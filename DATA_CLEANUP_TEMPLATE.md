# 📊 LELANI TRANSPORT DATA CLEANUP TEMPLATE

## 🎯 OVERVIEW

This document provides the exact format needed for importing your transport data into the Lelani Transport Management System.

---

## 📋 TEMPLATE 1: MASTER ROUTES

**Create a new Google Sheet called: `MASTER_ROUTES`**

### Column Headers (Copy exactly):
```
Route Name | Vehicle Number | Term | Year | Areas
```

### Example Data:
```
ROUTE D | KCS 614J | Term 1 | 2026 | VERSITY, RAINBOW, KWA CHIEF, BAMBOO STREET, KARUGURU, 2ND AVENUE, 3RD AVENUE, MSAFIRI, DISCIPLES GARDEN, 5TH AVENUE, MASHINANI
ROUTE E | KBZ 123A | Term 1 | 2026 | WESTLANDS, KILIMANI, PARKLANDS, LAVINGTON
```

### How to Fill:
1. **Route Name:** Exactly as shown in your sheet tabs (e.g., "ROUTE D")
2. **Vehicle Number:** From row 3 of each route sheet (e.g., "KCS 614J")
3. **Term:** Current term (e.g., "Term 1")
4. **Year:** Current year (e.g., "2026")
5. **Areas:** Copy from row 4 (the yellow highlighted areas), separated by commas

---

## 📋 TEMPLATE 2: MASTER DRIVERS

**Create a new Google Sheet called: `MASTER_DRIVERS`**

### Column Headers (Copy exactly):
```
Driver Name | Email | Phone | Assigned Route Name
```

### Example Data:
```
ROBERT | robert@lelani.school | +254792675152 | ROUTE D
BENSON | benson@lelani.school | +254700000000 | ROUTE E
```

### How to Fill:
1. **Driver Name:** From your sheet tabs (e.g., "ROBERT")
2. **Email:** Create format: `firstname@lelani.school` (lowercase)
3. **Phone:** Convert `0792675152` → `+254792675152`
4. **Assigned Route Name:** Must match EXACTLY with Route Name in MASTER_ROUTES

### Phone Number Conversion Formula:
In Google Sheets, if phone is in column C:
```
=CONCATENATE("+254", RIGHT(C2, 9))
```

---

## 📋 TEMPLATE 3: MASTER MINDERS

**Create a new Google Sheet called: `MASTER_MINDERS`**

### Column Headers (Copy exactly):
```
Minder Name | Phone | Assigned Driver Name
```

### Example Data:
```
STACY | +254740637139 | ROBERT
JANE | +254700000000 | BENSON
```

### How to Fill:
1. **Minder Name:** From row 6 of each route sheet (e.g., "STACY")
2. **Phone:** Convert `0740637139` → `+254740637139`
3. **Assigned Driver Name:** Must match EXACTLY with Driver Name in MASTER_DRIVERS

### Phone Number Conversion Formula:
```
=CONCATENATE("+254", RIGHT(B2, 9))
```

---

## 📋 TEMPLATE 4: ALL LEARNERS (MOST IMPORTANT!)

**Create a new Google Sheet called: `ALL_LEARNERS`**

### Column Headers (Copy exactly):
```
Admission Number | Name | Class | Pickup Area | Pickup Time | Father Phone | Mother Phone | Route Name
```

### Example Data:
```
2026001 | GIANNA WAIRIMU KAMITI | G1 | RAINBOW | 06:18 | +254712345678 | +254723456789 | ROUTE D
2026002 | HAWIYOLANDA | G1 | RAINBOW | 06:30 | +254734567890 | +254745678901 | ROUTE D
2026003 | ISAAC WARREN | GR2 | RAINBOW | 06:30 | +254756789012 | +254767890123 | ROUTE D
```

### How to Fill:

#### 1. Admission Number
**If you don't have admission numbers**, use this formula in column A:
```
=CONCATENATE("2026", TEXT(ROW()-1, "000"))
```
This creates: 2026001, 2026002, 2026003, etc.

**If you have admission numbers**, copy them from your "contact" column.

#### 2. Name
Copy from your "NAME" column as-is.

#### 3. Class
Copy from your "CLASS" column as-is (G1, GR2, etc.)

#### 4. Pickup Area
Copy from your "LOCATION" column.
**IMPORTANT:** Must match exactly with areas in MASTER_ROUTES!

#### 5. Pickup Time
Copy from your "PICK UP-TIME (AM)" column.
**Format:** Must be `HH:mm` (e.g., `06:18`, `07:30`, `14:45`)

If time shows as `6:18`, use this formula:
```
=TEXT(E2, "00:00")
```

