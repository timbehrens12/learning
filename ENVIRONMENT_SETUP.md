# StudyLayer Environment Setup

Copy these variables to your `.env` file:

```bash
# Anthropic Claude Configuration
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-key

# Stripe Configuration (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Backend Environment Variables (for webhook server)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
FRONTEND_URL=http://localhost:5174

# Stripe Price IDs (configure these in your Stripe dashboard)
STRIPE_PRICE_50_CREDITS=price_1234567890
STRIPE_PRICE_100_CREDITS=price_0987654321
STRIPE_PRICE_250_CREDITS=price_1122334455
STRIPE_PRICE_PRO_SUBSCRIPTION=price_pro_monthly
```

## Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project
2. Run the `CREDIT_SYSTEM_SCHEMA.sql` in your Supabase SQL editor
3. Copy your project URL and anon key to `.env`

### 2. Stripe Setup
1. Create a Stripe account
2. Create products and prices in Stripe dashboard:
   - 50 Credits: $4.99
   - 100 Credits: $8.99
   - 250 Credits: $19.99
   - Pro Subscription: $9.99/month
3. Copy price IDs to your `.env` file
4. Set up webhook endpoint pointing to your server: `https://yourdomain.com/webhook`

### 3. Anthropic Setup
1. Create account at https://console.anthropic.com/
2. Get your API key (starts with `sk-ant-`)
3. Add it to `.env`

### 4. Deploy Webhook Server
```bash
# Install dependencies
npm install stripe @supabase/supabase-js express cors

# Run the webhook server
node stripe-webhook-server.js
```

Deploy this to a service like Railway, Render, or Vercel.
