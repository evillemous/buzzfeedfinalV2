#!/usr/bin/env node
/**
 * Server-only deployment script for Render.com
 * This script completely bypasses the Vite build process
 * and focuses on deploying just the server portion
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== SERVER-ONLY DEPLOYMENT SCRIPT ===');

// Install only the essential dependencies
console.log('1. Installing essential dependencies...');
try {
  execSync('npm install esbuild express @neondatabase/serverless dotenv', {
    stdio: 'inherit'
  });
  console.log('✅ Essential dependencies installed');
} catch (err) {
  console.error('Error installing essential dependencies:', err);
  // Continue anyway
}

// Build the server-side code only
console.log('2. Building server-side code...');
try {
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    stdio: 'inherit'
  });
  console.log('✅ Server code built successfully');
} catch (err) {
  console.error('Error building server code:', err);
  process.exit(1);
}

// Fix NewsAPI in the built server code
console.log('3. Fixing NewsAPI references...');
try {
  // Check if the dist/index.js file exists
  if (fs.existsSync('./dist/index.js')) {
    let serverCode = fs.readFileSync('./dist/index.js', 'utf8');
    
    // Replace any NewsAPI URLs
    serverCode = serverCode.replace(
      /https:\/\/newsapi\.org\/v2\/[^"']+/g,
      'https://example.com/disabled-newsapi'
    );
    
    // Disable News API Org source if it exists
    serverCode = serverCode.replace(
      /\{[^{}]*['"]name['"]\s*:\s*['"]News API Org['"][^{}]*\}/g,
      '{ name: "News API Org", disabled: true, url: "https://example.com" }'
    );
    
    // Skip News API processing
    serverCode = serverCode.replace(
      /else if\s*\(\s*source\.name\s*===\s*['"]News API Org['"]\s*\)[^}]*\{[^}]*\}/g,
      'else if (source.name === "News API Org") { return []; }'
    );
    
    // Write the fixed server code back
    fs.writeFileSync('./dist/index.js', serverCode);
    console.log('✅ Fixed NewsAPI references in server code');
  } else {
    console.error('⚠️ Server code file not found at ./dist/index.js');
  }
} catch (err) {
  console.error('Error fixing NewsAPI references:', err);
  // Continue anyway
}

// Create basic .env file for production
console.log('4. Setting up environment variables...');
try {
  const envContent = `NODE_ENV=production
SESSION_SECRET=render_deployment_secret_please_change_in_dashboard
# Add these in Render dashboard:
# DATABASE_URL
# OPENAI_API_KEY
# UNSPLASH_ACCESS_KEY`;
  
  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env file');
} catch (err) {
  console.error('Error creating .env file:', err);
  // Continue anyway
}

// Create a static client directory if needed
console.log('5. Setting up public directory...');
try {
  if (!fs.existsSync('./dist/public')) {
    fs.mkdirSync('./dist/public', { recursive: true });
  }
  
  // Create a basic index.html file
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>yourbuzzfeed - Server Deployed</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #FF4500; }
    .message {
      background: #f8f8f8;
      border-left: 4px solid #0066CC;
      padding: 10px 20px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>yourbuzzfeed</h1>
  <div class="message">
    <h2>Server Successfully Deployed! 🎉</h2>
    <p>The API server is now running and available at:</p>
    <ul>
      <li><a href="/api/categories">/api/categories</a> - Get all categories</li>
      <li><a href="/api/articles/featured">/api/articles/featured</a> - Get featured articles</li>
      <li><a href="/api/articles?limit=5">/api/articles?limit=5</a> - Get latest articles</li>
    </ul>
    <p>To connect a custom domain, use the Render.com dashboard settings.</p>
  </div>
</body>
</html>`;
  
  fs.writeFileSync('./dist/public/index.html', indexHtml);
  console.log('✅ Created basic public files');
} catch (err) {
  console.error('Error setting up public directory:', err);
  // Continue anyway
}

console.log('\n=== SERVER-ONLY DEPLOYMENT COMPLETE ===');
console.log('For Render.com deployment:');
console.log('1. In Build Command: use "node server-only-deploy.js"');
console.log('2. In Start Command: use "NODE_ENV=production node dist/index.js"');
console.log('3. Add these environment variables in the Render dashboard:');
console.log('   - NODE_ENV=production');
console.log('   - DATABASE_URL (your Postgres connection string)');
console.log('   - OPENAI_API_KEY (if using OpenAI features)');
console.log('   - UNSPLASH_ACCESS_KEY (if using Unsplash for images)');
console.log('   - SESSION_SECRET (a long random string for session security)\n');