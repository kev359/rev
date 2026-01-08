// ============================================
// ADMIN PANEL LOGIC
// ============================================

import authService from '../auth/auth.service.js';
import routesService from '../routes/routes.service.js';
import driversService from '../drivers/drivers.service.js';
import mindersService from '../minders/minders.service.js';
import { validateForm, displayFormErrors, clearFormErrors, formatPhoneNumber } from '../utils/validators.js';
import { setButtonLoading, showMessage, sanitizeHTML } from '../utils/helpers.js';

let currentTab = 'routes';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  // Require admin access
  const isAdmin = await authService.requireAdmin();
  if (!isAdmin) return;

  // Initialize tabs
  initializeTabs();
  
  // Load initial tab
  await loadTab('routes');
});

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
        <td>${route.areas?.length || 0}</td>
        <td>${route.term}, ${route.year}</td>
        <td>
          <span class="status-badge ${route.status}">${route.status}</span>
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

// Add new buttons
document.getElementById('addRouteBtn')?.addEventListener('click', () => {
  alert('Add route modal would open here');
});

document.getElementById('addDriverBtn')?.addEventListener('click', () => {
  alert('Add driver modal would open here');
});

document.getElementById('addMinderBtn')?.addEventListener('click', () => {
  alert('Add minder modal would open here');
});
