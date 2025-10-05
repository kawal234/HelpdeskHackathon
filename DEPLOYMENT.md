# 🚀 Deployment Guide

This guide covers multiple deployment options for the HelpDesk Mini project.

## 📋 Prerequisites

- GitHub account
- Node.js installed locally
- Git installed locally

## 🎯 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest option for deploying Node.js applications with automatic deployments from GitHub.

#### Steps:

1. **Prepare your repository:**
   ```bash
   # Make sure your code is committed and pushed to GitHub
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - **Important**: Set the root directory to `backend`
   - Add environment variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-super-secret-jwt-key-here
     JWT_EXPIRES_IN=24h
     DATABASE_PATH=/tmp/helpdesk.db
     PORT=3000
     ```
   - Click "Deploy"

3. **Update frontend URLs:**
   - After deployment, update the frontend files to use your Vercel URL
   - Replace `http://localhost:3000` with your Vercel URL in `frontend/demo.js`

#### Vercel Configuration:
The project includes a `vercel.json` file in the backend directory that's already configured.

### Option 2: Railway

Railway provides persistent storage and is great for applications with databases.

#### Steps:

1. **Prepare for Railway:**
   ```bash
   # Create a railway.json file in the backend directory
   ```

2. **Deploy:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set the root directory to `backend`
   - Add environment variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-super-secret-jwt-key-here
     JWT_EXPIRES_IN=24h
     DATABASE_PATH=/app/data/helpdesk.db
     PORT=3000
     ```

3. **Enable persistent storage:**
   - In Railway dashboard, add a volume for `/app/data`
   - This ensures your database persists between deployments

### Option 3: Render

Render offers free hosting with automatic deployments.

#### Steps:

1. **Prepare for Render:**
   - Create a `render.yaml` file in your project root

2. **Deploy:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Add environment variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-super-secret-jwt-key-here
     JWT_EXPIRES_IN=24h
     DATABASE_PATH=/opt/render/project/src/database/helpdesk.db
     PORT=3000
     ```

### Option 4: Heroku

Heroku is a popular platform for deploying web applications.

#### Steps:

1. **Prepare for Heroku:**
   ```bash
   # Install Heroku CLI
   # Create a Procfile in the backend directory
   ```

2. **Deploy:**
   - Go to [heroku.com](https://heroku.com)
   - Create a new app
   - Connect to GitHub
   - Set the root directory to `backend`
   - Add environment variables in the Heroku dashboard
   - Deploy

## 🔧 Environment Variables

Set these environment variables in your deployment platform:

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
DATABASE_PATH=/path/to/your/database.db
PORT=3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
DEFAULT_SLA_HOURS=24
PRIORITY_SLA_HOURS_HIGH=4
PRIORITY_SLA_HOURS_MEDIUM=12
PRIORITY_SLA_HOURS_LOW=48
```

## 🗄️ Database Considerations

### For Vercel (Serverless):
- SQLite files are temporary and reset on each deployment
- Consider using a cloud database like PlanetScale, Supabase, or MongoDB Atlas
- Or use Vercel's KV storage for simple data

### For Railway/Render/Heroku:
- SQLite files persist between deployments
- Consider upgrading to PostgreSQL for production use

## 🌐 Frontend Deployment

After deploying the backend, you can deploy the frontend separately:

### Option 1: Vercel (Frontend)
1. Create a new Vercel project
2. Set root directory to `frontend`
3. Update API URLs in HTML files to point to your backend URL

### Option 2: Netlify
1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Set publish directory to `frontend/public`
4. Update API URLs in HTML files

## 🔍 Post-Deployment Checklist

- [ ] Backend is deployed and accessible
- [ ] Health check endpoint works: `https://your-app.vercel.app/health`
- [ ] Database is initialized (run migration)
- [ ] Environment variables are set
- [ ] Frontend is updated with correct API URLs
- [ ] Test login functionality
- [ ] Test ticket creation
- [ ] Check CORS settings if needed

## 🚨 Troubleshooting

### Common Issues:

1. **Database not found:**
   - Ensure DATABASE_PATH is set correctly
   - Run database migration after deployment

2. **CORS errors:**
   - Update CORS settings in `backend/src/server.js`
   - Add your frontend domain to allowed origins

3. **Environment variables not working:**
   - Double-check variable names and values
   - Restart the application after adding variables

4. **Static files not serving:**
   - Update the static file path in `server.js`
   - Ensure frontend files are in the correct location

## 📞 Support

If you encounter issues during deployment, check the platform's documentation or create an issue in the repository.
