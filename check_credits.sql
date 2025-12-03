-- Quick query to check user credits
-- Replace 'YOUR_USER_EMAIL' with your actual email

-- Check user_credits table
SELECT 
  uc.user_id,
  u.email,
  uc.credits_remaining,
  uc.subscription_plan,
  uc.stripe_customer_id,
  uc.created_at,
  uc.updated_at
FROM user_credits uc
JOIN auth.users u ON uc.user_id = u.id
WHERE u.email = 'tbehrens121@gmail.com';

-- Check pending credits (for purchases before login)
SELECT 
  email,
  credits_amount,
  amount_paid,
  claimed,
  claimed_by_user_id,
  created_at,
  claimed_at
FROM pending_credits
WHERE email = 'kevjohnson032@gmail.com';

-- Check all credit purchases
SELECT 
  cp.user_id,
  u.email,
  cp.credits_purchased,
  cp.amount_paid,
  cp.stripe_payment_id,
  cp.created_at
FROM credit_purchases cp
JOIN auth.users u ON cp.user_id = u.id
ORDER BY cp.created_at DESC;

