-- ============================================
-- UPDATE LEARNERS SCHEMA
-- Add dropoff details
-- ============================================

ALTER TABLE learners ADD COLUMN IF NOT EXISTS dropoff_area TEXT;
ALTER TABLE learners ADD COLUMN IF NOT EXISTS drop_time TIME;

-- ============================================
-- FIXES FOR AREAS
-- ============================================
-- Ensure routes table has areas column as text array
-- (It likely does given the existing code, but verifying)
-- ALTER TABLE routes ADD COLUMN IF NOT EXISTS areas TEXT[];
