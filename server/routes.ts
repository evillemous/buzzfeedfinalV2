import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertArticleSchema, insertCategorySchema } from "@shared/schema";
import { 
  generateArticleContent, 
  generateArticleIdeas, 
  generateListicleContent,
  batchGenerateContent,
  type ContentType
} from "./services/openai";
import { searchUnsplashImages, getRandomImage } from "./services/unsplash";
import { slugify } from "../client/src/lib/utils";

// Middleware to check if user is admin (simplified for demo)
const isAdmin = (req: Request, res: Response, next: Function) => {
  // In a real app, you would check session/token
  // For demo purposes, we'll just pass through
  // TODO: Implement proper authentication
  next();
};

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

  // AI Content Generation Routes
  app.post('/api/ai/generate-content', isAdmin, async (req, res) => {
    try {
      const { topic, targetLength } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: 'Topic is required' });
      }
      
      const articleContent = await generateArticleContent(
        topic,
        targetLength || 800
      );
      
      res.json(articleContent);
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({ message: 'Failed to generate content' });
    }
  });

  app.post('/api/ai/generate-ideas', isAdmin, async (req, res) => {
    try {
      const { category, count } = req.body;
      
      if (!category) {
        return res.status(400).json({ message: 'Category is required' });
      }
      
      const ideas = await generateArticleIdeas(category, count || 5);
      res.json({ ideas });
    } catch (error) {
      console.error('Error generating ideas:', error);
      res.status(500).json({ message: 'Failed to generate article ideas' });
    }
  });
  
  // Simple test route for OpenAI connection
  app.get('/api/ai/test-connection', async (req, res) => {
    try {
      // Simple test - just generate a single idea without requiring auth
      const testIdea = await generateArticleIdeas("Technology", 1);
      res.json({ 
        success: true, 
        message: "OpenAI connection is working correctly!",
        sample: testIdea[0]
      });
    } catch (error) {
      console.error('Error testing OpenAI connection:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to connect to OpenAI API', 
        error: error.message
      });
    }
  });
  
  // Simplified article creation for testing
  app.post('/api/ai/create-test-article', async (req, res) => {
    try {
      // Create a simple test article with the admin user
      const article = await storage.createArticle({
        title: "Test Article",
        slug: "test-article-" + Date.now(),
        content: "<p>This is a test article content.</p>",
        excerpt: "Test excerpt",
        featuredImage: "https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d",
        categoryId: 1, // Health category
        authorId: 1, // Admin user
        isPublished: true,
        isFeatured: false,
        contentType: 'article',
        readTime: 2
      });
      
      res.status(201).json({
        success: true,
        article,
        message: "Test article created successfully"
      });
    } catch (error) {
      console.error('Error creating test article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test article',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Image Search Routes
  app.get('/api/images/search', isAdmin, async (req, res) => {
    try {
      const { query, page, perPage } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const images = await searchUnsplashImages(
        query as string,
        page ? parseInt(page as string) : 1,
        perPage ? parseInt(perPage as string) : 10
      );
      
      res.json({ images });
    } catch (error) {
      console.error('Error searching images:', error);
      res.status(500).json({ message: 'Failed to search for images' });
    }
  });
  
  app.get('/api/images/random', isAdmin, async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const image = await getRandomImage(query as string);
      
      if (!image) {
        return res.status(404).json({ message: 'No image found' });
      }
      
      res.json({ image });
    } catch (error) {
      console.error('Error getting random image:', error);
      res.status(500).json({ message: 'Failed to get random image' });
    }
  });
  
  // Create a complete article with AI content and image
  app.post('/api/ai/create-article', isAdmin, async (req, res) => {
    try {
      const { 
        topic, 
        categoryId,
        targetLength,
        imageKeyword 
      } = req.body;
      
      if (!topic || !categoryId) {
        return res.status(400).json({ 
          message: 'Topic and categoryId are required' 
        });
      }
      
      // Step 1: Generate article content
      const generatedContent = await generateArticleContent(
        topic,
        targetLength || 800
      );
      
      // Step 2: Get an image
      const imageSearchTerm = imageKeyword || topic;
      const image = await getRandomImage(imageSearchTerm);
      
      // Step 3: Create the article
      const slug = slugify(generatedContent.title);
      
      const articleData = {
        title: generatedContent.title,
        slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        featuredImage: image?.urls.regular || '',
        categoryId,
        authorId: 1, // Default author (admin)
        isPublished: true,
        isFeatured: false
      };
      
      // Save to database
      const article = await storage.createArticle(articleData);
      
      res.status(201).json({ 
        article,
        message: 'Article created successfully' 
      });
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ message: 'Failed to create article' });
    }
  });

  // Generate listicle content
  app.post('/api/ai/generate-listicle', isAdmin, async (req, res) => {
    try {
      const { topic, numItems, targetLength } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: 'Topic is required' });
      }
      
      const listicleContent = await generateListicleContent(
        topic,
        numItems || 10,
        targetLength || 1000
      );
      
      res.json(listicleContent);
    } catch (error) {
      console.error('Error generating listicle content:', error);
      res.status(500).json({ message: 'Failed to generate listicle content' });
    }
  });

  // Create a listicle with AI content and image
  app.post('/api/ai/create-listicle', isAdmin, async (req, res) => {
    try {
      const { 
        topic, 
        categoryId,
        numItems,
        targetLength,
        imageKeyword 
      } = req.body;
      
      if (!topic || !categoryId) {
        return res.status(400).json({ 
          message: 'Topic and categoryId are required' 
        });
      }
      
      // Step 1: Generate listicle content
      const generatedContent = await generateListicleContent(
        topic,
        numItems || 10,
        targetLength || 1000
      );
      
      // Step 2: Get an image
      const imageSearchTerm = imageKeyword || topic;
      const image = await getRandomImage(imageSearchTerm);
      
      // Step 3: Create the article
      const slug = slugify(generatedContent.title);
      
      const articleData = {
        title: generatedContent.title,
        slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        featuredImage: image?.urls.regular || '',
        categoryId,
        authorId: 1, // Default author (admin)
        isPublished: true,
        isFeatured: false,
        contentType: 'listicle' as ContentType,
        readTime: Math.ceil(targetLength / 200) // Approximate read time
      };
      
      // Save to database
      const article = await storage.createArticle(articleData);
      
      res.status(201).json({ 
        article,
        message: 'Listicle created successfully' 
      });
    } catch (error) {
      console.error('Error creating listicle:', error);
      res.status(500).json({ message: 'Failed to create listicle' });
    }
  });

  // Batch content generation (multiple articles/listicles across categories)
  app.post('/api/ai/batch-generate', isAdmin, async (req, res) => {
    try {
      const { count, listiclePercentage } = req.body;
      
      // Generate batch content
      const batchContent = await batchGenerateContent(
        count || 10,
        listiclePercentage || 40
      );
      
      // Will store the created articles
      const createdArticles = [];
      
      // Process each generated content to create articles
      for (const content of batchContent) {
        try {
          // Find or create the category
          let categoryId: number | null = null;
          
          if (content.category) {
            // Check if category exists
            const categorySlug = slugify(content.category);
            let category = await storage.getCategoryBySlug(categorySlug);
            
            if (!category) {
              // Create the category
              category = await storage.createCategory({
                name: content.category,
                slug: categorySlug,
                description: `Articles about ${content.category}`,
                color: '#0066CC', // Default color
                bgColor: '#E6F0FF' // Default background color
              });
            }
            
            categoryId = category.id;
          }
          
          // Get an image for the article
          const image = await getRandomImage(content.title);
          
          // Create slug
          const slug = slugify(content.title);
          
          // Create the article
          const articleData = {
            title: content.title,
            slug,
            content: content.content,
            excerpt: content.excerpt,
            featuredImage: image?.urls.regular || '',
            categoryId,
            authorId: 1, // Default author (admin)
            isPublished: true,
            isFeatured: false,
            contentType: content.contentType,
            readTime: content.contentType === 'listicle' 
              ? Math.ceil(content.content.length / 600) 
              : Math.ceil(content.content.length / 400)
          };
          
          const article = await storage.createArticle(articleData);
          createdArticles.push(article);
        } catch (error) {
          console.error(`Error creating article "${content.title}":`, error);
          // Continue with the next article even if this one fails
        }
      }
      
      res.status(201).json({
        success: true,
        count: createdArticles.length,
        message: `Successfully created ${createdArticles.length} articles`
      });
    } catch (error) {
      console.error('Error in batch content generation:', error);
      res.status(500).json({ message: 'Failed to generate batch content' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
