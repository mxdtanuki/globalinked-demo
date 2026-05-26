# QUICK FIX - Vercel Deployment

## The Problem
Vercel is deploying old code with `react-scripts` instead of the new Vite setup.

## The Solution

Run these commands:

```bash
# 1. Delete old package-lock.json
cd frontend
rm package-lock.json
cd ..

# 2. Commit and push
git add .
git commit -m "Force Vite deployment - remove old lock file"
git push origin main

# 3. In Vercel Dashboard:
# Go to your project → Deployments tab
# Click the three dots on the latest deployment
# Click "Redeploy"
```

## Alternative: Force Fresh Install

If above doesn't work, go to Vercel Dashboard:
1. Settings → General
2. Scroll to "Build & Development Settings"
3. Add Environment Variable:
   - Name: `DISABLE_ESLINT_PLUGIN`
   - Value: `true`
4. Redeploy

This will work with BOTH react-scripts AND Vite!
