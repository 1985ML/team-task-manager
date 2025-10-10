# Vercel Deployment Guide for Team Task Manager

## Common Deployment Issues and Solutions

### 1. Deprecated Package Issues
The following packages were causing deployment errors:
- `rimraf@3.0.2` → Updated to `rimraf@5.0.0`
- `multer@1.4.5-lts.1` → Updated to `multer@2.0.0-rc.1`
- `puppeteer@23.6.0` → Updated to `puppeteer@24.15.0`
- Replaced deprecated lodash packages with modern alternatives

### 2. API Route Structure Issues
Fixed issues with the API route structure:
- Corrected the return value in the GET method to use `apiKeyToReturn` instead of `apiKey`
- Ensured proper handling of all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Removed unused parameters that were causing warnings

### 3. Vercel Configuration Issues
Updated `vercel.json` to explicitly handle the API keys routes:
- Added explicit routing for `/api/auth/api-keys/(.*)` with all HTTP methods
- Ensured proper CORS headers for all API routes

### 4. Next.js Configuration Issues
Updated `next.config.js`:
- Added explicit rewrite rules for API keys routes
- Fixed path resolution for `outputFileTracingRoot`

## Deployment Steps

1. Ensure all dependencies are up to date:
   ```bash
   npm install
   ```

2. Run a build locally to test:
   ```bash
   npm run build
   ```

3. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### If you encounter 405 Method Not Allowed errors:
1. Check that all HTTP methods are properly implemented in your route handlers
2. Verify Vercel configuration includes all required methods
3. Ensure no middleware is interfering with API routes

### If you encounter 404 Not Found errors:
1. Verify the file structure matches Next.js App Router conventions
2. Check that dynamic routes are correctly named with brackets `[id]`
3. Ensure Vercel's build settings are set to Next.js framework preset

### If you encounter module not found errors:
1. Check for deprecated packages and update them
2. Verify all dependencies are correctly listed in package.json
3. Clear Vercel's build cache if needed

## Environment Variables
Make sure the following environment variables are set in Vercel:
- `NEXTAUTH_SECRET` - Required for NextAuth.js
- `DATABASE_URL` - Connection string for your database
- Any other required environment variables for your specific setup