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

// Run the build
console.log('\n3. Running build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

console.log('\n=== BUILD HELPER COMPLETED SUCCESSFULLY ===');