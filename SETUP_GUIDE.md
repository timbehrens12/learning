# 🚀 StudyLayer Complete Setup Guide

**Follow these steps EXACTLY in order. Don't skip anything.**

---

## STEP 1: Get DeepSeek API Key

1. Go to https://platform.deepseek.com/
2. Click **"Sign Up"** or **"Login"**
3. After logging in, go to **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Name it: `StudyLayer Production`
6. **COPY THE KEY** - it starts with `sk-` and looks like: `sk-1234567890abcdef...`
7. **SAVE IT SOMEWHERE SAFE** - you'll need it in Step 6

---

## STEP 2: Set Up Supabase Project

1. Go to https://supabase.com/
2. Click **"Start your project"** or **"Sign In"**
3. Click **"New Project"**
4. Fill in:
   - **Name**: `studylayer` (or whatever you want)
   - **Database Password**: Create a STRONG password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine to start
5. Click **"Create new project"**
6. **WAIT 2-3 minutes** for project to finish setting up

### Get Your Supabase Keys:

1. In your Supabase project dashboard, click **"Settings"** (gear icon)
2. Click **"API"** in the left sidebar
3. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co` - COPY THIS
   - **anon public key**: Long string starting with `eyJ...` - COPY THIS
   - **service_role key**: Click "Reveal" and COPY THIS (keep it secret!)

---

## STEP 3: Set Up Supabase Database

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `CREDIT_SYSTEM_SCHEMA.sql` from your project folder
4. **COPY ALL THE SQL CODE** from that file
5. **PASTE IT** into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: **"Success. No rows returned"** - that's good!

---

## STEP 4: Set Up Google SSO in Supabase

1. In Supabase, go to **"Authentication"** → **"Providers"**
2. Find **"Google"** in the list
3. Click **"Enable Google provider"**
4. You'll need to create a Google OAuth app:

### Create Google OAuth App:

1. Go to https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Name it: `StudyLayer`
4. Click **"Create"**
5. Wait for project to be created, then select it
6. Go to **"APIs & Services"** → **"Credentials"**
7. Click **"Create Credentials"** → **"OAuth client ID"**
8. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: `StudyLayer`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"** through all steps
9. Back to OAuth client:
   - Application type: **Web application**
   - Name: `StudyLayer Web`
   - Authorized redirect URIs: Add this EXACT URL:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
     (Replace `YOUR_PROJECT_ID` with your actual Supabase project ID from the URL)
10. Click **"Create"**
11. **COPY** the **Client ID** and **Client Secret**

### Add to Supabase:

1. Go back to Supabase → **"Authentication"** → **"Providers"** → **"Google"**
2. Paste your **Client ID** and **Client Secret**
3. Click **"Save"**

---

## STEP 5: Set Up Stripe

1. Go to https://dashboard.stripe.com/
2. Sign up or log in
3. Make sure you're in **"Test mode"** (toggle in top right)
4. Go to **"Products"** in left sidebar
5. Click **"Add product"**

### Create Credit Products:

**Product 1: 10 Credits** 💰 **MINIMUM ENTRY**
- Name: `10 Credits`
- Description: `10 AI study credits - Perfect for a quick question or single problem`
- Pricing: **One time**
- Price: `$2.99`
- Click **"Save product"**
- **COPY the Price ID** (starts with `price_...`)

**Product 2: 20 Credits** 💰 **QUICK FIX**
- Name: `20 Credits`
- Description: `20 AI study credits - Perfect for one assignment or quick help`
- Pricing: **One time**
- Price: `$4.99`
- Click **"Save product"**
- **COPY the Price ID**

**Product 3: 50 Credits**
- Name: `50 Credits`
- Description: `50 AI study credits - Perfect for quick homework help`
- Pricing: **One time**
- Price: `$9.99`
- Click **"Save product"**
- **COPY the Price ID**

**Product 4: 100 Credits** ⭐ **BEST VALUE**
- Name: `100 Credits`
- Description: `100 AI study credits - Best value for regular students`
- Pricing: **One time**
- Price: `$16.99`
- Click **"Save product"**
- **COPY the Price ID**

**Product 5: 250 Credits** ⭐ **MOST POPULAR**
- Name: `250 Credits`
- Description: `250 AI study credits - Most popular for serious students`
- Pricing: **One time**
- Price: `$34.99`
- Click **"Save product"**
- **COPY the Price ID**

> 💡 **Pricing Note**: These prices are competitive with Chegg ($19.95/month) and Course Hero ($9.95/month). Credits give students flexibility without commitment. See `PRICING_STRATEGY.md` for detailed analysis.

### Get Stripe Keys:

1. In Stripe, go to **"Developers"** → **"API keys"**
2. You'll see:
   - **Publishable key**: Starts with `pk_test_...` - COPY THIS
   - **Secret key**: Click "Reveal" - COPY THIS (keep it secret!)

### Set Up Webhook:

1. In Stripe, go to **"Developers"** → **"Webhooks"**
2. Click **"Add endpoint"**
3. Endpoint URL: For now, use: `https://your-webhook-server.com/webhook`
   (We'll update this after deploying the webhook server in Step 7)
4. Description: `StudyLayer webhook`
5. Events to send: Select these:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
6. Click **"Add endpoint"**
7. **COPY the "Signing secret"** (starts with `whsec_...`)

---

## STEP 6: Create .env File

1. In your project folder (`study-layer`), create a file named `.env`
2. Open it in a text editor
3. Paste this template and fill in your values:

```env
# DeepSeek AI
VITE_DEEPSEEK_API_KEY=sk-your-deepseek-key-here

# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-key-here

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Stripe Product IDs (from Step 5)
STRIPE_PRICE_10_CREDITS=price_xxxxx
STRIPE_PRICE_20_CREDITS=price_xxxxx
STRIPE_PRICE_50_CREDITS=price_xxxxx
STRIPE_PRICE_100_CREDITS=price_xxxxx
STRIPE_PRICE_250_CREDITS=price_xxxxx
```

**Replace all the placeholder values with your actual keys from Steps 1-5!**

---

## STEP 7: Deploy Webhook Server

You need a server to handle Stripe webhooks. **If you already have Vercel**, use that! Otherwise, Railway is easiest.

### Option A: Vercel (If you already have Vercel hosting)

1. **Deploy your project to Vercel**:
   ```bash
   cd study-layer
   vercel
   ```
   (Or push to GitHub and connect to Vercel if you prefer)

2. **Set environment variables in Vercel**:
   - Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Add all the variables from Step 6 (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, etc.)
   - Make sure to select **Production**, **Preview**, and **Development**

3. **Get your webhook URL**:
   - Your webhook will be at: `https://your-project.vercel.app/api/webhook`
   - Or if using custom domain: `https://yourdomain.com/api/webhook`

4. **Update Stripe webhook URL**:
   - Go to Stripe → **Developers** → **Webhooks**
   - Update endpoint URL to: `https://your-project.vercel.app/api/webhook`
   - Click **"Update endpoint"**

> 📖 **Full Vercel setup guide**: See `VERCEL_WEBHOOK_SETUP.md` for detailed instructions

### Option B: Railway (Alternative)

1. Go to https://railway.app/
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your StudyLayer repository
5. Railway will auto-detect it's a Node.js project
6. Click on your project → **"Variables"** tab
7. Add these environment variables:
   ```
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   PORT=3001
   ```
8. Railway will give you a URL like: `https://your-app.up.railway.app`
9. **COPY THIS URL** - you'll need it for Stripe webhook

### Update Stripe Webhook:

1. Go back to Stripe → **"Developers"** → **"Webhooks"**
2. Click on your webhook endpoint
3. Click **"Update endpoint"**
4. Change the URL to: `https://your-app.up.railway.app/webhook`
5. Click **"Update endpoint"**

### Option C: Local Testing (For Development Only)

If you want to test locally first:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to http://localhost:3001/webhook`
3. This gives you a webhook secret starting with `whsec_`
4. Use that in your `.env` file
5. Run your webhook server locally: `node stripe-webhook-server.js`

---

## STEP 8: Test Everything

1. **Start your app**:
   ```bash
   cd study-layer
   npm run dev
   ```

2. **Test Google Login**:
   - Click "Sign in with Google"
   - Should redirect to Google and back
   - You should be logged in

3. **Test AI Features**:
   - Start a session
   - Try scanning your screen
   - Ask a question
   - Should see credits count down from 25

4. **Test Stripe** (in test mode):
   - When credits get low, click "Buy Credits"
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC
   - Should complete payment and add credits

---

## ✅ You're Done!

If everything works:
- ✅ Google SSO logs you in
- ✅ AI responds to questions
- ✅ Credits count down
- ✅ Stripe payments work
- ✅ Credits add after payment

**You're now production-ready!** 🚀

---

## 🐛 Troubleshooting

**"Invalid API key" error:**
- Check your `.env` file has the correct DeepSeek key
- Make sure it starts with `sk-`

**Google login doesn't work:**
- Check redirect URI in Google OAuth matches Supabase callback URL exactly
- Make sure Google provider is enabled in Supabase

**Stripe payments fail:**
- Make sure you're using test mode keys (`pk_test_...`)
- Check webhook URL is correct in Stripe dashboard
- Verify webhook server is running and accessible

**Database errors:**
- Make sure you ran the SQL schema in Supabase SQL Editor
- Check your Supabase keys are correct in `.env`

**Credits not updating:**
- Check Supabase service role key is correct
- Verify webhook server is receiving Stripe events
- Check Railway/logs for webhook errors

