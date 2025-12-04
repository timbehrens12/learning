# Logo Setup Guide

This guide will help you set up your logo files throughout the application.

## Step 1: Place Your Logo Files

Place all your logo files in the `logo/` directory at the root of the project:

```
study-layer/logo/
├── favicon-16x16.png      (required)
├── favicon-32x32.png      (required)
├── favicon-96x96.png      (optional)
├── apple-touch-icon.png   (optional, 180x180)
├── logo.png               (required, recommended 512x512+)
├── logo.svg               (optional, vector version)
└── icon.png               (required for Electron, 256x256)
```

## Step 2: Copy Logos to Project Locations

Run the copy script to automatically place logos in all the right locations:

```bash
npm run copy-logos
```

This will copy:
- Favicons to `web/public/` and `src/renderer/`
- Logo files to `web/public/` and `src/renderer/`

## Step 3: Verify

After copying, check that:
- ✅ `web/public/` contains favicon files and logo files
- ✅ `src/renderer/` contains favicon files and logo.png
- ✅ Browser shows your favicon in the tab
- ✅ Logo appears in navbar and landing page

## Where Logos Are Used

### Web Application (`web/`)
- **Favicons**: Browser tabs, bookmarks (`web/public/favicon-*.png`)
- **Logo**: Navbar, landing page, sign-in page (`web/public/logo.png` or `.svg`)
- **HTML**: `web/index.html` references favicons

### Electron Application (`src/renderer/`)
- **Favicons**: App window icon (`src/renderer/favicon-*.png`)
- **Logo**: Onboarding flow, dashboard (`src/renderer/logo.png`)
- **HTML**: `src/renderer/index.html` references favicons
- **App Icon**: `logo/icon.png` is used for the desktop app icon (configured in `package.json`)

## File Requirements

### Favicons
- **favicon-16x16.png**: 16x16 pixels, PNG format
- **favicon-32x32.png**: 32x32 pixels, PNG format
- **favicon-96x96.png**: 96x96 pixels, PNG format (optional, for high-DPI displays)
- **apple-touch-icon.png**: 180x180 pixels, PNG format (for iOS devices)

### Logo
- **logo.png**: Main logo, recommended 512x512 pixels or higher, transparent background preferred
- **logo.svg**: Vector version (optional, best quality at any size)

### Electron Icon
- **icon.png**: 256x256 pixels, PNG format
- Will be automatically converted to `.ico` format for Windows during build

## Troubleshooting

### Logo not showing?
1. Make sure you've run `npm run copy-logos`
2. Check that files exist in `web/public/` or `src/renderer/`
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for 404 errors

### Electron icon not updating?
1. Ensure `logo/icon.png` exists (256x256)
2. Rebuild the Electron app: `npm run build:win`
3. The icon is configured in `package.json` under `build.icon`

### Need to update logos?
1. Replace files in `logo/` directory
2. Run `npm run copy-logos` again
3. Restart dev server or rebuild

## Manual Copy (Alternative)

If you prefer to copy files manually:

**Web:**
- Copy favicon files to `web/public/`
- Copy logo files to `web/public/`

**Electron:**
- Copy favicon files to `src/renderer/`
- Copy logo.png to `src/renderer/`
- Ensure `logo/icon.png` exists for the app icon

