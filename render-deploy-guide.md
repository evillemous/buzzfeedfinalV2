# Render Deployment Guide for YouBuzzFeed

This guide will help you fix deployment issues on Render.com.

## Setup Instructions

### 1. Update Build Command on Render

Go to your Render.com dashboard, select your web service, and change the build command to:

```
node render-build.cjs
```

Instead of the default `npm install && npm run build`.

### 2. Configure Environment Variables

Make sure you have these environment variables set in Render:

- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: A random string for session security (e.g., `your-secret-key`)
- `NODE_ENV`: Set to `production`
- `OPENAI_API_KEY`: Your OpenAI API key 
- `UNSPLASH_ACCESS_KEY`: Your Unsplash API key

### 3. Fix Database with Debug Script

After deployment, open the Render shell and run:

```
node render-debug.cjs
```

This will diagnose issues with your database and fix them automatically.

### 4. Reset Admin User

If you're still having login issues, run:

```
node setup-admin-render.cjs
```

This will recreate the admin user with username `admin` and password `admin123`.

### 5. Check Database Schema

For detailed information about your database:

```
node check-db-connection.cjs
```

## Common Issues

### 1. Login Stuck at "Logging in..."

This is usually due to session configuration issues. Run:

```
node render-fix.cjs
```

### 2. No Content on Home Page

Check if your database has content:

```
node check-db-connection.js
```

If there are no articles, you'll need to generate some content or add categories.

## Testing Login

After following these steps, try logging in with:
- Username: `admin`
- Password: `admin123`

## Contact

If you continue to have issues, please contact support.