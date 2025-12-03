-- Pending Credits Table
-- For users who purchase before logging in
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

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_pending_credits_email ON pending_credits(email);
CREATE INDEX IF NOT EXISTS idx_pending_credits_claimed ON pending_credits(claimed);

-- RLS Policies
ALTER TABLE pending_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending credits (by email match)
CREATE POLICY "Users can view pending credits for their email" ON pending_credits
  FOR SELECT USING (
    claimed_by_user_id = auth.uid() OR 
    (NOT claimed AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

