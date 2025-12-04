/**
 * Script to copy logo files from the logo/ directory to their respective locations
 * Run this after placing your logo files in the logo/ directory
 */

const fs = require('fs');
const path = require('path');

const logoDir = path.join(__dirname, '..', 'logo');
const webPublicDir = path.join(__dirname, '..', 'web', 'public');
const rendererDir = path.join(__dirname, '..', 'src', 'renderer');

// Files to copy and their destinations
// Supports both standard names and size-based names (e.g., 16x16.png, 32x32.png.png)
const filesToCopy = [
  // Web favicons - try standard names first, then size-based names
  { 
    src: 'favicon-16x16.png', 
    altSrc: ['16x16.png', '16x16.png.png'],
    dest: webPublicDir, 
    rename: 'favicon-16x16.png'
  },
  { 
    src: 'favicon-32x32.png', 
    altSrc: ['32x32.png', '32x32.png.png'],
    dest: webPublicDir, 
    rename: 'favicon-32x32.png'
  },
  { 
    src: 'favicon-96x96.png', 
    altSrc: ['96x96.png', '96x96.png.png'],
    dest: webPublicDir, 
    rename: 'favicon-96x96.png',
    optional: true
  },
  { 
    src: 'apple-touch-icon.png', 
    altSrc: ['180x180.png', '180x180.png.png'],
    dest: webPublicDir, 
    rename: 'apple-touch-icon.png',
    optional: true
  },
  
  // Web logo - use largest available size
  { 
    src: 'logo.png', 
    altSrc: ['256x256.png.png', '256x256.png', '128x128.png.png', '128x128.png', '64x64.png.png', '64x64.png'],
    dest: webPublicDir, 
    rename: 'logo.png'
  },
  { 
    src: 'logo.svg', 
    dest: webPublicDir, 
    rename: 'logo.svg',
    optional: true
  },
  
  // Electron renderer favicons
  { 
    src: 'favicon-16x16.png', 
    altSrc: ['16x16.png', '16x16.png.png'],
    dest: rendererDir, 
    rename: 'favicon-16x16.png'
  },
  { 
    src: 'favicon-32x32.png', 
    altSrc: ['32x32.png', '32x32.png.png'],
    dest: rendererDir, 
    rename: 'favicon-32x32.png'
  },
  
  // Electron renderer logo
  { 
    src: 'logo.png', 
    altSrc: ['256x256.png.png', '256x256.png', '128x128.png.png', '128x128.png'],
    dest: rendererDir, 
    rename: 'logo.png'
  },
  
  // Electron app icon (for package.json build config)
  // This stays in logo/ directory, just verify it exists
  { 
    src: 'icon.png', 
    altSrc: ['256x256.png.png', '256x256.png'],
    dest: logoDir, 
    rename: 'icon.png',
    optional: false // Required for Electron build
  },
  // Electron Windows icon (ICO file)
  // Note: If icon.ico doesn't exist, electron-builder will auto-convert from icon.png
  // But it's better to provide a proper ICO file for best quality
  { 
    src: 'icon.ico', 
    altSrc: [],
    dest: logoDir, 
    rename: 'icon.ico',
    optional: true // Optional - electron-builder can convert PNG to ICO
  },
];

console.log('📋 Copying logo files...\n');
console.log('🔍 Looking for logo files in:', logoDir);
console.log('');

let copied = 0;
let skipped = 0;
let errors = 0;

filesToCopy.forEach(({ src, altSrc = [], dest, rename, optional }) => {
  // Try to find the source file - check standard name first, then alternatives
  let srcPath = null;
  let foundFile = null;
  
  // Check standard name first
  const standardPath = path.join(logoDir, src);
  if (fs.existsSync(standardPath)) {
    srcPath = standardPath;
    foundFile = src;
  } else {
    // Try alternative names
    for (const alt of altSrc) {
      const altPath = path.join(logoDir, alt);
      if (fs.existsSync(altPath)) {
        srcPath = altPath;
        foundFile = alt;
        break;
      }
    }
  }
  
  if (!srcPath) {
    if (optional) {
      console.log(`⏭️  Skipping optional file: ${src} (not found)`);
      skipped++;
      return;
    } else {
      console.log(`❌ Missing required file: ${src} (also tried: ${altSrc.join(', ')})`);
      errors++;
      return;
    }
  }
  
  try {
    // Ensure destination directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const destPath = path.join(dest, rename || src);
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${foundFile} → ${path.relative(process.cwd(), destPath)}`);
    copied++;
  } catch (error) {
    console.error(`❌ Error copying ${foundFile}:`, error.message);
    errors++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Copied: ${copied}`);
console.log(`   ⏭️  Skipped (optional): ${skipped}`);
console.log(`   ❌ Errors: ${errors}`);

if (errors > 0) {
  console.log(`\n⚠️  Some required files are missing. Please add them to the logo/ directory.`);
  process.exit(1);
} else {
  console.log(`\n✨ All logo files copied successfully!`);
}

