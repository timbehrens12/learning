-- Backfill user_credits for existing users who signed up before the table was created
-- Run this AFTER running complete_schema.sql

-- Insert user_credits for all existing users who don't have a record yet
INSERT INTO user_credits (user_id, credits_remaining, subscription_plan)
SELECT 
  id,
  25, -- Free starter credits
  'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- Check the results
SELECT 
  uc.user_id,
  u.email,
  uc.credits_remaining,
  uc.subscription_plan,
  uc.created_at
FROM user_credits uc
JOIN auth.users u ON uc.user_id = u.id
ORDER BY uc.created_at DESC;

