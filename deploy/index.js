var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  articles: () => articles,
  articlesTags: () => articlesTags,
  categories: () => categories,
  insertArticleSchema: () => insertArticleSchema,
  insertArticleTagSchema: () => insertArticleTagSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertTagSchema: () => insertTagSchema,
  insertUserSchema: () => insertUserSchema,
  tags: () => tags,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  isAdmin: boolean("is_admin").default(false)
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").default("#0066CC"),
  bgColor: text("bg_color").default("#E6F0FF")
});
var articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  publishDate: timestamp("publish_date").defaultNow(),
  authorId: integer("author_id").references(() => users.id),
  categoryId: integer("category_id").references(() => categories.id),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  contentType: text("content_type").default("article"),
  // 'article' or 'listicle'
  views: integer("views").default(0),
  shares: integer("shares").default(0),
  readTime: integer("read_time").default(5)
});
var tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique()
});
var articlesTags = pgTable("articles_tags", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id),
  tagId: integer("tag_id").references(() => tags.id)
});
var insertUserSchema = createInsertSchema(users).omit({ id: true });
var insertCategorySchema = createInsertSchema(categories).omit({ id: true });
var insertArticleSchema = createInsertSchema(articles).omit({ id: true, views: true, shares: true });
var insertTagSchema = createInsertSchema(tags).omit({ id: true });
var insertArticleTagSchema = createInsertSchema(articlesTags).omit({ id: true });

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, sql, and, inArray } from "drizzle-orm";
var DatabaseStorage = class {
  // User methods
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async createUser(user) {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  async updateUser(id, userData) {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`User with ID ${id} not found`);
    }
    return result[0];
  }
  // Category methods
  async getCategories() {
    return await db.select().from(categories);
  }
  async getCategoryBySlug(slug) {
    const result = await db.select().from(categories).where(eq(categories.slug, slug));
    return result[0];
  }
  async createCategory(category) {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }
  // Article methods
  async getArticles(limit = 20, offset = 0) {
    return await db.select().from(articles).limit(limit).offset(offset).orderBy(desc(articles.publishDate));
  }
  async getArticle(id) {
    const result = await db.select().from(articles).where(eq(articles.id, id));
    return result[0];
  }
  async getArticleBySlug(slug) {
    const result = await db.select().from(articles).where(eq(articles.slug, slug));
    return result[0];
  }
  async updateArticle(id, articleData) {
    const result = await db.update(articles).set(articleData).where(eq(articles.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Article with ID ${id} not found`);
    }
    return result[0];
  }
  async deleteArticle(id) {
    await db.delete(articlesTags).where(eq(articlesTags.articleId, id));
    const result = await db.delete(articles).where(eq(articles.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Article with ID ${id} not found`);
    }
  }
  async getFeaturedArticles(limit = 1) {
    return await db.select().from(articles).where(eq(articles.isFeatured, true)).limit(limit).orderBy(desc(articles.publishDate));
  }
  async getArticlesByCategory(categoryId, limit = 10) {
    return await db.select().from(articles).where(eq(articles.categoryId, categoryId)).limit(limit).orderBy(desc(articles.publishDate));
  }
  async getArticlesByCategorySlug(slug, limit = 10) {
    const category = await this.getCategoryBySlug(slug);
    if (!category) return [];
    return await this.getArticlesByCategory(category.id, limit);
  }
  async getPopularArticles(limit = 5) {
    return await db.select().from(articles).orderBy(desc(articles.views)).limit(limit);
  }
  async getRelatedArticles(articleId, limit = 3) {
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId));
    if (!article) return [];
    return await db.select().from(articles).where(and(
      eq(articles.categoryId, article.categoryId),
      sql`${articles.id} != ${articleId}`
    )).limit(limit).orderBy(desc(articles.publishDate));
  }
  async createArticle(article) {
    const result = await db.insert(articles).values(article).returning();
    return result[0];
  }
  async incrementArticleViews(id) {
    await db.update(articles).set({ views: sql`${articles.views} + 1` }).where(eq(articles.id, id));
  }
  async incrementArticleShares(id) {
    await db.update(articles).set({ shares: sql`${articles.shares} + 1` }).where(eq(articles.id, id));
  }
  // Tag methods
  async getTags() {
    return await db.select().from(tags);
  }
  async getTagBySlug(slug) {
    const result = await db.select().from(tags).where(eq(tags.slug, slug));
    return result[0];
  }
  async createTag(tag) {
    const result = await db.insert(tags).values(tag).returning();
    return result[0];
  }
  async getArticlesByTag(tagId) {
    const results = await db.select().from(articlesTags).where(eq(articlesTags.tagId, tagId));
    const articleIds = results.map((r) => r.articleId).filter((id) => id !== null);
    if (articleIds.length === 0) return [];
    return await db.select().from(articles).where(inArray(articles.id, articleIds)).orderBy(desc(articles.publishDate));
  }
  async getArticlesByTagSlug(slug) {
    const tag = await this.getTagBySlug(slug);
    if (!tag) return [];
    return await this.getArticlesByTag(tag.id);
  }
  // Article-Tag relationship
  async addTagToArticle(articleId, tagId) {
    await db.insert(articlesTags).values({ articleId, tagId });
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";

// server/services/openai.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});
async function generateArticleContent(topic, targetLength = 800) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional content writer creating articles for a viral news website called yourbuzzfeed.
          Create engaging, click-worthy content that will make readers want to share the article.
          
          FORMAT REQUIREMENTS (VERY IMPORTANT):
          - Format the response as HTML with proper tags
          - Start with an attention-grabbing intro paragraph
          - Include 4-6 subheadings (<h2> tags) to break up the content
          - Each section under a subheading should have 2-3 paragraphs (<p> tags)
          - Use <strong> tags for emphasis on key points
          - Include at least one bulleted list (<ul> with <li> items)
          - Add blockquotes (<blockquote>) for interesting quotes or statistics
          - End with a compelling conclusion paragraph
          - Keep paragraphs short (3-4 sentences maximum)
          - Insert a <div class="ad-break"></div> tag between major sections for ad placement
          
          Write approximately ${targetLength} words.
          The article should be visually structured for easy reading and optimized for AdSense placement.
          Output must be in this JSON format: { "title": "catchy title", "content": "full HTML content", "excerpt": "compelling 1-2 sentence excerpt" }`
        },
        {
          role: "user",
          content: `Create a viral, shareable article about: ${topic}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    return {
      title: result.title || "Generated Article",
      content: result.content || "<p>Content could not be generated</p>",
      excerpt: result.excerpt || "Generated excerpt"
    };
  } catch (error) {
    console.error("Error generating article content:", error);
    throw new Error("Failed to generate article content");
  }
}
async function generateArticleIdeas(category, count = 5) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a viral content strategist for yourbuzzfeed. 
          Create ${count} compelling, click-worthy article ideas for the ${category} category.
          These should be titles that would perform well on social media and have high potential for AdSense revenue.
          Format as a JSON array of strings.`
        },
        {
          role: "user",
          content: `Generate ${count} viral article ideas for the ${category} category.`
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });
    const content = response.choices[0].message.content || '{"ideas":[]}';
    const result = JSON.parse(content);
    return result.ideas || [];
  } catch (error) {
    console.error("Error generating article ideas:", error);
    throw new Error("Failed to generate article ideas");
  }
}
async function generateListicleContent(topic, numItems = 10, targetLength = 1e3) {
  try {
    numItems = Math.max(5, Math.min(20, numItems));
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional content writer creating viral listicles for a website called yourbuzzfeed.
          Create an engaging, shareable listicle with exactly ${numItems} items.
          
          FORMAT REQUIREMENTS (VERY IMPORTANT):
          - Begin with an attention-grabbing introduction paragraph (<p> tag)
          - The title must include the number of items (e.g., "${numItems} Shocking Ways..." or "${numItems} Incredible Facts...")
          - Format each list item with: 
             * <h2> heading with item number (e.g., "<h2>1. Interesting Item Title</h2>")
             * Bold intro sentence using <p><strong>Start with an interesting fact or hook.</strong> Then continue...</p>
             * Each list item should have 2-3 paragraphs of engaging content
             * At least 3 items should include a bulleted list (<ul> with <li> items)
             * Add <blockquote> elements for interesting quotes or facts
          - Insert a <div class="ad-break"></div> tag after every 3 list items for ad placement
          - Add a compelling conclusion paragraph at the end
          - Keep paragraphs short (3-4 sentences maximum)
          - Include an occasional <figure> with <figcaption> for image placeholders
          - Total word count should be approximately ${targetLength} words
          
          Output must be in this JSON format: { 
            "title": "catchy title with the number ${numItems} in it", 
            "content": "full HTML content with numbered list items", 
            "excerpt": "compelling 1-2 sentence excerpt that teases the most interesting items" 
          }`
        },
        {
          role: "user",
          content: `Create a viral, shareable listicle with ${numItems} items about: ${topic}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    return {
      title: result.title || `${numItems} Amazing Facts About ${topic}`,
      content: result.content || `<p>Content could not be generated</p>`,
      excerpt: result.excerpt || `Discover these ${numItems} incredible facts about ${topic}!`
    };
  } catch (error) {
    console.error("Error generating listicle content:", error);
    throw new Error("Failed to generate listicle content");
  }
}
async function batchGenerateContent(count = 10, listiclePercentage = 40) {
  try {
    console.log(`OpenAI batchGenerateContent called with count=${count}, listiclePercentage=${listiclePercentage}`);
    console.log("Calling OpenAI to get topic suggestions");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a viral content strategist for yourbuzzfeed. Generate a diverse set of ${count} content topics.
          Each topic should include:
          1. A topic name
          2. A category it belongs to (Health, Finance, Technology, Celebrity, Travel, or Home)
          3. Whether it should be a regular article or listicle format
          
          Format your response as a JSON array of objects with these properties: 
          {
            "topic": "Compelling topic", 
            "category": "one of the categories mentioned", 
            "contentType": "article | listicle"
          }`
        },
        {
          role: "user",
          content: `Generate ${count} viral content topics for batch creation. 
          Approximately ${listiclePercentage}% should be listicles.
          The topics should be diverse and cover different categories (Health, Finance, Tech, Celebrity, Travel, Home)`
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });
    const topicsContent = response.choices[0].message.content || '{"topics":[]}';
    console.log("Raw OpenAI response for topics:", topicsContent);
    let topicsResult;
    try {
      topicsResult = JSON.parse(topicsContent);
      console.log("Parsed topics result:", JSON.stringify(topicsResult));
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Attempting to fix malformed JSON response...");
      if (topicsContent.includes('"topic":') && topicsContent.includes('"category":')) {
        try {
          if (topicsContent.trim().startsWith("{") && !topicsContent.includes('"topics":')) {
            const singleTopic = JSON.parse(topicsContent);
            topicsResult = { topics: [singleTopic] };
            console.log("Fixed single topic response:", JSON.stringify(topicsResult));
          } else {
            topicsResult = { topics: [JSON.parse(topicsContent)] };
            console.log("Created topics array from response:", JSON.stringify(topicsResult));
          }
        } catch (fallbackError) {
          console.error("Failed to fix JSON response:", fallbackError);
          topicsResult = { topics: [] };
        }
      } else {
        topicsResult = { topics: [] };
      }
    }
    const topics = Array.isArray(topicsResult.topics) ? topicsResult.topics : topicsResult.topic ? [topicsResult] : [];
    console.log(`Got ${topics.length} topics from OpenAI`);
    const limitedTopics = topics.length > 2 ? topics.slice(0, 2) : topics;
    console.log("Working with topics for testing:", JSON.stringify(limitedTopics));
    console.log("Generating content for each topic...");
    const results = await Promise.all(
      limitedTopics.map(async (topicInfo) => {
        try {
          console.log(`Generating content for topic: "${topicInfo.topic}" (${topicInfo.contentType})`);
          let generatedContent;
          if (topicInfo.contentType === "listicle") {
            const numItems = Math.floor(Math.random() * 9) + 7;
            console.log(`Generating listicle with ${numItems} items`);
            generatedContent = await generateListicleContent(topicInfo.topic, numItems);
          } else {
            console.log("Generating regular article");
            generatedContent = await generateArticleContent(topicInfo.topic);
          }
          console.log(`Successfully generated content for "${topicInfo.topic}"`);
          return {
            ...generatedContent,
            contentType: topicInfo.contentType,
            category: topicInfo.category
          };
        } catch (error) {
          console.error(`Error generating content for topic "${topicInfo.topic}":`, error);
          return null;
        }
      })
    );
    const filteredResults = results.filter((item) => item !== null);
    console.log(`Successfully generated ${filteredResults.length} content items out of ${limitedTopics.length} topics`);
    return filteredResults;
  } catch (error) {
    console.error("Error in batch content generation:", error);
    throw new Error("Failed to generate batch content");
  }
}

