/*
This script directly creates an admin user in the database
using Drizzle ORM to access the PostgreSQL database
*/

import { config } from 'dotenv';
import { scrypt, randomBytes } from 'crypto';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from './shared/schema.js';
import { promisify } from 'util';
import ws from 'ws';

config();
neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function setupAdminUser() {
  console.log('Creating admin user...');
  
  // Connect to the database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Check if admin already exists
    const existingUsers = await db.select().from(schema.users).where(eq(schema.users.username, 'admin'));
    
    if (existingUsers.length > 0) {
      console.log('Admin user already exists!');
      console.log('Username: admin');
      console.log('Password: admin123');
      await pool.end();
      return;
    }
    
    // Create the admin user
    const hashedPassword = await hashPassword('admin123');
    
    const [admin] = await db.insert(schema.users).values({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Administrator',
      email: 'admin@yourbuzzfeed.com',
      isAdmin: true
    }).returning();
    
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    await pool.end();
  } catch (error) {
    console.error('Error creating admin user:', error);
    await pool.end();
    process.exit(1);
  }
}

setupAdminUser();