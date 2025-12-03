-- Fix schema issues - run this if you got errors
-- This handles existing tables and policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can view their own purchases" ON credit_purchases;
DROP POLICY IF EXISTS "Users can view pending credits for their email" ON pending_credits;

-- Recreate policies
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own purchases" ON credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view pending credits for their email" ON pending_credits
  FOR SELECT USING (
    claimed_by_user_id = auth.uid() OR 
    (NOT claimed AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Fix the trigger function to handle the case where user_credits might not have proper constraints
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if record exists first, then insert or do nothing
  IF NOT EXISTS (SELECT 1 FROM public.user_credits WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_credits (user_id, credits_remaining, subscription_plan)
    VALUES (NEW.id, 25, 'free');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

