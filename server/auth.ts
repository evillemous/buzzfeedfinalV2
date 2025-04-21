import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import MemoryStore from 'memorystore';
import { User } from '@shared/schema';
import { storage } from './storage';

// Extend the session interface to include userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Create memory store for sessions
const MemStore = MemoryStore(session);
const sessionStore = new MemStore({
  checkPeriod: 86400000 // Prune expired entries every 24h
});

const scryptAsync = promisify(scrypt);

// Hash password with scrypt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Compare passwords
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    // Make sure the hashed password contains the delimiter
    if (!hashedPassword.includes('.')) {
      console.error('Invalid password format');
      return false;
    }
    
    const [hashedPart, salt] = hashedPassword.split('.');
    
    // Check that we have both parts
    if (!hashedPart || !salt) {
      console.error('Missing parts in password hash');
      return false;
    }
    
    const hashedBuf = Buffer.from(hashedPart, 'hex');
    const suppliedBuf = (await scryptAsync(plainPassword, salt, 64)) as Buffer;
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Set up authentication
export function setupAuth(app: Express) {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'yourbuzzfeed-secret-key',
      resave: true,
      saveUninitialized: true,
      store: sessionStore,
      name: 'yourbuzzfeed.sid', // Custom name for cookie
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        secure: false, // Set to false to work in all environments
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      },
    })
  );

  // Login route
  app.post('/api/login', async (req, res) => {
    // Force content type to be JSON
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Log debugging information
      console.log(`Login attempt for username: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`User not found: ${username}`);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      console.log(`User found, verifying password for ${username}`);
      const passwordValid = await verifyPassword(password, user.password);
      
      if (!passwordValid) {
        console.log(`Invalid password for ${username}`);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Password is valid, set session
      console.log(`Password valid for ${username}, setting session`);
      req.session.userId = user.id;
      
      // Explicitly save the session to ensure it's stored
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        console.log(`Login successful for ${username}`);
        return res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // Get current user
  app.get('/api/user', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Helper function to create or reset admin user
  app.get('/api/admin-setup', async (req, res) => {
    // Force content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Check if admin already exists
      const existingAdmin = await storage.getUserByUsername('admin');
      
      if (existingAdmin) {
        // Update the admin password to ensure it's in the correct format
        const hashedPassword = await hashPassword('admin123');
        await storage.updateUser(existingAdmin.id, { password: hashedPassword });
        
        return res.json({ 
          message: 'Admin user password reset successfully',
          username: 'admin', 
          password: 'admin123' 
        });
      }

      // Create admin user with default password
      const hashedPassword = await hashPassword('admin123');
      
      const admin = await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        fullName: 'Administrator',
        email: 'admin@yourbuzzfeed.com',
        isAdmin: true
      });

      res.json({ 
        message: 'Admin user created successfully',
        username: 'admin',
        password: 'admin123'
      });
    } catch (error) {
      console.error('Setup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}