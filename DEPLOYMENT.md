# Deploying to Vercel

This guide will help you deploy the GlobalLinked System frontend to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will automatically detect the configuration from `vercel.json`

3. **Configure Build Settings** (Auto-detected from vercel.json)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`
   - Install Command: `cd frontend && npm install`

4. **Deploy**
   - Click "Deploy"
   - Your site will be live in a few minutes at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Important Configuration Notes

### Current Setup
- ✅ The frontend uses **mock/dummy data** and can run independently
- ✅ `vercel.json` is configured for SPA routing
- ✅ `.vercelignore` excludes unnecessary files (backend, node_modules)
- ✅ `homepage: "."` in package.json ensures proper asset paths

### Backend Considerations

The Python FastAPI backend is **not included** in this Vercel deployment. The frontend currently uses mock data from:
- `frontend/src/adminDummyData.js`
- `frontend/mock/*` files
- `frontend/src/services/*` (using local data)

**To connect to a real backend later:**
1. Deploy the Python backend separately (e.g., Railway, Render, Heroku, or AWS)
2. Update the service files to use real API endpoints
3. Add environment variable `REACT_APP_API_URL` in Vercel:
   - Go to Project Settings → Environment Variables
   - Add: `REACT_APP_API_URL=https://your-backend-url.com`
4. Update service files to use `process.env.REACT_APP_API_URL`

### Environment Variables

If you need to add environment variables:
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add variables as needed (see `frontend/.env.example` for reference)

### Custom Domain

To add a custom domain:
1. Go to your project in Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update your DNS records as instructed

## Post-Deployment Checks

After deployment, verify:
- [ ] All pages load correctly
- [ ] Routing works (try navigating directly to `/analytics`, `/archive`, etc.)
- [ ] Assets (images, fonts) load properly
- [ ] Mock data displays correctly
- [ ] Forms submit successfully (mock)
- [ ] Charts and visualizations render

## Troubleshooting

### Build Fails
- Check the Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### 404 on Routes
- Ensure `vercel.json` rewrites are configured (already done)
- Check that `frontend/public/_redirects` exists

### Assets Not Loading
- Verify `homepage: "."` is in `package.json` (already set)
- Check that assets are in `frontend/public/` directory

### Large Bundle Size
- Consider code splitting
- Optimize images
- Remove unused dependencies

## Continuous Deployment

Once connected to Git:
- Every push to `main` branch automatically deploys to production
- Pull requests create preview deployments
- You can configure deployment branches in Vercel settings

## Cost

- The free tier supports:
  - Unlimited deployments
  - 100 GB bandwidth/month
  - Serverless function execution
  - Automatic HTTPS
  - Preview deployments

## Support

For issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- Check Vercel build logs for detailed error messages
