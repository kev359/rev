-- ============================================
-- FIX: DROP PHONE NUMBER CONSTRAINTS
-- ============================================

-- The existing constraint likely mandates +254 start.
-- Since we want to support 07... (local format), we remove this check.

ALTER TABLE learners DROP CONSTRAINT IF EXISTS learners_father_phone_check;
ALTER TABLE learners DROP CONSTRAINT IF EXISTS learners_mother_phone_check;
xzfd dxza