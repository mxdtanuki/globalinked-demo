# Pre-Deployment Checklist for Vercel

Use this checklist before deploying to Vercel.

## ✅ Configuration Files

- [x] `vercel.json` created in root directory
- [x] `.vercelignore` created to exclude backend and unnecessary files
- [x] `frontend/.env.example` created for environment variable reference
- [x] `frontend/public/_redirects` exists for SPA routing
- [x] `homepage: "."` set in `frontend/package.json`

## ✅ Build Test

Run these commands locally to ensure build works:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Test build (this is what Vercel will run)
npm run build

# Verify build folder is created
ls -la build

# Test production build locally (optional)
npx serve -s build -p 3000
```

## ✅ Code Quality

- [ ] No console errors in browser
- [ ] All routes work correctly
- [ ] Forms function properly
- [ ] Data displays correctly
- [ ] No broken links or 404s
- [ ] Responsive design works on mobile

## ✅ Dependencies

- [ ] All dependencies are listed in `package.json`
- [ ] No missing peer dependencies
- [ ] Compatible with Node.js 18+ (Vercel default)

Check for issues:
```bash
cd frontend
npm install
npm audit
```

## ✅ Environment Variables

- [ ] No hardcoded secrets in code
- [ ] Environment variables use `REACT_APP_` prefix
- [ ] `.env.local` is in `.gitignore`
- [ ] Sample variables documented in `.env.example`

## ✅ Git Repository

- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `.gitignore` properly configured
- [ ] No sensitive data committed (check with `git log --all --full-history -- "*env*"`)
- [ ] Latest changes committed

```bash
git status
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## ✅ Performance

Optional optimizations:

- [ ] Images optimized (use WebP, compress)
- [ ] Unused dependencies removed
- [ ] Code splitting implemented (if needed)
- [ ] Bundle size analyzed

Check bundle size:
```bash
cd frontend
npm run build
# Check the size report in terminal
```

## ✅ SEO & Meta Tags

- [ ] `public/index.html` has proper title and meta tags
- [ ] Favicon exists in `public/`
- [ ] `manifest.json` configured
- [ ] `robots.txt` configured

## ✅ Browser Compatibility

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## ✅ Backend Status

Current status: **Frontend uses mock data**

- [x] Frontend works independently without backend
- [ ] If connecting to backend: Backend deployed separately
- [ ] If connecting to backend: CORS configured on backend
- [ ] If connecting to backend: API URL environment variable set

## Ready to Deploy! 🚀

Once all checks pass:

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect settings from `vercel.json`
5. Click "Deploy"
6. Wait 2-3 minutes
7. Visit your live site!

---

## Quick Deploy Command

If using Vercel CLI:
```bash
vercel --prod
```

## Post-Deployment Verification

After deployment, test:
- [ ] Homepage loads
- [ ] All routes accessible
- [ ] Mock data displays
- [ ] Forms work
- [ ] Charts render
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain (if configured)

## Rollback (if needed)

If something goes wrong:
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Find previous working deployment
5. Click "⋯" → "Promote to Production"
