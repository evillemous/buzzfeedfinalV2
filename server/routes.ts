import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertArticleSchema, insertCategorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  
  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch category' });
    }
  });

  app.get('/api/categories/:slug/articles', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const articles = await storage.getArticlesByCategorySlug(req.params.slug, limit);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch articles by category' });
    }
  });

  // Articles
  app.get('/api/articles', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const articles = await storage.getArticles(limit, offset);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch articles' });
    }
  });

  app.get('/api/articles/featured', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 1;
      const articles = await storage.getFeaturedArticles(limit);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch featured articles' });
    }
  });

  app.get('/api/articles/popular', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const articles = await storage.getPopularArticles(limit);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch popular articles' });
    }
  });

  app.get('/api/articles/:slug', async (req, res) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      // Increment view count
      await storage.incrementArticleViews(article.id);
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch article' });
    }
  });

  app.post('/api/articles/:id/share', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getUser(id);
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      await storage.incrementArticleShares(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to share article' });
    }
  });

  app.get('/api/articles/:id/related', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const articles = await storage.getRelatedArticles(id, limit);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch related articles' });
    }
  });

  // Tags
  app.get('/api/tags', async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tags' });
    }
  });

  app.get('/api/tags/:slug/articles', async (req, res) => {
    try {
      const articles = await storage.getArticlesByTagSlug(req.params.slug);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch articles by tag' });
    }
  });

  // Admin Routes (for content management - simplified for demo)
  app.post('/api/admin/articles', async (req, res) => {
    try {
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid article data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create article' });
    }
  });

  app.post('/api/admin/categories', async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create category' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
