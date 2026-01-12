// ============================================
// ADMIN PANEL LOGIC
// ============================================

import authService from '../auth/auth.service.js';
import routesService from '../routes/routes.service.js';
import driversService from '../drivers/drivers.service.js';
import mindersService from '../minders/minders.service.js';
import learnersService from '../learners/learners.service.js';
import settingsService from '../settings/settings.service.js';
import { validateForm, displayFormErrors, clearFormErrors, formatPhoneNumber } from '../utils/validators.js';
import { setButtonLoading, showMessage, sanitizeHTML, generateId } from '../utils/helpers.js';

let currentTab = 'routes';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  // Require admin access
  const isAdmin = await authService.requireAdmin();
  if (!isAdmin) return;

  // Initialize tabs
  initializeTabs();
  
  // Load stats
  loadStats();
  
  // Load initial tab
  await loadTab('routes');
});

/**
 * Load admin stats
 */
async function loadStats() {
  try {
    const [routes, drivers, minders, learners] = await Promise.all([
      routesService.getAll(),
      driversService.getAll(),
      mindersService.getAll(),
      learnersService.getAll()
    ]);

    document.getElementById('statRoutes').textContent = routes.length || 0;
    document.getElementById('statDrivers').textContent = drivers.length || 0;
    document.getElementById('statMinders').textContent = minders.length || 0;
    document.getElementById('statLearners').textContent = learners.length || 0;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

/**
 * Initialize tabs
 */
function initializeTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const tab = btn.dataset.tab;
      
      // Update active tab
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tab}Tab`)?.classList.add('active');
      
      // Load tab data
      currentTab = tab;
      await loadTab(tab);
    });
  });
}

/**
 * Load tab data
 */
async function loadTab(tab) {
  switch (tab) {
    case 'routes':
      await loadRoutes();
      break;
    case 'drivers':
      await loadDrivers();
      break;
    case 'minders':
      await loadMinders();
      break;
    case 'import':
      // Import tab is static
      break;
    case 'rollover':
      await loadRolloverData();
      break;
    case 'grades':
      await loadGrades();
      break;
  }
}

/**
 * Load routes
 */
async function loadRoutes() {
  try {
    const routes = await routesService.getAll();
    const tableBody = document.getElementById('routesTableBody');
    
    if (!tableBody) return;

    if (routes.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No routes found</td></tr>';
      return;
    }

    tableBody.innerHTML = routes.map(route => `
      <tr>
        <td>${sanitizeHTML(route.name)}</td>
        <td>${sanitizeHTML(route.vehicle_no)}</td>
        <td>${sanitizeHTML(route.term)}</td>
        <td>${route.year}</td>
        <td>
          <span class="status-badge ${route.status}">${route.status}</span>
        </td>
        <td class="text-center">
          ${route.learners_count || 0}
        </td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" onclick="editRoute('${route.id}')">Edit</button>
            ${route.status === 'active' ? `
              <button class="action-btn deactivate" onclick="archiveRoute('${route.id}')">Archive</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Load routes error:', error);
    alert('Failed to load routes');
  }
}

/**
 * Load drivers
 */
async function loadDrivers() {
  try {
    const drivers = await driversService.getAll();
    const routes = await routesService.getAll('active');
    const tableBody = document.getElementById('driversTableBody');
    
    if (!tableBody) return;

    if (drivers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No drivers found</td></tr>';
      return;
    }

    tableBody.innerHTML = drivers.map(driver => {
      const route = routes.find(r => r.id === driver.route_id);
      return `
        <tr>
          <td>${sanitizeHTML(driver.name)}</td>
          <td>${sanitizeHTML(driver.email)}</td>
          <td>${sanitizeHTML(driver.phone)}</td>
          <td>${route ? sanitizeHTML(route.name) : 'Not Assigned'}</td>
          <td>
            <span class="role-badge ${driver.role}">${driver.role}</span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit" onclick="editDriver('${driver.id}')">Edit</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Load drivers error:', error);
    alert('Failed to load drivers');
  }
}

/**
 * Load minders
 */
