# Lelani School Transport System – Supabase Setup Guide

## 🚀 Complete Database & RLS Configuration

This guide will walk you through setting up the complete Supabase backend for the Lelani School Transport Management System.

---

## STEP 1: Create the Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in the details:
   - **Project name:** `lelani-school-transport`
   - **Database password:** Set a strong password (save it securely!)
   - **Region:** Choose the closest to Kenya (e.g., `eu-west-1` or `ap-southeast-1`)
4. Click **"Create new project"**
5. Wait for the project to finish provisioning (2-3 minutes)

✅ **Once done, open the Supabase Dashboard**

---

## STEP 2: Enable Authentication (Email & Password)

### 2.1 Enable Email Provider

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Enable:
   - ✅ **Email** (toggle ON)
3. Disable others for now (Google, GitHub, etc.)

### 2.2 Configure Auth Settings

1. Go to **Authentication → Settings**
2. Configure:
   - ✅ **Enable email confirmations** (optional, recommended for production)
   - ✅ **Enable password reset**
   - **Minimum password length:** 8 characters

📌 **Note:** We'll create driver and admin accounts later through the admin panel.

---

## STEP 3: Database Tables (CORE STRUCTURE)

Go to **SQL Editor → New Query** and run the following SQL scripts **in order**.

### 3.1 Routes Table

```sql
-- Routes table with year-end rollover support
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,
  areas TEXT[], -- Array of area names
  term TEXT NOT NULL, -- e.g., "Term 1", "Term 2", "Term 3"
  year INTEGER NOT NULL, -- e.g., 2026
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_year_term ON routes(year, term);
```

### 3.2 Drivers Table

```sql
-- Drivers table linked to Supabase Auth
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL CHECK (phone ~ '^\+254[0-9]{9}$'), -- Kenyan format validation
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'driver' CHECK (role IN ('driver', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_route_id ON drivers(route_id);
CREATE INDEX idx_drivers_role ON drivers(role);
```

### 3.3 Minders Table

```sql
-- Minders table linked to drivers and routes
CREATE TABLE minders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (phone ~ '^\+254[0-9]{9}$'), -- Kenyan format validation
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_minders_driver_id ON minders(driver_id);
CREATE INDEX idx_minders_route_id ON minders(route_id);

-- Constraint: One minder per driver
CREATE UNIQUE INDEX idx_minders_unique_driver ON minders(driver_id);
```

### 3.4 Areas Table

```sql
-- Areas table for pickup locations
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_areas_route_id ON areas(route_id);

-- Constraint: Unique area name per route
CREATE UNIQUE INDEX idx_areas_unique_name_route ON areas(route_id, name);
```

### 3.5 Learners Table

```sql
-- Learners table with validation
CREATE TABLE learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admission_no TEXT NOT NULL UNIQUE, -- Unique across all routes
  class TEXT NOT NULL,
  pickup_area TEXT NOT NULL,
  pickup_time TIME NOT NULL, -- 24-hour format (HH:mm)
  father_phone TEXT NOT NULL CHECK (father_phone ~ '^\+254[0-9]{9}$'),
  mother_phone TEXT NOT NULL CHECK (mother_phone ~ '^\+254[0-9]{9}$'),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_learners_route_id ON learners(route_id);
CREATE INDEX idx_learners_active ON learners(active);
CREATE INDEX idx_learners_admission_no ON learners(admission_no);
CREATE INDEX idx_learners_pickup_time ON learners(pickup_time);

-- Index for conflict detection (same pickup time on same route)
CREATE INDEX idx_learners_route_time ON learners(route_id, pickup_time);
```

### 3.6 Audit Logs Table

```sql
-- Audit logs for tracking learner changes
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES learners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deactivated', 'reactivated')),
  field_name TEXT, -- NULL for create/deactivate/reactivate actions
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_learner_id ON audit_logs(learner_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

---

## STEP 4: Enable Row Level Security (RLS)

Run this to enable RLS on all tables:

```sql
-- Enable RLS on all tables
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE minders ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

---

## STEP 5: RLS Policies (Access Control)

### 5.1 Routes Table Policies

```sql
-- All authenticated users can view all routes (read-only for drivers)
CREATE POLICY "All users can view routes"
ON routes
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can insert routes
CREATE POLICY "Admins can insert routes"
ON routes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update routes
CREATE POLICY "Admins can update routes"
ON routes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete routes (archive instead)
CREATE POLICY "Admins can delete routes"
ON routes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

### 5.2 Drivers Table Policies

```sql
-- Users can view their own driver profile
CREATE POLICY "Drivers can view own profile"
ON drivers
FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all drivers
CREATE POLICY "Admins can view all drivers"
ON drivers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can insert drivers
CREATE POLICY "Admins can insert drivers"
ON drivers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update drivers
CREATE POLICY "Admins can update drivers"
ON drivers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

### 5.3 Minders Table Policies

