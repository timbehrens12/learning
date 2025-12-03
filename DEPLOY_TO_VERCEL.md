# 🚀 Deploy to Vercel (Git → Auto-Deploy)

## **How It Works:**

Since you connected Vercel to GitHub, **every time you push to GitHub, Vercel automatically deploys!**

You don't need to do anything special - just push your code.

---

## **Step-by-Step:**

### **1. Make sure all changes are saved**

Your `.env` file is local only (not pushed to GitHub - that's good for security!)

### **2. Add and commit your changes**

```bash
git add .
git commit -m "Remove subscription references, update environment variables"
```

### **3. Push to GitHub**

```bash
git push
```

### **4. Vercel auto-deploys!**

- Go to Vercel Dashboard
- You'll see a new deployment starting automatically
- Wait 2-3 minutes for it to finish
- Your site will be live at: `https://your-project.vercel.app`

---

## **What Gets Deployed:**

✅ **Landing page** (`/web` folder) → Built and deployed  
✅ **Webhook API** (`/api/webhook.js`) → Deployed as serverless function  
❌ **Electron app code** (`/src` folder) → NOT deployed (stays local)  
❌ **`.env` file** → NOT deployed (stays local, secure)  

---

## **Check Deployment Status:**

1. Go to https://vercel.com/dashboard
2. Click on your project
3. You'll see all deployments with status:
   - 🟡 **Building** - In progress
   - 🟢 **Ready** - Deployed successfully
   - 🔴 **Error** - Check logs

---

## **If Deployment Fails:**

1. Click on the failed deployment
2. Check the **"Logs"** tab
3. Common issues:
   - Missing environment variables → Add them in Vercel Settings
   - Build errors → Check the error message
   - Missing dependencies → Make sure `web/package.json` has all deps

---

## **That's It!**

**Every `git push` = automatic Vercel deployment** 🎉

No manual steps needed!

