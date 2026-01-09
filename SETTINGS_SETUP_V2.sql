-- ============================================
-- UPDATED SCHOOL CONFIGURATION SCHEMA
-- Grades with Associated Streams
-- ============================================

-- Drop existing table if you want to start fresh
-- DROP TABLE IF EXISTS school_config CASCADE;

-- Create updated school_config table with parent-child relationship
CREATE TABLE IF NOT EXISTS school_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('grade', 'stream')),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES school_config(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_school_config_type ON school_config(type);
CREATE INDEX IF NOT EXISTS idx_school_config_parent ON school_config(parent_id);

-- Enable Row Level Security
ALTER TABLE school_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to read
CREATE POLICY "Public read config" ON school_config
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can insert, update, delete
CREATE POLICY "Admins manage config" ON school_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = auth.uid()
      AND drivers.role = 'admin'
    )
  );

-- ============================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- ============================================

-- Insert CBC Grades (parent items, no parent_id)
INSERT INTO school_config (type, name, parent_id) VALUES
  ('grade', 'Play Group', NULL),
  ('grade', 'PP1', NULL),
  ('grade', 'PP2', NULL),
  ('grade', 'Grade 1', NULL),
  ('grade', 'Grade 2', NULL),
  ('grade', 'Grade 3', NULL),
  ('grade', 'Grade 4', NULL),
  ('grade', 'Grade 5', NULL),
  ('grade', 'Grade 6', NULL),
  ('grade', 'Grade 7', NULL),
  ('grade', 'Grade 8', NULL),
  ('grade', 'Grade 9', NULL)
ON CONFLICT DO NOTHING;

-- Example: Add streams to Grade 1
-- First, get the Grade 1 ID, then insert streams with that parent_id
-- You can do this via the UI after running this script

-- ============================================
-- NOTES
-- ============================================
-- 1. Grades have type='grade' and parent_id=NULL
-- 2. Streams have type='stream' and parent_id=<grade_id>
-- 3. This allows each grade to have its own set of streams
-- 4. Example structure:
--    - Grade 1 (parent_id=NULL)
--      - Red (parent_id=<Grade 1 ID>)
--      - Blue (parent_id=<Grade 1 ID>)
--    - Grade 2 (parent_id=NULL)
--      - North (parent_id=<Grade 2 ID>)
--      - South (parent_id=<Grade 2 ID>)
