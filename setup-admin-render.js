const { Pool } = require('@neondatabase/serverless');
const crypto = require('crypto');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function setupAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    
    // First check if the user already exists
    const checkResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists, updating password...');
      await pool.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );
    } else {
      console.log('Creating new admin user...');
      await pool.query(
        'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'admin@example.com', 'admin']
      );
    }
    
    console.log('Admin user setup complete.');
  } catch (error) {
    console.error('Error setting up admin user:', error);
  } finally {
    await pool.end();
  }
}

setupAdminUser();