# Logo Files

Place your logo files in this directory with the following naming convention:

## Required Files:

### Web Favicons (for website):
- `favicon-16x16.png` - 16x16 pixels
- `favicon-32x32.png` - 32x32 pixels
- `favicon-96x96.png` - 96x96 pixels (optional, for better quality)
- `apple-touch-icon.png` - 180x180 pixels (for iOS devices)

### Web Logo (for landing page, navbar, etc.):
- `logo.png` - Main logo (recommended: 512x512 or higher, transparent background)
- `logo.svg` - Vector version (optional, preferred for scalability)

### Electron App Icon:
- `icon.png` - 256x256 pixels (will be converted to .ico for Windows)
- `icon.ico` - Windows icon file (optional, can be auto-generated)

## File Structure:
```
logo/
├── favicon-16x16.png
├── favicon-32x32.png
├── favicon-96x96.png (optional)
├── apple-touch-icon.png (optional)
├── logo.png
├── logo.svg (optional)
└── icon.png (for Electron app)
```

## Notes:
- All PNG files should have transparent backgrounds where appropriate
- The logo.png will be used in the Logo component throughout the app
- The favicon files will be used in browser tabs and bookmarks
- The icon.png will be used for the Electron desktop app icon

