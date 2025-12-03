# Deploy StudyLayer Webhook Server to Railway

## Quick Railway Deployment

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

2. **Deploy the webhook server**:
```bash
cd study-layer
railway init studylayer-webhooks
railway up
```

3. **Set environment variables**:
```bash
railway variables set STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
railway variables set STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. **Get your Railway URL** and add it to Stripe webhooks:
```
https://studylayer-webhooks-production.up.railway.app/webhook
```

## Alternative: Deploy to Vercel

1. **Create a `vercel.json`**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "stripe-webhook-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "stripe-webhook-server.js"
    }
  ]
}
```

2. **Deploy**:
```bash
npm install -g vercel
vercel --prod
```

3. **Set environment variables** in Vercel dashboard

## Alternative: Deploy to Render

1. **Connect your GitHub repo** to Render
2. **Choose "Web Service"**
3. **Set build command**: `npm install`
4. **Set start command**: `npm start`
5. **Add environment variables** in Render dashboard

## Test Your Webhook

Use Stripe CLI to test locally:
```bash
stripe listen --forward-to http://localhost:3001/webhook
```

Then trigger test events in Stripe Dashboard → Developers → Webhooks.
