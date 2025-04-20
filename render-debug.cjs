const { Pool } = require('@neondatabase/serverless');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Helper function for password hashing
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function debugRender() {
  console.log('=== RENDER DEPLOYMENT DEBUG ===');
  console.log('Current directory:', process.cwd());
  
  // Check environment variables
  console.log('\n1. Checking Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
  console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'set' : 'not set');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
  console.log('UNSPLASH_ACCESS_KEY:', process.env.UNSPLASH_ACCESS_KEY ? 'set' : 'not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('⚠️ DATABASE_URL is not set! This is required for database access.');
    console.log('Please set this in your Render environment variables.');
    return;
  }
  
  if (!process.env.SESSION_SECRET) {
    console.log('⚠️ SESSION_SECRET is not set! Setting a temporary one for debugging.');
    process.env.SESSION_SECRET = 'temp-session-secret-for-debug';
  }
  
  // Check database connection
  console.log('\n2. Checking Database Connection:');
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.rows[0].current_time);
    
    // Check users table
    console.log('\n3. Checking Users Table:');
    const usersResult = await pool.query('SELECT * FROM users');
    console.log(`Found ${usersResult.rows.length} users in database.`);
    
    if (usersResult.rows.length > 0) {
      // Show user info without sensitive data
      usersResult.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Role: ${user.role || 'not set'}`);
        console.log(`  Email: ${user.email || 'not set'}`);
        console.log(`  HasPassword: ${user.password ? 'yes' : 'no'}`);
      });
      
      // Reset admin password
      const adminUser = usersResult.rows.find(user => user.username === 'admin');
      if (adminUser) {
        console.log('\nResetting admin password...');
        const hashedPassword = await hashPassword('admin123');
        
        await pool.query(`
          UPDATE users 
          SET password = $1 
          WHERE username = $2
        `, [hashedPassword, 'admin']);
        
        console.log('✅ Admin password reset successfully.');
      }
    } else {
      console.log('⚠️ No users found in database. Creating admin user...');
      
      const hashedPassword = await hashPassword('admin123');
      
      await pool.query(`
        INSERT INTO users (username, password, email, role) 
        VALUES ($1, $2, $3, $4)
      `, ['admin', hashedPassword, 'admin@yourbuzzfeed.com', 'admin']);
      
      console.log('✅ Admin user created successfully.');
    }
    
    // Check categories and content
    console.log('\n4. Checking Content:');
    const catResult = await pool.query('SELECT COUNT(*) FROM categories');
    console.log(`Found ${catResult.rows[0].count} categories`);
    
    const articlesResult = await pool.query('SELECT COUNT(*) FROM articles');
    console.log(`Found ${articlesResult.rows[0].count} articles`);
    
    if (parseInt(catResult.rows[0].count) === 0) {
      console.log('⚠️ No categories found. Adding default categories...');
      
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
      console.log('✅ Default categories added');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }

  // Provide next steps
  console.log('\n=== DEBUG COMPLETE ===');
  console.log('\nNext steps:');
  console.log('1. Check the results above for any issues');
  console.log('2. If you still have login issues, try running: node setup-admin-render.cjs');
  console.log('3. If you have no content on the home page, try running: node render-fix.cjs');
  console.log('\nYou can now access the app at your Render URL and login with:');
  console.log('Username: admin');
  console.log('Password: admin123');
}

debugRender().catch(console.error);