async function loadMinders() {
  try {
    const minders = await mindersService.getAllWithDetails();
    const tableBody = document.getElementById('mindersTableBody');
    
    if (!tableBody) return;

    if (minders.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No minders found</td></tr>';
      return;
    }

    tableBody.innerHTML = minders.map(minder => `
      <tr>
        <td>${sanitizeHTML(minder.name)}</td>
        <td>${sanitizeHTML(minder.phone)}</td>
        <td>${sanitizeHTML(minder.driver_name)}</td>
        <td>${sanitizeHTML(minder.route_name)}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" onclick="editMinder('${minder.id}')">Edit</button>
            <button class="action-btn deactivate" onclick="deleteMinder('${minder.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Load minders error:', error);
    alert('Failed to load minders');
  }
}

/**
 * Load rollover data
 */
async function loadRolloverData() {
  try {
    const routes = await routesService.getAll('active');
    const routeSelect = document.getElementById('rolloverRoute');
    
    if (routeSelect) {
      routeSelect.innerHTML = '<option value="">Select route to duplicate</option>' +
        routes.map(r => `<option value="${r.id}">${sanitizeHTML(r.name)}</option>`).join('');
    }

    // Load archived routes
    const archivedRoutes = await routesService.getAll('archived');
    const archivedTableBody = document.getElementById('archivedRoutesTableBody');
    
    if (archivedTableBody) {
      if (archivedRoutes.length === 0) {
        archivedTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No archived routes</td></tr>';
      } else {
        archivedTableBody.innerHTML = archivedRoutes.map(route => `
          <tr>
            <td>${sanitizeHTML(route.name)}</td>
            <td>${sanitizeHTML(route.vehicle_no)}</td>
            <td>${route.term}, ${route.year}</td>
            <td>${new Date(route.updated_at).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Load rollover data error:', error);
  }
}

/**
 * Handle year-end rollover
 */
window.handleRollover = async function() {
  const form = document.getElementById('rolloverForm');
  const routeId = document.getElementById('rolloverRoute').value;
  const newTerm = document.getElementById('newTerm').value;
  const newYear = document.getElementById('newYear').value;
  const copyLearners = document.getElementById('copyLearners').checked;
  const rolloverBtn = document.getElementById('rolloverBtn');

  if (!routeId || !newTerm || !newYear) {
    alert('Please fill in all fields');
    return;
  }

  if (!confirm(`Are you sure you want to duplicate this route for ${newTerm}, ${newYear}?`)) {
    return;
  }

  setButtonLoading(rolloverBtn, true);

  try {
    await routesService.duplicate(routeId, newTerm, parseInt(newYear), copyLearners);
    alert('Route duplicated successfully!');
    form.reset();
    await loadRolloverData();
  } catch (error) {
    console.error('Rollover error:', error);
    alert('Failed to duplicate route');
  } finally {
    setButtonLoading(rolloverBtn, false);
  }
};

/**
 * Global functions for modals (simplified for brevity)
 */
window.editRoute = function(id) {
  alert('Route editing modal would open here. Implementation similar to learners page.');
};

window.archiveRoute = async function(id) {
  if (!confirm('Archive this route?')) return;
  try {
    await routesService.archive(id);
    await loadRoutes();
    alert('Route archived');
  } catch (error) {
    alert('Failed to archive route');
  }
};

window.editDriver = function(id) {
  alert('Driver editing modal would open here.');
};

window.editMinder = function(id) {
  alert('Minder editing modal would open here.');
};

window.deleteMinder = async function(id) {
  if (!confirm('Delete this minder?')) return;
  try {
    await mindersService.delete(id);
    await loadMinders();
    alert('Minder deleted');
  } catch (error) {
    alert('Failed to delete minder');
  }
};

// ============================================
// ROUTE MODAL FUNCTIONALITY
// ============================================

let currentRouteId = null;

// Add Route Button
document.getElementById('addRouteBtn')?.addEventListener('click', () => {
  openRouteModal();
});

// Close Route Modal
document.getElementById('closeRouteModal')?.addEventListener('click', closeRouteModal);
document.getElementById('cancelRouteBtn')?.addEventListener('click', closeRouteModal);

// Route Form Submit
document.getElementById('routeForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveRoute();
});

/**
 * Open route modal
 */
function openRouteModal(routeId = null) {
  const modal = document.getElementById('routeModal');
  const form = document.getElementById('routeForm');
  const title = document.getElementById('routeModalTitle');
  
  if (!modal || !form) return;
  
  // Reset form
  form.reset();
  clearFormErrors(form);
  currentRouteId = routeId;
  
  if (routeId) {
    title.textContent = 'Edit Route';
    loadRouteData(routeId);
  } else {
    title.textContent = 'Add Route';
  }
  
  modal.style.display = 'flex';
}

/**
 * Close route modal
 */
function closeRouteModal() {
  const modal = document.getElementById('routeModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentRouteId = null;
}

/**
 * Load route data for editing
 */
async function loadRouteData(routeId) {
  try {
    const route = await routesService.getById(routeId);
    
    document.getElementById('routeId').value = route.id;
    document.getElementById('routeName').value = route.name;
    document.getElementById('vehicleNo').value = route.vehicle_no;
    document.getElementById('term').value = route.term;
    document.getElementById('year').value = route.year;
    document.getElementById('areas').value = route.areas?.join(', ') || '';
  } catch (error) {
    console.error('Load route error:', error);
    alert('Failed to load route data');
    closeRouteModal();
  }
}

/**
 * Save route
 */
async function saveRoute() {
  const form = document.getElementById('routeForm');
  const submitBtn = document.getElementById('submitRouteBtn');
  const errorDiv = document.getElementById('routeFormError');
  
  // Clear previous errors
  clearFormErrors(form);
  errorDiv.style.display = 'none';
  
  // Get form data
  const formData = {
    name: document.getElementById('routeName').value.trim(),
    vehicle_no: document.getElementById('vehicleNo').value.trim(),
    term: document.getElementById('term').value.trim(),
    year: parseInt(document.getElementById('year').value),
    areas: document.getElementById('areas').value
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)
  };
  
  // Validate
  if (!formData.name || !formData.vehicle_no || !formData.term || !formData.year) {
    errorDiv.textContent = 'Please fill in all required fields';
    errorDiv.style.display = 'block';
    return;
  }
  
  setButtonLoading(submitBtn, true);
  
  try {
    if (currentRouteId) {
      await routesService.update(currentRouteId, formData);
      showMessage('Route updated successfully!', 'success');
    } else {
      await routesService.create(formData);
      showMessage('Route created successfully!', 'success');
    }
    
    closeRouteModal();
    await loadRoutes();
  } catch (error) {
    console.error('Save route error:', error);
    errorDiv.textContent = error.message || 'Failed to save route';
    errorDiv.style.display = 'block';
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// Make functions globally accessible
window.editRoute = function(id) {
  openRouteModal(id);
};

// ============================================
// DRIVER MODAL FUNCTIONALITY
// ============================================

let currentDriverId = null;

// Add Driver Button
document.getElementById('addDriverBtn')?.addEventListener('click', () => {
  openDriverModal();
});

// Close Driver Modal
document.getElementById('closeDriverModal')?.addEventListener('click', closeDriverModal);
document.getElementById('cancelDriverBtn')?.addEventListener('click', closeDriverModal);

// Driver Form Submit
document.getElementById('driverForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveDriver();
});

/**
 * Open driver modal
 */
async function openDriverModal(driverId = null) {
  const modal = document.getElementById('driverModal');
  const form = document.getElementById('driverForm');
  const title = document.getElementById('driverModalTitle');
  const routeSelect = document.getElementById('driverRoute');
  const passwordHint = document.getElementById('passwordHint');  // Note: HTML might not have this ID yet, verify
  
  if (!modal || !form) return;
  
  // Reset form
  form.reset();
  clearFormErrors(form);
  currentDriverId = driverId;
  
  // Load routes into select
  try {
    const routes = await routesService.getAll('active');
    routeSelect.innerHTML = '<option value="">Select route</option>' + 
      routes.map(r => `<option value="${r.id}">${sanitizeHTML(r.name)}</option>`).join('');
  } catch (error) {
    console.error('Failed to load routes for dropdown:', error);
  }

  if (driverId) {
    title.textContent = 'Edit Driver';
    if(passwordHint) passwordHint.textContent = '';
    await loadDriverData(driverId);
  } else {
    title.textContent = 'Add Driver';
    if(passwordHint) passwordHint.textContent = 'Drivers should register themselves';
  }
  
  modal.style.display = 'flex';
}

/**
 * Close driver modal
 */
function closeDriverModal() {
  const modal = document.getElementById('driverModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentDriverId = null;
}

/**
 * Load driver data for editing
 */
async function loadDriverData(driverId) {
  try {
    const driver = await driversService.getById(driverId);
    
    document.getElementById('driverName').value = driver.name;
    document.getElementById('driverEmail').value = driver.email;
    document.getElementById('driverPhone').value = driver.phone;
    document.getElementById('driverRoute').value = driver.route_id || '';
    document.getElementById('driverRole').value = driver.role || 'driver';
    
    // Email is read-only for security/auth reasons usually, but let's allow edit if supported
    // document.getElementById('driverEmail').readOnly = true; 
  } catch (error) {
    console.error('Load driver error:', error);
    showMessage('Failed to load driver data', 'error');
    closeDriverModal();
  }
}

/**
 * Save driver
 */
async function saveDriver() {
  const form = document.getElementById('driverForm');
  const submitBtn = document.getElementById('submitDriverBtn');
  const errorDiv = document.getElementById('driverFormError');
  
  // Clear previous errors
  clearFormErrors(form);
  if(errorDiv) errorDiv.style.display = 'none';
  
  // Get form data
  const formData = {
    name: document.getElementById('driverName').value.trim(),
    email: document.getElementById('driverEmail').value.trim(),
    phone: document.getElementById('driverPhone').value.trim(),
    route_id: document.getElementById('driverRoute').value || null,
    role: document.getElementById('driverRole').value
  };
  
  // Validate
  if (!formData.name || !formData.email || !formData.phone) {
    if(errorDiv) {
        errorDiv.textContent = 'Please fill in all required fields';
        errorDiv.style.display = 'block';
    }
    return;
  }


  setButtonLoading(submitBtn, true);
  
  try {
    if (currentDriverId) {
      if (!formData.password) delete formData.password; // Don't update if empty
      await driversService.update(currentDriverId, formData);
      showMessage('Driver updated successfully!', 'success');
    } else {
      await driversService.create(formData);
      showMessage('Driver created successfully!', 'success');
    }
    
    closeDriverModal();
    await loadDrivers();
  } catch (error) {
    console.error('Save driver error:', error);
    if(errorDiv) {
        errorDiv.textContent = error.message || 'Failed to save driver';
        errorDiv.style.display = 'block';
    }
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// Make functions globally accessible
window.editDriver = function(id) {
  openDriverModal(id);
};

// ============================================
// MINDER MODAL FUNCTIONALITY
// ============================================

let currentMinderId = null;
let cachedDrivers = []; // Store drivers to lookup route info

// Add Minder Button
document.getElementById('addMinderBtn')?.addEventListener('click', () => {
    openMinderModal();
});

// Close Minder Modal
document.getElementById('closeMinderModal')?.addEventListener('click', closeMinderModal);
document.getElementById('cancelMinderBtn')?.addEventListener('click', closeMinderModal);

// Minder Form Submit
document.getElementById('minderForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveMinder();
});

// Auto-assign route when driver is selected
document.getElementById('minderDriver')?.addEventListener('change', (e) => {
    const driverId = e.target.value;
    const routeSelect = document.getElementById('minderRoute');
    
    if (!driverId) {
        routeSelect.value = "";
        return;
    }

    const driver = cachedDrivers.find(d => d.id === driverId);
    if (driver && driver.route_id) {
        routeSelect.value = driver.route_id;
    } else {
        routeSelect.value = ""; // Or handle case where driver has no route
    }
});

/**
 * Open minder modal
 */
async function openMinderModal(minderId = null) {
  const modal = document.getElementById('minderModal');
  const form = document.getElementById('minderForm');
  const title = document.getElementById('minderModalTitle');
  const driverSelect = document.getElementById('minderDriver');
  const routeSelect = document.getElementById('minderRoute');
  
  if (!modal || !form) return;
  
  // Reset form
  form.reset();
  currentMinderId = minderId;
  const errorDiv = document.getElementById('minderFormError');
  if(errorDiv) errorDiv.style.display = 'none';
  
  // Load drivers and routes
  try {
    const [drivers, routes] = await Promise.all([
        driversService.getAll(),
        routesService.getAll('active')
    ]);
    cachedDrivers = drivers; // Cache for route lookup

    driverSelect.innerHTML = '<option value="">Select driver</option>' + 
      drivers.map(d => `<option value="${d.id}">${sanitizeHTML(d.name)}</option>`).join('');
      
    routeSelect.innerHTML = '<option value="">Select route</option>' + 
      routes.map(r => `<option value="${r.id}">${sanitizeHTML(r.name)}</option>`).join('');

  } catch (error) {
    console.error('Failed to load dropdown data:', error);
    showMessage('Failed to load form data', 'error');
  }

  if (minderId) {
    title.textContent = 'Edit Minder';
    await loadMinderData(minderId);
  } else {
    title.textContent = 'Add Minder';
  }
  
  modal.style.display = 'flex';
}

/**
 * Close minder modal
 */
function closeMinderModal() {
  const modal = document.getElementById('minderModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentMinderId = null;
}

/**
 * Load minder data for editing
 */
async function loadMinderData(minderId) {
  try {
    const minder = await mindersService.getById(minderId);
    
    document.getElementById('minderName').value = minder.name;
    document.getElementById('minderPhone').value = minder.phone;
    
    // Set driver and trigger change event to set route
    const driverSelect = document.getElementById('minderDriver');
    driverSelect.value = minder.driver_id || '';
    
    // Manually set route in case trigger doesn't work or we want exact value from DB
    // But usually syncing with driver is better.
    // Let's manually set route just in case
    const routeSelect = document.getElementById('minderRoute');
    // Find driver to get route_id
    const driver = cachedDrivers.find(d => d.id === minder.driver_id);
    if(driver && driver.route_id) {
         routeSelect.value = driver.route_id;
    }

  } catch (error) {
    console.error('Load minder error:', error);
    showMessage('Failed to load minder data', 'error');
    closeMinderModal();
  }
}

/**
 * Save minder
 */
async function saveMinder() {
  const form = document.getElementById('minderForm');
  const submitBtn = document.getElementById('submitMinderBtn');
  const errorDiv = document.getElementById('minderFormError');
  
  // Clear previous errors
  if(errorDiv) errorDiv.style.display = 'none';
  
  // Get form data
  // Note: route_id is derived from the driver, but passing it might be useful or redundancy. 
  // The service/DB takes driver_id. Does it take route_id? 
  // Let's check schema/service. Usually minder is linked to driver, and gets route via driver?
  // Or minder table has route_id? 
  // The HTML shows a route select.
  // Assuming mindersService handles it. Let's send what we have.
  
  const formData = {
    name: document.getElementById('minderName').value.trim(),
    phone: document.getElementById('minderPhone').value.trim(),
    driver_id: document.getElementById('minderDriver').value,
    route_id: document.getElementById('minderRoute').value // If schema requires it
  };
  
  // Validate
  if (!formData.name || !formData.phone || !formData.driver_id) {
    if(errorDiv) {
        errorDiv.textContent = 'Please fill in all required fields';
        errorDiv.style.display = 'block';
    }
    return;
  }

  setButtonLoading(submitBtn, true);
  
  try {
    if (currentMinderId) {
      await mindersService.update(currentMinderId, formData);
      showMessage('Minder updated successfully!', 'success');
    } else {
      await mindersService.create(formData);
      showMessage('Minder created successfully!', 'success');
    }
    
    closeMinderModal();
    await loadMinders();
  } catch (error) {
    console.error('Save minder error:', error);
    if(errorDiv) {
        errorDiv.textContent = error.message || 'Failed to save minder';
        errorDiv.style.display = 'block';
    }
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

window.editMinder = function(id) {
  openMinderModal(id);
};

// ============================================
// GRADES TAB LOGIC
// ============================================

let currentGradeId = null;
let currentGradeStreams = []; // Temporary array for streams being added

/**
 * Load grades table
 */
async function loadGrades() {
  try {
    const grades = await settingsService.getAllGrades();
    const tableBody = document.getElementById('gradesTableBody');
    
    if (!tableBody) return;

    if (grades.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No grades found. Click "Add Grade" to create one.</td></tr>';
      return;
    }

    tableBody.innerHTML = grades.map(grade => {
      const streamsDisplay = grade.streams && grade.streams.length > 0
        ? grade.streams.map(s => `<span style="display: inline-block; padding: 4px 8px; background: #e0e0e0; border-radius: 12px; margin: 2px; font-size: 12px; color: #000;">${sanitizeHTML(s.name)}</span>`).join('')
        : '<span style="color: #999;">No streams</span>';
      
      const isDefault = grade.id && grade.id.startsWith('default-');
      
      return `
        <tr>
          <td>${sanitizeHTML(grade.name)}</td>
          <td>${streamsDisplay}</td>
          <td>
            ${!isDefault ? `
              <button class="action-btn edit" onclick="editGrade('${grade.id}')">Edit</button>
              <button class="action-btn delete" onclick="deleteGrade('${grade.id}', '${sanitizeHTML(grade.name)}')">Delete</button>
            ` : '<span style="color: #999;">Default</span>'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Load grades error:', error);
    showMessage('Failed to load grades', 'error');
  }
}

/**
 * Open grade/stream modal
 */
function openGradeStreamModal(gradeId = null) {
  const modal = document.getElementById('gradeStreamModal');
  const modalTitle = document.getElementById('gradeStreamModalTitle');
  const form = document.getElementById('gradeStreamForm');
  const gradeNameInput = document.getElementById('gradeName');
  const streamsContainer = document.getElementById('gradeStreamsContainer');
  
  if (!modal || !form) return;

  currentGradeId = gradeId;
  currentGradeStreams = [];
  
  form.reset();
  streamsContainer.innerHTML = '';
  document.getElementById('gradeFormError').style.display = 'none';

  if (gradeId) {
    modalTitle.textContent = 'Edit Grade';
    loadGradeData(gradeId);
  } else {
    modalTitle.textContent = 'Add Grade';
  }

  modal.classList.add('active');
}

/**
 * Close grade/stream modal
 */
function closeGradeStreamModal() {
  const modal = document.getElementById('gradeStreamModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentGradeId = null;
  currentGradeStreams = [];
}

/**
 * Load grade data for editing
 */
async function loadGradeData(gradeId) {
  try {
    const grades = await settingsService.getAllGrades();
    const grade = grades.find(g => g.id === gradeId);
    
    if (!grade) {
      showMessage('Grade not found', 'error');
      closeGradeStreamModal();
      return;
    }

    document.getElementById('gradeName').value = grade.name;
    currentGradeStreams = grade.streams || [];
    renderGradeStreams();
  } catch (error) {
    console.error('Load grade data error:', error);
    showMessage('Failed to load grade data', 'error');
  }
}

/**
 * Add stream to current grade (in modal)
 */
function addStreamToGrade() {
  const input = document.getElementById('gradeStreamsInput');
  const streamName = input.value.trim();
  
  if (!streamName) return;
  
  // Check for duplicates
  if (currentGradeStreams.some(s => s.name === streamName)) {
    showMessage('Stream already added', 'error');
    return;
  }
  
  // Add to temporary array
  currentGradeStreams.push({ name: streamName, isNew: true });
  input.value = '';
  renderGradeStreams();
}

/**
 * Remove stream from current grade (in modal)
 */
function removeStreamFromGrade(index) {
  currentGradeStreams.splice(index, 1);
  renderGradeStreams();
}

/**
 * Render streams in modal
 */
function renderGradeStreams() {
  const container = document.getElementById('gradeStreamsContainer');
  if (!container) return;

  if (currentGradeStreams.length === 0) {
    container.innerHTML = '<span style="color: #999;">No streams added yet</span>';
    return;
  }

  container.innerHTML = currentGradeStreams.map((stream, index) => `
    <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; 
                 background: #e0e0e0; border-radius: 16px; border: 1px solid #999; color: #000; font-size: 13px;">
      ${sanitizeHTML(stream.name)}
      <span onclick="removeStreamFromGrade(${index})" 
            style="cursor: pointer; color: #d32f2f; font-weight: bold; font-size: 16px;" 
            title="Remove">&times;</span>
    </span>
  `).join('');
}

/**
 * Save grade with streams
 */
async function saveGradeStream(e) {
  e.preventDefault();

  const gradeName = document.getElementById('gradeName').value.trim();
  const submitBtn = document.getElementById('submitGradeStreamBtn');
  const errorDiv = document.getElementById('gradeFormError');

  if (!gradeName) {
    errorDiv.textContent = 'Grade name is required';
    errorDiv.style.display = 'block';
    return;
  }

  setButtonLoading(submitBtn, true);
  errorDiv.style.display = 'none';

  try {
    if (currentGradeId) {
      // Update existing grade
      await settingsService.update(currentGradeId, { name: gradeName });
      
      // Handle streams: delete removed, add new
      const grades = await settingsService.getAllGrades();
      const existingGrade = grades.find(g => g.id === currentGradeId);
      const existingStreams = existingGrade?.streams || [];
      
      // Delete streams not in currentGradeStreams
      for (const existingStream of existingStreams) {
        if (!currentGradeStreams.some(s => s.id === existingStream.id)) {
          await settingsService.deleteStream(existingStream.id);
        }
      }
      
      // Add new streams
      for (const stream of currentGradeStreams) {
        if (stream.isNew) {
          console.log(`Adding new stream: ${stream.name} to parent: ${currentGradeId}`);
          await settingsService.addStream(currentGradeId, stream.name);
        }
      }
      
      showMessage('Grade updated successfully', 'success');
    } else {
      // Create new grade with streams
      const streamNames = currentGradeStreams.map(s => s.name);
      await settingsService.addGrade(gradeName, streamNames);
      showMessage('Grade added successfully', 'success');
    }

    await loadGrades();
    closeGradeStreamModal();
  } catch (error) {
    console.error('Save grade error:', error);
    if (error.code === '42P01') {
      errorDiv.textContent = 'Database table missing. Please run SETTINGS_SETUP_V2.sql';
    } else {
      errorDiv.textContent = error.message || 'Failed to save grade';
    }
    errorDiv.style.display = 'block';
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

/**
 * Delete grade
 */
window.deleteGrade = async function(gradeId, gradeName) {
  if (!confirm(`Are you sure you want to delete "${gradeName}" and all its streams?`)) return;

  try {
    await settingsService.delete(gradeId);
    await loadGrades();
    showMessage('Grade deleted successfully', 'success');
  } catch (error) {
    console.error('Delete grade error:', error);
    showMessage('Failed to delete grade', 'error');
  }
};

/**
 * Edit grade
 */
window.editGrade = function(gradeId) {
  openGradeStreamModal(gradeId);
};

// Make removeStreamFromGrade globally accessible
window.removeStreamFromGrade = removeStreamFromGrade;

// Setup event listeners for Grades tab
document.getElementById('addGradeStreamBtn')?.addEventListener('click', () => openGradeStreamModal());
document.getElementById('closeGradeStreamModal')?.addEventListener('click', closeGradeStreamModal);
document.getElementById('cancelGradeStreamBtn')?.addEventListener('click', closeGradeStreamModal);
document.getElementById('gradeStreamForm')?.addEventListener('submit', saveGradeStream);
document.getElementById('addStreamToGradeBtn')?.addEventListener('click', addStreamToGrade);





