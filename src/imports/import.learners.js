// ============================================
// BULK LEARNER IMPORT
// ============================================

import learnersService from '../learners/learners.service.js';
import { validatePhone, formatPhoneNumber } from '../utils/validators.js';

/**
 * Import learners from Excel/CSV file
 * @param {File} file - File to import
 * @param {string} routeId - Route ID
 * @returns {Promise<Object>} - Import results
 */
export async function importLearners(file, routeId) {
  if (!routeId) {
    throw new Error('Route ID is required');
  }

  // Check if XLSX is loaded
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS library not loaded');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and import
        const results = await processLearners(jsonData, routeId);
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Process learners data
 */
async function processLearners(data, routeId) {
  const results = {
    total: data.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Validate required fields
      if (!row['Admission Number'] || !row['Name'] || !row['Class']) {
        throw new Error('Missing required fields');
      }

      // Format phone numbers
      const fatherPhone = formatPhoneNumber(row['Father Phone'] || '');
      const motherPhone = formatPhoneNumber(row['Mother Phone'] || '');

      if (!validatePhone(fatherPhone) || !validatePhone(motherPhone)) {
        throw new Error('Invalid phone number format');
      }

      // Create learner
      await learnersService.create({
        admission_no: row['Admission Number'].toString(),
        name: row['Name'],
        class: row['Class'],
        pickup_area: row['Pickup Area'] || '',
        pickup_time: row['Pickup Time'] || '07:00',
        father_phone: fatherPhone,
        mother_phone: motherPhone,
        route_id: routeId
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i + 2, // Excel row number (1-indexed + header)
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Download template
 */
export function downloadTemplate() {
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS library not loaded');
  }

  const template = [
    ['Admission Number', 'Name', 'Class', 'Pickup Area', 'Pickup Time', 'Father Phone', 'Mother Phone'],
    ['12345', 'John Doe', 'Grade 1', 'Westlands', '07:30', '+254712345678', '+254723456789'],
    ['12346', 'Jane Smith', 'Grade 2', 'Kilimani', '07:45', '+254734567890', '+254745678901']
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Learners Template');
  
  XLSX.writeFile(wb, 'learners_import_template.xlsx');
}

export default { importLearners, downloadTemplate };
