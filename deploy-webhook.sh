#!/bin/bash

# Deploy StudyLayer webhook server to Railway
echo "🚀 Deploying StudyLayer webhook server..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "npm install -g @railway/cli"
    echo "railway login"
    exit 1
fi

# Create new Railway project
echo "📦 Creating Railway project..."
railway init studylayer-webhooks

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
railway variables set STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
railway variables set SUPABASE_URL=$VITE_SUPABASE_URL
railway variables set SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
railway variables set FRONTEND_URL=$FRONTEND_URL

# Deploy
echo "🚀 Deploying..."
railway up

echo "✅ Webhook server deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the Railway domain URL"
echo "2. Go back to Stripe Dashboard → Webhooks"
echo "3. Update the webhook endpoint URL to: https://your-railway-domain.up.railway.app/webhook"
echo "4. Test the webhook with Stripe CLI:"
echo "   stripe listen --forward-to https://your-railway-domain.up.railway.app/webhook"
