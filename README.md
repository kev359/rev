# Lelani School Transport Management System

A modern, secure, and user-friendly transport management system for Lelani School.

## 📋 Overview

The Lelani School Transport Management System (LSTMS) is designed to streamline transport data management, eliminate manual formatting errors, and produce professional, school-branded reports for parents and administrators.

## ✨ Features

### For Drivers
- ✅ Secure login with email/password
- ✅ View assigned route details
- ✅ Add, edit, and manage learners on assigned route
- ✅ View all routes (read-only)
- ✅ Generate PDF and Excel reports for any route
- ✅ Update minder contact information
- ✅ View audit logs for assigned route
- ✅ Pickup time conflict warnings

### For Administrators
- ✅ Full system access
- ✅ Manage routes, drivers, minders, and learners
- ✅ Bulk import learners and areas (Excel/CSV)
- ✅ Generate reports for any route
- ✅ Year-end rollover (archive and duplicate routes)
- ✅ View complete audit trail
- ✅ Create driver and admin accounts

## 🚀 Getting Started

### Prerequisites

1. **Supabase Account**
   - Create a free account at [supabase.com](https://supabase.com)
   - Follow the setup guide in `SUPABASE_SETUP.md`

2. **Web Browser**
   - Modern browser (Chrome, Firefox, Safari, Edge)
   - JavaScript enabled

### Installation

1. **Clone or Download** this repository

2. **Configure Supabase**
   - Follow the complete setup guide in `SUPABASE_SETUP.md`
   - Get your Supabase credentials (URL and anon key)

3. **Update Configuration**
   - Open `src/config.js`
   - Replace placeholders with your Supabase credentials:
     ```javascript
     export const supabaseConfig = {
       url: 'https://xxxxx.supabase.co',
       anonKey: 'your-anon-key-here',
     };
     ```

4. **Add Supabase CDN**
   - The HTML files already include the Supabase CDN script
   - No additional installation needed for basic setup

5. **Deploy**
   - Upload all files to your web hosting (Netlify, Vercel, etc.)
   - Or run locally with a simple HTTP server:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js (install http-server first: npm install -g http-server)
     http-server -p 8000
     ```

6. **Access the System**
   - Open `http://localhost:8000` in your browser
   - Login with your admin credentials

## 📁 Project Structure

```
lelani/
├── index.html                  # Login page
├── forgot-password.html        # Password reset page
├── dashboard.html              # Dashboard
├── learners.html               # Learner management
├── reports.html                # Report generation
├── admin.html                  # Admin panel
├── audit-logs.html             # Audit logs
├── assets/
│   ├── logo.png               # School logo
│   └── favicon.png            # Favicon
├── src/
│   ├── config.js              # Configuration
│   ├── auth/
│   │   ├── login.js           # Login logic
│   │   ├── forgot-password.js # Password reset logic
│   │   └── auth.service.js    # Authentication service
│   ├── routes/
│   │   └── routes.service.js  # Routes service
│   ├── drivers/
│   │   └── drivers.service.js # Drivers service
│   ├── minders/
│   │   └── minders.service.js # Minders service
│   ├── learners/
│   │   ├── learners.js        # Learners page logic
│   │   ├── learners.service.js # Learners service
│   │   └── conflict.checker.js # Pickup time conflict detection
│   ├── reports/
│   │   ├── reports.js         # Reports page logic
│   │   ├── pdf.generator.js   # PDF generation (pdfmake)
│   │   └── excel.generator.js # Excel generation (SheetJS)
│   ├── admin/
│   │   └── admin.js           # Admin panel logic
│   ├── audit/
│   │   └── audit.js           # Audit logs logic
│   ├── imports/
│   │   ├── import.learners.js # Learner import
│   │   └── import.areas.js    # Area import
│   ├── ui/
│   │   ├── navbar.js          # Navigation bar
│   │   └── dashboard.js       # Dashboard logic
│   ├── utils/
│   │   ├── validators.js      # Validation functions
│   │   └── helpers.js         # Helper functions
│   └── styles/
│       ├── variables.css      # CSS variables (branding)
│       ├── main.css           # Main styles
│       ├── auth.css           # Auth pages styles
│       ├── dashboard.css      # Dashboard styles
│       ├── learners.css       # Learners page styles
│       ├── reports.css        # Reports page styles
│       ├── admin.css          # Admin page styles
│       └── audit.css          # Audit logs styles
├── PRD.md                      # Product Requirements Document
├── SUPABASE_SETUP.md          # Supabase setup guide
└── README.md                   # This file
```

## 🎨 Branding

The system uses Lelani School's official branding:

- **Primary Color:** Red (#D32F2F)
- **Secondary Color:** Dark Grey (#333333)
- **Logo:** Lelani School official logo
- **Font:** System fonts (optimized for readability)

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all database tables
- ✅ Role-based access control (Driver vs Admin)
- ✅ Secure authentication via Supabase Auth
- ✅ Phone number validation (Kenyan format: +254...)
- ✅ Input validation and sanitization
- ✅ Audit logging for all learner changes
- ✅ No direct deletion of learners (use active flag)

## 📱 Mobile Support

The system is fully responsive and works on:
- ✅ Smartphones (iOS, Android)
- ✅ Tablets
- ✅ Laptops
- ✅ Desktop computers

## 📊 Data Formats

### Phone Numbers
- **Format:** +254XXXXXXXXX (Kenyan international format)
- **Example:** +254712345678

### Time
- **Format:** HH:mm (24-hour)
- **Example:** 07:30, 14:45

### Date
- **Display:** DD/MM/YYYY
- **Example:** 08/01/2026

## 🛠️ Development

### Adding New Features

1. Create new service files in appropriate directories
2. Follow the modular structure
3. Update relevant HTML pages
4. Add styles to page-specific CSS files
5. Test thoroughly before deployment

### Code Style

- Use ES6+ JavaScript features
- Follow existing naming conventions
- Comment complex logic
- Keep functions small and focused
- Use semantic HTML
- Follow CSS BEM methodology where applicable

## 📚 Documentation

- **PRD:** See `PRD.md` for complete product requirements
- **Supabase Setup:** See `SUPABASE_SETUP.md` for database configuration
- **API Documentation:** Coming soon

## 🐛 Troubleshooting

### Login Issues
- Verify Supabase credentials in `src/config.js`
- Check browser console for errors
- Ensure user account exists in Supabase

### RLS Policy Errors
- Verify RLS policies are correctly set up
- Check user role in `drivers` table
- Ensure user is authenticated

### Import Failures
- Check file format (Excel or CSV)
- Verify column headers match template
- Check for duplicate admission numbers
- Validate phone number format (+254...)

## 📞 Support

For technical support, contact:
- **Email:** ict@lelani.school
- **Phone:** ICT Department hotline

## 📄 License

© 2026 Lelani School. All rights reserved.

## 🙏 Acknowledgments

Built with:
- [Supabase](https://supabase.com) - Backend and authentication
- [pdfmake](http://pdfmake.org) - PDF generation
- [SheetJS](https://sheetjs.com) - Excel export

---

**Version:** 1.0.0 (MVP)  
**Last Updated:** January 8, 2026  
**Status:** Ready for Deployment ✅
