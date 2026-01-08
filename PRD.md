# Lelani School Transport System – Product Requirements Document (PRD)

📘 **Product Requirements Document (PRD)**

## Product Name
**Lelani School Transport Management System (LSTMS)**

## Version
**v1.0 (MVP)**

## Prepared by
**ICT Department – Lelani School**

---

## 1. Background & Problem Statement

Lelani School currently manages transport data using manually edited Google Sheets. This process has resulted in:

- Drivers manually formatting documents
- High error rates due to low computer literacy
- Inconsistent and poorly formatted PDFs sent to parents
- Repetitive work when corrections are needed
- No validation, versioning, or controlled access

The school requires a simple, secure, mobile-friendly system that allows drivers to enter data via forms, while the system automatically generates professional transport lists in PDF and Excel formats.

---

## 2. Product Vision

To build a free, reliable, and easy-to-use transport management system that:

- Eliminates manual formatting
- Reduces driver workload
- Produces clean, school-branded reports
- Works on any device (phone, tablet, computer)
- Scales with minimal cost

---

## 3. Target Users & Roles

### 3.1 User Roles

#### 1️⃣ Driver
- Login securely
- View assigned route only (edit mode)
- View all routes (read-only)
- Add, edit, and deactivate/reactivate learners on assigned route
- Manage minder details for assigned route
- Generate PDF and Excel lists for any route
- Receive warnings for pickup time conflicts

#### 2️⃣ Admin (ICT / Transport Office)
- Full system access
- Manage routes, drivers, minders, and learners
- Import bulk data
- Generate reports for any route
- Archive old data and duplicate routes for new terms
- View audit logs for learner changes

---

## 4. Functional Requirements

### 4.1 Authentication & Access Control

- Email/password authentication (Supabase Auth)
- Password reset via email
- Role-based access control
- Row Level Security (RLS) to restrict editing and data modification by route
- **Drivers can view data from all routes (read-only)**
- **Drivers can only add, edit, or deactivate learners on their assigned route**
- **Drivers can export PDF/Excel for any route (read-only access)**

---

### 4.2 Route Management (Admin)

#### Create, edit, deactivate routes

**Fields:**
- Route Name (e.g., Route E)
- Vehicle Number
- Areas Covered
- Term
- Year
- Status (Active / Archived)

#### Year-End Rollover
- **Archive old routes** when term/year ends
- **Duplicate routes** for new terms with option to:
  - Copy learner data (mark all as active)
  - Start fresh (empty learner list)
- Archived routes remain viewable but not editable

---

### 4.3 Driver Management (Admin)

- Create driver accounts
- Assign drivers to routes
- Link minder to driver
- Store contact details

**Fields:**
- Driver Name
- Email (for login)
- Phone Number (Kenyan format: +254...)
- Assigned Route
- Linked Minder

---

### 4.4 Minder Management (Admin & Driver)

#### Admin Functions
- Create, edit, deactivate minders
- Link minder to specific driver/route

#### Driver Functions
- View assigned minder details
- Update minder contact information for their route

**Fields:**
- Minder Name
- Phone Number (Kenyan format: +254...)
- Linked Driver
- Linked Route

---

### 4.5 Learner Management

#### Add / Edit Learner (Form-Based)

**Fields:**
- Learner Name *(required)*
- Admission Number *(required, unique)*
- Class *(required)*
- Pickup Area *(required, dropdown)*
- Pickup Time *(required, 24-hour format HH:mm)*
- Father Phone Number *(required, Kenyan format: +254...)*
- Mother Phone Number *(required, Kenyan format: +254...)*
- Route *(auto-assigned for drivers)*
- Status (Active / Inactive)

**Validation Rules:**
✔ Required field validation  
✔ Phone number format validation (+254...)  
✔ Consistent time format enforcement (24-hour HH:mm)  
✔ Duplicate admission number detection  
✔ **Pickup time conflict warning** (if two learners in different areas have same pickup time on same route)

