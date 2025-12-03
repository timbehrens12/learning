# 🔑 Environment Variables Complete Guide

## **Two Places to Set Variables:**

1. **Local `.env` file** → For Electron app (runs on user's computer)
2. **Vercel Environment Variables** → For webhook API (runs on server)

---

## **📁 1. Local `.env` File (For Electron App)**

**Location**: `study-layer/.env` (in the root folder, same level as `package.json`)

**Create this file** and add:

```env
# DeepSeek AI (for smart AI responses)
VITE_DEEPSEEK_API_KEY=sk-your-deepseek-key-here

# Supabase (database and auth)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-key-here

# Stripe (for payments in the app)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

**Where to get these:**
- **DeepSeek API Key**: https://platform.deepseek.com/ → API Keys → Create new key
- **Supabase URL & Key**: Supabase Dashboard → Settings → API
- **Stripe Publishable Key**: Stripe Dashboard → Developers → API keys

---

## **☁️ 2. Vercel Environment Variables (For Webhook API)**

**Location**: Vercel Dashboard → Your Project → Settings → Environment Variables

**Add ALL of these:**

```env
# Stripe (for processing payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Supabase (for updating credits in database)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe Product IDs (these tell the webhook which product was purchased)
STRIPE_PRICE_10_CREDITS=price_xxxxx
STRIPE_PRICE_20_CREDITS=price_xxxxx
STRIPE_PRICE_50_CREDITS=price_xxxxx
STRIPE_PRICE_100_CREDITS=price_xxxxx
STRIPE_PRICE_250_CREDITS=price_xxxxx
```

**Where to get these:**
- **STRIPE_SECRET_KEY**: Stripe Dashboard → Developers → API keys → Secret key (click "Reveal")
- **STRIPE_WEBHOOK_SECRET**: Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret (click "Reveal")
- **SUPABASE_URL**: Same as above (your Supabase project URL)
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → service_role key (click "Reveal")
- **STRIPE_PRICE_*_CREDITS**: Stripe Dashboard → Products → Click each product → Copy the "Price ID" (starts with `price_...`)

---

## **🎯 What Are Stripe Product IDs For?**

When a user buys credits in your Electron app:
1. Stripe processes the payment
2. Stripe sends a webhook to your Vercel API
3. The webhook includes the **Price ID** of what was purchased
4. Your webhook code checks: "Was it `price_10_credits`? Add 10 credits. Was it `price_50_credits`? Add 50 credits."
5. Updates the user's credits in Supabase

**That's why you need all the Price IDs!**

---

## **✅ Quick Checklist:**

### **Local `.env` (3 variables):**
- [ ] `VITE_DEEPSEEK_API_KEY` - Get from DeepSeek platform
- [ ] `VITE_SUPABASE_URL` - Get from Supabase dashboard
- [ ] `VITE_SUPABASE_KEY` - Get from Supabase dashboard (anon key)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Get from Stripe dashboard

### **Vercel Environment Variables (9 variables):**
- [ ] `STRIPE_SECRET_KEY` - Get from Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - Get from Stripe webhook endpoint
- [ ] `SUPABASE_URL` - Same as local (your Supabase URL)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase dashboard (service_role key)
- [ ] `STRIPE_PRICE_10_CREDITS` - Get from Stripe product (Price ID)
- [ ] `STRIPE_PRICE_20_CREDITS` - Get from Stripe product (Price ID)
- [ ] `STRIPE_PRICE_50_CREDITS` - Get from Stripe product (Price ID)
- [ ] `STRIPE_PRICE_100_CREDITS` - Get from Stripe product (Price ID)
- [ ] `STRIPE_PRICE_250_CREDITS` - Get from Stripe product (Price ID)

---

## **🚀 Next Steps:**

1. **Create local `.env` file** with the 4 variables above
2. **Go to Vercel** → Your Project → Settings → Environment Variables
3. **Add all 10 variables** (make sure to select Production, Preview, Development for each)
4. **Redeploy** your Vercel project (or it will auto-deploy on next push)

---

## **💡 Pro Tip:**

**For Vercel variables:**
- Click "Add" for each variable
- Paste the value
- Select all three checkboxes: ✅ Production ✅ Preview ✅ Development
- Click "Save"

This ensures the variables work in all environments!

