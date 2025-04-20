const { Pool } = require('@neondatabase/serverless');

async function checkConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }
  
  // Print a sanitized version of the connection string (hiding credentials)
  const connString = process.env.DATABASE_URL;
  const sanitizedConnString = connString.replace(/:\/\/([^:]+):([^@]+)@/, '://*****:*****@');
  console.log('Using connection string:', sanitizedConnString);
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Attempting to connect to database...');
    const result = await pool.query('SELECT NOW()');
    console.log('Connection successful:', result.rows[0]);
    
    // Create tables manually
    console.log('Creating tables manually...');
    
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user'
        )
      `);
      console.log('Users table created or verified');
      
      // Create admin user
      const checkAdmin = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
      if (checkAdmin.rows.length === 0) {
        // Create a simple hashed password for now
        const crypto = require('crypto');
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync('admin123', salt, 64).toString('hex');
        const hashedPassword = `${hash}.${salt}`;
        
        await pool.query(
          'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4)',
          ['admin', hashedPassword, 'admin@example.com', 'admin']
        );
        console.log('Admin user created');
      } else {
        console.log('Admin user already exists');
      }
      
      // Create other required tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT
        )
      `);
      console.log('Categories table created or verified');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          content TEXT NOT NULL,
          image_url TEXT,
          category_id INTEGER REFERENCES categories(id),
          is_featured BOOLEAN DEFAULT false,
          views INTEGER DEFAULT 0,
          shares INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Articles table created or verified');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE
        )
      `);
      console.log('Tags table created or verified');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS articles_tags (
          id SERIAL PRIMARY KEY,
          article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
          tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
          UNIQUE(article_id, tag_id)
        )
      `);
      console.log('Articles_tags table created or verified');
      
      // Add default category if none exists
      const checkCategory = await pool.query('SELECT * FROM categories LIMIT 1');
      if (checkCategory.rows.length === 0) {
        await pool.query(
          'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)',
          ['News', 'news', 'Latest news and updates']
        );
        console.log('Default category created');
      }
      
    } catch (err) {
      console.error('Error creating tables:', err);
    }
    
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await pool.end();
  }
}

checkConnection();