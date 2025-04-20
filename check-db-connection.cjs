const { Pool } = require('@neondatabase/serverless');

async function checkConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('Connection successful:', result.rows[0].current_time);
    
    // Test getting users
    console.log('\nChecking users table:');
    const usersResult = await pool.query('SELECT * FROM users');
    console.log(`Found ${usersResult.rows.length} user(s)`);
    
    if (usersResult.rows.length > 0) {
      const adminUser = usersResult.rows.find(user => user.username === 'admin');
      if (adminUser) {
        console.log('Admin user found with id:', adminUser.id);
      } else {
        console.log('No admin user found');
      }
    }
    
    // Check table schema
    console.log('\nChecking table schema:');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables in database:');
    for (const row of tablesResult.rows) {
      console.log(`- ${row.table_name}`);
      
      // Get columns for this table
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [row.table_name]);
      
      console.log('  Columns:');
      for (const col of columnsResult.rows) {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      }
    }
    
    // Test getting categories
    console.log('\nChecking categories:');
    const catResult = await pool.query('SELECT * FROM categories');
    console.log(`Found ${catResult.rows.length} categories`);
    if (catResult.rows.length > 0) {
      console.log('Categories:', catResult.rows.map(c => c.name).join(', '));
    }
    
    // Test getting articles
    console.log('\nChecking articles:');
    const articlesResult = await pool.query('SELECT COUNT(*) FROM articles');
    console.log(`Total articles: ${articlesResult.rows[0].count}`);
    
    if (parseInt(articlesResult.rows[0].count) > 0) {
      const recentArticles = await pool.query('SELECT id, title, slug FROM articles ORDER BY id DESC LIMIT 3');
      console.log('Latest articles:');
      recentArticles.rows.forEach(article => {
        console.log(`- ${article.title} (ID: ${article.id}, Slug: ${article.slug})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkConnection();