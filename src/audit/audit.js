// ============================================
// AUDIT LOGS PAGE LOGIC
// ============================================

import authService from '../auth/auth.service.js';
import { setLoadingState, setEmptyState, formatDate, getRelativeTime } from '../utils/helpers.js';

let currentPage = 1;
const itemsPerPage = 50;
let allLogs = [];
let filteredLogs = [];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  // Require authentication
  const authenticated = await authService.requireAuth();
  if (!authenticated) return;

  // Load audit logs
  await loadAuditLogs();
  
  // Setup event listeners
  setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshLogsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadAuditLogs);
  }

  // Filters
  const actionFilter = document.getElementById('actionFilter');
  const userFilter = document.getElementById('userFilter');
  const dateFilter = document.getElementById('dateFilter');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  if (actionFilter) actionFilter.addEventListener('change', applyFilters);
  if (userFilter) userFilter.addEventListener('change', applyFilters);
  if (dateFilter) dateFilter.addEventListener('change', applyFilters);
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (actionFilter) actionFilter.value = '';
      if (userFilter) userFilter.value = '';
      if (dateFilter) dateFilter.value = '';
      applyFilters();
    });
  }

  // Pagination
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  if (prevPageBtn) prevPageBtn.addEventListener('click', () => changePage(-1));
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => changePage(1));
}

/**
 * Load audit logs
 */
async function loadAuditLogs() {
  try {
    const loadingState = document.getElementById('loadingState');
    const tableBody = document.getElementById('auditLogsTableBody');
    const emptyState = document.getElementById('emptyState');

    setLoadingState(loadingState, tableBody, true);

    // Get current driver
    const driver = authService.getCurrentDriver();
    
    // Build query
    let query = authService.supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    // If not admin, filter by route
    if (driver.role !== 'admin' && driver.route_id) {
      // Get learners on driver's route
      const { data: learners } = await authService.supabase
        .from('learners')
        .select('id')
        .eq('route_id', driver.route_id);

      const learnerIds = learners?.map(l => l.id) || [];
      
      if (learnerIds.length > 0) {
        query = query.in('learner_id', learnerIds);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    allLogs = data || [];
    
    // Populate user filter
    populateUserFilter();
    
    // Apply filters
    applyFilters();

    setLoadingState(loadingState, tableBody, false);
  } catch (error) {
    console.error('Load audit logs error:', error);
    alert('Failed to load audit logs. Please try again.');
  }
}

/**
 * Populate user filter
 */
function populateUserFilter() {
  const userFilter = document.getElementById('userFilter');
  if (!userFilter) return;

  const uniqueUsers = [...new Set(allLogs.map(log => log.user_name))].sort();
  
  userFilter.innerHTML = '<option value="">All Users</option>' +
    uniqueUsers.map(user => `<option value="${user}">${user}</option>`).join('');
}

/**
 * Apply filters
 */
function applyFilters() {
  const actionFilter = document.getElementById('actionFilter')?.value;
  const userFilter = document.getElementById('userFilter')?.value;
  const dateFilter = document.getElementById('dateFilter')?.value;

  filteredLogs = allLogs.filter(log => {
    // Action filter
    if (actionFilter && log.action !== actionFilter) return false;
    
    // User filter
    if (userFilter && log.user_name !== userFilter) return false;
    
    // Date filter
    if (dateFilter) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate !== dateFilter) return false;
    }
    
    return true;
  });

  currentPage = 1;
  renderAuditLogs();
}

/**
 * Render audit logs
 */
function renderAuditLogs() {
  const tableBody = document.getElementById('auditLogsTableBody');
  const emptyState = document.getElementById('emptyState');
  const pagination = document.getElementById('pagination');

  if (!tableBody) return;

  // Check if empty
  if (filteredLogs.length === 0) {
    setEmptyState(emptyState, tableBody, true);
    if (pagination) pagination.style.display = 'none';
    return;
  }

  setEmptyState(emptyState, tableBody, false);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Render table
  tableBody.innerHTML = paginatedLogs.map(log => `
    <tr>
      <td>${formatDate(log.timestamp)}</td>
      <td>${log.user_name || 'N/A'}</td>
      <td>
        <span class="role-badge ${log.user_role}">${log.user_role || 'N/A'}</span>
      </td>
      <td>
        <span class="action-cell ${log.action}">${log.action}</span>
      </td>
      <td>${log.learner_id ? 'Learner' : 'N/A'}</td>
      <td>${log.field_name || '-'}</td>
      <td>
        ${log.old_value ? `<span class="value-cell">${log.old_value}</span>` : '-'}
      </td>
      <td>
        ${log.new_value ? `<span class="value-cell">${log.new_value}</span>` : '-'}
      </td>
    </tr>
  `).join('');

  // Update pagination
  updatePagination();
}

/**
 * Update pagination
 */
function updatePagination() {
  const pagination = document.getElementById('pagination');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageInfo = document.getElementById('pageInfo');

  if (!pagination) return;

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';

  // Update buttons
  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 1;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage === totalPages;
  }

  // Update page info
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

/**
 * Change page
 */
function changePage(direction) {
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const newPage = currentPage + direction;

  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderAuditLogs();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