// server/services/unsplash.ts
async function searchUnsplashImages(query, page = 1, perPage = 10) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || "";
    if (!accessKey) {
      throw new Error("Unsplash API key is not configured");
    }
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Client-ID ${accessKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error searching Unsplash images:", error);
    throw new Error("Failed to search for images");
  }
}
async function getRandomImage(query) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || "";
    if (!accessKey) {
      throw new Error("Unsplash API key is not configured");
    }
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Client-ID ${accessKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error getting random Unsplash image:", error);
    return null;
  }
}

// server/services/newsScraper.ts
import axios from "axios";
import * as cheerio from "cheerio";
import * as cron from "node-cron";

// client/src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function slugify(text2) {
  return text2.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-");
}

// server/services/newsScraper.ts
var NEWS_SOURCES = [
  {
    name: "Reuters",
    url: "https://www.reuters.com/world/",
    selector: "a.text__headline",
    titleSelector: "",
    baseUrl: "https://www.reuters.com"
  },
  {
    name: "AP News",
    url: "https://apnews.com/hub/trending-news",
    selector: ".PageList-items-item a",
    titleSelector: ".CardHeadline-title",
    baseUrl: ""
  },
  {
    name: "NPR",
    url: "https://www.npr.org/sections/news/",
    selector: "h2.title a",
    titleSelector: "",
    baseUrl: ""
  }
];
var NEWS_CATEGORIES = {
  "politics": "News",
  "world": "News",
  "business": "News",
  "technology": "Technology",
  "science": "Health",
  "health": "Health",
  "sports": "Entertainment",
  "entertainment": "Entertainment"
};
async function fetchHeadlines(source) {
  try {
    console.log(`Fetching headlines from ${source.name}...`);
    const response = await axios.get(source.url);
    const html = response.data;
    const $ = cheerio.load(html);
    const headlines = [];
    $(source.selector).each((i, element) => {
      let title;
      let url;
      if (source.titleSelector) {
        title = $(element).find(source.titleSelector).text().trim();
      } else {
        title = $(element).text().trim();
      }
      url = $(element).attr("href");
      if (url && url.startsWith("/")) {
        url = source.baseUrl + url;
      }
      if (title && url && title.length > 10) {
        headlines.push({ title, url });
      }
    });
    console.log(`Found ${headlines.length} headlines from ${source.name}`);
    return headlines.slice(0, 5);
  } catch (error) {
    console.error(`Error fetching headlines from ${source.name}:`, error);
    return [];
  }
}
function determineCategory(headline) {
  headline = headline.toLowerCase();
  for (const [keyword, category] of Object.entries(NEWS_CATEGORIES)) {
    if (headline.includes(keyword)) {
      return category;
    }
  }
  return "News";
}
async function generateNewsArticle(headline) {
  try {
    console.log(`Generating article for headline: "${headline.title}"`);
    const categoryName = determineCategory(headline.title);
    const prompt = `Write a detailed news article based on this headline: "${headline.title}". 
    
    FORMAT REQUIREMENTS (VERY IMPORTANT):
    - Structure the article with a clear introduction, body, and conclusion
    - Start with an attention-grabbing intro paragraph using <p> tags
    - Use 4-5 informative subheadings (<h2> tags) to organize the content
    - Include <strong> tags for emphasis on key statistics or important facts
    - Add <blockquote> elements for analysis or expert opinions
    - Include at least one bulleted list (<ul> with <li> items) for key points
    - Insert a <div class="ad-break"></div> tag after every 2-3 paragraphs for ad placement
    - Keep paragraphs short (3-4 sentences maximum)
    - End with a conclusion paragraph summarizing the key implications
    
    The article should be factual, informative, and read like a professional news piece.
    Include contextual background and analysis. Don't make up specific quotes or statistics
    unless they are common knowledge.`;
    const { title, content, excerpt } = await generateArticleContent(prompt, 800);
    return {
      title,
      content,
      excerpt,
      categoryName
    };
  } catch (error) {
    console.error(`Error generating article for "${headline.title}":`, error);
    throw error;
  }
}
async function scrapeAndGenerateNews() {
  try {
    console.log("Starting news scraping process...");
    const allHeadlinesPromises = NEWS_SOURCES.map((source) => fetchHeadlines(source));
    const allHeadlinesArrays = await Promise.all(allHeadlinesPromises);
    let allHeadlines = allHeadlinesArrays.flat();
    allHeadlines = allHeadlines.sort(() => Math.random() - 0.5);
    const limitedHeadlines = allHeadlines.slice(0, 5);
    console.log(`Selected ${limitedHeadlines.length} headlines for article generation`);
    const createdArticles = [];
    for (const headline of limitedHeadlines) {
      try {
        const { title, content, excerpt, categoryName } = await generateNewsArticle(headline);
        const categorySlug = slugify(categoryName);
        let category = await storage.getCategoryBySlug(categorySlug);
        if (!category) {
          console.log(`Category ${categoryName} not found, using News category`);
          category = await storage.getCategoryBySlug("news");
        }
        const imageKeywords = `${categoryName} ${title.split(" ").slice(0, 4).join(" ")}`;
        console.log(`News article image search using keywords: "${imageKeywords}"`);
        const image = await getRandomImage(imageKeywords);
        const slug = slugify(title);
        const articleData = {
          title,
          slug,
          content,
          excerpt,
          featuredImage: image?.urls.regular || "",
          categoryId: category?.id,
          authorId: 1,
          // Default author (admin)
          isPublished: true,
          isFeatured: true,
          // Featured news articles
          contentType: "article",
          readTime: Math.ceil(content.length / 400)
        };
        const article = await storage.createArticle(articleData);
        createdArticles.push(article);
        console.log(`Created news article: "${title}"`);
      } catch (error) {
        console.error(`Error creating article for headline "${headline.title}":`, error);
      }
    }
    console.log(`Successfully created ${createdArticles.length} news articles`);
    return createdArticles.length;
  } catch (error) {
    console.error("Error in news scraping process:", error);
    return 0;
  }
}
function scheduleNewsScraping() {
  console.log("Scheduling news scraping to run every 4 hours");
  setTimeout(() => {
    scrapeAndGenerateNews().then((count) => {
      console.log(`Initial news scraping complete. Created ${count} articles.`);
    });
  }, 6e4);
  cron.schedule("0 */4 * * *", async () => {
    console.log("Running scheduled news scraping...");
    const count = await scrapeAndGenerateNews();
    console.log(`Scheduled news scraping complete. Created ${count} articles.`);
  });
}

