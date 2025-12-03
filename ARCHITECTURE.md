# 🏗️ StudyLayer Architecture

## **Three Separate Components:**

### 1. **Landing Page** (Vercel - Already Deployed)
- **Location**: Your existing Vercel project (`studylayer-website-psql6l5ma-kortezs-projects.vercel.app`)
- **Purpose**: Marketing site with download button
- **Contains**: 
  - Landing page HTML/CSS/JS
  - **Webhook API** (`api/webhook.js`) ← Add this here!
  - Download button that links to the Electron app installer

### 2. **Electron App** (This Codebase - Desktop Application)
- **Location**: This `study-layer` folder
- **Purpose**: Desktop app that runs on users' computers
- **Contains**: 
  - All the app code (Dashboard, Overlay, AI, etc.)
  - Gets built into an installer (.exe, .dmg, etc.)
  - Users download and install it on their computer

### 3. **Webhook API** (Should be in Landing Page Project)
- **Location**: Add `api/webhook.js` to your **landing page Vercel project**
- **Purpose**: Handles Stripe payment events
- **Why here**: Payments happen when users click "Buy Credits" in the Electron app, but the webhook needs to be on a server (Vercel)

---

## **How They Connect:**

```
User Flow:
1. User visits landing page (Vercel)
2. Clicks "Download" button
3. Downloads Electron app installer
4. Installs and runs Electron app
5. In app, clicks "Buy Credits"
6. Stripe payment happens
7. Stripe sends webhook to: https://your-landing-page.vercel.app/api/webhook
8. Webhook updates Supabase with credits
9. Electron app reads credits from Supabase
```

---

## **What to Do:**

### **For the Webhook:**
- **Add `api/webhook.js` to your LANDING PAGE Vercel project** (not this Electron app codebase)
- The landing page and webhook can coexist in the same Vercel project

### **For the Download Button:**
- Build the Electron app: `npm run build`
- Create installers (using electron-builder or similar)
- Host installers on:
  - **GitHub Releases** (recommended)
  - **Cloud storage** (S3, Cloudflare R2, etc.)
  - **CDN** (Vercel Blob, etc.)
- Update landing page download button to point to installer URL

---

## **File Structure:**

```
Your Landing Page Vercel Project:
├── index.html (landing page)
├── styles.css
├── script.js
└── api/
    └── webhook.js  ← Add this here!

This Electron App Codebase (study-layer/):
├── src/
├── package.json
├── electron.vite.config.ts
└── ... (all the app code)
```

---

## **Summary:**

- **Webhook goes in landing page project** (Vercel)
- **Electron app is separate** (gets built and distributed)
- **Download button on landing page** links to the built Electron installer

