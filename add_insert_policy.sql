-- Add INSERT policy for user_credits table
-- This allows users to create their own credit record if it doesn't exist
-- Run this in Supabase SQL Editor

DROP POLICY IF EXISTS "Users can insert their own credits" ON user_credits;
CREATE POLICY "Users can insert their own credits" ON user_credits
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

