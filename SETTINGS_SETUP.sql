-- Table for storing dynamic school configurations (Grades and Streams)
CREATE TABLE school_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('grade', 'stream')),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE school_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Public read config" 
ON school_config FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow write access only to admins
CREATE POLICY "Admins manage config" 
ON school_config FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM drivers 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Index for faster lookups
CREATE INDEX idx_school_config_type ON school_config(type);

-- Insert Default CBC Grades (Optional - User can delete/add)
INSERT INTO school_config (type, name) VALUES
('grade', 'Play Group'),
('grade', 'PP1'),
('grade', 'PP2'),
('grade', 'Grade 1'),
('grade', 'Grade 2'),
('grade', 'Grade 3'),
('grade', 'Grade 4'),
('grade', 'Grade 5'),
('grade', 'Grade 6'),
('grade', 'Grade 7'),
('grade', 'Grade 8'),
('grade', 'Grade 9');

-- Insert Common Streams (Optional)
INSERT INTO school_config (type, name) VALUES
('stream', 'Red'),
('stream', 'Blue');
