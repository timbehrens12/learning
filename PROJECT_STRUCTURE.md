# 📁 StudyLayer Project Structure

## **Recommended: Everything in One Repo**

```
study-layer/
├── api/                          # Webhook API (deployed to Vercel)
│   └── webhook.js
├── web/                          # Landing page (deployed to Vercel)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── assets/
├── src/                          # Electron app code
│   ├── main/
│   ├── renderer/
│   └── preload/
├── package.json                  # Electron app dependencies
├── vercel.json                   # Vercel config (deploy web/ + api/)
└── ... (other Electron files)
```

## **Benefits:**

✅ **One repo** - easier to manage  
✅ **Webhook in same repo** - no confusion  
✅ **Version control** - everything tracked together  
✅ **Easy updates** - change landing page and app together  
✅ **Vercel can deploy** - just configure it to deploy `/web` and `/api`

## **Vercel Configuration:**

Vercel will automatically:
- Deploy `/api/webhook.js` as serverless function
- Deploy `/web/*` as static files
- Ignore Electron-specific files

---

## **Alternative: Keep Separate**

If you prefer separation:
- **Landing page repo**: Just web files + webhook
- **Electron app repo**: Just app code

**But combining is easier for your use case!**

