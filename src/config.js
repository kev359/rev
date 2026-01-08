// ============================================
// SUPABASE CONFIGURATION
// ============================================

// TODO: Replace these with your actual Supabase credentials
// Get these from: Supabase Dashboard > Settings > API

export const supabaseConfig = {
  url: 'https://unofiwsocigosisdciwl.supabase.co', // e.g., https://xxxxx.supabase.co
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVub2Zpd3NvY2lnb3Npc2RjaXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzAzMjcsImV4cCI6MjA4MzQwNjMyN30.QK-wLo0o4XtTBmWR02QjU1ZTITDET1YFdE0MQsWYJtQ', // Your anon/public key
};

// Initialize Supabase client
// Note: This will be imported by other modules
// Make sure to install Supabase JS library first:
// npm install @supabase/supabase-js

// For now, we'll use CDN in HTML files
// Add this to your HTML <head>:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

export function getSupabaseClient() {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase library not loaded. Add CDN script to HTML.');
    return null;
  }
  
  return window.supabase.createClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );
}

// App Configuration
export const appConfig = {
  appName: 'Lelani School Transport System',
  version: '1.0.0',
  
  // Pagination
  itemsPerPage: 50,
  
  // Date/Time Formats
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm', // 24-hour format
  
  // Phone Number Validation
  phoneRegex: /^\+254[0-9]{9}$/,
  phoneFormat: '+254XXXXXXXXX',
  
  // File Upload
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['.xlsx', '.xls', '.csv'],
  
  // Routes
  routes: {
    login: 'index.html',
    dashboard: 'dashboard.html',
    learners: 'learners.html',
    reports: 'reports.html',
    admin: 'admin.html',
    auditLogs: 'audit-logs.html',
  },
};

// Export for use in other modules
export default {
  supabaseConfig,
  appConfig,
  getSupabaseClient,
};
