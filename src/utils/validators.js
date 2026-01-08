// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate Kenyan phone number format (+254XXXXXXXXX)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export function validatePhone(phone) {
  const phoneRegex = /^\+254[0-9]{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate time format (HH:mm)
 * @param {string} time - Time to validate
 * @returns {boolean} - True if valid
 */
export function validateTime(time) {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validate admission number (not empty, alphanumeric)
 * @param {string} admissionNo - Admission number to validate
 * @returns {boolean} - True if valid
 */
export function validateAdmissionNo(admissionNo) {
  return admissionNo && admissionNo.trim().length > 0;
}

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @returns {boolean} - True if not empty
 */
export function validateRequired(value) {
  return value !== null && value !== undefined && value.toString().trim().length > 0;
}

/**
 * Format phone number to Kenyan format
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export function formatPhoneNumber(phone) {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  // Add + prefix
  return '+' + cleaned;
}

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - { valid: boolean, errors: Object }
 */
export function validateForm(data, rules) {
  const errors = {};
  let valid = true;

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Required validation
    if (rule.required && !validateRequired(value)) {
      errors[field] = `${rule.label || field} is required`;
      valid = false;
      continue;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) {
      continue;
    }

    // Email validation
    if (rule.type === 'email' && !validateEmail(value)) {
      errors[field] = `${rule.label || field} must be a valid email`;
      valid = false;
    }

    // Phone validation
    if (rule.type === 'phone' && !validatePhone(value)) {
      errors[field] = `${rule.label || field} must be in format +254XXXXXXXXX`;
      valid = false;
    }

    // Time validation
    if (rule.type === 'time' && !validateTime(value)) {
      errors[field] = `${rule.label || field} must be in format HH:mm`;
      valid = false;
    }

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
      valid = false;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be at most ${rule.maxLength} characters`;
      valid = false;
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors[field] = rule.customMessage || `${rule.label || field} is invalid`;
      valid = false;
    }
  }

  return { valid, errors };
}

/**
 * Display validation errors on form
 * @param {Object} errors - Errors object from validateForm
 * @param {HTMLFormElement} form - Form element
 */
export function displayFormErrors(errors, form) {
  // Clear previous errors
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.error-border').forEach(el => el.classList.remove('error-border'));

  // Display new errors
  for (const [field, message] of Object.entries(errors)) {
    const input = form.querySelector(`[name="${field}"], #${field}`);
    if (input) {
      input.classList.add('error-border');
      
      const errorEl = document.createElement('small');
      errorEl.className = 'field-error';
      errorEl.style.color = 'var(--color-error)';
      errorEl.style.fontSize = 'var(--font-size-xs)';
      errorEl.style.marginTop = 'var(--spacing-xs)';
      errorEl.style.display = 'block';
      errorEl.textContent = message;
      
      input.parentElement.appendChild(errorEl);
    }
  }
}

/**
 * Clear form errors
 * @param {HTMLFormElement} form - Form element
 */
export function clearFormErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.error-border').forEach(el => el.classList.remove('error-border'));
}

export default {
  validatePhone,
  validateEmail,
  validateTime,
  validateAdmissionNo,
  validateRequired,
  formatPhoneNumber,
  validateForm,
  displayFormErrors,
  clearFormErrors,
};