#### Deactivate / Reactivate Learners
- Learners can be marked as **Inactive** (e.g., left school, temporarily absent)
- **Inactive learners can be reactivated** at any time
- Inactive learners **do not appear** in generated reports unless explicitly included
- Audit log tracks all status changes

---

### 4.6 Audit Logging

**Track all learner changes:**
- Who made the change (user ID, name, role)
- What was changed (field name, old value, new value)
- When it was changed (timestamp)
- Action type (Created, Updated, Deactivated, Reactivated)

**Viewable by:**
- Admins (all logs)
- Drivers (logs for their assigned route only)

**Log Retention:**
- Minimum 1 year
- Archived with route data during year-end rollover

---

### 4.7 Import Module (CRITICAL)

The system **MUST** support bulk data import to avoid re-entering existing records.

#### 4.7.1 Import Areas
- Upload Excel / CSV
- **Fields:**
  - Area Name
  - Route

#### 4.7.2 Import Learners
- Upload Excel / CSV
- **Required fields:**
  - Learner Name
  - Admission Number
  - Class
  - Pickup Area
  - Pickup Time (24-hour format HH:mm)
  - Father Phone (+254...)
  - Mother Phone (+254...)
  - Route

#### 4.7.3 Import Validation Rules
- Duplicate detection (Admission Number)
- Missing required fields rejected
- Invalid phone numbers flagged (+254 format)
- Invalid time format flagged (must be HH:mm)
- Preview before final import
- Import summary report (success/failed records)

---

### 4.8 Report Generation

#### PDF Generation (using pdfmake)
- One-click PDF export
- Professional, branded layout
- **Includes:**
  - Lelani School logo
  - School name
  - Term & Year
  - Route & Vehicle
  - Areas covered
  - Driver & Minder details (name, phone)
  - Learner list table (sorted by pickup time)
    - Learner Name
    - Admission Number
    - Class
    - Pickup Area
    - Pickup Time
    - Father Phone
    - Mother Phone
- **Only active learners** included by default
- Option to include inactive learners (marked with status)

#### Excel Export (using SheetJS)
- Clean, unmerged columns
- Admin-friendly structure
- **Columns:**
  - Learner Name
  - Admission Number
  - Class
  - Pickup Area
  - Pickup Time
  - Father Phone
  - Mother Phone
  - Status (Active/Inactive)
- All learners included (with status indicator)

#### Export Permissions
- **Drivers:** Can export PDF/Excel for **any route** (read-only access)
- **Admins:** Can export PDF/Excel for **any route**

---

## 5. Non-Functional Requirements

### 5.1 Design & Branding

