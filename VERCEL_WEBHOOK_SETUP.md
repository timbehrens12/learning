# 🚀 Deploy Stripe Webhook to Vercel

## Step-by-Step Guide

### 1. **Prepare Your Code**

The webhook handler is already created at `api/webhook.js`. This is the correct location for Vercel serverless functions.

### 2. **Deploy to Vercel**

1. **Install Vercel CLI** (if you haven't):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project folder**:
   ```bash
   cd study-layer
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? **Yes** (if you already have a Vercel project)
   - Project name: `studylayer` (or your existing project name)
   - Directory: `.` (current directory)
   - Override settings? **No**

5. **Get your deployment URL**:
   - Vercel will give you a URL like: `https://your-project.vercel.app`
   - Your webhook endpoint will be: `https://your-project.vercel.app/api/webhook`

### 3. **Set Environment Variables in Vercel**

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_PRICE_10_CREDITS=price_xxxxx
STRIPE_PRICE_20_CREDITS=price_xxxxx
STRIPE_PRICE_50_CREDITS=price_xxxxx
STRIPE_PRICE_100_CREDITS=price_xxxxx
STRIPE_PRICE_250_CREDITS=price_xxxxx
STRIPE_PRICE_PRO_SUBSCRIPTION=price_xxxxx
```

5. Make sure to select **Production**, **Preview**, and **Development** for each variable
6. Click **Save**

### 4. **Configure Stripe Webhook**

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint (or create new one)
3. Update the endpoint URL to:
   ```
   https://your-project.vercel.app/api/webhook
   ```
   (Replace `your-project` with your actual Vercel project name)

4. **If creating new webhook:**
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
   - Click **Add endpoint**

5. **Copy the webhook signing secret** (starts with `whsec_...`)
6. **Add it to Vercel environment variables** as `STRIPE_WEBHOOK_SECRET`

### 5. **Test the Webhook**

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Click **"Send test webhook"**
6. Check Vercel function logs:
   - Go to Vercel Dashboard → Your Project → **Functions** tab
   - Click on `api/webhook.js`
   - Check the logs for any errors

### 6. **Use Your Custom Domain (Optional)**

If you have a custom domain:

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update Stripe webhook URL to: `https://api.yourdomain.com/api/webhook`
4. Or use your main domain: `https://yourdomain.com/api/webhook`

---

## ✅ You're Done!

Your Stripe webhook is now live on Vercel. All payment events will be automatically processed and credits will be added to user accounts.

---

## 🐛 Troubleshooting

**Webhook returns 400 error:**
- Check that `STRIPE_WEBHOOK_SECRET` is correct in Vercel
- Make sure you're using the signing secret from the correct webhook endpoint

**Webhook returns 500 error:**
- Check Vercel function logs for errors
- Verify all environment variables are set correctly
- Check Supabase service role key has correct permissions

**Credits not updating:**
- Check Vercel function logs
- Verify Stripe price IDs match your environment variables
- Check Supabase database for errors

