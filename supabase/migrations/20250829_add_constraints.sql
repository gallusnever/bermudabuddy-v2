-- Add unique constraint on yard_states to ensure one per user
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uniq_yard_state_user'
  ) THEN
    ALTER TABLE yard_states 
    ADD CONSTRAINT uniq_yard_state_user 
    UNIQUE (user_id);
  END IF;
END $$;

-- Add area_sqft to properties table if not exists
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS area_sqft NUMERIC;

-- Ensure RLS is enabled on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE polygons ENABLE ROW LEVEL SECURITY;
ALTER TABLE yard_states ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;

DROP POLICY IF EXISTS "Users can view own polygons" ON polygons;
DROP POLICY IF EXISTS "Users can insert own polygons" ON polygons;
DROP POLICY IF EXISTS "Users can update own polygons" ON polygons;
DROP POLICY IF EXISTS "Users can delete own polygons" ON polygons;

DROP POLICY IF EXISTS "Users can view own yard_states" ON yard_states;
DROP POLICY IF EXISTS "Users can insert own yard_states" ON yard_states;
DROP POLICY IF EXISTS "Users can update own yard_states" ON yard_states;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties policies (assuming there's a user_id or similar field)
-- Note: You may need to adjust these based on your actual schema
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (true); -- Adjust based on how properties link to users

CREATE POLICY "Users can insert own properties" ON properties
  FOR INSERT WITH CHECK (true); -- Adjust based on your needs

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (true); -- Adjust based on your needs

CREATE POLICY "Users can delete own properties" ON properties
  FOR DELETE USING (true); -- Adjust based on your needs

-- Polygons policies (linked via property_id)
CREATE POLICY "Users can view own polygons" ON polygons
  FOR SELECT USING (true); -- Adjust based on property ownership

CREATE POLICY "Users can insert own polygons" ON polygons
  FOR INSERT WITH CHECK (true); -- Adjust based on property ownership

CREATE POLICY "Users can update own polygons" ON polygons
  FOR UPDATE USING (true); -- Adjust based on property ownership

CREATE POLICY "Users can delete own polygons" ON polygons
  FOR DELETE USING (true); -- Adjust based on property ownership

-- Yard states policies
CREATE POLICY "Users can view own yard_states" ON yard_states
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own yard_states" ON yard_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own yard_states" ON yard_states
  FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_yard_states_user_id ON yard_states(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lon ON properties(lat, lon);