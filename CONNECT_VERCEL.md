# 🔗 Connect Vercel to GitHub

## **Step-by-Step Guide**

### **1. Go to Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Sign in (if not already)

### **2. Import Your GitHub Repository**

1. Click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find **"learning"** (or search for it)
4. Click **"Import"** next to it

### **3. Configure Project Settings**

Vercel will auto-detect your project. Configure:

**Framework Preset:**
- Select **"Vite"** (since your web folder uses Vite)

**Root Directory:**
- Leave blank (or set to `.` if needed)
- Vercel will use the root `vercel.json` which points to `web/`

**Build Command:**
- Should auto-fill: `cd web && npm install && npm run build`
- If not, enter it manually

**Output Directory:**
- Should auto-fill: `web/dist`
- If not, enter it manually

**Install Command:**
- Should auto-fill: `cd web && npm install`
- If not, enter it manually

### **4. Add Environment Variables**

**Before deploying**, click **"Environment Variables"** and add:

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
```

**Important:** For each variable, select:
- ✅ **Production**
- ✅ **Preview**  
- ✅ **Development**

### **5. Deploy**

1. Click **"Deploy"**
2. Wait for deployment to finish (2-3 minutes)
3. Vercel will give you a URL like: `https://learning-xxxxx.vercel.app`

### **6. Update Stripe Webhook URL**

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **"Update endpoint"**
4. Change URL to: `https://your-vercel-url.vercel.app/api/webhook`
5. Click **"Update endpoint"**

### **7. Test Everything**

1. **Test landing page**: Visit `https://your-vercel-url.vercel.app/`
2. **Test webhook**: 
   - Go to Stripe → Webhooks → Your endpoint
   - Click **"Send test webhook"**
   - Select `checkout.session.completed`
   - Check Vercel function logs for success

---

## **✅ You're Done!**

Now every time you push to GitHub:
- Vercel will automatically deploy
- Landing page updates instantly
- Webhook stays live

---

## **Future Updates**

To update your site:
1. Make changes locally
2. `git add .`
3. `git commit -m "Your message"`
4. `git push`
5. Vercel auto-deploys! 🚀

