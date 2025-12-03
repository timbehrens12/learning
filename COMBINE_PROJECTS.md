# 🔗 How to Combine Landing Page + Electron App

## **Step-by-Step Guide**

### **1. Create Folder Structure**

In your `study-layer` folder, create a `web` folder:

```
study-layer/
├── api/                    # ✅ Already here (webhook)
├── web/                    # ⬅️ Create this folder
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── assets/
├── src/                    # ✅ Electron app (already here)
└── ...
```

### **2. Copy Landing Page Files**

Copy all your landing page files (HTML, CSS, JS, images) into the `web/` folder.

### **3. Update Download Button**

In your landing page `index.html`, update the download button to point to where you'll host the Electron installer:

```html
<!-- Option 1: GitHub Releases (recommended) -->
<a href="https://github.com/yourusername/study-layer/releases/latest/download/StudyLayer-Setup.exe">
  Download for Windows
</a>

<!-- Option 2: Direct file hosting -->
<a href="https://your-cdn.com/StudyLayer-Setup.exe">
  Download for Windows
</a>
```

### **4. Configure Vercel**

Your `vercel.json` is already set up! Vercel will:
- Deploy `/web/*` as static files (your landing page)
- Deploy `/api/webhook.js` as serverless function
- Ignore everything else (Electron app code)

### **5. Connect to Vercel**

1. **If using GitHub:**
   - Push this entire repo to GitHub
   - Connect to Vercel
   - Vercel will auto-deploy `/web` and `/api`

2. **If deploying manually:**
   ```bash
   vercel --prod
   ```

### **6. Set Environment Variables**

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- All the `STRIPE_PRICE_*` variables

---

## **Result:**

✅ **One repo** with everything  
✅ **Landing page** at: `https://your-site.vercel.app/`  
✅ **Webhook API** at: `https://your-site.vercel.app/api/webhook`  
✅ **Electron app** code stays in `/src` (not deployed to Vercel)  

---

## **Benefits:**

- ✅ Everything in one place
- ✅ Easy to update landing page and app together
- ✅ Webhook is in the same repo
- ✅ Single source of truth
- ✅ Easier version control

---

## **Next Steps:**

1. Create `web/` folder
2. Copy landing page files there
3. Push to GitHub (or deploy to Vercel)
4. Update Vercel project settings if needed
5. Done! 🎉

