// ============================================
// EXCEL GENERATOR (using SheetJS)
// ============================================

import { formatDate } from '../utils/helpers.js';

/**
 * Generate Excel report
 * @param {Object} reportData - Report data (route, driver, minder, learners)
 */
export async function generateExcel(reportData) {
  const { route, driver, minder, learners } = reportData;

  // Check if XLSX is loaded
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS library not loaded. Please add the CDN script to your HTML.');
  }

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Route Information
  const routeInfo = [
    ['LELANI SCHOOL - TRANSPORT MANAGEMENT SYSTEM'],
    [''],
    ['Route Information'],
    ['Route Name:', route.name],
    ['Vehicle Number:', route.vehicle_no],
    ['Term:', route.term],
    ['Year:', route.year],
    ['Total Learners:', learners.length],
    ['Total Areas:', route.areas?.length || 0],
    [''],
    ['Personnel'],
    ['Driver:', driver?.name || 'Not Assigned'],
    ['Driver Phone:', driver?.phone || 'N/A'],
    ['Minder:', minder?.name || 'Not Assigned'],
    ['Minder Phone:', minder?.phone || 'N/A'],
    [''],
    ['Areas Covered'],
    [route.areas?.join(', ') || 'No areas defined'],
    [''],
    ['Generated:', formatDate(new Date())]
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(routeInfo);
  
  // Set column widths for info sheet
  wsInfo['!cols'] = [
    { wch: 20 },
    { wch: 40 }
  ];

  XLSX.utils.book_append_sheet(wb, wsInfo, 'Route Info');

  // Sheet 2: Learners List
  const learnersData = [
    [
      '#',
      'Admission No',
      'Name',
      'Class',
      'Pickup Area',
      'Pickup Time',
      'Father Phone',
      'Mother Phone',
      'Status'
    ],
    ...learners.map((learner, index) => [
      index + 1,
      learner.admission_no,
      learner.name,
      learner.class,
      learner.pickup_area,
      learner.pickup_time,
      learner.father_phone,
      learner.mother_phone,
      learner.active ? 'Active' : 'Inactive'
    ])
  ];

  const wsLearners = XLSX.utils.aoa_to_sheet(learnersData);

  // Set column widths for learners sheet
  wsLearners['!cols'] = [
    { wch: 5 },   // #
    { wch: 12 },  // Admission No
    { wch: 25 },  // Name
    { wch: 10 },  // Class
    { wch: 20 },  // Pickup Area
    { wch: 12 },  // Pickup Time
    { wch: 15 },  // Father Phone
    { wch: 15 },  // Mother Phone
    { wch: 10 }   // Status
  ];

  XLSX.utils.book_append_sheet(wb, wsLearners, 'Learners');

  // Sheet 3: Summary by Area
  const areaGroups = {};
  learners.forEach(learner => {
    if (!areaGroups[learner.pickup_area]) {
      areaGroups[learner.pickup_area] = [];
    }
    areaGroups[learner.pickup_area].push(learner);
  });

  const summaryData = [
    ['Summary by Pickup Area'],
    [''],
    ['Area', 'Total Learners', 'Active', 'Inactive'],
    ...Object.entries(areaGroups).map(([area, areaLearners]) => [
      area,
      areaLearners.length,
      areaLearners.filter(l => l.active).length,
      areaLearners.filter(l => !l.active).length
    ]),
    [''],
    ['TOTAL', learners.length, learners.filter(l => l.active).length, learners.filter(l => !l.active).length]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths for summary sheet
  wsSummary['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 }
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 4: Contact List (for emergencies)
  const contactsData = [
    ['Emergency Contact List'],
    [''],
    ['Learner Name', 'Class', 'Father Phone', 'Mother Phone'],
    ...learners
      .filter(l => l.active)
      .map(learner => [
        learner.name,
        learner.class,
        learner.father_phone,
        learner.mother_phone
      ])
  ];

  const wsContacts = XLSX.utils.aoa_to_sheet(contactsData);

  // Set column widths for contacts sheet
  wsContacts['!cols'] = [
    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(wb, wsContacts, 'Contacts');

  // Generate filename
  const filename = `${route.name}_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
}

export default { generateExcel };
