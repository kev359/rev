-- ============================================
-- FIX: ALLOW DRIVER SELF-REGISTRATION
-- ============================================

-- 1. Enable RLS on drivers table (just in case)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow users to INSERT their own profile
-- This checks that the user_id provided in the new row matches the authenticated user's ID
CREATE POLICY "Users can insert their own profile" 
ON drivers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Also allow users to READ their own profile (if not already set)
CREATE POLICY "Users can view their own profile" 
ON drivers 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Allow Admins to do everything (if not already set)
CREATE POLICY "Admins can manage all drivers" 
ON drivers 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM drivers d
    WHERE d.user_id = auth.uid() 
    AND d.role = 'admin'
  )
);
