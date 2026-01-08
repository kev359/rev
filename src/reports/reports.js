// ============================================
// REPORTS PAGE LOGIC
// ============================================

import authService from '../auth/auth.service.js';
import routesService from '../routes/routes.service.js';
import learnersService from '../learners/learners.service.js';
import driversService from '../drivers/drivers.service.js';
import mindersService from '../minders/minders.service.js';
import { generatePDF } from './pdf.generator.js';
import { generateExcel } from './excel.generator.js';
import { setButtonLoading, showMessage, sanitizeHTML } from '../utils/helpers.js';

let selectedRoute = null;
let routeLearners = [];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  // Require authentication
  const authenticated = await authService.requireAuth();
  if (!authenticated) return;

  // Load routes
  await loadRoutes();
  
  // Setup event listeners
  setupEventListeners();
});

/**
 * Load routes
 */
async function loadRoutes() {
  try {
    const routes = await routesService.getAll('active');
    const routeSelect = document.getElementById('reportRoute');
    
    if (routeSelect) {
      routeSelect.innerHTML = '<option value="">Choose a route</option>' +
        routes.map(r => `<option value="${r.id}">${sanitizeHTML(r.name)}</option>`).join('');
    }
  } catch (error) {
    console.error('Load routes error:', error);
    alert('Failed to load routes');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const reportConfigForm = document.getElementById('reportConfigForm');
  const reportRoute = document.getElementById('reportRoute');

  if (reportConfigForm) {
    reportConfigForm.addEventListener('submit', handleGenerateReport);
  }

  if (reportRoute) {
    reportRoute.addEventListener('change', async (e) => {
      if (e.target.value) {
        await loadRoutePreview(e.target.value);
      } else {
        hidePreview();
      }
    });
  }
}

/**
 * Load route preview
 */
async function loadRoutePreview(routeId) {
  try {
    // Get route details
    selectedRoute = await routesService.getById(routeId);
    
    // Get driver
    const drivers = await driversService.getByRoute(routeId);
    const driver = drivers[0] || null;
    
    // Get minder
    const minder = await mindersService.getByRouteId(routeId);
    
    // Get learners
    const includeInactive = document.getElementById('includeInactive')?.checked || false;
    routeLearners = await learnersService.getByRoute(routeId, !includeInactive);
    
    // Sort learners
    const sortBy = document.getElementById('sortBy')?.value || 'time';
    sortLearners(sortBy);
    
    // Display preview
    displayPreview(selectedRoute, driver, minder, routeLearners);
  } catch (error) {
    console.error('Load route preview error:', error);
    alert('Failed to load route preview');
  }
}

/**
 * Sort learners
 */
function sortLearners(sortBy) {
  switch (sortBy) {
    case 'name':
      routeLearners.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'class':
      routeLearners.sort((a, b) => a.class.localeCompare(b.class));
      break;
    case 'area':
      routeLearners.sort((a, b) => a.pickup_area.localeCompare(b.pickup_area));
      break;
    case 'time':
    default:
      routeLearners.sort((a, b) => a.pickup_time.localeCompare(b.pickup_time));
      break;
  }
}

/**
 * Display preview
 */
function displayPreview(route, driver, minder, learners) {
  const previewSection = document.getElementById('routePreviewSection');
  if (!previewSection) return;

  previewSection.style.display = 'block';

  // Route info
  document.getElementById('previewRouteName').textContent = route.name;
  document.getElementById('previewRouteDetails').textContent = 
    `Vehicle: ${route.vehicle_no} | ${route.term}, ${route.year}`;
  document.getElementById('previewLearnerCount').textContent = learners.length;
  document.getElementById('previewAreaCount').textContent = route.areas?.length || 0;

  // Driver & Minder info
  document.getElementById('previewDriverName').textContent = driver?.name || 'Not Assigned';
  document.getElementById('previewDriverPhone').textContent = driver?.phone || 'N/A';
  document.getElementById('previewMinderName').textContent = minder?.name || 'Not Assigned';
  document.getElementById('previewMinderPhone').textContent = minder?.phone || 'N/A';

  // Areas
  const areasContainer = document.getElementById('previewAreas');
  if (areasContainer) {
    areasContainer.innerHTML = route.areas?.map(area => 
      `<span class="area-tag">${sanitizeHTML(area)}</span>`
    ).join('') || '<span>No areas defined</span>';
  }

  // Learners table
  const tableBody = document.getElementById('previewTableBody');
  if (tableBody) {
    tableBody.innerHTML = learners.map((learner, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${sanitizeHTML(learner.admission_no)}</td>
        <td>${sanitizeHTML(learner.name)}</td>
        <td>${sanitizeHTML(learner.class)}</td>
        <td>${sanitizeHTML(learner.pickup_area)}</td>
        <td>${learner.pickup_time}</td>
        <td>${sanitizeHTML(learner.father_phone)}</td>
        <td>${sanitizeHTML(learner.mother_phone)}</td>
        <td>
          <span class="status-badge ${learner.active ? 'active' : 'inactive'}">
            ${learner.active ? 'Active' : 'Inactive'}
          </span>
        </td>
      </tr>
    `).join('');
  }
}

/**
 * Hide preview
 */
function hidePreview() {
  const previewSection = document.getElementById('routePreviewSection');
  if (previewSection) {
    previewSection.style.display = 'none';
  }
}

/**
 * Handle generate report
 */
async function handleGenerateReport(e) {
  e.preventDefault();

  const routeId = document.getElementById('reportRoute').value;
  const format = document.getElementById('reportFormat').value;
  const generateBtn = document.getElementById('generateBtn');

  if (!routeId) {
    alert('Please select a route');
    return;
  }

  if (!selectedRoute || !routeLearners) {
    alert('Please wait for route data to load');
    return;
  }

  setButtonLoading(generateBtn, true);

  try {
    // Get driver and minder
    const drivers = await driversService.getByRoute(routeId);
    const driver = drivers[0] || null;
    const minder = await mindersService.getByRouteId(routeId);

    const reportData = {
      route: selectedRoute,
      driver: driver,
      minder: minder,
      learners: routeLearners,
    };

    if (format === 'pdf') {
      await generatePDF(reportData);
    } else if (format === 'excel') {
      await generateExcel(reportData);
    }

    alert('Report generated successfully!');
  } catch (error) {
    console.error('Generate report error:', error);
    alert('Failed to generate report. Please try again.');
  } finally {
    setButtonLoading(generateBtn, false);
  }
}

// Listen for sort and filter changes
document.addEventListener('change', (e) => {
  if (e.target.id === 'sortBy' || e.target.id === 'includeInactive') {
    const routeId = document.getElementById('reportRoute')?.value;
    if (routeId) {
      loadRoutePreview(routeId);
    }
  }
});
