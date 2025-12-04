# Supabase Setup Guide

This guide will help you set up Supabase authentication and database for StudyLayer.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - Name: `studylayer` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region to your users
4. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 3: Set Up Environment Variables

1. In the `study-layer` directory, create a `.env` file (copy from `.env.example` if it exists)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key
```

**⚠️ Important:** Never commit your `.env` file to git! It's already in `.gitignore`.

## Step 4: Set Up the Database

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

This creates:
- A `profiles` table to store user data
- Row Level Security (RLS) policies so users can only see/edit their own data
- An automatic trigger that creates a profile when a user signs up

## Step 5: Install Dependencies

Run this command in your terminal:

```bash
npm install
```

This will install `@supabase/supabase-js` and other dependencies.

## Step 6: Test the Integration

1. Start your app: `npm run dev`
2. You should see the login screen
3. Click "Sign Up" and create a test account
4. Check your email for the confirmation link (if email confirmation is enabled)
5. After logging in, you should see the onboarding flow

## Troubleshooting

### "Missing Supabase keys" error
- Make sure your `.env` file exists in the `study-layer` directory
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` are set correctly
- Restart your dev server after creating/updating `.env`

### "Failed to fetch" or network errors
- Check that your Supabase project URL is correct
- Make sure your Supabase project is active (not paused)
- Check browser console for detailed error messages

### Database errors
- Make sure you ran the SQL schema in the Supabase SQL Editor
- Check that Row Level Security is enabled on the `profiles` table
- Verify the trigger was created successfully

## Next Steps

After authentication is working:
1. **Connect Stripe** for payments (Phase 14)
2. **Update Dashboard** to fetch user profile from Supabase
3. **Add Pro features** that check `is_pro` status
4. **Track scans** using `scans_used_today` field

## Security Notes

- The `anon` key is safe to use in client-side code (it's public)
- Row Level Security (RLS) ensures users can only access their own data
- Never expose your `service_role` key in client code
- Always validate user permissions on the server side



