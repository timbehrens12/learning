-- ==========================================
-- Add onboarding_complete column to existing profiles table
-- ==========================================
-- Run this in Supabase SQL Editor if you already have a profiles table
-- ==========================================

-- Add onboarding_complete column if it doesn't exist
alter table profiles 
add column if not exists onboarding_complete boolean default false;

-- Update existing users to have onboarding_complete = false (they'll need to complete it)
update profiles 
set onboarding_complete = false 
where onboarding_complete is null;