// server/services/entertainment.ts
var ENTERTAINMENT_TOPICS = [
  "celebrity gossip",
  "movie reviews",
  "television shows",
  "music releases",
  "celebrity fashion",
  "entertainment awards",
  "streaming platforms",
  "viral videos",
  "celebrity interviews",
  "box office results"
];
var ENTERTAINMENT_LISTICLES = [
  "Top 10 Celebrity Fashion Moments This Month",
  "12 Most Anticipated Movies Coming This Year",
  "7 TV Shows You Need to Watch Right Now",
  "15 Celebrity Couples Who Called It Quits",
  "8 Music Videos That Broke the Internet",
  "10 Most Shocking Celebrity Transformations",
  "6 Rising Stars to Watch This Year",
  "9 Celebrity Social Media Moments That Went Viral",
  "11 Biggest Entertainment Scandals of the Year",
  "7 Upcoming Album Releases You Can't Miss"
];
async function generateEntertainmentArticle() {
  try {
    console.log("Generating entertainment article");
    const topic = ENTERTAINMENT_TOPICS[Math.floor(Math.random() * ENTERTAINMENT_TOPICS.length)];
    const prompt = `Write an engaging entertainment article about ${topic}. 
    Focus on recent events, trends, or news. Make it feel current and relevant.
    The tone should be light, entertaining, and gossip-like. Include interesting facts or 
    industry insights where appropriate.`;
    const { title, content, excerpt } = await generateArticleContent(prompt, 800);
    let category = await storage.getCategoryBySlug("entertainment");
    if (!category) {
      console.log("Entertainment category not found, using default category");
      category = await storage.getCategoryBySlug("celebrity");
    }
    const imageKeywords = `entertainment ${topic} ${title.split(" ").slice(0, 3).join(" ")}`;
    console.log(`Entertainment article image search using keywords: "${imageKeywords}"`);
    const image = await getRandomImage(imageKeywords);
    const slug = slugify(title);
    const articleData = {
      title,
      slug,
      content,
      excerpt,
      featuredImage: image?.urls.regular || "",
      categoryId: category?.id,
      authorId: 1,
      // Default author (admin)
      isPublished: true,
      isFeatured: Math.random() > 0.8,
      // 20% chance to be featured
      contentType: "article",
      readTime: Math.ceil(content.length / 400)
    };
    const article = await storage.createArticle(articleData);
    console.log(`Created entertainment article: "${title}"`);
    return article.id;
  } catch (error) {
    console.error("Error generating entertainment article:", error);
    return null;
  }
}
async function generateEntertainmentListicle() {
  try {
    console.log("Generating entertainment listicle");
    const topic = ENTERTAINMENT_LISTICLES[Math.floor(Math.random() * ENTERTAINMENT_LISTICLES.length)];
    const numItemsMatch = topic.match(/^\d+/);
    const numItems = numItemsMatch ? parseInt(numItemsMatch[0]) : Math.floor(Math.random() * 5) + 7;
    const { title, content, excerpt } = await generateListicleContent(topic, numItems);
    let category = await storage.getCategoryBySlug("entertainment");
    if (!category) {
      console.log("Entertainment category not found, using default category");
      category = await storage.getCategoryBySlug("celebrity");
    }
    const imageKeywords = `entertainment ${topic.split(" ").slice(0, 3).join(" ")}`;
    console.log(`Entertainment listicle image search using keywords: "${imageKeywords}"`);
    const image = await getRandomImage(imageKeywords);
    const slug = slugify(title);
    const articleData = {
      title,
      slug,
      content,
      excerpt,
      featuredImage: image?.urls.regular || "",
      categoryId: category?.id,
      authorId: 1,
      // Default author (admin)
      isPublished: true,
      isFeatured: Math.random() > 0.7,
      // 30% chance to be featured
      contentType: "listicle",
      readTime: Math.ceil(content.length / 600)
    };
    const article = await storage.createArticle(articleData);
    console.log(`Created entertainment listicle: "${title}"`);
    return article.id;
  } catch (error) {
    console.error("Error generating entertainment listicle:", error);
    return null;
  }
}
async function generateEntertainmentBatch(count = 5, listiclePercentage = 60) {
  try {
    console.log(`Generating batch of ${count} entertainment content pieces (${listiclePercentage}% listicles)`);
    const createdIds = [];
    for (let i = 0; i < count; i++) {
      try {
        const isListicle = Math.random() * 100 < listiclePercentage;
        if (isListicle) {
          const id = await generateEntertainmentListicle();
          if (id) createdIds.push(id);
        } else {
          const id = await generateEntertainmentArticle();
          if (id) createdIds.push(id);
        }
      } catch (error) {
        console.error(`Error generating entertainment content piece ${i + 1}/${count}:`, error);
      }
    }
    console.log(`Successfully created ${createdIds.length}/${count} entertainment content pieces`);
    return createdIds;
  } catch (error) {
    console.error("Error in entertainment batch generation:", error);
    return [];
  }
}

