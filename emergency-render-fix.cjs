#!/usr/bin/env node
/**
 * Emergency fix script for Render.com deployment issues
 * Specifically addresses the common issue with Vite plugin dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== EMERGENCY RENDER DEPLOYMENT FIX ===');

// 1. Ensure correct environment and directory structure
console.log('Checking environment...');
if (!process.env.RENDER) {
  console.log('Not running on Render, but continuing anyway');
}

// 2. Force install critical dependencies
console.log('Installing critical dependencies...');
try {
  execSync('npm install --no-save vite @vitejs/plugin-react esbuild tsx', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  console.log('✅ Core dependencies installed');
} catch (err) {
  console.error('⚠️ Error installing dependencies:', err.message);
}

// 3. Create a minimal vite.config.js file as fallback
console.log('Creating fallback vite.config.js...');
try {
  const minimalViteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.PORT || 5000,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});`;

  fs.writeFileSync('vite.config.js', minimalViteConfig);
  console.log('✅ Fallback vite.config.js created');
} catch (err) {
  console.error('⚠️ Error creating fallback vite.config.js:', err.message);
}

// 4. Verify the package.json has correct scripts
console.log('Verifying package.json...');
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);
  let modified = false;

  if (!packageJson.scripts || !packageJson.scripts.build) {
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.build = 'vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist';
    modified = true;
  }

  if (!packageJson.scripts.start || !packageJson.scripts.start.includes('NODE_ENV=production')) {
    packageJson.scripts.start = 'NODE_ENV=production node dist/index.js';
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts');
  } else {
    console.log('✅ package.json scripts look good');
  }
} catch (err) {
  console.error('⚠️ Error verifying package.json:', err.message);
}

// 5. Fix NewsAPI.org issues for production
console.log('Creating NewsAPI fix script...');
try {
  const newsApiFix = `
#!/usr/bin/env node
/**
 * Fix script to ensure NewsAPI.org is not used in production
 */

const fs = require('fs');
const path = require('path');

async function fixNewsApiProduction() {
  console.log('Fixing NewsAPI.org for production environment...');
  
  // Find NewsAPI references in compiled files
  const files = [
    './dist/index.js',
    './dist/services/newsScraper.js'
  ];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      console.log(\`Processing \${file}...\`);
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // Replace NewsAPI URLs
      if (content.includes('newsapi.org')) {
        content = content.replace(
          /https:\\/\\/newsapi\\.org\\/v2\\/[^"']+/g,
          'https://example.com/disabled-newsapi'
        );
        modified = true;
      }
      
      // Disable News API source
      if (content.includes('News API Org')) {
        content = content.replace(
          /\\{[^{}]*['"]name['"]\\s*:\\s*['"]News API Org['"][^{}]*\\}/g,
          '{ name: "News API Org", disabled: true, url: "https://example.com" }'
        );
        
        content = content.replace(
          /else if\\s*\\(\\s*source\\.name\\s*===\\s*['"]News API Org['"]\\s*\\)[^}]*\\{[^}]*\\}/g,
          'else if (source.name === "News API Org") { return []; }'
        );
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(file, content);
        console.log(\`Fixed NewsAPI references in \${file}\`);
      }
    }
  }
  
  console.log('NewsAPI fix complete');
}

fixNewsApiProduction().catch(err => {
  console.error('Error fixing NewsAPI:', err);
  process.exit(1);
});
`;

  fs.writeFileSync('fix-newsapi-production.js', newsApiFix);
  fs.chmodSync('fix-newsapi-production.js', '755');
  console.log('✅ NewsAPI fix script created');
} catch (err) {
  console.error('⚠️ Error creating NewsAPI fix script:', err.message);
}

// 6. Create an .env file with production settings
console.log('Creating .env file...');
try {
  const envContent = `NODE_ENV=production
SESSION_SECRET=emergency_render_deployment_session_secret_replace_in_dashboard
# Remember to set the following in the Render dashboard:
# DATABASE_URL
# OPENAI_API_KEY
# UNSPLASH_ACCESS_KEY
`;
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created');
} catch (err) {
  console.error('⚠️ Error creating .env file:', err.message);
}

console.log('\n=== EMERGENCY FIX COMPLETE ===');
console.log('Instructions for Render deployment:');
console.log('1. Add this line to Build Command: "node render-build.cjs && node emergency-render-fix.cjs"');
console.log('2. Add this line to Start Command: "node dist/index.js"');
console.log('3. Set required environment variables in the Render dashboard');
console.log('4. Make sure to set NODE_ENV=production in the Render environment variables');