#### 6. Father Phone
Convert from `0712345678` → `+254712345678`

**Formula** (if father phone is in column F):
```
=IF(LEN(F2)>0, CONCATENATE("+254", RIGHT(F2, 9)), "")
```

#### 7. Mother Phone
Same as Father Phone.

**Formula** (if mother phone is in column G):
```
=IF(LEN(G2)>0, CONCATENATE("+254", RIGHT(G2, 9)), "")
```

#### 8. Route Name
Add this column manually. Fill with route name (e.g., "ROUTE D").

**Quick Fill Method:**
1. Type "ROUTE D" in first cell
2. Select all cells below
3. Press Ctrl+D (Windows) or Cmd+D (Mac) to fill down

---

## 🔧 STEP-BY-STEP CONSOLIDATION PROCESS

### Step 1: Create the 4 Master Sheets
1. Open your Google Sheets workbook
2. Create 4 new sheets:
   - `MASTER_ROUTES`
   - `MASTER_DRIVERS`
   - `MASTER_MINDERS`
   - `ALL_LEARNERS`

### Step 2: Fill MASTER_ROUTES
1. Go through each route sheet tab
2. Extract route info and add to MASTER_ROUTES
3. Should take ~10 minutes for all routes

### Step 3: Fill MASTER_DRIVERS
1. Extract driver names from sheet tabs
2. Create emails (format: `firstname@lelani.school`)
3. Extract phone from row 6
4. Match to route names

### Step 4: Fill MASTER_MINDERS
1. Extract minder names from row 6 of each sheet
2. Extract minder phone from row 6
3. Match to driver names

### Step 5: Consolidate ALL_LEARNERS
1. Copy header row to ALL_LEARNERS sheet
2. For each route sheet:
   - Copy all learner rows (starting from row 9)
   - Paste into ALL_LEARNERS
   - Add Route Name column
3. Apply phone number formulas
4. Generate admission numbers if needed

---

## ✅ FINAL VALIDATION CHECKLIST

Before importing, check:

### Routes:
- [ ] All route names are consistent (ROUTE D, not Route D)
- [ ] Vehicle numbers are correct
- [ ] Areas are comma-separated

### Drivers:
- [ ] All emails are lowercase and follow format
- [ ] All phones start with +254
- [ ] Route names match MASTER_ROUTES exactly

### Minders:
- [ ] All phones start with +254
- [ ] Driver names match MASTER_DRIVERS exactly

### Learners:
- [ ] All admission numbers are unique
- [ ] All phones start with +254
- [ ] All pickup times are in HH:mm format (06:18, not 6:18)
- [ ] All pickup areas match areas in MASTER_ROUTES
- [ ] All route names match MASTER_ROUTES exactly
- [ ] No empty rows

---

## 📤 EXPORT FOR IMPORT

Once cleaned:

1. **Export each sheet as Excel (.xlsx)**:
   - File → Download → Microsoft Excel (.xlsx)
   
2. **Name the files**:
   - `MASTER_ROUTES.xlsx`
   - `MASTER_DRIVERS.xlsx`
   - `MASTER_MINDERS.xlsx`
   - `ALL_LEARNERS.xlsx`

3. **Import in this order**:
   1. Routes (Admin Panel → Routes tab → Add manually)
   2. Drivers (Admin Panel → Drivers tab → Add manually)
   3. Minders (Admin Panel → Minders tab → Add manually)
   4. Learners (Admin Panel → Import Data tab → Upload ALL_LEARNERS.xlsx)

---

## 🎯 QUICK START: Test with ONE Route

**Before cleaning everything, test with ROUTE D:**

1. Create MASTER_ROUTES with just ROUTE D
2. Create MASTER_DRIVERS with just ROBERT
3. Create MASTER_MINDERS with just STACY
4. Create ALL_LEARNERS with just the 3 learners from ROUTE D
5. Import and test
6. Once working, clean and import the rest!

---

## 💡 COMMON ISSUES & FIXES

### Issue: Phone number shows as scientific notation
**Fix:** Format column as "Plain text" before pasting

### Issue: Time shows as decimal (0.26)
**Fix:** Format column as "Time" with format "HH:mm"

### Issue: Leading zeros disappear (0712 becomes 712)
**Fix:** Format column as "Plain text" before entering data

### Issue: Duplicate admission numbers
**Fix:** Use formula to auto-generate unique numbers

---

## 📞 NEED HELP?

If you get stuck:
1. Take a screenshot of the issue
2. Share it with me
3. I'll give you the exact fix!

---

**Created:** January 8, 2026  
**For:** Lelani School Transport System  
**Status:** Ready to Use ✅