// server/auth.ts
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";
var MemStore = MemoryStore(session);
var sessionStore = new MemStore({
  checkPeriod: 864e5
  // Prune expired entries every 24h
});
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    if (!hashedPassword.includes(".")) {
      console.error("Invalid password format");
      return false;
    }
    const [hashedPart, salt] = hashedPassword.split(".");
    if (!hashedPart || !salt) {
      console.error("Missing parts in password hash");
      return false;
    }
    const hashedBuf = Buffer.from(hashedPart, "hex");
    const suppliedBuf = await scryptAsync(plainPassword, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}
function setupAuth(app2) {
  app2.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 864e5,
        // 24 hours
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      }
    })
  );
  app2.post("/api/login", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const passwordValid = await verifyPassword(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
  app2.get("/api/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/admin-setup", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const existingAdmin = await storage.getUserByUsername("admin");
      if (existingAdmin) {
        const hashedPassword2 = await hashPassword("admin123");
        await storage.updateUser(existingAdmin.id, { password: hashedPassword2 });
        return res.json({
          message: "Admin user password reset successfully",
          username: "admin",
          password: "admin123"
        });
      }
      const hashedPassword = await hashPassword("admin123");
      const admin = await storage.createUser({
        username: "admin",
        password: hashedPassword,
        fullName: "Administrator",
        email: "admin@yourbuzzfeed.com",
        isAdmin: true
      });
      res.json({
        message: "Admin user created successfully",
        username: "admin",
        password: "admin123"
      });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// server/routes.ts
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });
  app2.get("/api/categories/:slug/articles", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const articles2 = await storage.getArticlesByCategorySlug(req.params.slug, limit);
      res.json(articles2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles by category" });
    }
  });
  app2.get("/api/articles", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const articles2 = await storage.getArticles(limit, offset);
      res.json(articles2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });
  app2.get("/api/articles/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 1;
      const articles2 = await storage.getFeaturedArticles(limit);
      res.json(articles2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured articles" });
    }
  });
  app2.get("/api/articles/popular", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const articles2 = await storage.getPopularArticles(limit);
      res.json(articles2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular articles" });
    }
  });
  app2.get("/api/articles/:slug", async (req, res) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      await storage.incrementArticleViews(article.id);
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });
  app2.post("/api/articles/:id/share", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getUser(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      await storage.incrementArticleShares(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to share article" });
    }
  });
  app2.get("/api/articles/:id/related", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit) : 3;
      const articles2 = await storage.getRelatedArticles(id, limit);
      res.json(articles2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch related articles" });
    }
  });
  app2.get("/api/tags", async (req, res) => {
    try {
      const tags2 = await storage.getTags();
      res.json(tags2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });
  app2.get("/api/tags/:slug/articles", async (req, res) => {
    try {
      const articles2 = await storage.getArticlesByTagSlug(req.params.slug);
      res.json(articles2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles by tag" });
    }
  });
  app2.post("/api/admin/articles", async (req, res) => {
    try {
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create article" });
    }
  });
  app2.patch("/api/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      const updateData = req.body;
      const updatedArticle = await storage.updateArticle(id, updateData);
      res.json(updatedArticle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update article" });
    }
  });
  app2.delete("/api/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      await storage.deleteArticle(id);
      res.json({ success: true, message: "Article deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article" });
    }
  });
  app2.post("/api/articles/bulk-delete", isAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid article IDs" });
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            await storage.deleteArticle(id);
            return { id, success: true };
          } catch (error) {
            console.error(`Error deleting article ${id}:`, error);
            return { id, success: false, error: "Failed to delete" };
          }
        })
      );
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      res.json({
        message: `Deleted ${successful} articles${failed > 0 ? `, failed to delete ${failed} articles` : ""}`,
        successful,
        failed,
        results
      });
    } catch (error) {
      console.error("Error in bulk delete:", error);
      res.status(500).json({ message: "Failed to perform bulk delete operation" });
    }
  });
  app2.post("/api/admin/categories", isAuthenticated, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  app2.post("/api/ai/generate-content", isAuthenticated, async (req, res) => {
    try {
      const { topic, targetLength } = req.body;
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      const articleContent = await generateArticleContent(
        topic,
        targetLength || 800
      );
      res.json(articleContent);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });
  app2.post("/api/ai/generate-ideas", isAuthenticated, async (req, res) => {
    try {
      const { category, count } = req.body;
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }
      const ideas = await generateArticleIdeas(category, count || 5);
      res.json({ ideas });
    } catch (error) {
      console.error("Error generating ideas:", error);
      res.status(500).json({ message: "Failed to generate article ideas" });
    }
  });
  app2.get("/api/ai/test-connection", async (req, res) => {
    try {
      const testIdea = await generateArticleIdeas("Technology", 1);
      res.json({
        success: true,
        message: "OpenAI connection is working correctly!",
        sample: testIdea[0]
      });
    } catch (error) {
      console.error("Error testing OpenAI connection:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect to OpenAI API",
        error: error.message || "Unknown error"
      });
    }
  });
  app2.post("/api/ai/create-test-article", async (req, res) => {
    try {
      const article = await storage.createArticle({
        title: "Test Article",
        slug: "test-article-" + Date.now(),
        content: "<p>This is a test article content.</p>",
        excerpt: "Test excerpt",
        featuredImage: "https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d",
        categoryId: 1,
        // Health category
        authorId: 1,
        // Admin user
        isPublished: true,
        isFeatured: false,
        contentType: "article",
        readTime: 2
      });
      res.status(201).json({
        success: true,
        article,
        message: "Test article created successfully"
      });
    } catch (error) {
      console.error("Error creating test article:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create test article",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/images/search", isAuthenticated, async (req, res) => {
    try {
      const { query, page, perPage } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const images = await searchUnsplashImages(
        query,
        page ? parseInt(page) : 1,
        perPage ? parseInt(perPage) : 10
      );
      res.json({ images });
    } catch (error) {
      console.error("Error searching images:", error);
      res.status(500).json({ message: "Failed to search for images" });
    }
  });
  app2.get("/api/images/random", isAuthenticated, async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const image = await getRandomImage(query);
      if (!image) {
        return res.status(404).json({ message: "No image found" });
      }
      res.json({ image });
    } catch (error) {
      console.error("Error getting random image:", error);
      res.status(500).json({ message: "Failed to get random image" });
    }
  });
  app2.post("/api/ai/create-article", isAuthenticated, async (req, res) => {
    try {
      const {
        topic,
        categoryId,
        targetLength,
        imageKeyword
      } = req.body;
      if (!topic || !categoryId) {
        return res.status(400).json({
          message: "Topic and categoryId are required"
        });
      }
      const generatedContent = await generateArticleContent(
        topic,
        targetLength || 800
      );
      const imageSearchTerm = imageKeyword || topic;
      const image = await getRandomImage(imageSearchTerm);
      const slug = slugify(generatedContent.title);
      const articleData = {
        title: generatedContent.title,
        slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        featuredImage: image?.urls.regular || "",
        categoryId,
        authorId: 1,
        // Default author (admin)
        isPublished: true,
        isFeatured: false
      };
      const article = await storage.createArticle(articleData);
      res.status(201).json({
        article,
        message: "Article created successfully"
      });
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });
  app2.post("/api/ai/generate-listicle", isAuthenticated, async (req, res) => {
    try {
      const { topic, numItems, targetLength } = req.body;
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      const listicleContent = await generateListicleContent(
        topic,
        numItems || 10,
        targetLength || 1e3
      );
      res.json(listicleContent);
    } catch (error) {
      console.error("Error generating listicle content:", error);
      res.status(500).json({ message: "Failed to generate listicle content" });
    }
  });
  app2.post("/api/ai/create-listicle", isAuthenticated, async (req, res) => {
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
          message: "Topic and categoryId are required"
        });
      }
      const generatedContent = await generateListicleContent(
        topic,
        numItems || 10,
        targetLength || 1e3
      );
      const imageSearchTerm = imageKeyword || topic;
      const image = await getRandomImage(imageSearchTerm);
      const slug = slugify(generatedContent.title);
      const articleData = {
        title: generatedContent.title,
        slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        featuredImage: image?.urls.regular || "",
        categoryId,
        authorId: 1,
        // Default author (admin)
        isPublished: true,
        isFeatured: false,
        contentType: "listicle",
        readTime: Math.ceil(targetLength / 200)
        // Approximate read time
      };
      const article = await storage.createArticle(articleData);
      res.status(201).json({
        article,
        message: "Listicle created successfully"
      });
    } catch (error) {
      console.error("Error creating listicle:", error);
      res.status(500).json({ message: "Failed to create listicle" });
    }
  });
  app2.post("/api/ai/batch-generate", isAuthenticated, async (req, res) => {
    try {
      const { count, listiclePercentage } = req.body;
      console.log(`Starting batch generation with count=${count} and listiclePercentage=${listiclePercentage}`);
      const batchContent = await batchGenerateContent(
        count || 10,
        listiclePercentage || 40
      );
      console.log(`Received ${batchContent.length} content items from OpenAI`);
      const createdArticles = [];
      for (const content of batchContent) {
        try {
          console.log(`Processing article: "${content.title}" (${content.contentType})`);
          let categoryId = null;
          if (content.category) {
            const categorySlug = slugify(content.category);
            let category = await storage.getCategoryBySlug(categorySlug);
            if (!category) {
              console.log(`Creating new category: ${content.category}`);
              category = await storage.createCategory({
                name: content.category,
                slug: categorySlug,
                description: `Articles about ${content.category}`,
                color: "#0066CC",
                // Default color
                bgColor: "#E6F0FF"
                // Default background color
              });
            } else {
              console.log(`Using existing category: ${category.name} (id: ${category.id})`);
            }
            categoryId = category.id;
          } else {
            console.log("No category provided for this article");
          }
          const imageKeywords = `${content.category} ${content.title.split(" ").slice(0, 4).join(" ")}`;
          console.log(`Batch article image search using keywords: "${imageKeywords}"`);
          const image = await getRandomImage(imageKeywords);
          const slug = slugify(content.title);
          console.log("Preparing article data for database insertion");
          const articleData = {
            title: content.title,
            slug,
            content: content.content,
            excerpt: content.excerpt,
            featuredImage: image?.urls.regular || "",
            categoryId,
            authorId: 1,
            // Default author (admin)
            isPublished: true,
            isFeatured: false,
            contentType: content.contentType,
            readTime: content.contentType === "listicle" ? Math.ceil(content.content.length / 600) : Math.ceil(content.content.length / 400)
          };
          console.log("Article data prepared:", JSON.stringify({
            title: articleData.title,
            slug: articleData.slug,
            excerpt: articleData.excerpt.substring(0, 50) + "...",
            categoryId: articleData.categoryId,
            contentType: articleData.contentType
          }));
          console.log("Calling storage.createArticle()");
          const article = await storage.createArticle(articleData);
          console.log(`Article created successfully with ID: ${article.id}`);
          createdArticles.push(article);
        } catch (error) {
          console.error(`Error creating article "${content.title}":`, error);
        }
      }
      console.log(`Batch generation complete. Created ${createdArticles.length} articles`);
      res.status(201).json({
        success: true,
        count: createdArticles.length,
        message: `Successfully created ${createdArticles.length} articles`
      });
    } catch (error) {
      console.error("Error in batch content generation:", error);
      res.status(500).json({ message: "Failed to generate batch content" });
    }
  });
  app2.post("/api/news/scrape", isAuthenticated, async (req, res) => {
    try {
      console.log("Manual news scraping initiated");
      const articlesCreated = await scrapeAndGenerateNews();
      res.status(201).json({
        success: true,
        count: articlesCreated,
        message: `Successfully created ${articlesCreated} news articles`
      });
    } catch (error) {
      console.error("Error in manual news scraping:", error);
      res.status(500).json({ message: "Failed to scrape and generate news articles" });
    }
  });
  app2.post("/api/entertainment/generate", isAuthenticated, async (req, res) => {
    try {
      const { count, listiclePercentage } = req.body;
      console.log("Manual entertainment content generation initiated");
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
      console.error("Error in entertainment content generation:", error);
      res.status(500).json({ message: "Failed to generate entertainment content" });
    }
  });
  app2.post("/api/entertainment/generate-article", isAuthenticated, async (req, res) => {
    try {
      console.log("Generating single entertainment article");
      const articleId = await generateEntertainmentArticle();
      if (!articleId) {
        return res.status(500).json({ message: "Failed to generate entertainment article" });
      }
      res.status(201).json({
        success: true,
        articleId,
        message: "Successfully created entertainment article"
      });
    } catch (error) {
      console.error("Error generating entertainment article:", error);
      res.status(500).json({ message: "Failed to generate entertainment article" });
    }
  });
  app2.post("/api/entertainment/generate-listicle", isAuthenticated, async (req, res) => {
    try {
      console.log("Generating entertainment listicle");
      const articleId = await generateEntertainmentListicle();
      if (!articleId) {
        return res.status(500).json({ message: "Failed to generate entertainment listicle" });
      }
      res.status(201).json({
        success: true,
        articleId,
        message: "Successfully created entertainment listicle"
      });
    } catch (error) {
      console.error("Error generating entertainment listicle:", error);
      res.status(500).json({ message: "Failed to generate entertainment listicle" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
    scheduleNewsScraping();
    log("News scraping scheduler has been initialized");
  });
})();
