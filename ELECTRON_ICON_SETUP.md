# Electron App Icon Setup

The Electron app icon is configured to use your logo. Here's how it works:

## Current Configuration

- **Icon Location**: `logo/icon.png` (256x256px or larger required)
- **Windows Icon**: Uses `logo/icon.png` (electron-builder auto-converts to .ico)
- **Configuration**: Set in `package.json` under `build.win.icon`

## Icon Requirements

**IMPORTANT**: The icon must be at least 256x256 pixels!

- **Minimum Size**: 256x256px (required by electron-builder)
- **Recommended**: 512x512px or 1024x1024px for best quality
- **Format**: PNG with transparent background (preferred)
- **Location**: Must be in `logo/icon.png`

## How It Works

1. **During Build**: When you run `npm run build:win` or `npm run build:installer`, electron-builder will:
   - Use `logo/icon.png` as the app icon
   - Auto-convert it to `.ico` format for Windows (if PNG is 256x256+)
   - Embed it in the installer and executable

2. **Current Setup**: 
   - ✅ Using `logo/icon.png` (electron-builder auto-converts)
   - ✅ Works automatically - no manual conversion needed

## Creating a Proper ICO File (Optional)

If you want to use a `.ico` file directly (instead of auto-conversion), it must be **at least 256x256px**:

1. **Start with a large PNG**:
   - Use your `logo/icon.png` (must be 256x256px or larger)
   - Or use `logo/256x256.png.png` if it exists

2. **Convert to ICO**:
   - **Online Tools**:
     - [CloudConvert](https://cloudconvert.com/png-to-ico) - Upload PNG, download ICO
     - [ConvertICO](https://convertico.com/) - Simple PNG to ICO converter
     - [ICO Convert](https://icoconvert.com/) - Another option
   
   - **Important**: Make sure the ICO file contains at least a 256x256px version
   - Some converters create multi-resolution ICOs (16x16, 32x32, 48x48, 256x256) which is ideal

3. **Save the ICO**:
   - Save as `logo/icon.ico`
   - Update `package.json` → `build.win.icon` to `"logo/icon.ico"`

## Troubleshooting

### Error: "must be at least 256x256"
- **Problem**: Your icon file is too small
- **Solution**: 
  1. Use `logo/icon.png` (make sure it's 256x256px or larger)
  2. Or create a proper ICO file with at least 256x256px resolution

### Icon not showing after build
- Make sure `logo/icon.png` exists and is 256x256px or larger
- Rebuild: `npm run build:win`
- Check that the file is included in `package.json` → `build.files`

### Want to verify icon size?
- Open `logo/icon.png` in an image viewer
- Check the dimensions (should be 256x256 or larger)
- If smaller, resize it to at least 256x256px

## Current Status

✅ Icon is configured in `package.json`
✅ Using `logo/icon.png` (electron-builder auto-converts)
✅ Will work as long as icon.png is 256x256px or larger
⚠️ If you have a proper 256x256+ ICO file, you can use it by updating `build.win.icon` to `"logo/icon.ico"`