#### School Branding
- **Logo:** Lelani School official logo
- **Primary Color:** Red (#D32F2F – derived from logo)
- **Secondary Colors:**
  - White (#FFFFFF)
  - Dark Grey (#333333)
- **Consistent branding across:**
  - Web UI
  - PDF exports
  - Excel headers

---

### 5.2 Responsiveness & Accessibility

- Fully responsive (mobile-first)
- **Works on:**
  - Smartphones
  - Tablets
  - Laptops
  - Desktops
- **Accessibility:**
  - Large buttons
  - Clear fonts (minimum 14px)
  - High contrast
  - Simple navigation
  - Touch-friendly (minimum 44px tap targets)

---

### 5.3 Performance & Scale

- Designed for **< 300 learners** (MVP)
- Scales to **1,000+ learners** without redesign
- Minimal network usage
- Fast page loads (< 2 seconds)
- Optimized database queries with proper indexing

---

### 5.4 Data Formats & Standards

#### Phone Numbers
- **Format:** Kenyan international format (+254...)
- **Validation:** Must start with +254 followed by 9 digits
- **Example:** +254712345678

#### Time Format
- **Format:** 24-hour time (HH:mm)
- **Example:** 07:30, 14:45
- **Validation:** Must be valid time between 00:00 and 23:59

#### Date Format
- **Display:** DD/MM/YYYY
- **Storage:** ISO 8601 (YYYY-MM-DD)

---

## 6. Technical Architecture

### 6.1 Technology Stack

#### Frontend
- HTML5
- CSS3 (Flexbox / Grid)
- Vanilla JavaScript (ES6+)

#### Backend / Database
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Storage (optional)

#### Hosting
- Netlify (Frontend)

#### Export Libraries
- **pdfmake** (PDF generation with advanced formatting)
- **SheetJS** (Excel export)

---

## 7. Database Schema (High-Level)

### routes
- `id` (UUID, primary key)
- `name` (text, e.g., "Route E")
- `vehicle_no` (text)
- `areas` (text array or JSON)
- `term` (text, e.g., "Term 1")
- `year` (integer, e.g., 2026)
- `status` (enum: active, archived)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### drivers
- `id` (UUID, primary key)
- `name` (text)
- `email` (text, unique)
- `phone` (text, format: +254...)
- `route_id` (UUID, foreign key → routes)
- `user_id` (UUID, foreign key → auth.users)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### minders
- `id` (UUID, primary key)
- `name` (text)
- `phone` (text, format: +254...)
- `driver_id` (UUID, foreign key → drivers)
- `route_id` (UUID, foreign key → routes)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### learners
- `id` (UUID, primary key)
- `name` (text)
- `admission_no` (text, unique)
- `class` (text)
- `pickup_area` (text)
- `pickup_time` (time, format: HH:mm)
- `father_phone` (text, format: +254...)
- `mother_phone` (text, format: +254...)
- `route_id` (UUID, foreign key → routes)
- `active` (boolean, default: true)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### areas
- `id` (UUID, primary key)
- `name` (text)
- `route_id` (UUID, foreign key → routes)
- `created_at` (timestamp)

### audit_logs
- `id` (UUID, primary key)
- `learner_id` (UUID, foreign key → learners)
- `user_id` (UUID, foreign key → auth.users)
- `user_name` (text)
- `user_role` (text, e.g., "driver", "admin")
- `action` (enum: created, updated, deactivated, reactivated)
- `field_name` (text, nullable)
- `old_value` (text, nullable)
- `new_value` (text, nullable)
- `timestamp` (timestamp)

---

## 8. Code Structure (MODULAR – NOT MONOLITHIC)

```
/src
  /auth
    login.js
    auth.service.js

  /routes
    routes.service.js
    route.form.js
    route.archive.js

  /drivers
    drivers.service.js
    driver.form.js

  /minders
    minders.service.js
    minder.form.js

  /learners
    learners.service.js
    learner.form.js
    learner.validator.js
    conflict.checker.js

  /imports
    import.learners.js
    import.areas.js
    import.validator.js

  /reports
    pdf.generator.js        (pdfmake)
    excel.generator.js      (SheetJS)

  /audit
    audit.service.js
    audit.logger.js

  /ui
    dashboard.js
    navbar.js
    notifications.js

  /styles
    main.css
    variables.css
    responsive.css

  /utils
    validators.js
    helpers.js
    formatters.js

index.html
```

✔ Separation of concerns  
✔ Easy maintenance  
✔ Scalable  
✔ Testable

---

## 9. Row Level Security (RLS) Policies

### Routes Table
- **Admins:** Full access (SELECT, INSERT, UPDATE, DELETE)
- **Drivers:** Read-only access to all routes (SELECT)

### Drivers Table
- **Admins:** Full access
- **Drivers:** Read-only access to own record

### Minders Table
- **Admins:** Full access
- **Drivers:** Read-only access to own minder, UPDATE for assigned route

### Learners Table
- **Admins:** Full access
- **Drivers:** 
  - SELECT: All learners (all routes)
  - INSERT/UPDATE/DELETE: Only learners on assigned route

### Audit Logs Table
- **Admins:** Read-only access to all logs
- **Drivers:** Read-only access to logs for assigned route

---

## 10. Deployment Strategy

1. GitHub repository (version control)
2. Netlify auto-deploy from `main` branch
3. Environment variables stored securely in Netlify
4. Supabase keys restricted by RLS
5. Separate environments:
   - **Development:** Testing and staging
   - **Production:** Live system

---

## 11. Success Metrics

- ✅ **0 manual formatting** by drivers
- ✅ **100% consistent PDFs** with school branding
- ✅ **Reduced data errors** through validation
- ✅ **Faster report generation** (< 5 seconds)
- ✅ **Positive driver feedback** (ease of use)
- ✅ **Audit trail** for all learner changes
- ✅ **Zero pickup time conflicts** (warnings prevent issues)
- ✅ **Successful year-end rollover** without data loss

---

## 12. Future Enhancements (Post-MVP)

### Phase 2 Features (Deferred)
- **Offline Capability:** Allow drivers to work offline and sync when online
- **Notification System:** 
  - Email/SMS notifications to parents when lists are updated
  - Alerts to drivers when learners are added to their route
- **Parent Portal:** Allow parents to view transport schedules
- **GPS Tracking:** Real-time bus location tracking
- **Payment Integration:** Track transport fee payments

---

## 13. Testing & Quality Assurance

### Testing Checklist
- [ ] Authentication flows (login, logout, password reset)
- [ ] RLS policies (drivers can't edit other routes)
- [ ] Phone number validation (+254 format)
- [ ] Time format validation (HH:mm)
- [ ] Duplicate admission number detection
- [ ] Pickup time conflict warnings
- [ ] PDF generation (branding, layout, data accuracy)
- [ ] Excel export (all columns, correct data)
- [ ] Import validation (reject invalid data)
- [ ] Audit logging (all changes tracked)
- [ ] Deactivate/reactivate learners
- [ ] Year-end rollover (archive + duplicate)
- [ ] Mobile responsiveness (all screen sizes)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

---

## 14. Training & Documentation

### User Documentation
- **Driver Manual:** How to add/edit learners, generate reports
- **Admin Manual:** How to manage routes, import data, archive routes
- **Quick Reference Guide:** Common tasks (PDF, 1-page)

### Training Plan
- **Week 1:** Admin training (ICT staff)
- **Week 2:** Driver training (hands-on session)
- **Week 3:** Pilot testing with 1-2 routes
- **Week 4:** Full rollout

---

## 15. Support & Maintenance

### Support Channels
- **Email:** ict@lelani.school
- **Phone:** ICT Department hotline
- **In-person:** ICT office during school hours

### Maintenance Schedule
- **Daily:** Monitor system health, backup database
- **Weekly:** Review audit logs, check for errors
- **Monthly:** Performance optimization, user feedback review
- **Termly:** Year-end rollover preparation, data cleanup

---

## 16. Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during import | High | Validation, preview, backup before import |
| Driver enters wrong data | Medium | Validation rules, audit logging |
| Supabase downtime | High | Monitor uptime, have backup plan |
| Poor mobile experience | Medium | Mobile-first design, thorough testing |
| Pickup time conflicts | Medium | Automated conflict detection |
| Unauthorized access | High | RLS policies, strong authentication |

---

## 17. Acceptance Criteria

The system will be considered complete when:

1. ✅ Admins can create routes, drivers, minders, and learners
2. ✅ Drivers can log in and manage learners on their assigned route
3. ✅ Drivers can view (read-only) all routes
4. ✅ Drivers can export PDF/Excel for any route
5. ✅ System validates phone numbers (+254 format)
6. ✅ System validates time format (HH:mm)
7. ✅ System warns about pickup time conflicts
8. ✅ PDF exports match school branding (logo, colors)
9. ✅ Excel exports contain all required columns
10. ✅ Import module successfully loads bulk data
11. ✅ Audit logs track all learner changes
12. ✅ Deactivated learners can be reactivated
13. ✅ Year-end rollover archives old data and duplicates routes
14. ✅ System works on mobile devices (responsive)
15. ✅ All RLS policies enforce correct permissions

---

**Document Version:** v1.1 (Updated with clarifications)  
**Last Updated:** January 8, 2026  
**Status:** Ready for Development ✅
