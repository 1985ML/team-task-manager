# 🚀 Complete Vercel Deployment Guide

## Step 1: Set Up Database (Supabase - Easiest)

### 1.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub

### 1.2 Create Database
1. Click "New Project"
2. Fill in:
   - **Name**: `team-task-manager`
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest to you
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### 1.3 Get Database Connection String
1. Go to Settings → Database
2. Scroll to "Connection string" → "URI"
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

## Step 2: Deploy to Vercel

### 2.1 Import Project
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import `1985ML/team-task-manager`

### 2.2 Configure Project Settings
**IMPORTANT**: Set these settings:
- **Root Directory**: `app` (not the default root)
- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 2.3 Set Environment Variables
Add these in Vercel dashboard:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-32-chars-min
NODE_ENV=production
STORAGE_TYPE=local
API_RATE_LIMIT=300
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 2.4 Deploy
1. Click "Deploy"
2. Wait for build to complete

## Step 3: Set Up Database Schema

### 3.1 After First Deployment
1. Go to your Vercel project dashboard
2. Go to Functions tab
3. Or use Vercel CLI locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Set environment variables locally
vercel env pull .env.local

# Run database setup
cd app
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

## Step 4: Verify Deployment

### 4.1 Check Your App
1. Visit your Vercel app URL
2. Try creating an account
3. Test basic functionality

### 4.2 Common Issues & Solutions

**Build Fails - "Root Directory"**:
- Make sure Root Directory is set to `app`

**Database Connection Error**:
- Verify DATABASE_URL is correct
- Check Supabase project is running
- Ensure password is correct in connection string

**NextAuth Error**:
- Verify NEXTAUTH_URL matches your Vercel URL
- Ensure NEXTAUTH_SECRET is set and long enough

**API Routes 404**:
- Verify Root Directory is `app`
- Check vercel.json configuration

## Step 5: Optional Enhancements

### 5.1 Custom Domain
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update NEXTAUTH_URL to your custom domain

### 5.2 Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add to Vercel environment variables:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## 🎉 You're Done!

Your Team Task Manager should now be live at your Vercel URL!

## Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)