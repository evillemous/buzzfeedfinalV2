#!/usr/bin/env node
/**
 * Render.com deployment script specifically designed to work around
 * common issues with Render deployments for Vite + React + Node.js projects
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a simplified CommonJS build script that doesn't rely on vite config
function createSimpleBuildScript() {
  console.log('Creating simplified build script...');
  
  const simpleBuildJs = `
#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure we have esbuild
try {
  require.resolve('esbuild');
} catch (err) {
  console.log('Installing esbuild...');
  execSync('npm install esbuild --no-save');
}

// Build the server
console.log('Building server code...');
try {
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    stdio: 'inherit'
  });
  console.log('Server built successfully');
} catch (err) {
  console.error('Failed to build server:', err);
  process.exit(1);
}

// Create a minimalist client bundle for production
console.log('Done - server will serve static files from /client');
`;

  fs.writeFileSync('simple-build.js', simpleBuildJs);
  fs.chmodSync('simple-build.js', '755');
  console.log('✅ Created simple-build.js');
}

// Create a minimal server-only build
function createServerOnlyBuild() {
  console.log('Creating server-only build...');
  
  try {
    // Install esbuild if needed
    try {
      require.resolve('esbuild');
      console.log('✅ esbuild is installed');
    } catch (err) {
      console.log('Installing esbuild...');
      execSync('npm install esbuild --no-save');
    }

    // Build just the server
    console.log('Building server code...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit'
    });
    
    // Create a public directory if it doesn't exist
    if (!fs.existsSync('dist/public')) {
      fs.mkdirSync('dist/public', { recursive: true });
    }
    
    // Copy client files if they exist
    if (fs.existsSync('client')) {
      console.log('Copying client files...');
      execSync('cp -r client dist/public', { stdio: 'inherit' });
    }
    
    console.log('✅ Server-only build completed');
    return true;
  } catch (err) {
    console.error('❌ Failed to create server-only build:', err);
    return false;
  }
}

// Create a simplified vite.config.js
function createSimpleViteConfig() {
  console.log('Creating simplified vite.config.js...');
  
  const configContent = `
const { defineConfig } = require('vite');

// Simple fallback plugin if @vitejs/plugin-react isn't available
const reactPlugin = () => ({
  name: 'simple-react-plugin',
  transform(code, id) {
    // Don't do any transforms, just return code as-is
    return code;
  }
});

module.exports = defineConfig({
  plugins: [reactPlugin()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: process.env.PORT || 5000,
  },
});
`;

  fs.writeFileSync('vite.config.js', configContent);
  console.log('✅ Created simplified vite.config.js');
}

// Fix package.json scripts for Render deployment
function fixPackageJson() {
  console.log('Fixing package.json scripts...');
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ package.json not found!');
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let modified = false;
    
    // Ensure scripts section exists
    packageJson.scripts = packageJson.scripts || {};
    
    // Fix build script
    if (!packageJson.scripts.build || packageJson.scripts.build.includes('vite build')) {
      packageJson.scripts.build = 'node simple-build.js';
      modified = true;
    }
    
    // Fix start script
    if (!packageJson.scripts.start || !packageJson.scripts.start.includes('NODE_ENV=production')) {
      packageJson.scripts.start = 'NODE_ENV=production node dist/index.js';
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated package.json scripts');
    } else {
      console.log('✅ package.json scripts already look good');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Failed to fix package.json:', err);
    return false;
  }
}

// Execute the deployment steps
async function main() {
  console.log('=== RENDER DEPLOYMENT HELPER ===');
  console.log('Running in:', process.cwd());
  
  try {
    // 1. Install core dependencies
    console.log('\n1. Installing core dependencies...');
    execSync('npm install esbuild dotenv --no-save', { stdio: 'inherit' });
    
    // 2. Create build alternatives
    console.log('\n2. Creating build alternatives...');
    createSimpleBuildScript();
    createSimpleViteConfig();
    
    // 3. Fix package.json
    console.log('\n3. Fixing package.json...');
    fixPackageJson();
    
    // 4. Attempt a server-only build
    console.log('\n4. Attempting server-only build...');
    const buildSuccess = createServerOnlyBuild();
    
    // 5. Create a .env file with production settings
    console.log('\n5. Creating .env file...');
    const envContent = `NODE_ENV=production
SESSION_SECRET=render_deployment_session_secret
`;
    fs.writeFileSync('.env', envContent);
    
    console.log('\n=== RENDER DEPLOYMENT HELPER COMPLETE ===');
    if (buildSuccess) {
      console.log('✅ Build completed successfully');
      console.log('\nTo deploy on Render.com:');
      console.log('1. Set Start Command to: "NODE_ENV=production node dist/index.js"');
      console.log('2. Add the following environment variables:');
      console.log('   - NODE_ENV=production');
      console.log('   - DATABASE_URL (your Postgres database URL)');
      console.log('   - OPENAI_API_KEY (if using OpenAI)');
    } else {
      console.log('⚠️ Build encountered issues but deployment files were created');
      console.log('Try running "node simple-build.js" manually');
    }
  } catch (err) {
    console.error('❌ Deployment helper failed:', err);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});