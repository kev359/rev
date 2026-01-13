// ============================================
// LEARNERS PAGE LOGIC
// ============================================

import authService from '../auth/auth.service.js';
import learnersService from './learners.service.js';
import routesService from '../routes/routes.service.js';
import conflictChecker from './conflict.checker.js';
import settingsService from '../settings/settings.service.js';
import { 
  validateForm, 
  displayFormErrors, 
  clearFormErrors,
  formatPhoneNumber 
} from '../utils/validators.js';
import { 
  setButtonLoading, 
  showMessage, 
  setLoadingState,
  setEmptyState,
  debounce,
  sanitizeHTML 
} from '../utils/helpers.js';

let currentDriver = null;
let allLearners = [];
let allRoutes = [];
let currentEditId = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  // Require authentication
  const authenticated = await authService.requireAuth();
  if (!authenticated) return;

  // Get current driver
  currentDriver = authService.getCurrentDriver();
  if (!currentDriver) {
    window.location.href = 'index.html';
    return;
  }

  // Initialize page
  await initializePage();
  setupEventListeners();
});

/**
 * Initialize page
 */
async function initializePage() {
  try {
    // Load routes
    allRoutes = await routesService.getAll('active');
    
    // Load settings (grades/streams)
    await loadDropdownSettings();

    // Load learners
    await loadLearners();
    
    // Populate filters
    populateFilters();
  } catch (error) {
    console.error('Initialize page error:', error);
    alert('Failed to load page data. Please refresh.');
  }
}

/**
 * Load dropdown settings
 */
async function loadDropdownSettings() {
    try {
        const grades = await settingsService.getAllGrades();
        const gradeSelect = document.getElementById('learnerGrade');
        const streamSelect = document.getElementById('learnerStream');
        
        if(gradeSelect) {
            gradeSelect.innerHTML = '<option value="">Select Grade</option>' + 
                grades.map(g => `<option value="${sanitizeHTML(g.name)}" data-grade-id="${g.id}">${sanitizeHTML(g.name)}</option>`).join('');
            
            // Add event listener to populate streams when grade is selected
            gradeSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const gradeId = selectedOption.getAttribute('data-grade-id');
                const selectedGrade = grades.find(g => g.id === gradeId);
                
                if (streamSelect && selectedGrade) {
                    streamSelect.innerHTML = '<option value="">None</option>';
                    if (selectedGrade.streams && selectedGrade.streams.length > 0) {
                        streamSelect.innerHTML += selectedGrade.streams
                            .map(s => `<option value="${sanitizeHTML(s.name)}">${sanitizeHTML(s.name)}</option>`)
                            .join('');
                    }
                } else if (streamSelect) {
                    streamSelect.innerHTML = '<option value="">None</option>';
                }
            });
        }
        
        if(streamSelect) {
            streamSelect.innerHTML = '<option value="">None</option>';
        }
    } catch(e) { 
        console.error('Failed to load dropdown settings', e); 
    }
}

/**
 * Load learners
 */
async function loadLearners() {
  try {
    const loadingState = document.getElementById('loadingState');
    const tableBody = document.getElementById('learnersTableBody');
    const emptyState = document.getElementById('emptyState');
    
    setLoadingState(loadingState, tableBody, true);

    // Load all learners (drivers can view all)
    allLearners = await learnersService.getAll();
    
    // Apply filters
    const filtered = applyFilters(allLearners);
    
    // Render table
    renderLearnersTable(filtered);
    
    // Show/hide empty state
    setEmptyState(emptyState, tableBody, filtered.length === 0);
    setLoadingState(loadingState, tableBody, false);
  } catch (error) {
    console.error('Load learners error:', error);
    alert('Failed to load learners. Please try again.');
  }
}

/**
 * Apply filters to learners
 */
function applyFilters(learners) {
  let filtered = [...learners];

  // Search filter
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(l => 
      l.name.toLowerCase().includes(searchTerm) ||
      l.admission_no.toLowerCase().includes(searchTerm) ||
      l.class.toLowerCase().includes(searchTerm)
    );
  }

  // Route filter
  const routeFilter = document.getElementById('routeFilter')?.value;
  if (routeFilter) {
    filtered = filtered.filter(l => l.route_id === routeFilter);
  }

  // Status filter
  const statusFilter = document.getElementById('statusFilter')?.value;
  if (statusFilter === 'active') {
    filtered = filtered.filter(l => l.active);
  } else if (statusFilter === 'inactive') {
    filtered = filtered.filter(l => !l.active);
  }

  // Class filter
  const classFilter = document.getElementById('classFilter')?.value;
  if (classFilter) {
    filtered = filtered.filter(l => l.class === classFilter);
  }

  return filtered;
}

