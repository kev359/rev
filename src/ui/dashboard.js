// ============================================
// DASHBOARD PAGE LOGIC
// ============================================

import authService from '../auth/auth.service.js';
import learnersService from '../learners/learners.service.js';
import routesService from '../routes/routes.service.js';
import driversService from '../drivers/drivers.service.js';
import mindersService from '../minders/minders.service.js';
import settingsService from '../settings/settings.service.js';
import { setLoadingState, formatDate, sanitizeHTML } from '../utils/helpers.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  // Require authentication
  const authenticated = await authService.requireAuth();
  if (!authenticated) return;

  // Get current driver
  const driver = authService.getCurrentDriver();
  if (!driver) {
    window.location.href = 'index.html';
    return;
  }

  // Update user name
  const userNameEl = document.getElementById('userName');
  if (userNameEl) {
    userNameEl.textContent = driver.name;
    
    // Add (Admin) label if admin
    if (driver.role === 'admin') {
      const roleSpan = document.createElement('span');
      roleSpan.className = 'role-badge admin';
      roleSpan.textContent = 'ADMIN';
      roleSpan.style.marginLeft = '10px';
      userNameEl.appendChild(roleSpan);
    }
  }

  // Load dashboard data
  await loadDashboardData(driver);

  // Setup refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDashboardData(driver);
    });
  }
});

/**
 * Load dashboard data
 * @param {Object} driver - Current driver
 */
async function loadDashboardData(driver) {
  try {
    // Show loading state
    const loadingState = document.getElementById('loadingState');
    const driverStats = document.getElementById('driverStats');
    const adminStats = document.getElementById('adminStats');
    
    // Handle admin view
    if (driver.role === 'admin') {
      // Toggle visibility
      if (driverStats) driverStats.style.display = 'none';
      if (adminStats) adminStats.style.display = 'grid';
      
      // Fetch system-wide stats
      const [routes, driversList, minders, learners] = await Promise.all([
        routesService.getAll(),
        driversService.getAll(),
        mindersService.getAll(),
        learnersService.getAll()
      ]);

      document.getElementById('adminTotalRoutes').textContent = routes.length || 0;
      document.getElementById('adminTotalDrivers').textContent = driversList.length || 0;
      document.getElementById('adminTotalMinders').textContent = minders.length || 0;
      document.getElementById('adminTotalLearners').textContent = learners.length || 0;
      
      // Load recent activity
      await loadRecentActivity();
      return; 
    }

    // Handle normal driver view (Default)
    if (driverStats) driverStats.style.display = 'grid';
    if (adminStats) adminStats.style.display = 'none';

    if (loadingState && driverStats) {
      setLoadingState(loadingState, driverStats, true);
    }

    // Get route information
    let route = null;
    if (driver.route_id) {
      route = await routesService.getById(driver.route_id);
    }

    // Get learners for driver's route
    let learners = [];
    let activeLearners = [];
    
    if (driver.route_id) {
      learners = await learnersService.getByRoute(driver.route_id, false);
      activeLearners = learners.filter(l => l.active);
    }

    // Get unique areas
    const areas = route?.areas || [];
    const areaCount = Array.isArray(areas) ? areas.length : 0;

    // Update stats
    updateStats({
      totalLearners: learners.length,
      activeLearners: activeLearners.length,
      routeName: route?.name || 'Not Assigned',
      totalAreas: areaCount,
    });

    // Hide loading state
    if (loadingState && driverStats) {
      setLoadingState(loadingState, driverStats, false);
    }
  } catch (error) {
    console.error('Load dashboard data error:', error);
    alert('Failed to load dashboard data. Please try again.');
  }
}

/**
 * Update dashboard stats
 * @param {Object} stats - Stats object
 */
function updateStats(stats) {
  const totalLearnersEl = document.getElementById('totalLearners');
  const activeLearnersEl = document.getElementById('activeLearners');
  const routeNameEl = document.getElementById('routeName');
  const totalAreasEl = document.getElementById('totalAreas');

  if (totalLearnersEl) totalLearnersEl.textContent = stats.totalLearners;
  if (activeLearnersEl) activeLearnersEl.textContent = stats.activeLearners;
  if (routeNameEl) routeNameEl.textContent = stats.routeName;
  if (totalAreasEl) totalAreasEl.textContent = stats.totalAreas;
}

/**
 * Load recent activity (admin only)
 */
async function loadRecentActivity() {
  try {
    const recentActivitySection = document.getElementById('recentActivitySection');
    if (!recentActivitySection) return;

    // Show section
    recentActivitySection.style.display = 'block';

    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    // Get recent audit logs
    const { data: logs, error } = await authService.supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!logs || logs.length === 0) {
      activityList.innerHTML = '<p class="empty-message">No recent activity</p>';
      return;
    }

    // Render activity items
    activityList.innerHTML = logs.map(log => `
      <div class="activity-item">
        <div class="activity-icon">${getActionIcon(log.action)}</div>
        <div class="activity-content">
          <p>
            <strong>${log.user_name}</strong> ${getActionText(log.action)} 
            ${log.field_name ? `<em>${log.field_name}</em>` : ''}
          </p>
          <span class="activity-time">${formatDate(log.timestamp)}</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load recent activity error:', error);
  }
}

/**
 * Get action icon
 * @param {string} action - Action type
 * @returns {string} - Icon emoji
 */
function getActionIcon(action) {
  const icons = {
    created: '➕',
    updated: '✏️',
    deactivated: '⏸️',
    reactivated: '▶️',
  };
  return icons[action] || '📝';
}

/**
 * Get action text
 * @param {string} action - Action type
 * @returns {string} - Action description
 */
function getActionText(action) {
  const texts = {
    created: 'created a learner',
    updated: 'updated',
    deactivated: 'deactivated a learner',
    reactivated: 'reactivated a learner',
  };
  return texts[action] || 'modified';
}


