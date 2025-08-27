// Script to update test user profile with complete data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipsjsfonzweykrueoret.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwc2pzZm9uendleWtydWVvcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzYxNjYsImV4cCI6MjA3MTc1MjE2Nn0.wSnJ6-Tni2ZmosowC8F71YW5mHTg5_ftY5kLdGmXws8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateTestProfile() {
  // First sign in as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@test.com',
    password: 'abc123'
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  console.log('Signed in as:', authData.user.email);

  // Update the profile with complete data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email: 'test@test.com',
      first_name: 'Test',
      last_name: 'User',
      nickname: 'WeedWarrior75',
      full_name: 'Test User',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      area_sqft: 8500,
      grass_type: 'tifway419',
      hoc: 0.75,
      mower: 'reel-powered',
      sprayer: 'backpack',
      irrigation: 'auto',
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) {
    console.error('Profile update error:', profileError);
  } else {
    console.log('Profile updated successfully:', profile);
  }

  process.exit(0);
}

updateTestProfile();