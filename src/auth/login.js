// ============================================
// LOGIN PAGE LOGIC
// ============================================

import authService from './auth.service.js';
import { validateEmail, validateRequired } from '../utils/validators.js';
import { setButtonLoading, showMessage, getQueryParam } from '../utils/helpers.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if already authenticated
  const authenticated = await authService.isAuthenticated();
  if (authenticated) {
    const returnUrl = getQueryParam('return') || 'dashboard.html';
    window.location.href = returnUrl;
    return;
  }

  // Get form elements
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');

  // Handle form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate inputs
    if (!validateRequired(email)) {
      showMessage('Please enter your email address', 'error', errorMessage);
      emailInput.focus();
      return;
    }

    if (!validateEmail(email)) {
      showMessage('Please enter a valid email address', 'error', errorMessage);
      emailInput.focus();
      return;
    }

    if (!validateRequired(password)) {
      showMessage('Please enter your password', 'error', errorMessage);
      passwordInput.focus();
      return;
    }

    // Show loading state
    setButtonLoading(loginBtn, true);
    errorMessage.style.display = 'none';

    try {
      // Attempt sign in
      const result = await authService.signIn(email, password);

      if (result.success) {
        // Success - redirect to dashboard or return URL
        const returnUrl = getQueryParam('return') || 'dashboard.html';
        window.location.href = returnUrl;
      } else {
        // Show error
        setButtonLoading(loginBtn, false);
        showMessage(result.error || 'Invalid email or password', 'error', errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      setButtonLoading(loginBtn, false);
      showMessage('An error occurred. Please try again.', 'error', errorMessage);
    }
  });

  // Clear error on input
  emailInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
  });

  passwordInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
  });

  // Focus email input
  emailInput.focus();
});
