# Production Build Guide

This guide explains how to build and distribute the Visnly Electron app for production.

## Prerequisites

1. **Node.js** installed (v18+)
2. **Windows** machine for building Windows installer (or use GitHub Actions)
3. **Environment Variables** set in `.env` file

## Environment Variables

Create a `.env` file in the `study-layer` directory with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
```

**Important:** These will be bundled into the app at build time. Make sure they're correct before building.

## Building the Installer

### Option 1: Local Build (Windows)

```bash
cd study-layer
npm install
npm run build:production
```

This will create:
- `dist/Visnly Setup 1.0.0.exe` - The Windows installer

### Option 2: GitHub Actions (Recommended)

Set up GitHub Actions to automatically build on release tags.

## Hosting the Installer

### Option A: Vercel (Recommended for web app)

1. Upload the installer to a Vercel project
2. Place it in `web/public/downloads/Visnly-Setup.exe`
3. Update `VITE_DOWNLOAD_URL` in web app's `.env` to point to it

### Option B: GitHub Releases

1. Create a GitHub release
2. Upload the installer as an asset
3. Use the release asset URL in the landing page

### Option C: CDN (Cloudflare, AWS S3, etc.)

1. Upload installer to your CDN
2. Update download URL in landing page

## Updating the Landing Page

The landing page download button uses:
- `VITE_DOWNLOAD_URL` environment variable (in web app)
- Fallback: GitHub releases URL

Update the web app's `.env`:
```env
VITE_DOWNLOAD_URL=https://www.visnly.com/downloads/Visnly-Setup.exe
```

## Version Management

Update version in `package.json` before each build:
```json
{
  "version": "1.0.0"
}
```

The installer will be named: `Visnly Setup {version}.exe`

## Build Output

After building, you'll find:
- `dist/` - Contains the installer and unpacked app
- `out/` - Contains the built Electron app code

## Testing the Installer

1. Run the installer on a clean Windows machine
2. Verify the app installs correctly
3. Test that all features work (sign-in, AI requests, etc.)
4. Check that environment variables are loaded correctly

