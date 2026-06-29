# Live Domain Par Deploy Karne Ka Guide

Aapke Next.js website ko live domain par deploy karne ke liye yahan multiple options hain:

## Option 1: Vercel (Recommended - Sabse Aasan) ⭐

Vercel Next.js ke liye best hai kyunki yeh Next.js team ne banaya hai.

### Steps:

1. **Vercel Account Banayein:**
   - https://vercel.com par jayein
   - GitHub/GitLab/Bitbucket se sign up karein

2. **Project Deploy Karein:**
   - Vercel dashboard mein "New Project" click karein
   - Aapka repository select karein
   - Root directory set karein: `apps/website-nextjs`
   - Build command: `npm run build`
   - Output directory: `.next` (automatic detect hoga)

3. **Environment Variables Add Karein:**
   - Project settings > Environment Variables
   - Add karein:
     - `NEXT_PUBLIC_API_URL` = aapka API URL
     - `NEXT_PUBLIC_PROJECT_ID` = aapka project ID

4. **Domain Connect Karein:**
   - Project settings > Domains
   - Aapka domain add karein
   - DNS records follow karein (Vercel automatically provide karega)

**Cost:** Free tier available (hobby projects ke liye)

---

## Option 2: Netlify

### Steps:

1. **Netlify Account:**
   - https://netlify.com par sign up karein

2. **Deploy:**
   - "Add new site" > "Import an existing project"
   - Repository connect karein
   - Build settings:
     - Base directory: `apps/website-nextjs`
     - Build command: `npm run build && npm run export` (agar static export chahiye) ya `npm run build`
     - Publish directory: `.next` ya `.out`

3. **Environment Variables:**
   - Site settings > Environment variables
   - Add karein: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_PROJECT_ID`

4. **Custom Domain:**
   - Site settings > Domain management
   - Custom domain add karein

**Cost:** Free tier available

---

## Option 3: Traditional VPS/Server (DigitalOcean, AWS, etc.)

Agar aapko full control chahiye:

### Prerequisites:
- VPS server (Ubuntu recommended)
- Domain name
- SSH access

### Steps:

1. **Server Setup:**
```bash
# Server par Node.js install karein
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 install karein (process manager)
sudo npm install -g pm2
```

2. **Project Deploy:**
```bash
# Git se clone karein
git clone <your-repo-url>
cd aiwebbuilder/apps/website-nextjs

# Dependencies install
npm install

# Environment variables set karein
nano .env.local
# Add:
# NEXT_PUBLIC_API_URL=https://your-api-url.com
# NEXT_PUBLIC_PROJECT_ID=your-project-id

# Build karein
npm run build

# PM2 se start karein
pm2 start npm --name "nextjs-website" -- start
pm2 save
pm2 startup
```

3. **Nginx Setup (Reverse Proxy):**
```bash
# Nginx install
sudo apt install nginx

# Config file banayein
sudo nano /etc/nginx/sites-available/your-domain.com
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **SSL Certificate (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Option 4: Railway

### Steps:

1. **Railway Account:**
   - https://railway.app par sign up

2. **New Project:**
   - "New Project" > "Deploy from GitHub repo"
   - Repository select karein

3. **Configure:**
   - Root directory: `apps/website-nextjs`
   - Build command: `npm run build`
   - Start command: `npm start`

4. **Environment Variables:**
   - Variables tab mein add karein

5. **Custom Domain:**
   - Settings > Domains > Add custom domain

**Cost:** Pay-as-you-go, free trial available

---

## Option 5: AWS Amplify

### Steps:

1. **AWS Account:**
   - AWS Console mein Amplify service select karein

2. **Deploy:**
   - "New app" > "Host web app"
   - Repository connect karein
   - Build settings configure karein

3. **Domain:**
   - App settings > Domain management
   - Custom domain add karein

---

## Important Pre-Deployment Checklist

### 1. Environment Variables Check:
```bash
# .env.local file banayein (local testing ke liye)
NEXT_PUBLIC_API_URL=https://your-api-url.com
NEXT_PUBLIC_PROJECT_ID=your-project-id
```

### 2. Build Test:
```bash
cd apps/website-nextjs
npm run build
npm run start
# Check karein ki sab theek se chal raha hai
```

### 3. Production Optimizations:
- ✅ `next.config.js` mein already optimizations hain
- ✅ Image optimization configured hai
- ✅ Compression enabled hai

### 4. Security:
- Environment variables ko `.env.local` mein rakhein (git mein commit mat karein)
- `.gitignore` mein `.env*` add karein

---

## Quick Start (Vercel - Recommended)

Agar aap jaldi se deploy karna chahte hain:

1. **GitHub par code push karein:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Vercel par:**
   - https://vercel.com/new
   - GitHub repo import karein
   - Root directory: `apps/website-nextjs`
   - Deploy button click karein

3. **Domain add karein:**
   - Project settings > Domains
   - Aapka domain add karein

**Done!** Aapka website live ho jayega.

---

## Troubleshooting

### Build Errors:
- `npm run build` local par test karein pehle
- Dependencies check karein: `npm install`

### Environment Variables Not Working:
- `NEXT_PUBLIC_` prefix zaroori hai client-side variables ke liye
- Deploy ke baad rebuild zaroori hai

### Domain Not Working:
- DNS records check karein (A record ya CNAME)
- 24-48 hours lag sakte hain DNS propagation ke liye

---

## Recommendation

**Naye users ke liye:** Vercel (easiest, free, Next.js optimized)
**Advanced users ke liye:** VPS (full control, custom setup)

Koi specific platform par help chahiye? Bataiye, main detailed steps de sakta hoon!