/**
 * Render learners table
 */
function renderLearnersTable(learners) {
  const tableBody = document.getElementById('learnersTableBody');
  if (!tableBody) return;

  if (learners.length === 0) {
    tableBody.innerHTML = '';
    return;
  }

  tableBody.innerHTML = learners.map(learner => {
    const route = allRoutes.find(r => r.id === learner.route_id);
    const canEdit = currentDriver.role === 'admin' || currentDriver.route_id === learner.route_id;

    return `
      <tr>
        <td>${sanitizeHTML(learner.admission_no)}</td>
        <td>${sanitizeHTML(learner.name)}</td>
        <td>${sanitizeHTML(learner.class)}</td>
        <td>${sanitizeHTML(learner.pickup_area)}</td>
        <td>${learner.pickup_time}</td>
        <td>${sanitizeHTML(learner.dropoff_area || '-')}</td>
        <td>${learner.drop_time || '-'}</td>
        <td>${sanitizeHTML(learner.father_phone)}</td>
        <td>${sanitizeHTML(learner.mother_phone)}</td>
        <td>${route ? sanitizeHTML(route.name) : 'N/A'}</td>
        <td>
          <span class="status-badge ${learner.active ? 'active' : 'inactive'}">
            ${learner.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            ${canEdit ? `
              <button class="action-btn edit" onclick="editLearner('${learner.id}')">
                Edit
              </button>
              ${learner.active ? `
                <button class="action-btn deactivate" onclick="deactivateLearner('${learner.id}')">
                  Deactivate
                </button>
              ` : `
                <button class="action-btn activate" onclick="reactivateLearner('${learner.id}')">
                  Reactivate
                </button>
              `}
            ` : `
              <span class="text-muted">View Only</span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Populate filters
 */
function populateFilters() {
  // Populate route filter
  const routeFilter = document.getElementById('routeFilter');
  if (routeFilter) {
    routeFilter.innerHTML = '<option value="">All Routes</option>' +
      allRoutes.map(r => `<option value="${r.id}">${sanitizeHTML(r.name)}</option>`).join('');
  }

  // Populate class filter
  const classes = [...new Set(allLearners.map(l => l.class))].sort();
  const classFilter = document.getElementById('classFilter');
  if (classFilter) {
    classFilter.innerHTML = '<option value="">All Classes</option>' +
      classes.map(c => `<option value="${c}">${sanitizeHTML(c)}</option>`).join('');
  }

  // Populate route select in modal
  const routeSelect = document.getElementById('routeSelect');
  if (routeSelect) {
    routeSelect.innerHTML = '<option value="">Select route</option>' +
      allRoutes.map(r => `<option value="${r.id}">${sanitizeHTML(r.name)}</option>`).join('');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add learner button
  const addLearnerBtn = document.getElementById('addLearnerBtn');
  if (addLearnerBtn) {
    addLearnerBtn.addEventListener('click', () => openLearnerModal());
  }

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => loadLearners(), 300));
  }

  // Filters
  ['routeFilter', 'statusFilter', 'classFilter'].forEach(id => {
    const filter = document.getElementById(id);
    if (filter) {
      filter.addEventListener('change', () => loadLearners());
    }
  });

  // Modal close buttons
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  
  if (closeModal) closeModal.addEventListener('click', closeLearnerModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeLearnerModal);

  // Form submission
  const learnerForm = document.getElementById('learnerForm');
  if (learnerForm) {
    learnerForm.addEventListener('submit', handleFormSubmit);
  }

  // Route change - load areas
  const routeSelect = document.getElementById('routeSelect');
  if (routeSelect) {
    routeSelect.addEventListener('change', async (e) => {
      await loadAreasForRoute(e.target.value);
    });
  }

  // Pickup time change - check conflicts
  const pickupTime = document.getElementById('pickupTime');
  if (pickupTime) {
    pickupTime.addEventListener('change', checkPickupConflicts);
  }
}

/**
 * Open learner modal
 */
function openLearnerModal(learnerId = null) {
  const modal = document.getElementById('learnerModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('learnerForm');
  const statusGroup = document.getElementById('statusGroup');
  
  if (!modal || !form) return;

  currentEditId = learnerId;
  
  // Reset form
  form.reset();
  clearFormErrors(form);
  document.getElementById('conflictWarning').style.display = 'none';
  document.getElementById('formError').style.display = 'none';

  if (learnerId) {
    // Edit mode
    modalTitle.textContent = 'Edit Learner';
    statusGroup.style.display = 'block';
    loadLearnerData(learnerId);
  } else {
    // Add mode
    modalTitle.textContent = 'Add Learner';
    statusGroup.style.display = 'none';
    
    // Pre-select driver's route if not admin
    if (currentDriver.role !== 'admin' && currentDriver.route_id) {
      document.getElementById('routeSelect').value = currentDriver.route_id;
      // document.getElementById('routeSelect').disabled = true; // Allow drivers to change route if needed
      loadAreasForRoute(currentDriver.route_id);
    }
  }

  modal.classList.add('active');
}

/**
 * Close learner modal
 */
function closeLearnerModal() {
  const modal = document.getElementById('learnerModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentEditId = null;
}

/**
 * Load learner data for editing
 */
async function loadLearnerData(learnerId) {
  try {
    const learner = await learnersService.getById(learnerId);
    
    document.getElementById('learnerId').value = learner.id;
    document.getElementById('learnerName').value = learner.name;
    document.getElementById('admissionNo').value = learner.admission_no;
    
    // Parse Class and Stream
    const fullClass = learner.class || '';
    const gradeSelect = document.getElementById('learnerGrade');
    let foundGrade = '';
    
    // Find matching grade prefix
    if(gradeSelect) {
        Array.from(gradeSelect.options).forEach(opt => {
            if (opt.value && fullClass.startsWith(opt.value)) {
                if (opt.value.length > foundGrade.length) {
                    foundGrade = opt.value;
                }
            }
        });
        
        if (foundGrade) {
            gradeSelect.value = foundGrade;
            const streamPart = fullClass.substring(foundGrade.length).trim();
            const streamSelect = document.getElementById('learnerStream');
            if(streamSelect) streamSelect.value = streamPart || "";
        } else {
            // If no match found, try to set it directly (maybe legacy data)
             gradeSelect.value = ""; 
        }
    }

    document.getElementById('pickupTime').value = learner.pickup_time;
    document.getElementById('fatherPhone').value = learner.father_phone;
    document.getElementById('motherPhone').value = learner.mother_phone;
    document.getElementById('routeSelect').value = learner.route_id;
    document.getElementById('learnerStatus').value = learner.active.toString();
    
    // Load areas for route
    await loadAreasForRoute(learner.route_id);
    document.getElementById('pickupArea').value = learner.pickup_area;
    if(document.getElementById('dropoffArea')) document.getElementById('dropoffArea').value = learner.dropoff_area || '';
    if(document.getElementById('dropTime')) document.getElementById('dropTime').value = learner.drop_time || '';
  } catch (error) {
    console.error('Load learner data error:', error);
    alert('Failed to load learner data.');
  }
}

/**
 * Load areas for route
 */
async function loadAreasForRoute(routeId) {
  const pickupArea = document.getElementById('pickupArea');
  const dropoffArea = document.getElementById('dropoffArea');
  
  if (!routeId) return;

  try {
    const route = await routesService.getById(routeId);
    const areas = route.areas || [];
    
    const options = '<option value="">Select area</option>' +
      areas.map(area => `<option value="${area}">${sanitizeHTML(area)}</option>`).join('');

    if (pickupArea) pickupArea.innerHTML = options;
    if (dropoffArea) dropoffArea.innerHTML = options;
  } catch (error) {
    console.error('Load areas error:', error);
  }
}

/**
 * Check pickup conflicts
 */
async function checkPickupConflicts() {
  const routeId = document.getElementById('routeSelect').value;
  const pickupTime = document.getElementById('pickupTime').value;
  const pickupArea = document.getElementById('pickupArea').value;
  const conflictWarning = document.getElementById('conflictWarning');
  const conflictDetails = document.getElementById('conflictDetails');

  if (!routeId || !pickupTime || !pickupArea) {
    conflictWarning.style.display = 'none';
    return;
  }

  try {
    const result = await conflictChecker.checkConflicts(
      routeId,
      pickupTime,
      pickupArea,
      currentEditId
    );

    if (result.hasConflict) {
      const message = conflictChecker.formatConflictMessage(result.conflicts);
      conflictDetails.textContent = message;
      conflictWarning.style.display = 'block';
    } else {
      conflictWarning.style.display = 'none';
    }
  } catch (error) {
    console.error('Check conflicts error:', error);
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const formError = document.getElementById('formError');

  // Get form data
  const grade = document.getElementById('learnerGrade').value;
  const stream = document.getElementById('learnerStream').value;
  
  const formData = {
    name: document.getElementById('learnerName').value.trim(),
    admission_no: document.getElementById('admissionNo').value.trim(),
    class: stream ? `${grade} ${stream}` : grade,
    pickup_area: document.getElementById('pickupArea').value,
    pickup_time: document.getElementById('pickupTime').value,
    dropoff_area: document.getElementById('dropoffArea').value,
    drop_time: document.getElementById('dropTime').value,
    father_phone: formatPhoneNumber(document.getElementById('fatherPhone').value),
    mother_phone: formatPhoneNumber(document.getElementById('motherPhone').value),
    route_id: document.getElementById('routeSelect').value,
  };

  if (currentEditId) {
    formData.active = document.getElementById('learnerStatus').value === 'true';
  }

  // Validate form
  const validation = validateForm(formData, {
    name: { required: true, label: 'Learner Name' },
    admission_no: { required: true, label: 'Admission Number' },
    class: { required: true, label: 'Class' },
    pickup_area: { required: true, label: 'Pickup Area' },
    pickup_time: { required: true, type: 'time', label: 'Pickup Time' },
    dropoff_area: { required: true, label: 'Dropoff Area' },
    drop_time: { required: true, type: 'time', label: 'Dropoff Time' },
    father_phone: { required: true, type: 'phone', label: 'Father Phone' },
    mother_phone: { required: true, type: 'phone', label: 'Mother Phone' },
    route_id: { required: true, label: 'Route' },
  });

  if (!validation.valid) {
    displayFormErrors(validation.errors, form);
    return;
  }

  clearFormErrors(form);
  setButtonLoading(submitBtn, true);
  formError.style.display = 'none';

  try {
    // Check for duplicate admission number
    if (!currentEditId || formData.admission_no !== allLearners.find(l => l.id === currentEditId)?.admission_no) {
      const duplicate = await learnersService.checkDuplicateAdmission(formData.admission_no, currentEditId);
      if (duplicate) {
        showMessage('Admission number already exists', 'error', formError);
        setButtonLoading(submitBtn, false);
        return;
      }
    }

    // Create or update
    if (currentEditId) {
      await learnersService.update(currentEditId, formData);
    } else {
      await learnersService.create(formData);
    }

    // Reload learners
    await loadLearners();
    
    // Close modal
    closeLearnerModal();
    
    // Show success message
    alert(currentEditId ? 'Learner updated successfully' : 'Learner added successfully');
  } catch (error) {
    console.error('Save learner error:', error);
    showMessage(error.message || 'Failed to save learner', 'error', formError);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

/**
 * Edit learner
 */
window.editLearner = function(learnerId) {
  openLearnerModal(learnerId);
};

/**
 * Deactivate learner
 */
window.deactivateLearner = async function(learnerId) {
  if (!confirm('Are you sure you want to deactivate this learner?')) return;

  try {
    await learnersService.deactivate(learnerId);
    await loadLearners();
    alert('Learner deactivated successfully');
  } catch (error) {
    console.error('Deactivate learner error:', error);
    alert('Failed to deactivate learner');
  }
};

/**
 * Reactivate learner
 */
window.reactivateLearner = async function(learnerId) {
  if (!confirm('Are you sure you want to reactivate this learner?')) return;

  try {
    await learnersService.reactivate(learnerId);
    await loadLearners();
    alert('Learner reactivated successfully');
  } catch (error) {
    console.error('Reactivate learner error:', error);
    alert('Failed to reactivate learner');
  }
};
