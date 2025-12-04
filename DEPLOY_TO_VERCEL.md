# Deploying to Vercel

## Quick Answer

**Yes, but you need to set it up first!** Once connected, pushing to git will auto-deploy.

## Setup Steps

### Option 1: Connect via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New Project"**
3. **Import your Git repository** (GitHub/GitLab/Bitbucket)
4. **Configure the project:**
   - **Root Directory**: Set to `web` (important!)
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Add Environment Variables:**
   - `VITE_SUPABASE_URL` - Your Supabase URL
   - `VITE_SUPABASE_KEY` - Your Supabase anon key
   - `VITE_DOWNLOAD_URL` - (Optional) Override download URL

6. **Click Deploy**

### Option 2: Use Vercel CLI

```bash
cd web
npm install -g vercel
vercel login
vercel --prod
```

Then follow the prompts.

## Important: Root Directory

**You MUST set the root directory to `web`** because:
- Your web app is in the `web/` folder
- The installer is in `web/public/downloads/`
- Vercel needs to build from the `web/` directory

## After Setup

Once connected:
- ✅ **Every push to `main` branch** → Auto-deploys to production
- ✅ **Every push to other branches** → Creates preview deployment
- ✅ **The installer** in `web/public/downloads/` will be served automatically

## Your Installer URL

After deployment, your installer will be available at:
```
https://your-domain.vercel.app/downloads/Visnly-Setup.exe
```

Or if you have a custom domain:
```
https://www.visnly.com/downloads/Visnly-Setup.exe
```

## Environment Variables in Vercel

Go to: **Project Settings → Environment Variables**

Add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- `VITE_DOWNLOAD_URL` (optional - defaults to `/downloads/Visnly-Setup.exe`)

## Workflow

1. **Build installer locally:**
   ```bash
   cd study-layer
   npm run build:production
   ```
   This copies installer to `web/public/downloads/`

2. **Commit and push:**
   ```bash
   git add web/public/downloads/Visnly-Setup.exe
   git commit -m "Update installer"
   git push
   ```

3. **Vercel auto-deploys** (if connected)

## Troubleshooting

**"Build failed"**
- Make sure root directory is set to `web`
- Check that `web/package.json` exists
- Verify environment variables are set

**"Installer not found"**
- Make sure you ran `npm run build:production` first
- Check that `web/public/downloads/Visnly-Setup.exe` exists
- Verify it's committed to git

**"Wrong directory"**
- In Vercel dashboard: Settings → General → Root Directory → Set to `web`

