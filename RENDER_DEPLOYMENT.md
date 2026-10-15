# Deploying Backend to Render

This guide will help you deploy the Interview Coach backend to Render.

## Prerequisites

1. A [Render account](https://render.com) (free tier available)
2. Your code in a Git repository (GitHub, GitLab, or Bitbucket)
3. Google Gemini API key

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
# If not already initialized
cd backend
git init
git add .
git commit -m "Prepare for Render deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Fill in the details:
   - **Name**: `interview-coach-db`
   - **Database**: `interview_coach`
   - **User**: (auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click **Create Database**
5. Wait for the database to be created
6. Copy the **Internal Database URL** (starts with `postgresql://`)

## Step 3: Create Web Service on Render

1. In Render Dashboard, click **New** → **Web Service**
2. Connect your GitHub repository
3. Select the repository containing your backend code
4. Fill in the details:

### Basic Settings:
- **Name**: `interview-coach-backend`
- **Region**: Same as your database
- **Branch**: `main`
- **Root Directory**: `backend` (if backend is in a subfolder)
- **Runtime**: `Node`
- **Build Command**: `chmod +x build.sh && ./build.sh`
- **Start Command**: `npm start`
- **Instance Type**: Free

### Advanced Settings:

Click **Advanced** and add these environment variables:

#### Required Environment Variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Render default |
| `DATABASE_URL` | *Paste Internal Database URL* | From Step 2 |
| `JWT_SECRET` | *Generate a random string* | Use: `openssl rand -base64 32` |
| `GEMINI_API_KEY` | *Your Gemini API key* | Get from Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.0-flash-exp` | Or your preferred model |
| `USE_OLLAMA` | `false` | |
| `CLIENT_URL` | `http://localhost:5173` | Update after frontend deployment |

#### Optional (for Ollama - if needed):
| Key | Value |
|-----|-------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` |
| `OLLAMA_MODEL` | `qwen2.5:3b` |

4. Click **Create Web Service**

## Step 4: Update Prisma Schema for Production

The build script will automatically use PostgreSQL. Make sure your schema supports it.

## Step 5: Monitor Deployment

1. Watch the deployment logs in real-time
2. The build process will:
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Build TypeScript
3. Once complete, your service will be live at: `https://interview-coach-backend.onrender.com`

## Step 6: Seed the Database (Optional)

After first deployment, you may want to seed the database:

1. Go to your Web Service in Render
2. Click **Shell** tab
3. Run:
```bash
npm run db:seed
```

## Step 7: Update Frontend

Update your frontend `.env` file to point to the Render backend:

```env
VITE_API_URL=https://interview-coach-backend.onrender.com
VITE_WS_URL=wss://interview-coach-backend.onrender.com
```

Then update the `CLIENT_URL` environment variable in Render to your frontend URL.

## Troubleshooting

### Build Fails

**Check build logs**: Look for errors in the Build Logs tab

**Common issues**:
- Missing environment variables
- Database connection issues
- TypeScript compilation errors

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check database is active in Render dashboard
3. Ensure database and web service are in same region

### Migration Issues

If migrations fail:
1. Go to Shell tab in Render
2. Run manually:
```bash
npx prisma migrate deploy
```

### Service Won't Start

1. Check your `start` script in package.json
2. Verify the build created `dist/index.js`
3. Check logs for runtime errors

## Free Tier Limitations

⚠️ **Important**: Render's free tier has limitations:

1. **Services spin down after 15 minutes of inactivity**
   - First request after inactivity may take 30-60 seconds
   - Consider upgrading to paid tier for production

2. **Free PostgreSQL database**:
   - 90 days free
   - Then $7/month
   - 1GB storage limit

3. **Build minutes**: 500 free build minutes/month

## Upgrade Path

For production use, consider:
- **Starter Plan**: $7/month - No spin down
- **PostgreSQL**: $7/month - Persistent database
- **Autoscaling**: Available on paid plans

## Monitoring

1. **Logs**: Available in Render dashboard
2. **Metrics**: CPU, Memory, Request metrics
3. **Alerts**: Set up via Render notifications

## Environment Variables Reference

Generate secure secrets:

```bash
# JWT Secret
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Useful Commands

```bash
# View logs
# (In Render dashboard → Logs tab)

# Access shell
# (In Render dashboard → Shell tab)

# Manual migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database
npm run db:seed

# View database
npx prisma studio
```

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Prisma Render Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render)

## Security Checklist

- [ ] Environment variables are set (not hardcoded)
- [ ] JWT_SECRET is a strong random string
- [ ] DATABASE_URL is using internal connection
- [ ] CORS is configured for your frontend domain
- [ ] Rate limiting is enabled
- [ ] Helmet security headers are active

## Next Steps

After successful deployment:

1. Test all API endpoints
2. Deploy frontend (Vercel/Netlify recommended)
3. Update CORS settings to allow frontend domain
4. Set up monitoring and alerts
5. Consider setting up a custom domain
