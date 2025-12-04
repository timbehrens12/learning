#!/usr/bin/env node

/**
 * Production Build Script for Visnly Electron App
 * 
 * This script:
 * 1. Validates environment variables
 * 2. Builds the Electron app
 * 3. Creates the Windows installer
 * 4. Copies installer to web/public/downloads for hosting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const ROOT_DIR = path.resolve(__dirname, '..');
const envPath = path.join(ROOT_DIR, '.env');

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    // Skip empty lines and comments
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      // Handle KEY=VALUE format, splitting only on first =
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  });
  console.log('📄 Loaded .env file\n');
} else {
  console.log('⚠️  No .env file found, using system environment variables\n');
}

const WEB_PUBLIC_DIR = path.resolve(ROOT_DIR, 'web', 'public', 'downloads');

console.log('🚀 Starting production build...\n');

// Step 1: Validate environment variables
console.log('1️⃣ Validating environment variables...');
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_KEY',
  'VITE_DEEPSEEK_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these in your .env file or environment.');
  process.exit(1);
}
console.log('✅ All environment variables present\n');

// Step 2: Build Electron app
console.log('2️⃣ Building Electron app...');
try {
  execSync('npm run build', { 
    cwd: ROOT_DIR, 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Electron app built successfully\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Create installer
console.log('3️⃣ Creating Windows installer...');
try {
  execSync('npx electron-builder --win --x64 --publish never', { 
    cwd: ROOT_DIR, 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Installer created successfully\n');
} catch (error) {
  console.error('❌ Installer creation failed:', error.message);
  process.exit(1);
}

// Step 4: Copy installer to web/public/downloads
console.log('4️⃣ Copying installer to web/public/downloads...');
try {
  // Read package.json to get version
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const version = packageJson.version;
  const installerName = `Visnly Setup ${version}.exe`;
  const sourcePath = path.join(ROOT_DIR, 'dist', installerName);
  const destDir = WEB_PUBLIC_DIR;
  const destPath = path.join(destDir, 'Visnly-Setup.exe');

  // Create downloads directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy installer
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Installer copied to: ${destPath}\n`);
    
    // Also copy with version in name
    const versionedPath = path.join(destDir, `Visnly-Setup-${version}.exe`);
    fs.copyFileSync(sourcePath, versionedPath);
    console.log(`✅ Versioned installer copied to: ${versionedPath}\n`);
  } else {
    console.warn(`⚠️  Installer not found at: ${sourcePath}`);
    console.warn('   Looking for any .exe file in dist/...');
    
    const distDir = path.join(ROOT_DIR, 'dist');
    const files = fs.readdirSync(distDir);
    const exeFiles = files.filter(f => f.endsWith('.exe'));
    
    if (exeFiles.length > 0) {
      const foundExe = exeFiles[0];
      const foundPath = path.join(distDir, foundExe);
      fs.copyFileSync(foundPath, destPath);
      console.log(`✅ Found and copied: ${foundExe} to ${destPath}\n`);
    } else {
      console.error('❌ No installer found in dist/ directory');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ Failed to copy installer:', error.message);
  process.exit(1);
}

console.log('🎉 Production build complete!');
console.log('\nNext steps:');
console.log('1. Deploy the web app (the installer is now in web/public/downloads/)');
console.log('2. Update VITE_DOWNLOAD_URL in web app to: https://www.visnly.com/downloads/Visnly-Setup.exe');
console.log('3. Test the download from the landing page');

