# Production Setup Guide for Visnly

This guide walks you through setting up the complete production build and distribution system for Visnly.

## 📋 Overview

The production setup includes:
1. **Electron App** - Desktop application (Windows installer)
2. **Web App** - Landing page with download button
3. **Build System** - Automated installer creation
4. **Distribution** - Hosting the installer for downloads

## 🔧 Prerequisites

1. **Node.js 20+** installed
2. **Windows machine** (for building Windows installer, or use GitHub Actions)
3. **Environment variables** configured

## 📝 Step 1: Environment Variables

### Electron App (`study-layer/.env`)

Create `.env` file in the `study-layer` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key_here
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**⚠️ Important:** These are bundled into the app at build time. Make sure they're correct!

### Web App (`web/.env`)

Create `.env` file in the `web` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key_here
VITE_DOWNLOAD_URL=https://www.visnly.com/downloads/Visnly-Setup.exe
```

## 🏗️ Step 2: Create App Icon

You need a Windows icon file (`.ico`) for the installer:

1. Create a 256x256 PNG image with your app logo
2. Convert to `.ico` format using:
   - Online tool: https://convertio.co/png-ico/
   - Or ImageMagick: `convert icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico`
3. Place it at: `study-layer/build/icon.ico`

**Note:** The build will work without an icon, but it's recommended for a professional look.

## 🚀 Step 3: Build the Installer

### Option A: Local Build (Windows)

```bash
cd study-layer
npm install
npm run build:production
```

This will:
1. Build the Electron app
2. Create Windows installer (`Visnly Setup 1.0.0.exe`)
3. Copy installer to `web/public/downloads/Visnly-Setup.exe`

### Option B: GitHub Actions (Recommended)

1. Push your code to GitHub
2. Create a release tag: `git tag v1.0.0 && git push origin v1.0.0`
3. GitHub Actions will automatically:
   - Build the installer
   - Create a GitHub release
   - Upload the installer as a release asset

**Setup GitHub Secrets:**
- Go to your repo → Settings → Secrets and variables → Actions
- Add these secrets:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_KEY`
  - `VITE_DEEPSEEK_API_KEY`

## 📦 Step 4: Deploy the Web App

### Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd web
   vercel --prod
   ```

3. **The installer** in `web/public/downloads/` will be automatically served at:
   `https://www.visnly.com/downloads/Visnly-Setup.exe`

### Alternative: Manual Upload

If you built locally, upload the installer from `web/public/downloads/` to your hosting:
- Vercel: It's already in `public/`, so it deploys automatically
- Other hosts: Upload to your CDN or static hosting

## 🔗 Step 5: Update Download URL

The landing page automatically uses `/downloads/Visnly-Setup.exe` (relative path).

If you want to use a different URL (e.g., GitHub Releases, CDN), set in `web/.env`:
```env
VITE_DOWNLOAD_URL=https://github.com/yourusername/yourrepo/releases/latest/download/Visnly-Setup.exe
```

## ✅ Step 6: Test Everything

1. **Test the installer:**
   - Download from your landing page
   - Install on a clean Windows machine
   - Verify app launches correctly
   - Test sign-in flow
   - Test AI features

2. **Test the download button:**
   - Visit your landing page
   - Click "Get for Windows"
   - Verify installer downloads

## 📊 Build Output

After running `npm run build:production`:

```
study-layer/
├── dist/
│   └── Visnly Setup 1.0.0.exe  ← Windows installer
├── out/                          ← Built app code
└── web/
    └── public/
        └── downloads/
            └── Visnly-Setup.exe  ← Copied for web hosting
```

## 🔄 Version Management

Before each release:

1. Update version in `study-layer/package.json`:
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. Build new installer:
   ```bash
   npm run build:production
   ```

3. Deploy web app (installer is already in `web/public/downloads/`)

## 🐛 Troubleshooting

### Build fails with "icon not found"
- The build will work without an icon, but create `build/icon.ico` for a professional look
- Or remove the `"icon"` line from `package.json` build config

### Environment variables not working in built app
- Make sure `.env` file exists in `study-layer/` directory
- Variables must start with `VITE_` to be bundled
- Rebuild after changing environment variables

### Installer too large
- Check `node_modules` aren't being included unnecessarily
- The `files` array in `package.json` controls what gets bundled

### Download button doesn't work
- Check browser console for errors
- Verify `web/public/downloads/Visnly-Setup.exe` exists
- Check that Vercel/hosting is serving the file correctly

## 🎯 Production Checklist

- [ ] Environment variables set in `.env` files
- [ ] App icon created (`build/icon.ico`)
- [ ] Version number updated in `package.json`
- [ ] Installer built successfully
- [ ] Installer copied to `web/public/downloads/`
- [ ] Web app deployed
- [ ] Download button tested
- [ ] Installer tested on clean Windows machine
- [ ] Sign-in flow works
- [ ] AI features work
- [ ] Credits system works

## 📚 Next Steps

Once everything is working:
1. Set up automatic builds with GitHub Actions
2. Add code signing for Windows (optional, requires certificate)
3. Set up auto-updates (using electron-updater)
4. Add analytics/tracking
5. Set up error reporting (Sentry, etc.)

