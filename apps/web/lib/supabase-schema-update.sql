-- Add nickname field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT false;

-- Create index for faster nickname lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);

-- Update the profiles type in your code to include:
-- nickname: string;
-- first_name: string;
-- last_name: string;
-- age_verified: boolean;