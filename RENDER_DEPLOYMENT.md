# Render Deployment Guide for Bermuda Buddy

## Repository
- GitHub URL: https://github.com/gallusnever/bermudabuddy-v2

## Prerequisites
1. Create a Render account at https://render.com
2. Create a PostgreSQL database on Render first (for the API service)

## Service 1: PostgreSQL Database
1. Create New > PostgreSQL
2. Settings:
   - Name: `bermudabuddy-db`
   - Database: `bermuda`
   - User: (auto-generated)
   - Region: Choose closest to your users
   - Instance Type: Free tier for testing
3. Copy the "Internal Database URL" for API service configuration

## Service 2: API (Python FastAPI)
1. Create New > Web Service
2. Connect to GitHub repository: `gallusnever/bermudabuddy-v2`
3. Configuration:
   - **Name**: `bermudabuddy-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `.` (repo root)
   - **Runtime**: Python 3
   - **Build Command**: 
     ```bash
     pip install -r apps/api/requirements.txt
     ```
   - **Start Command**: 
     ```bash
     uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT
     ```

4. Environment Variables (click "Advanced" to add):
   ```
   DATABASE_URL=<Internal Database URL from PostgreSQL service>
   OPENROUTER_API_KEY=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
   NWS_USER_AGENT=BermudaBuddy/1.0 (ronbowers214@gmail.com)
   CORS_ORIGINS=https://bermudabuddy-v2.onrender.com,http://localhost:3001
   ```
   
5. Note the service URL (e.g., `https://bermudabuddy-api.onrender.com`) https://bermudabuddy-api.onrender.com

## Service 3: Web (Next.js Frontend)
1. Create New > Web Service
2. Connect to GitHub repository: `gallusnever/bermudabuddy-v2`
3. Configuration:
   - **Name**: `bermudabuddy-web`
   - **Region**: Same as API
   - **Branch**: `main`
   - **Root Directory**: `apps/web`
   - **Runtime**: Node
   - **Build Command**: 
     ```bash
     npm install -g pnpm && pnpm install --frozen-lockfile && pnpm build
     ```
   - **Start Command**: 
     ```bash
     pnpm start -- -p $PORT -H 0.0.0.0
     ```

4. Environment Variables:
   ```
   NODE_VERSION=20
   NEXT_PUBLIC_API_BASE=https://bermudabuddy-api.onrender.com
   NEXT_PUBLIC_SUPABASE_URL=https://ipsjsfonzweykrueoret.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwc2pzZm9uendleWtydWVvcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzYxNjYsImV4cCI6MjA3MTc1MjE2Nn0.wSnJ6-Tni2ZmosowC8F71YW5mHTg5_ftY5kLdGmXws8
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZ2FsbHVzbmV2ZXIiLCJhIjoiY21lM2pwd2lqMDg4ZDJtcHo1OTI1cmRqOCJ9.693--g8-cRTuQolbuY0npA
   ```
   
   **Important**: Do NOT set `NEXT_PUBLIC_E2E_AUTH_BYPASS` in production

5. Note the service URL (e.g., `https://bermudabuddy-web.onrender.com`) https://bermudabuddy-v2.onrender.com

## Post-Deployment Steps

### 1. Update CORS Origins
After both services are deployed:
1. Go to API service settings
2. Update `CORS_ORIGINS` environment variable to include your Web service URL:
   ```
   CORS_ORIGINS=https://bermudabuddy-v2.onrender.com
   ```
3. Redeploy the API service

### 2. Verify Health Checks
- API: Visit `https://bermudabuddy-api.onrender.com/healthz`
- API Metrics: Visit `https://bermudabuddy-api.onrender.com/metrics`
- Web: Visit `https://bermudabuddy-web.onrender.com`

### 3. Test Core Features
1. **Login/Auth**: Navigate to `/login` and test Supabase authentication
2. **Dashboard**: Check `/dashboard` loads with weather data
3. **Nickname Generation**: Test in `/onboarding` (requires OPENROUTER_API_KEY)
4. **Mix Calculator**: Visit `/mix` and test calculations
5. **OK to Spray**: Check `/ok-to-spray` for weather conditions
6. **Applications**: Save a mix and verify it appears in `/applications`

## Troubleshooting

### CORS Errors
- Ensure the Web URL is in API's `CORS_ORIGINS` environment variable
- Check browser console for exact error message
- Verify API is running at the expected URL

### Database Connection Issues
- Verify `DATABASE_URL` is using the Internal Database URL (not External)
- Check API logs for connection errors
- Ensure migrations ran successfully during build

### Build Failures
- For Web: Ensure Node version is set to 20
- For API: Check Python version compatibility (3.11+ required)
- Review build logs for missing dependencies

### PostGIS Requirements
- If migrations fail due to Geography fields, you may need to:
  1. Skip station-related migrations initially
  2. Or upgrade to a PostgreSQL instance with PostGIS extension

## Environment Variable Summary

### API Service
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - For LLM features (optional but recommended)
- `NWS_USER_AGENT` - Required for weather.gov API
- `CORS_ORIGINS` - Comma-separated list of allowed origins

### Web Service
- `NODE_VERSION` - Set to 20
- `NEXT_PUBLIC_API_BASE` - URL of your API service
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_MAPBOX_TOKEN` - For map features (optional)

## Security Notes
- These are development/test API keys included for testing purposes
- For production, rotate all API keys and use Render's secret management
- Consider setting up environment-specific branches (staging/production)
- Enable Render's DDoS protection and rate limiting for production use

## Support
- Render Status: https://status.render.com
- Render Docs: https://render.com/docs
- Repository Issues: https://github.com/gallusnever/bermudabuddy-v2/issues