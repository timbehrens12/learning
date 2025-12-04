# Quick Start: Building for Production

## 🚀 Fast Track (5 minutes)

### 1. Set Environment Variables

Create `study-layer/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key
VITE_DEEPSEEK_API_KEY=your_deepseek_key
```

### 2. Build the Installer

```bash
cd study-layer
npm install
npm run build:production
```

This creates:
- ✅ Windows installer in `dist/Visnly Setup 1.0.0.exe`
- ✅ Copies it to `web/public/downloads/Visnly-Setup.exe` for hosting

### 3. Deploy Web App

```bash
cd web
vercel --prod
```

The installer is now available at:
`https://www.visnly.com/downloads/Visnly-Setup.exe`

### 4. Test

1. Visit your landing page
2. Click "Get for Windows"
3. Install and test the app

## 📝 What Gets Built

- **Installer**: `dist/Visnly Setup {version}.exe` (Windows NSIS installer)
- **Web Copy**: `web/public/downloads/Visnly-Setup.exe` (for hosting)

## 🔄 Updating Version

Edit `package.json`:
```json
{
  "version": "1.0.1"
}
```

Then rebuild: `npm run build:production`

## ⚠️ Important Notes

1. **Environment variables are bundled** - Make sure they're correct before building
2. **Icon is optional** - App will build without it (just won't have custom icon)
3. **First build takes time** - Downloads Electron and dependencies
4. **Installer size**: ~150-200MB (includes Electron runtime)

## 🐛 Common Issues

**Build fails?**
- Make sure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be 20+)

**Installer not found?**
- Check `dist/` directory
- Look for any `.exe` file in `dist/`

**Download doesn't work?**
- Verify `web/public/downloads/Visnly-Setup.exe` exists
- Check Vercel deployment includes the file
- Try accessing directly: `https://yoursite.com/downloads/Visnly-Setup.exe`

