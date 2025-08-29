-- Add user_id to properties table for ownership tracking
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);

-- Update existing properties to link to users based on profiles
-- This assumes properties were created after user signup
UPDATE properties p
SET user_id = prof.id
FROM profiles prof
WHERE p.user_id IS NULL
  AND prof.lat IS NOT NULL 
  AND prof.lon IS NOT NULL
  AND ABS(p.lat - prof.lat) < 0.001  -- Match by coordinates
  AND ABS(p.lon - prof.lon) < 0.001;

-- Create proper junction table for user-property relationships
-- This allows multiple users to share a property (family members, etc)
CREATE TABLE IF NOT EXISTS user_properties (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'owner', -- owner, manager, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);

-- Populate junction table from existing data
INSERT INTO user_properties (user_id, property_id, role)
SELECT DISTINCT p.user_id, p.id, 'owner'
FROM properties p
WHERE p.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Drop and recreate RLS policies with proper ownership checks
DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;

-- Properties policies - check via user_id or junction table
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_properties up 
      WHERE up.property_id = properties.id 
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own properties" ON properties
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_properties up 
      WHERE up.property_id = properties.id 
      AND up.user_id = auth.uid()
      AND up.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Users can delete own properties" ON properties
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_properties up 
      WHERE up.property_id = properties.id 
      AND up.user_id = auth.uid()
      AND up.role = 'owner'
    )
  );

-- Fix polygons policies to check property ownership
DROP POLICY IF EXISTS "Users can view own polygons" ON polygons;
DROP POLICY IF EXISTS "Users can insert own polygons" ON polygons;
DROP POLICY IF EXISTS "Users can update own polygons" ON polygons;
DROP POLICY IF EXISTS "Users can delete own polygons" ON polygons;

CREATE POLICY "Users can view own polygons" ON polygons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = polygons.property_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_properties up
          WHERE up.property_id = p.id
          AND up.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert own polygons" ON polygons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = polygons.property_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_properties up
          WHERE up.property_id = p.id
          AND up.user_id = auth.uid()
          AND up.role IN ('owner', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can update own polygons" ON polygons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = polygons.property_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_properties up
          WHERE up.property_id = p.id
          AND up.user_id = auth.uid()
          AND up.role IN ('owner', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can delete own polygons" ON polygons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = polygons.property_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_properties up
          WHERE up.property_id = p.id
          AND up.user_id = auth.uid()
          AND up.role IN ('owner', 'manager')
        )
      )
    )
  );

-- Applications table also needs RLS if it exists
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;

-- Assuming applications has property_id
CREATE POLICY IF NOT EXISTS "Users can view own applications" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = applications.property_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_properties up
          WHERE up.property_id = p.id
          AND up.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert own applications" ON applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = applications.property_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_properties up
          WHERE up.property_id = p.id
          AND up.user_id = auth.uid()
          AND up.role IN ('owner', 'manager')
        )
      )
    )
  );

-- Enable RLS on junction table
ALTER TABLE user_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own property associations" ON user_properties
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own property associations" ON user_properties
  FOR ALL USING (user_id = auth.uid());