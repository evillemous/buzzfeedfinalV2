const { Pool } = require('@neondatabase/serverless');
const crypto = require('crypto');

async function verifyPassword(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  return new Promise((resolve, reject) => {
    crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(hashed === derivedKey.toString('hex'));
    });
  });
}

async function testLogin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Attempting to get admin user from database...');
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (result.rows.length === 0) {
      console.error('Admin user not found in database');
      return;
    }
    
    const adminUser = result.rows[0];
    console.log('Found admin user:');
    console.log({
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      // Don't log the password
    });
    
    // Verify the password
    const isPasswordValid = await verifyPassword('admin123', adminUser.password);
    console.log('Is password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Updating admin password...');
      // Hash a new password
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedBuffer = crypto.scryptSync('admin123', salt, 64);
      const hashedPassword = `${hashedBuffer.toString('hex')}.${salt}`;
      
      await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, 'admin']);
      console.log('Admin password updated');
    }
    
    // Test session configuration
    console.log('\nChecking environment:');
    console.log('SESSION_SECRET set:', !!process.env.SESSION_SECRET);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // List all tables
    console.log('\nListing all tables:');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testLogin();