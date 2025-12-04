-- ==========================================
-- StudyLayer Supabase Database Schema
-- ==========================================
-- Run this in Supabase SQL Editor after creating your project
-- ==========================================

-- 1. Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  is_pro boolean default false,
  scans_used_today int default 0,
  onboarding_complete boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (Security Policy)
alter table profiles enable row level security;

-- Users can view their own profile
create policy "Users can view own profile" on profiles
  for select using ( auth.uid() = id );

-- Users can update their own profile
create policy "Users can update own profile" on profiles
  for update using ( auth.uid() = id );

-- 3. Auto-create profile on Sign Up (Trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


