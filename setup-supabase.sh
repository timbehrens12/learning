#!/bin/bash

# StudyLayer Supabase Setup Script
echo "🚀 Setting up StudyLayer Supabase database..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Run:"
    echo "supabase login"
    exit 1
fi

# Create new project
echo "📦 Creating new Supabase project..."
supabase projects create "studylayer" --org "your-org-name"

# Wait for project to be ready
echo "⏳ Waiting for project to be ready..."
sleep 30

# Link project (you'll need to select the project)
echo "🔗 Linking project..."
supabase link

# Run migrations
echo "🗃️ Setting up database schema..."
supabase db reset

# Push the schema
echo "📤 Pushing credit system schema..."
psql "$(supabase db url)" < CREDIT_SYSTEM_SCHEMA.sql

echo "✅ Supabase setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your new 'studylayer' project"
echo "3. Go to Settings → API"
echo "4. Copy the 'URL' and 'anon public' key"
echo "5. Add them to your .env file:"
echo "   VITE_SUPABASE_URL=your-url-here"
echo "   VITE_SUPABASE_KEY=your-anon-key-here"
