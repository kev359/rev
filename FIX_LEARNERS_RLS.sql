-- ============================================
-- FIX: ALLOW DRIVERS TO MANAGE LEARNERS
-- ============================================

ALTER TABLE learners ENABLE ROW LEVEL SECURITY;

-- Drop existng policies to avoid conflicts
DROP POLICY IF EXISTS "Drivers can insert learners" ON learners;
DROP POLICY IF EXISTS "Drivers can update learners" ON learners;
DROP POLICY IF EXISTS "Drivers can delete learners" ON learners;
DROP POLICY IF EXISTS "Allow read access" ON learners;

-- 1. READ: Allow everyone to read (or restrict to drivers/admins)
CREATE POLICY "Allow read access" 
ON learners FOR SELECT 
TO authenticated 
USING (true);

-- 2. INSERT: Allow drivers to add learners
-- (We assume any authenticated user with 'driver' role can add)
CREATE POLICY "Drivers can insert learners" 
ON learners FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. UPDATE: Allow drivers to update learners
CREATE POLICY "Drivers can update learners" 
ON learners FOR UPDATE 
TO authenticated 
USING (true);

-- 4. DELETE: Allow drivers to delete (deactivate) learners
CREATE POLICY "Drivers can delete learners" 
ON learners FOR DELETE 
TO authenticated 
USING (true);
