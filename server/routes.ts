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
import { scrapeAndGenerateNews, scheduleNewsScraping } from "./services/newsScraper";
import { 
  generateEntertainmentBatch, 
  generateEntertainmentArticle, 
  generateEntertainmentListicle 
} from "./services/entertainment";
import { slugify } from "../client/src/lib/utils";

// Import our authentication system
import { isAuthenticated, setupAuth } from './auth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware and routes
  setupAuth(app);
  
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
  
  // Update article
  app.patch('/api/articles/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      // Validate the update data (partial validation)
      const updateData = req.body;
      
      // Update article in storage
      const updatedArticle = await storage.updateArticle(id, updateData);
      res.json(updatedArticle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid article data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update article' });
    }
  });
  
  // Delete article
  app.delete('/api/articles/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      await storage.deleteArticle(id);
      res.json({ success: true, message: 'Article deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete article' });
    }
  });
  
  // Bulk delete articles
  app.post('/api/articles/bulk-delete', isAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid article IDs' });
      }
      
      // Delete articles one by one
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            await storage.deleteArticle(id);
            return { id, success: true };
          } catch (error) {
            console.error(`Error deleting article ${id}:`, error);
            return { id, success: false, error: 'Failed to delete' };
          }
        })
      );
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      res.json({ 
        message: `Deleted ${successful} articles${failed > 0 ? `, failed to delete ${failed} articles` : ''}`,
        successful,
        failed,
        results
      });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      res.status(500).json({ message: 'Failed to perform bulk delete operation' });
    }
  });

  app.post('/api/admin/categories', isAuthenticated, async (req, res) => {
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
  app.post('/api/ai/generate-content', isAuthenticated, async (req, res) => {
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

  app.post('/api/ai/generate-ideas', isAuthenticated, async (req, res) => {
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
    } catch (error: any) {
      console.error('Error testing OpenAI connection:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to connect to OpenAI API', 
        error: error.message || 'Unknown error'
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
  app.get('/api/images/search', isAuthenticated, async (req, res) => {
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
  
  app.get('/api/images/random', isAuthenticated, async (req, res) => {
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
  app.post('/api/ai/create-article', isAuthenticated, async (req, res) => {
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
  app.post('/api/ai/generate-listicle', isAuthenticated, async (req, res) => {
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
  app.post('/api/ai/create-listicle', isAuthenticated, async (req, res) => {
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
  app.post('/api/ai/batch-generate', isAuthenticated, async (req, res) => {
    try {
      const { count, listiclePercentage } = req.body;
      
      console.log(`Starting batch generation with count=${count} and listiclePercentage=${listiclePercentage}`);
      
      // Generate batch content
      const batchContent = await batchGenerateContent(
        count || 10,
        listiclePercentage || 40
      );
      
      console.log(`Received ${batchContent.length} content items from OpenAI`);
      
      // Will store the created articles
      const createdArticles = [];
      
      // Process each generated content to create articles
      for (const content of batchContent) {
        try {
          console.log(`Processing article: "${content.title}" (${content.contentType})`);
          
          // Find or create the category
          let categoryId: number | null = null;
          
          if (content.category) {
            // Check if category exists
            const categorySlug = slugify(content.category);
            let category = await storage.getCategoryBySlug(categorySlug);
            
            if (!category) {
              console.log(`Creating new category: ${content.category}`);
              // Create the category
              category = await storage.createCategory({
                name: content.category,
                slug: categorySlug,
                description: `Articles about ${content.category}`,
                color: '#0066CC', // Default color
                bgColor: '#E6F0FF' // Default background color
              });
            } else {
              console.log(`Using existing category: ${category.name} (id: ${category.id})`);
            }
            
            categoryId = category.id;
          } else {
            console.log('No category provided for this article');
          }
          
          // Generate a better image search query based on article context
          const imageKeywords = `${content.category} ${content.title.split(' ').slice(0, 4).join(' ')}`;
          console.log(`Batch article image search using keywords: "${imageKeywords}"`);
          
          // Get an image for the article
          const image = await getRandomImage(imageKeywords);
          
          // Create slug
          const slug = slugify(content.title);
          
          // Create the article
          console.log('Preparing article data for database insertion');
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
          
          console.log('Article data prepared:', JSON.stringify({
            title: articleData.title,
            slug: articleData.slug,
            excerpt: articleData.excerpt.substring(0, 50) + '...',
            categoryId: articleData.categoryId,
            contentType: articleData.contentType
          }));
          
          console.log('Calling storage.createArticle()');
          const article = await storage.createArticle(articleData);
          console.log(`Article created successfully with ID: ${article.id}`);
          
          createdArticles.push(article);
        } catch (error) {
          console.error(`Error creating article "${content.title}":`, error);
          // Continue with the next article even if this one fails
        }
      }
      
      console.log(`Batch generation complete. Created ${createdArticles.length} articles`);
      
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
  
  // News scraping endpoints
  app.post('/api/news/scrape', isAuthenticated, async (req, res) => {
    try {
      console.log('Manual news scraping initiated');
      const articlesCreated = await scrapeAndGenerateNews();
      
      res.status(201).json({
        success: true,
        count: articlesCreated,
        message: `Successfully created ${articlesCreated} news articles`
      });
    } catch (error) {
      console.error('Error in manual news scraping:', error);
      res.status(500).json({ message: 'Failed to scrape and generate news articles' });
    }
  });
  
  // Entertainment content generation endpoints
  app.post('/api/entertainment/generate', isAuthenticated, async (req, res) => {
    try {
      const { count, listiclePercentage } = req.body;
      
      console.log('Manual entertainment content generation initiated');
      const articleIds = await generateEntertainmentBatch(
        count || 5,
        listiclePercentage || 60
      );
      
      res.status(201).json({
        success: true,
        count: articleIds.length,
        ids: articleIds,
        message: `Successfully created ${articleIds.length} entertainment content pieces`
      });
    } catch (error) {
      console.error('Error in entertainment content generation:', error);
      res.status(500).json({ message: 'Failed to generate entertainment content' });
    }
  });
  
  app.post('/api/entertainment/generate-article', isAuthenticated, async (req, res) => {
    try {
      console.log('Generating single entertainment article');
      const articleId = await generateEntertainmentArticle();
      
      if (!articleId) {
        return res.status(500).json({ message: 'Failed to generate entertainment article' });
      }
      
      res.status(201).json({
        success: true,
        articleId,
        message: 'Successfully created entertainment article'
      });
    } catch (error) {
      console.error('Error generating entertainment article:', error);
      res.status(500).json({ message: 'Failed to generate entertainment article' });
    }
  });
  
  app.post('/api/entertainment/generate-listicle', isAuthenticated, async (req, res) => {
    try {
      console.log('Generating entertainment listicle');
      const articleId = await generateEntertainmentListicle();
      
      if (!articleId) {
        return res.status(500).json({ message: 'Failed to generate entertainment listicle' });
      }
      
      res.status(201).json({
        success: true,
        articleId,
        message: 'Successfully created entertainment listicle'
      });
    } catch (error) {
      console.error('Error generating entertainment listicle:', error);
      res.status(500).json({ message: 'Failed to generate entertainment listicle' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
