// This script modifies the auth.ts file to fix session issues on Render
// Run this on Render after deployment to update the session configuration

const fs = require('fs');
const path = require('path');

async function fixSessionConfig() {
  try {
    // Path to the server/auth.ts file
    const authFilePath = path.join(process.cwd(), 'server', 'auth.ts');
    
    // Check if the file exists
    if (!fs.existsSync(authFilePath)) {
      console.error(`File not found: ${authFilePath}`);
      return;
    }
    
    // Read the file
    console.log(`Reading file: ${authFilePath}`);
    let content = fs.readFileSync(authFilePath, 'utf8');
    
    // Replace the session configuration to fix cookies in production
    const oldSessionConfig = `app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 86400000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    })
  );`;
    
    const newSessionConfig = `app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 86400000, // 24 hours
        secure: false, // Set to false for now to debug
        sameSite: 'lax',
        httpOnly: true,
      },
    })
  );`;
    
    // Make the replacement
    if (content.includes(oldSessionConfig)) {
      content = content.replace(oldSessionConfig, newSessionConfig);
      console.log('Session configuration updated');
    } else {
      console.log('Session configuration not found, manual update required');
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(authFilePath, content, 'utf8');
    console.log('File updated successfully');
    
    console.log('\nNext steps:');
    console.log('1. Rebuild your application on Render');
    console.log('2. After rebuilding, your session configuration will be updated');
    console.log('3. Try logging in again');
    
  } catch (error) {
    console.error('Error updating file:', error);
  }
}

fixSessionConfig();