```sql
-- All authenticated users can view all minders
CREATE POLICY "All users can view minders"
ON minders
FOR SELECT
USING (auth.role() = 'authenticated');

-- Drivers can update their own minder
CREATE POLICY "Drivers can update own minder"
ON minders
FOR UPDATE
USING (
  driver_id = (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

-- Admins can insert minders
CREATE POLICY "Admins can insert minders"
ON minders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all minders
CREATE POLICY "Admins can update all minders"
ON minders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete minders
CREATE POLICY "Admins can delete minders"
ON minders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

### 5.4 Areas Table Policies

```sql
-- All authenticated users can view all areas
CREATE POLICY "All users can view areas"
ON areas
FOR SELECT
USING (auth.role() = 'authenticated');

-- Drivers can insert areas for their assigned route
CREATE POLICY "Drivers can insert areas on own route"
ON areas
FOR INSERT
WITH CHECK (
  route_id = (
    SELECT route_id FROM drivers WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Drivers can update areas for their assigned route
CREATE POLICY "Drivers can update areas on own route"
ON areas
FOR UPDATE
USING (
  route_id = (
    SELECT route_id FROM drivers WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete areas
CREATE POLICY "Admins can delete areas"
ON areas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

### 5.5 Learners Table Policies (KEY LOGIC)

```sql
-- 👀 All authenticated users can VIEW all learners (any route)
CREATE POLICY "All users can view all learners"
ON learners
FOR SELECT
USING (auth.role() = 'authenticated');

-- ✏️ Drivers can INSERT learners ONLY on their assigned route
CREATE POLICY "Drivers can insert learners on own route"
ON learners
FOR INSERT
WITH CHECK (
  route_id = (
    SELECT route_id FROM drivers WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ✏️ Drivers can UPDATE learners ONLY on their assigned route
CREATE POLICY "Drivers can update learners on own route"
ON learners
FOR UPDATE
USING (
  route_id = (
    SELECT route_id FROM drivers WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ❌ Prevent all users from deleting learners (use active = false instead)
CREATE POLICY "Prevent learner deletion"
ON learners
FOR DELETE
USING (FALSE);
```

### 5.6 Audit Logs Table Policies

```sql
-- Drivers can view audit logs for learners on their assigned route
CREATE POLICY "Drivers can view audit logs for own route"
ON audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM learners l
    JOIN drivers d ON l.route_id = d.route_id
    WHERE l.id = audit_logs.learner_id
    AND d.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM drivers
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- All authenticated users can insert audit logs (system-generated)
CREATE POLICY "System can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

---

## STEP 6: Database Functions & Triggers

### 6.1 Auto-Update Timestamp Function

```sql
-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_minders_updated_at
  BEFORE UPDATE ON minders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learners_updated_at
  BEFORE UPDATE ON learners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6.2 Audit Log Trigger Function

```sql
-- Function to create audit log entries for learner changes
CREATE OR REPLACE FUNCTION log_learner_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  -- Get user details
  SELECT d.name, d.role INTO v_user_name, v_user_role
  FROM drivers d
  WHERE d.user_id = auth.uid();

  -- Handle INSERT (created)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action)
    VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'created');
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Check if active status changed
    IF OLD.active = TRUE AND NEW.active = FALSE THEN
      INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action)
      VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'deactivated');
    ELSIF OLD.active = FALSE AND NEW.active = TRUE THEN
      INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action)
      VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'reactivated');
    END IF;

    -- Log field changes
    IF OLD.name != NEW.name THEN
      INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action, field_name, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'updated', 'name', OLD.name, NEW.name);
    END IF;

    IF OLD.class != NEW.class THEN
      INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action, field_name, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'updated', 'class', OLD.class, NEW.class);
    END IF;

    IF OLD.pickup_area != NEW.pickup_area THEN
      INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action, field_name, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'updated', 'pickup_area', OLD.pickup_area, NEW.pickup_area);
    END IF;

    IF OLD.pickup_time != NEW.pickup_time THEN
      INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action, field_name, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'updated', 'pickup_time', OLD.pickup_time::TEXT, NEW.pickup_time::TEXT);
    END IF;

    IF OLD.father_phone != NEW.father_phone THEN
      INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action, field_name, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'updated', 'father_phone', OLD.father_phone, NEW.father_phone);
    END IF;

    IF OLD.mother_phone != NEW.mother_phone THEN
      INSERT INTO audit_logs (learner_id, user_id, user_name, user_role, action, field_name, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, v_user_role, 'updated', 'mother_phone', OLD.mother_phone, NEW.mother_phone);
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to learners table
CREATE TRIGGER learners_audit_trigger
  AFTER INSERT OR UPDATE ON learners
  FOR EACH ROW
  EXECUTE FUNCTION log_learner_changes();
```

### 6.3 Pickup Time Conflict Detection Function

```sql
-- Function to check for pickup time conflicts
CREATE OR REPLACE FUNCTION check_pickup_time_conflicts(
  p_route_id UUID,
  p_pickup_time TIME,
  p_pickup_area TEXT,
  p_learner_id UUID DEFAULT NULL
)
RETURNS TABLE(
  conflict_exists BOOLEAN,
  conflicting_learners JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) > 0 AS conflict_exists,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', l.id,
        'name', l.name,
        'pickup_area', l.pickup_area,
        'pickup_time', l.pickup_time
      )
    ) AS conflicting_learners
  FROM learners l
  WHERE l.route_id = p_route_id
    AND l.pickup_time = p_pickup_time
    AND l.pickup_area != p_pickup_area
    AND l.active = TRUE
    AND (p_learner_id IS NULL OR l.id != p_learner_id);
END;
$$ LANGUAGE plpgsql;
```

---

## STEP 7: Helper Functions for Admin Operations

### 7.1 Archive Route Function

```sql
-- Function to archive a route (year-end rollover)
CREATE OR REPLACE FUNCTION archive_route(p_route_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE routes
  SET status = 'archived'
  WHERE id = p_route_id;
END;
$$ LANGUAGE plpgsql;
```

### 7.2 Duplicate Route Function

```sql
-- Function to duplicate a route for new term/year
CREATE OR REPLACE FUNCTION duplicate_route(
  p_route_id UUID,
  p_new_term TEXT,
  p_new_year INTEGER,
  p_copy_learners BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_new_route_id UUID;
  v_route RECORD;
BEGIN
  -- Get original route data
  SELECT * INTO v_route FROM routes WHERE id = p_route_id;

  -- Create new route
  INSERT INTO routes (name, vehicle_no, areas, term, year, status)
  VALUES (v_route.name, v_route.vehicle_no, v_route.areas, p_new_term, p_new_year, 'active')
  RETURNING id INTO v_new_route_id;

  -- Copy areas
  INSERT INTO areas (name, route_id)
  SELECT name, v_new_route_id
  FROM areas
  WHERE route_id = p_route_id;

  -- Copy learners if requested
  IF p_copy_learners THEN
    INSERT INTO learners (name, admission_no, class, pickup_area, pickup_time, father_phone, mother_phone, route_id, active)
    SELECT name, admission_no, class, pickup_area, pickup_time, father_phone, mother_phone, v_new_route_id, TRUE
    FROM learners
    WHERE route_id = p_route_id AND active = TRUE;
  END IF;

  RETURN v_new_route_id;
END;
$$ LANGUAGE plpgsql;
```

---

## STEP 8: Create Initial Admin Account

### 8.1 Sign Up Admin User

1. Go to **Authentication → Users**
2. Click **"Add user"**
3. Fill in:
   - **Email:** `admin@lelani.school` (or your admin email)
   - **Password:** Set a strong password
   - **Auto Confirm User:** ✅ (check this)
4. Click **"Create user"**
5. Copy the **User ID** (you'll need it next)

### 8.2 Create Admin Driver Record

Go to **SQL Editor** and run:

```sql
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from step 8.1
INSERT INTO drivers (user_id, name, email, phone, role)
VALUES (
  'YOUR_USER_ID_HERE',
  'Admin User',
  'admin@lelani.school',
  '+254712345678', -- Replace with actual phone
  'admin'
);
```

✅ **You now have an admin account!**

---

## STEP 9: Get Supabase API Keys

1. Go to **Settings → API**
2. Copy the following:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key:** (keep this secret!)

📌 **Save these securely** – you'll need them for the frontend configuration.

---

## STEP 10: Test the Setup

### 10.1 Test Authentication

1. Go to **Authentication → Users**
2. Verify your admin user exists

### 10.2 Test RLS Policies

Run these test queries in **SQL Editor**:

```sql
-- Test 1: View routes (should work)
SELECT * FROM routes;

-- Test 2: View drivers (should work for admin)
SELECT * FROM drivers;

-- Test 3: View learners (should work)
SELECT * FROM learners;
```

---

## ✅ Setup Complete!

Your Supabase backend is now fully configured with:

- ✅ **6 tables:** routes, drivers, minders, areas, learners, audit_logs
- ✅ **Row Level Security (RLS)** policies for all tables
- ✅ **Audit logging** for learner changes
- ✅ **Pickup time conflict detection** function
- ✅ **Year-end rollover** functions (archive & duplicate)
- ✅ **Admin account** created

---

## 📋 Next Steps

1. **Save your API keys** from Step 9
2. **Create the frontend** application
3. **Test with real data**
4. **Create driver accounts** through the admin panel

---

## 🔒 Security Checklist

- ✅ RLS enabled on all tables
- ✅ Drivers can only edit their assigned route
- ✅ Drivers can view all routes (read-only)
- ✅ Admins have full access
- ✅ Phone number validation (+254 format)
- ✅ Audit logging tracks all changes
- ✅ No direct deletion of learners (use active flag)

---

**Document Version:** v1.0  
**Last Updated:** January 8, 2026  
**Status:** Ready for Frontend Development ✅
