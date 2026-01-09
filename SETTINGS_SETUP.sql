-- ============================================
-- UPDATED SCHOOL CONFIGURATION SCHEMA (V2)
-- Grades with Associated Streams
-- ============================================

-- 1. DROP existing table to ensure clean slate (and add parent_id)
DROP TABLE IF EXISTS school_config CASCADE;

-- 2. Create updated school_config table
CREATE TABLE IF NOT EXISTS school_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('grade', 'stream')),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES school_config(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_school_config_type ON school_config(type);
CREATE INDEX IF NOT EXISTS idx_school_config_parent ON school_config(parent_id);

-- 4. Enable RLS
ALTER TABLE school_config ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Public read config" ON school_config
  FOR SELECT
  TO authenticated
  USING (true);

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

-- 6. Insert Default Data
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
  ('grade', 'Grade 9', NULL);
