// ============================================
// BULK AREA IMPORT
// ============================================

import routesService from '../routes/routes.service.js';

/**
 * Import areas from Excel/CSV file
 * @param {File} file - File to import
 * @param {string} routeId - Route ID
 * @returns {Promise<Object>} - Import results
 */
export async function importAreas(file, routeId) {
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

        // Process areas
        const results = await processAreas(jsonData, routeId);
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
 * Process areas data
 */
async function processAreas(data, routeId) {
  try {
    // Extract area names
    const areas = data
      .map(row => row['Area Name'])
      .filter(area => area && area.trim().length > 0)
      .map(area => area.trim());

    // Remove duplicates
    const uniqueAreas = [...new Set(areas)];

    // Get current route
    const route = await routesService.getById(routeId);

    // Update route with new areas
    await routesService.update(routeId, {
      ...route,
      areas: uniqueAreas
    });

    return {
      total: data.length,
      successful: uniqueAreas.length,
      failed: data.length - uniqueAreas.length,
      areas: uniqueAreas
    };
  } catch (error) {
    throw new Error(`Failed to import areas: ${error.message}`);
  }
}

/**
 * Download template
 */
export function downloadTemplate() {
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS library not loaded');
  }

  const template = [
    ['Area Name'],
    ['Westlands'],
    ['Kilimani'],
    ['Lavington'],
    ['Parklands']
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Areas Template');
  
  XLSX.writeFile(wb, 'areas_import_template.xlsx');
}

export default { importAreas, downloadTemplate };
