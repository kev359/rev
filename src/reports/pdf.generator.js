// ============================================
// PDF GENERATOR (using pdfmake)
// ============================================

import { formatDate } from '../utils/helpers.js';

/**
 * Generate PDF report
 * @param {Object} reportData - Report data (route, driver, minder, learners)
 */
export async function generatePDF(reportData) {
  const { route, driver, minder, learners } = reportData;

  // Check if pdfMake is loaded
  if (typeof pdfMake === 'undefined') {
    throw new Error('pdfMake library not loaded. Please add the CDN script to your HTML.');
  }

  // Define document
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 80, 40, 60],
    
    // Header
    header: function(currentPage, pageCount) {
      return {
        columns: [
          {
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // Placeholder
            width: 50,
            margin: [40, 20, 0, 0]
          },
          {
            stack: [
              { text: 'LELANI SCHOOL', style: 'header', color: '#D32F2F' },
              { text: 'Transport Management System', style: 'subheader' }
            ],
            margin: [10, 20, 0, 0]
          }
        ]
      };
    },

    // Footer
    footer: function(currentPage, pageCount) {
      return {
        columns: [
          { text: `Generated: ${formatDate(new Date())}`, alignment: 'left', margin: [40, 0] },
          { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0] }
        ],
        fontSize: 8,
        color: '#666'
      };
    },

    // Content
    content: [
      // Route Information
      {
        text: `Route: ${route.name}`,
        style: 'routeTitle',
        margin: [0, 0, 0, 10]
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Route Details', style: 'sectionHeader' },
              { text: `Vehicle: ${route.vehicle_no}`, margin: [0, 5] },
              { text: `Term: ${route.term}, ${route.year}`, margin: [0, 5] },
              { text: `Total Learners: ${learners.length}`, margin: [0, 5] },
              { text: `Areas: ${route.areas?.length || 0}`, margin: [0, 5] }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'Personnel', style: 'sectionHeader' },
              { text: `Driver: ${driver?.name || 'Not Assigned'}`, margin: [0, 5] },
              { text: `Phone: ${driver?.phone || 'N/A'}`, margin: [0, 5] },
              { text: `Minder: ${minder?.name || 'Not Assigned'}`, margin: [0, 5] },
              { text: `Phone: ${minder?.phone || 'N/A'}`, margin: [0, 5] }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Areas Covered
      {
        text: 'Areas Covered',
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      },
      {
        text: route.areas?.join(', ') || 'No areas defined',
        margin: [0, 0, 0, 20]
      },

      // Learners Table
      {
        text: 'Learners List',
        style: 'sectionHeader',
        margin: [0, 10, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', 'auto', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            // Header
            [
              { text: '#', style: 'tableHeader' },
              { text: 'Adm No', style: 'tableHeader' },
              { text: 'Name', style: 'tableHeader' },
              { text: 'Class', style: 'tableHeader' },
              { text: 'Pickup Area', style: 'tableHeader' },
              { text: 'Time', style: 'tableHeader' },
              { text: 'Father Phone', style: 'tableHeader' },
              { text: 'Mother Phone', style: 'tableHeader' },
              { text: 'Status', style: 'tableHeader' }
            ],
            // Data rows
            ...learners.map((learner, index) => [
              { text: (index + 1).toString(), fontSize: 9 },
              { text: learner.admission_no, fontSize: 9 },
              { text: learner.name, fontSize: 9 },
              { text: learner.class, fontSize: 9 },
              { text: learner.pickup_area, fontSize: 9 },
              { text: learner.pickup_time, fontSize: 9 },
              { text: learner.father_phone, fontSize: 9 },
              { text: learner.mother_phone, fontSize: 9 },
              { 
                text: learner.active ? 'Active' : 'Inactive', 
                fontSize: 9,
                color: learner.active ? '#4CAF50' : '#F44336'
              }
            ])
          ]
        },
        layout: {
          fillColor: function (rowIndex) {
            return (rowIndex === 0) ? '#F5F5F5' : (rowIndex % 2 === 0 ? '#FAFAFA' : null);
          },
          hLineWidth: function (i, node) {
            return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5;
          },
          vLineWidth: function () {
            return 0.5;
          },
          hLineColor: function () {
            return '#E0E0E0';
          },
          vLineColor: function () {
            return '#E0E0E0';
          }
        }
      }
    ],

    // Styles
    styles: {
      header: {
        fontSize: 18,
        bold: true
      },
      subheader: {
        fontSize: 10,
        color: '#666'
      },
      routeTitle: {
        fontSize: 16,
        bold: true,
        color: '#D32F2F'
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#333'
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        fillColor: '#F5F5F5',
        color: '#333'
      }
    },

    defaultStyle: {
      fontSize: 10,
      color: '#333'
    }
  };

  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download(`${route.name}_${formatDate(new Date())}.pdf`);
}

export default { generatePDF };
