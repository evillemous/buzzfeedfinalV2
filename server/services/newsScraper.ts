/**
 * News scraper service to fetch headlines and generate articles
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as cron from 'node-cron';
import { generateArticleContent } from './openai';
import { slugify } from '../../client/src/lib/utils';
import { storage } from '../storage';
import { getRandomImage } from './unsplash';

// Sources to scrape news from
const NEWS_SOURCES = [
  {
    name: 'Reuters',
    url: 'https://www.reuters.com/world/',
    selector: 'a.text__headline',
    titleSelector: '',
    baseUrl: 'https://www.reuters.com'
  },
  {
    name: 'AP News',
    url: 'https://apnews.com/hub/trending-news',
    selector: '.PageList-items-item a',
    titleSelector: '.CardHeadline-title',
    baseUrl: ''
  },
  {
    name: 'NPR',
    url: 'https://www.npr.org/sections/news/',
    selector: 'h2.title a',
    titleSelector: '',
    baseUrl: ''
  }
];

// Categories for news
const NEWS_CATEGORIES = {
  'politics': 'News',
  'world': 'News',
  'business': 'News',
  'technology': 'Technology',
  'science': 'Health',
  'health': 'Health',
  'sports': 'Entertainment',
  'entertainment': 'Entertainment'
};

/**
 * Fetch headlines from a news source
 * @param source News source configuration
 * @returns Array of headline objects
 */
async function fetchHeadlines(source: typeof NEWS_SOURCES[0]): Promise<Array<{title: string, url: string}>> {
  try {
    console.log(`Fetching headlines from ${source.name}...`);
    
    // Fetch the HTML
    const response = await axios.get(source.url);
    const html = response.data;
    
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Extract headlines
    const headlines: Array<{title: string, url: string}> = [];
    
    $(source.selector).each((i: number, element: any) => {
      let title;
      let url;
      
      if (source.titleSelector) {
        title = $(element).find(source.titleSelector).text().trim();
      } else {
        title = $(element).text().trim();
      }
      
      url = $(element).attr('href');
      
      // Handle relative URLs
      if (url && url.startsWith('/')) {
        url = source.baseUrl + url;
      }
      
      // Only add valid headlines
      if (title && url && title.length > 10) {
        headlines.push({ title, url });
      }
    });
    
    console.log(`Found ${headlines.length} headlines from ${source.name}`);
    return headlines.slice(0, 5); // Limit to 5 headlines per source
    
  } catch (error) {
    console.error(`Error fetching headlines from ${source.name}:`, error);
    return [];
  }
}

/**
 * Determine the most likely category for a headline
 * @param headline The headline text
 * @returns Category name
 */
function determineCategory(headline: string): string {
  headline = headline.toLowerCase();
  
  for (const [keyword, category] of Object.entries(NEWS_CATEGORIES)) {
    if (headline.includes(keyword)) {
      return category;
    }
  }
  
  // Default to News
  return 'News';
}

/**
 * Generate article content based on a headline
 * @param headline The headline object
 * @returns Generated article content with metadata
 */
async function generateNewsArticle(headline: { title: string, url: string }): Promise<{
  title: string;
  content: string;
  excerpt: string;
  categoryName: string;
}> {
  try {
    console.log(`Generating article for headline: "${headline.title}"`);
    
    // Determine category
    const categoryName = determineCategory(headline.title);
    
    // Generate article content using OpenAI
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

/**
 * Main function to scrape news and generate articles
 */
export async function scrapeAndGenerateNews(): Promise<number> {
  try {
    console.log('Starting news scraping process...');
    
    // Fetch headlines from all sources
    const allHeadlinesPromises = NEWS_SOURCES.map(source => fetchHeadlines(source));
    const allHeadlinesArrays = await Promise.all(allHeadlinesPromises);
    
    // Combine all headlines and shuffle them
    let allHeadlines = allHeadlinesArrays.flat();
    
    // Shuffle the headlines to mix sources
    allHeadlines = allHeadlines.sort(() => Math.random() - 0.5);
    
    // Limit to 5 headlines total to avoid generating too many articles at once
    const limitedHeadlines = allHeadlines.slice(0, 5);
    
    console.log(`Selected ${limitedHeadlines.length} headlines for article generation`);
    
    // Generate articles for each headline
    const createdArticles = [];
    
    for (const headline of limitedHeadlines) {
      try {
        // Generate article content
        const { title, content, excerpt, categoryName } = await generateNewsArticle(headline);
        
        // Find category ID
        const categorySlug = slugify(categoryName);
        let category = await storage.getCategoryBySlug(categorySlug);
        
        if (!category) {
          console.log(`Category ${categoryName} not found, using News category`);
          category = await storage.getCategoryBySlug('news');
        }
        
        // Generate a better image search query based on article context
        const imageKeywords = `${categoryName} ${title.split(' ').slice(0, 4).join(' ')}`;
        console.log(`News article image search using keywords: "${imageKeywords}"`);
        
        // Get an image for the article
        const image = await getRandomImage(imageKeywords);
        
        // Create slug
        const slug = slugify(title);
        
        // Create the article
        const articleData = {
          title,
          slug,
          content,
          excerpt,
          featuredImage: image?.urls.regular || '',
          categoryId: category?.id,
          authorId: 1, // Default author (admin)
          isPublished: true,
          isFeatured: true, // Featured news articles
          contentType: 'article',
          readTime: Math.ceil(content.length / 400)
        };
        
        const article = await storage.createArticle(articleData);
        createdArticles.push(article);
        
        console.log(`Created news article: "${title}"`);
      } catch (error) {
        console.error(`Error creating article for headline "${headline.title}":`, error);
        // Continue with the next headline
      }
    }
    
    console.log(`Successfully created ${createdArticles.length} news articles`);
    return createdArticles.length;
  } catch (error) {
    console.error('Error in news scraping process:', error);
    return 0;
  }
}

// Schedule news scraping every 4 hours
export function scheduleNewsScraping() {
  console.log('Scheduling news scraping to run every 4 hours');
  
  // Run immediately on startup
  setTimeout(() => {
    scrapeAndGenerateNews().then(count => {
      console.log(`Initial news scraping complete. Created ${count} articles.`);
    });
  }, 60000); // Wait 1 minute after server startup
  
  // Schedule to run every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('Running scheduled news scraping...');
    const count = await scrapeAndGenerateNews();
    console.log(`Scheduled news scraping complete. Created ${count} articles.`);
  });
}