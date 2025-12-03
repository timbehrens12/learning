-- Complete Database Schema for StudyLayer Credit System
-- Run this in Supabase SQL Editor

-- 1. User Credits Table (main credits storage)
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER DEFAULT 25 NOT NULL,
  subscription_plan TEXT DEFAULT 'free' NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Credit Purchases Table (purchase history)
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE NOT NULL,
  credits_purchased INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Pending Credits Table (for purchases before login)
CREATE TABLE IF NOT EXISTS pending_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_session_id TEXT UNIQUE NOT NULL,
  credits_amount INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_stripe_customer ON user_credits(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_stripe_payment ON credit_purchases(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_pending_credits_email ON pending_credits(email);
CREATE INDEX IF NOT EXISTS idx_pending_credits_claimed ON pending_credits(claimed);

-- Enable Row Level Security
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits (drop if exists first)
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
CREATE POLICY "Users can update their own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for credit_purchases
DROP POLICY IF EXISTS "Users can view their own purchases" ON credit_purchases;
CREATE POLICY "Users can view their own purchases" ON credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for pending_credits
DROP POLICY IF EXISTS "Users can view pending credits for their email" ON pending_credits;
CREATE POLICY "Users can view pending credits for their email" ON pending_credits
  FOR SELECT USING (
    claimed_by_user_id = auth.uid() OR 
    (NOT claimed AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Function to automatically create user_credits record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if record exists first, then insert
  IF NOT EXISTS (SELECT 1 FROM public.user_credits WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_credits (user_id, credits_remaining, subscription_plan)
    VALUES (NEW.id, 25, 'free');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create credits when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_credits TO authenticated;
GRANT ALL ON credit_purchases TO authenticated;
GRANT SELECT ON pending_credits TO authenticated;

