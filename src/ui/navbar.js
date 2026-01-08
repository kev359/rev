// ============================================
// NAVIGATION BAR COMPONENT
// ============================================

import authService from '../auth/auth.service.js';
import { sanitizeHTML } from '../utils/helpers.js';

class Navbar {
  constructor() {
    this.driver = null;
    this.isAdmin = false;
  }

  /**
   * Initialize navbar
   */
  async init() {
    // Get current session
    const { driver } = await authService.getSession();
    
    if (!driver) {
      // Not authenticated, redirect to login
      window.location.href = 'index.html';
      return;
    }

    this.driver = driver;
    this.isAdmin = driver.role === 'admin';

    // Render navbar
    this.render();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Render navbar HTML
   */
  render() {
    const navbarEl = document.getElementById('navbar');
    if (!navbarEl) return;

    const currentPage = window.location.pathname.split('/').pop();

    navbarEl.innerHTML = `
      <div class="navbar">
        <div class="navbar-container">
          <div class="navbar-brand">
            <img src="assets/logo.png" alt="Lelani School" class="navbar-logo" onerror="this.style.display='none'">
            <span class="navbar-title">Lelani Transport</span>
          </div>

          <button class="navbar-toggle" id="navbarToggle" aria-label="Toggle navigation">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div class="navbar-menu" id="navbarMenu">
            <div class="navbar-nav">
              <a href="dashboard.html" class="nav-link ${currentPage === 'dashboard.html' ? 'active' : ''}">
                <span class="nav-icon">📊</span>
                Dashboard
              </a>
              
              <a href="learners.html" class="nav-link ${currentPage === 'learners.html' ? 'active' : ''}">
                <span class="nav-icon">👥</span>
                Learners
              </a>
              
              <a href="reports.html" class="nav-link ${currentPage === 'reports.html' ? 'active' : ''}">
                <span class="nav-icon">📄</span>
                Reports
              </a>
              
              <a href="audit-logs.html" class="nav-link ${currentPage === 'audit-logs.html' ? 'active' : ''}">
                <span class="nav-icon">📋</span>
                Audit Logs
              </a>
              
              ${this.isAdmin ? `
                <a href="admin.html" class="nav-link ${currentPage === 'admin.html' ? 'active' : ''}">
                  <span class="nav-icon">⚙️</span>
                  Admin
                </a>
              ` : ''}
            </div>

            <div class="navbar-user">
              <div class="user-info">
                <span class="user-name">${sanitizeHTML(this.driver.name)}</span>
                <span class="user-role">${this.isAdmin ? 'Admin' : 'Driver'}</span>
              </div>
              <button class="btn btn-secondary btn-sm" id="logoutBtn">
                <span class="nav-icon">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add navbar styles
    this.addStyles();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const confirmed = confirm('Are you sure you want to logout?');
        if (confirmed) {
          await authService.signOut();
          window.location.href = 'index.html';
        }
      });
    }

    // Mobile menu toggle
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    
    if (navbarToggle && navbarMenu) {
      navbarToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('active');
        navbarToggle.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navbarToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
          navbarMenu.classList.remove('active');
          navbarToggle.classList.remove('active');
        }
      });
    }
  }

  /**
   * Add navbar styles
   */
  addStyles() {
    // Check if styles already added
    if (document.getElementById('navbar-styles')) return;

    const style = document.createElement('style');
    style.id = 'navbar-styles';
    style.textContent = `
      .navbar {
        background-color: var(--color-surface);
        box-shadow: var(--shadow-md);
        position: sticky;
        top: 0;
        z-index: var(--z-sticky);
        height: var(--navbar-height);
      }

      .navbar-container {
        max-width: var(--container-max-width);
        margin: 0 auto;
        padding: 0 var(--spacing-md);
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .navbar-brand {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-size-lg);
        color: var(--color-primary);
      }

      .navbar-logo {
        width: 40px;
        height: 40px;
        object-fit: contain;
      }

      .navbar-title {
        white-space: nowrap;
      }

      .navbar-toggle {
        display: none;
        flex-direction: column;
        gap: 4px;
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--spacing-sm);
      }

      .navbar-toggle span {
        display: block;
        width: 24px;
        height: 3px;
        background-color: var(--color-text-primary);
        transition: all var(--transition-fast);
      }

      .navbar-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }

      .navbar-toggle.active span:nth-child(2) {
        opacity: 0;
      }

      .navbar-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }

      .navbar-menu {
        display: flex;
        align-items: center;
        gap: var(--spacing-xl);
        flex: 1;
        justify-content: space-between;
        margin-left: var(--spacing-xl);
      }

      .navbar-nav {
        display: flex;
        gap: var(--spacing-sm);
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        color: var(--color-text-secondary);
        text-decoration: none;
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
        font-weight: var(--font-weight-medium);
        white-space: nowrap;
      }

      .nav-link:hover {
        background-color: var(--color-background);
        color: var(--color-text-primary);
        text-decoration: none;
      }

      .nav-link.active {
        background-color: var(--color-primary);
        color: var(--color-white);
      }

      .nav-icon {
        font-size: var(--font-size-lg);
      }

      .navbar-user {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .user-name {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        font-size: var(--font-size-sm);
      }

      .user-role {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .btn-sm {
        padding: var(--spacing-xs) var(--spacing-md);
        min-height: 36px;
        font-size: var(--font-size-sm);
      }

      /* Mobile Responsive */
      @media (max-width: 992px) {
        .navbar-toggle {
          display: flex;
        }

        .navbar-menu {
          position: fixed;
          top: var(--navbar-height);
          left: 0;
          right: 0;
          background-color: var(--color-surface);
          box-shadow: var(--shadow-lg);
          flex-direction: column;
          align-items: stretch;
          gap: 0;
          margin-left: 0;
          padding: var(--spacing-md);
          transform: translateY(-100%);
          opacity: 0;
          visibility: hidden;
          transition: all var(--transition-base);
        }

        .navbar-menu.active {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }

        .navbar-nav {
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .nav-link {
          width: 100%;
          justify-content: flex-start;
        }

        .navbar-user {
          flex-direction: column;
          align-items: stretch;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          margin-top: var(--spacing-md);
        }

        .user-info {
          align-items: flex-start;
          margin-bottom: var(--spacing-sm);
        }

        #logoutBtn {
          width: 100%;
        }
      }

      @media (max-width: 576px) {
        .navbar-title {
          font-size: var(--font-size-base);
        }

        .navbar-logo {
          width: 32px;
          height: 32px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const navbar = new Navbar();
  navbar.init();
});

export default Navbar;
