// ============================================
// FORGOT PASSWORD PAGE LOGIC
// ============================================

import authService from './auth.service.js';
import { validateEmail, validateRequired } from '../utils/validators.js';
import { setButtonLoading, showMessage } from '../utils/helpers.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Get form elements
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const emailInput = document.getElementById('email');
  const resetBtn = document.getElementById('resetBtn');
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');

  // Handle form submission
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const email = emailInput.value.trim();

    // Validate input
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

    // Show loading state
    setButtonLoading(resetBtn, true);
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    try {
      // Send password reset email
      const result = await authService.resetPassword(email);

      setButtonLoading(resetBtn, false);

      if (result.success) {
        // Show success message
        showMessage(
          'Password reset link has been sent to your email. Please check your inbox.',
          'success',
          successMessage
        );
        
        // Clear form
        emailInput.value = '';
      } else {
        // Show error
        showMessage(
          result.error || 'Failed to send reset link. Please try again.',
          'error',
          errorMessage
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setButtonLoading(resetBtn, false);
      showMessage('An error occurred. Please try again.', 'error', errorMessage);
    }
  });

  // Clear messages on input
  emailInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
  });

  // Focus email input
  emailInput.focus();
});
