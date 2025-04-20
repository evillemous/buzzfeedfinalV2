const { Pool } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Hash password function
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

// Main function to setup admin user
async function setupAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔄 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if admin exists
    console.log('🔄 Checking if admin user exists...');
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (result.rows.length === 0) {
      // Create admin user
      console.log('🔄 Creating admin user...');
      const hashedPassword = await hashPassword('admin123');
      
      await pool.query(`
        INSERT INTO users (username, password, email, role) 
        VALUES ($1, $2, $3, $4)
      `, ['admin', hashedPassword, 'admin@yourbuzzfeed.com', 'admin']);
      
      console.log('✅ Admin user created successfully');
    } else {
      // Reset admin password
      console.log('🔄 Resetting admin password...');
      const hashedPassword = await hashPassword('admin123');
      
      await pool.query(`
        UPDATE users 
        SET password = $1 
        WHERE username = $2
      `, [hashedPassword, 'admin']);
      
      console.log('✅ Admin password reset successfully');
    }
    
    console.log('\n==== SUCCESS ====');
    console.log('Admin user is now set up on your Render deployment.');
    console.log('You can login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

setupAdminUser();