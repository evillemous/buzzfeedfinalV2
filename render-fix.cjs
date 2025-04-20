// This script is meant to be run in the Render shell to fix authentication issues

const { Pool } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Helper functions
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function fixRenderDeployment() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Testing database connection...');
    const connResult = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', connResult.rows[0]);
    
    console.log('\nChecking environment variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'set' : 'not set');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
    console.log('UNSPLASH_ACCESS_KEY:', process.env.UNSPLASH_ACCESS_KEY ? 'set' : 'not set');
    
    // Check if admin user exists and create/reset if needed
    console.log('\nChecking admin user...');
    const adminResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (adminResult.rows.length === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await hashPassword('admin123');
      
      await pool.query(`
        INSERT INTO users (username, password, email, role) 
        VALUES ($1, $2, $3, $4)
      `, ['admin', hashedPassword, 'admin@yourbuzzfeed.com', 'admin']);
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user exists, resetting password...');
      const hashedPassword = await hashPassword('admin123');
      
      await pool.query(`
        UPDATE users 
        SET password = $1 
        WHERE username = $2
      `, [hashedPassword, 'admin']);
      
      console.log('Admin password reset successfully');
    }
    
    // Check categories
    console.log('\nChecking categories...');
    const catResult = await pool.query('SELECT COUNT(*) FROM categories');
    console.log(`Found ${catResult.rows[0].count} categories`);
    
    if (catResult.rows[0].count === '0') {
      console.log('Adding default categories...');
      const categories = [
        ['Health', 'health', 'Health and wellness tips'],
        ['Technology', 'technology', 'Latest tech news and gadgets'],
        ['Entertainment', 'entertainment', 'Movies, TV shows, and celebrity news'],
        ['Lifestyle', 'lifestyle', 'Fashion, food, and travel'],
        ['News', 'news', 'Latest news and updates']
      ];
      
      for (const [name, slug, description] of categories) {
        await pool.query(
          'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)',
          [name, slug, description]
        );
      }
      console.log('Default categories added');
    }
    
    console.log('\nSUCCESS: Your Render deployment has been fixed!');
    console.log('You can now access your site and login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nMake sure you have these environment variables set in your Render dashboard:');
    console.log('1. DATABASE_URL (your PostgreSQL connection string)');
    console.log('2. SESSION_SECRET (a random string for securing sessions)');
    console.log('3. NODE_ENV=production');
    console.log('4. OPENAI_API_KEY (your OpenAI API key)');
    console.log('5. UNSPLASH_ACCESS_KEY (your Unsplash API key)');
    console.log('\nIf you still have issues:');
    console.log('1. Go to your Render dashboard, select your web service');
    console.log('2. Click on "Environment" and ensure all required environment variables are set');
    console.log('3. Restart your service after making these changes');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixRenderDeployment();