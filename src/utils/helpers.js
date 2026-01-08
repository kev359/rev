// ============================================
// HELPER UTILITIES
// ============================================

/**
 * Format date to DD/MM/YYYY
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date
 */
export function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format time to HH:mm
 * @param {string} time - Time to format
 * @returns {string} - Formatted time
 */
export function formatTime(time) {
  if (!time) return '';
  // If time is already in HH:mm format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  
  // If time includes seconds, remove them
  if (/^\d{2}:\d{2}:\d{2}/.test(time)) {
    return time.substring(0, 5);
  }
  
  return time;
}

/**
 * Format timestamp to readable format
 * @param {Date|string} timestamp - Timestamp to format
 * @returns {string} - Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return `${formatDate(date)} ${formatTime(date.toTimeString())}`;
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date|string} timestamp - Timestamp
 * @returns {string} - Relative time
 */
export function getRelativeTime(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return formatDate(timestamp);
}

/**
 * Show loading state on button
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} loading - Loading state
 */
export function setButtonLoading(button, loading) {
  const textEl = button.querySelector('.btn-text');
  const loaderEl = button.querySelector('.btn-loader');

  if (loading) {
    button.disabled = true;
    if (textEl) textEl.style.display = 'none';
    if (loaderEl) loaderEl.style.display = 'inline-flex';
  } else {
    button.disabled = false;
    if (textEl) textEl.style.display = 'inline';
    if (loaderEl) loaderEl.style.display = 'none';
  }
}

/**
 * Show message (error, success, warning, info)
 * @param {string} message - Message to display
 * @param {string} type - Message type (error, success, warning, info)
 * @param {HTMLElement} container - Container element
 */
export function showMessage(message, type = 'info', container) {
  if (!container) return;

  // Clear previous messages
  container.innerHTML = '';
  container.style.display = 'block';

  // Set message class
  container.className = `${type}-message`;
  container.textContent = message;

  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      container.style.display = 'none';
    }, 5000);
  }
}

/**
 * Hide message
 * @param {HTMLElement} container - Container element
 */
export function hideMessage(container) {
  if (container) {
    container.style.display = 'none';
    container.innerHTML = '';
  }
}

/**
 * Show/hide loading state
 * @param {HTMLElement} loadingEl - Loading element
 * @param {HTMLElement} contentEl - Content element
 * @param {boolean} loading - Loading state
 */
export function setLoadingState(loadingEl, contentEl, loading) {
  if (loading) {
    if (loadingEl) loadingEl.style.display = 'block';
    if (contentEl) contentEl.style.display = 'none';
  } else {
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
  }
}

/**
 * Show/hide empty state
 * @param {HTMLElement} emptyEl - Empty state element
 * @param {HTMLElement} contentEl - Content element
 * @param {boolean} empty - Empty state
 */
export function setEmptyState(emptyEl, contentEl, empty) {
  if (empty) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (contentEl) contentEl.style.display = 'none';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
  }
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML to sanitize
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null} - Parameter value
 */
export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Redirect to page
 * @param {string} page - Page to redirect to
 */
export function redirect(page) {
  window.location.href = page;
}

/**
 * Sort array of objects by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - Sort order (asc or desc)
 * @returns {Array} - Sorted array
 */
export function sortByKey(array, key, order = 'asc') {
  return array.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filter array by search term
 * @param {Array} array - Array to filter
 * @param {string} searchTerm - Search term
 * @param {Array} keys - Keys to search in
 * @returns {Array} - Filtered array
 */
export function filterBySearch(array, searchTerm, keys) {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key];
      return value && value.toString().toLowerCase().includes(term);
    });
  });
}

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} - Grouped object
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Download file
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename
 */
export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default {
  formatDate,
  formatTime,
  formatTimestamp,
  getRelativeTime,
  setButtonLoading,
  showMessage,
  hideMessage,
  setLoadingState,
  setEmptyState,
  debounce,
  sanitizeHTML,
  getQueryParam,
  redirect,
  sortByKey,
  filterBySearch,
  groupBy,
  downloadFile,
  copyToClipboard,
  formatFileSize,
  generateId,
};
