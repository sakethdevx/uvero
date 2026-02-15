# 🚀 Deployment Guide - Uvero

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. Install Vercel CLI:

```bash
npm install -g vercel
```

1. Deploy:

```bash
cd uvero
vercel
```

1. Follow the prompts:
   - Link to Vercel account
   - Set project name
   - Use default settings
   - Deploy!

**Result**: Your app will be live at `https://your-project.vercel.app`

### Option 2: Netlify

1. Build the project:

```bash
npm run build
```

1. Install Netlify CLI:

```bash
npm install -g netlify-cli
```

1. Deploy:

```bash
netlify deploy --prod --dir=dist
```

**Or use Netlify Drop**:

- Go to <https://app.netlify.com/drop>
- Drag your `dist` folder
- Done!

### Option 3: GitHub Pages

1. Install gh-pages:

```bash
npm install -D gh-pages
```

1. Add to `package.json`:

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/uvero"
}
```

1. Update `vite.config.js`:

```javascript
export default defineConfig({
  base: '/uvero/', // Your repo name
  plugins: [react()],
})
```

1. Deploy:

```bash
npm run deploy
```

### Option 4: Cloudflare Pages

1. Build the project:

```bash
npm run build
```

1. Go to Cloudflare Pages dashboard
2. Create new project
3. Connect to Git or upload `dist` folder
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Deploy!

---

## Pre-Deployment Checklist

### ✅ Must Do Before Deploying

1. **Update URLs in index.html**:
   - Change `https://uvero.app/` to your actual domain
   - Update Open Graph URLs
   - Update Twitter card URLs

2. **Add Favicon**:
   - Replace `/vite.svg` with your own favicon
   - Add multiple sizes (16x16, 32x32, etc.)
   - Add Apple touch icon

3. **Add Social Media Images**:
   - Create `/public/og-image.jpg` (1200x630px)
   - Update reference in index.html

4. **Environment Variables** (if needed):
   - Create `.env.production`
   - Add any API keys for analytics

5. **Test Production Build Locally**:

```bash
npm run build
npm run preview
```

- Visit <http://localhost:4173>
- Test all routes
- Test image compressor
- Check console for errors

1. **Optimize Images**:
   - Compress any images in `/public`
   - Use WebP format where possible

2. **Security Headers** (add to hosting config):

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Post-Deployment Setup

### 1. Custom Domain (Optional)

**Vercel**:

```bash
vercel domains add yourdomain.com
```

**Netlify**:

- Go to Domain settings
- Add custom domain
- Follow DNS instructions

### 2. Analytics (Optional)

Add Google Analytics to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. Search Console

1. Go to <https://search.google.com/search-console>
2. Add your property
3. Verify ownership
4. Submit sitemap (create one first)

### 4. Create Sitemap

Create `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/compress-image</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/privacy</loc>
    <priority>0.5</priority>
  </url>
</urlset>
```

### 5. robots.txt

Create `public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml
```

---

## Performance Optimization

### Already Implemented ✅

- Vite optimized build
- Tailwind CSS purging
- Code splitting via React Router
- Web Worker for heavy processing

### Additional Optimizations

1. **Enable Compression** (on hosting):
   - Gzip/Brotli compression
   - Most hosts enable this by default

2. **CDN** (automatically with Vercel/Netlify):
   - Global edge network
   - Automatic SSL
   - DDoS protection

3. **Caching Headers**:
   Add to hosting config:

   ```
   /assets/*
     Cache-Control: public, max-age=31536000, immutable
   
   /*.js
     Cache-Control: public, max-age=31536000, immutable
   
   /*.css
     Cache-Control: public, max-age=31536000, immutable
   ```

---

## Monitoring

### 1. Uptime Monitoring

- UptimeRobot (free)
- Pingdom
- StatusCake

### 2. Error Tracking

Add Sentry (optional):

```bash
npm install @sentry/react
```

### 3. Analytics Dashboard

- Google Analytics
- Plausible (privacy-friendly)
- Fathom Analytics

---

## Cost Breakdown

### Free Tier Limits (More than enough for starting)

**Vercel Free**:

- 100 GB bandwidth/month
- Unlimited websites
- Automatic SSL
- Global CDN

**Netlify Free**:

- 100 GB bandwidth/month
- 300 build minutes/month
- Automatic SSL
- Global CDN

**Cloudflare Pages**:

- Unlimited bandwidth
- 500 builds/month
- Automatic SSL
- Global CDN

**GitHub Pages**:

- 100 GB bandwidth/month
- 100 GB storage
- Free SSL
- No custom build process

---

## Recommended: Vercel Deployment

**Why Vercel?**

- Instant deployments
- Automatic SSL
- Global CDN
- Zero configuration
- Preview deployments for Git branches
- Great DX

**Steps**:

1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Click Deploy
5. Done! ✅

---

## Testing Production Deployment

After deploying, test:

1. **All Routes Work**:
   - Home page
   - /compress-image
   - /privacy
   - Invalid routes (should redirect)

2. **Image Compressor Works**:
   - Upload image
   - Compress
   - Download
   - Check different formats

3. **Performance**:
   - Check load time (should be < 3s)
   - Test on mobile
   - Test on slow connection

4. **SEO**:
   - Check meta tags with view-source
   - Test with <https://cards-dev.twitter.com/validator>
   - Test with Facebook Debugger

5. **Console**:
   - No errors in browser console
   - No 404s in Network tab

---

## Continuous Deployment

### Git-based Deployment (Recommended)

1. Push to GitHub:

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

1. Connect to Vercel/Netlify:
   - Auto-deploys on every push
   - Preview deployments for PRs
   - Rollback capability

### Manual Deployment

If you prefer manual control:

```bash
# Build
npm run build

# Deploy dist folder to your hosting
```

---

## Domain Setup

### 1. Buy Domain

- Namecheap
- Google Domains
- Cloudflare Registrar

### 2. Configure DNS

Point to your hosting:

**Vercel**:

```
A record: 76.76.21.21
CNAME: cname.vercel-dns.com
```

**Netlify**:

```
Follow instructions in Netlify dashboard
```

### 3. Enable HTTPS

- Automatic with all modern hosts
- Free Let's Encrypt SSL

---

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Try build
npm run build
```

### Routes Don't Work After Deploy

Add `_redirects` file to `public/`:

```
/*    /index.html   200
```

### 404 on Refresh

Configure hosting for SPA routing:

**Vercel** - Add `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**Netlify** - Already handled by `_redirects`

---

## Security Checklist

✅ HTTPS enabled (auto with hosting)  
✅ No API keys in frontend code  
✅ Content Security Policy (optional)  
✅ Security headers configured  
✅ Dependencies up to date  
✅ No console.logs in production  

---

## Launch Checklist

Before announcing your site:

- [ ] All features tested
- [ ] Mobile responsive verified
- [ ] Fast load time confirmed
- [ ] SEO meta tags complete
- [ ] Privacy policy reviewed
- [ ] Analytics installed (optional)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Social media cards tested
- [ ] Console errors cleared
- [ ] 404 page works
- [ ] All links functional

---

## 🎉 You're Ready to Deploy

**Recommended Quick Start**:

```bash
# 1. Build
npm run build

# 2. Test locally
npm run preview

# 3. Deploy to Vercel
vercel
```

**That's it! Your app is live!** 🚀

---

**Need help?** Check the main README.md or hosting provider docs.
