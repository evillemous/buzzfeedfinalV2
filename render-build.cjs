#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * This script fixes common build issues on Render.com
 */

console.log('=== RENDER BUILD HELPER ===');

// Check if we're on Render
const isRender = process.env.RENDER === 'true';
console.log(`Running on Render: ${isRender ? 'Yes' : 'No'}`);

// Make sure all dependencies are installed
console.log('\n1. Installing dependencies...');
try {
  // First try with a clean install
  execSync('npm ci', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully with npm ci');
} catch (error) {
  console.log('⚠️ npm ci failed, falling back to npm install');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully with npm install');
  } catch (installError) {
    console.error('❌ Failed to install dependencies:', installError);
    process.exit(1);
  }
}

// Ensure vite plugins are installed
console.log('\n2. Checking for Vite plugins...');
try {
  // Check for @vitejs/plugin-react
  if (!fs.existsSync(path.join('node_modules', '@vitejs', 'plugin-react'))) {
    console.log('⚠️ @vitejs/plugin-react not found, installing...');
    execSync('npm install @vitejs/plugin-react', { stdio: 'inherit' });
  } else {
    console.log('✅ @vitejs/plugin-react is installed');
  }
  
  // Check for other plugins
  const requiredPlugins = [
    '@replit/vite-plugin-shadcn-theme-json',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-runtime-error-modal',
    '@tailwindcss/vite'
  ];
  
  for (const plugin of requiredPlugins) {
    const [scope, packageName] = plugin.split('/');
    const pluginPath = path.join('node_modules', scope, packageName);
    
    if (!fs.existsSync(pluginPath)) {
      console.log(`⚠️ ${plugin} not found, installing...`);
      execSync(`npm install ${plugin}`, { stdio: 'inherit' });
    } else {
      console.log(`✅ ${plugin} is installed`);
    }
  }
} catch (error) {
  console.error('❌ Failed to install Vite plugins:', error);
  process.exit(1);
}

// Set NODE_ENV to production
console.log('\n3. Setting NODE_ENV=production...');
process.env.NODE_ENV = 'production';
console.log('✅ NODE_ENV set to:', process.env.NODE_ENV);

// Run the build
console.log('\n4. Running build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Fix NewsAPI issues
console.log('\n5. Applying NewsAPI fix for production...');
try {
  // Files to check and fix
  const filesToCheck = [
    './dist/index.js',
    './dist/services/newsScraper.js'
  ];
  
  // Process each file to remove or disable NewsAPI calls
  for (const file of filesToCheck) {
    try {
      if (!fs.existsSync(file)) {
        console.log(`⚠️ File not found: ${file}`);
        continue;
      }
      
      console.log(`Processing file: ${file}`);
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Fix 1: Remove any direct NewsAPI.org URLs
      content = content.replace(
        /https:\/\/newsapi\.org\/v2\/top-headlines\?[^"']+/g,
        'https://example.com/disabled-newsapi'
      );
      
      // Fix 2: Handle NewsAPI source configuration
      if (file.includes('newsScraper')) {
        content = content.replace(
          /\{[^{}]*['"]name['"]\s*:\s*['"]News API Org['"][^{}]*\}/g,
          '{ name: "News API Org", disabled: true, url: "https://example.com" }'
        );
        
        // Fix 3: Skip NewsAPI processing
        content = content.replace(
          /else if\s*\(\s*source\.name\s*===\s*['"]News API Org['"]\s*\)[\s\S]*?\{[\s\S]*?\}/g,
          'else if (source.name === "News API Org") { console.log("NewsAPI disabled in production"); return []; }'
        );
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed NewsAPI references in ${file}`);
      } else {
        console.log(`✅ No NewsAPI references found in ${file}`);
      }
    } catch (fileError) {
      console.error(`⚠️ Error processing ${file}:`, fileError);
    }
  }
  console.log('✅ NewsAPI fix applied successfully');
} catch (error) {
  console.error('⚠️ NewsAPI fix warning:', error);
  // Continue anyway, don't exit
}

console.log('\n=== BUILD HELPER COMPLETED SUCCESSFULLY ===');