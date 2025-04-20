/**
 * Entertainment content generation service
 */

import { generateArticleContent, generateListicleContent } from './openai';
import { storage } from '../storage';
import { getRandomImage } from './unsplash';
import { slugify } from '../../client/src/lib/utils';

// Entertainment topics
const ENTERTAINMENT_TOPICS = [
  'celebrity gossip',
  'movie reviews',
  'television shows',
  'music releases',
  'celebrity fashion',
  'entertainment awards',
  'streaming platforms',
  'viral videos',
  'celebrity interviews',
  'box office results'
];

// Entertainment listicle ideas
const ENTERTAINMENT_LISTICLES = [
  'Top 10 Celebrity Fashion Moments This Month',
  '12 Most Anticipated Movies Coming This Year',
  '7 TV Shows You Need to Watch Right Now',
  '15 Celebrity Couples Who Called It Quits',
  '8 Music Videos That Broke the Internet',
  '10 Most Shocking Celebrity Transformations',
  '6 Rising Stars to Watch This Year',
  '9 Celebrity Social Media Moments That Went Viral',
  '11 Biggest Entertainment Scandals of the Year',
  '7 Upcoming Album Releases You Can\'t Miss'
];

/**
 * Generate a random entertainment article
 * @returns The created article ID
 */
export async function generateEntertainmentArticle(): Promise<number | null> {
  try {
    console.log('Generating entertainment article');
    
    // Randomly choose a topic
    const topic = ENTERTAINMENT_TOPICS[Math.floor(Math.random() * ENTERTAINMENT_TOPICS.length)];
    
    // Generate content using OpenAI
    const prompt = `Write an engaging entertainment article about ${topic}. 
    Focus on recent events, trends, or news. Make it feel current and relevant.
    The tone should be light, entertaining, and gossip-like. Include interesting facts or 
    industry insights where appropriate.`;
    
    const { title, content, excerpt } = await generateArticleContent(prompt, 800);
    
    // Get Entertainment category
    let category = await storage.getCategoryBySlug('entertainment');
    if (!category) {
      console.log('Entertainment category not found, using default category');
      category = await storage.getCategoryBySlug('celebrity');
    }
    
    // Generate a better image search query based on article context
    const imageKeywords = `entertainment ${topic} ${title.split(' ').slice(0, 3).join(' ')}`;
    console.log(`Entertainment article image search using keywords: "${imageKeywords}"`);
    
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
      isFeatured: Math.random() > 0.8, // 20% chance to be featured
      contentType: 'article',
      readTime: Math.ceil(content.length / 400)
    };
    
    const article = await storage.createArticle(articleData);
    console.log(`Created entertainment article: "${title}"`);
    
    return article.id;
  } catch (error) {
    console.error('Error generating entertainment article:', error);
    return null;
  }
}

/**
 * Generate an entertainment listicle
 * @returns The created article ID
 */
export async function generateEntertainmentListicle(): Promise<number | null> {
  try {
    console.log('Generating entertainment listicle');
    
    // Randomly choose a listicle idea
    const topic = ENTERTAINMENT_LISTICLES[Math.floor(Math.random() * ENTERTAINMENT_LISTICLES.length)];
    
    // Determine number of items from the topic title
    const numItemsMatch = topic.match(/^\d+/);
    const numItems = numItemsMatch ? parseInt(numItemsMatch[0]) : Math.floor(Math.random() * 5) + 7;
    
    // Generate listicle using OpenAI
    const { title, content, excerpt } = await generateListicleContent(topic, numItems);
    
    // Get Entertainment category
    let category = await storage.getCategoryBySlug('entertainment');
    if (!category) {
      console.log('Entertainment category not found, using default category');
      category = await storage.getCategoryBySlug('celebrity');
    }
    
    // Generate a better image search query based on article context
    const imageKeywords = `entertainment ${topic.split(' ').slice(0, 3).join(' ')}`;
    console.log(`Entertainment listicle image search using keywords: "${imageKeywords}"`);
    
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
      isFeatured: Math.random() > 0.7, // 30% chance to be featured
      contentType: 'listicle',
      readTime: Math.ceil(content.length / 600)
    };
    
    const article = await storage.createArticle(articleData);
    console.log(`Created entertainment listicle: "${title}"`);
    
    return article.id;
  } catch (error) {
    console.error('Error generating entertainment listicle:', error);
    return null;
  }
}

/**
 * Generate a batch of entertainment content (mix of articles and listicles)
 * @param count Number of entertainment content pieces to generate
 * @param listiclePercentage Percentage of content that should be listicles (0-100)
 * @returns Array of created article IDs
 */
export async function generateEntertainmentBatch(
  count: number = 5,
  listiclePercentage: number = 60
): Promise<number[]> {
  try {
    console.log(`Generating batch of ${count} entertainment content pieces (${listiclePercentage}% listicles)`);
    
    const createdIds: number[] = [];
    
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
        console.error(`Error generating entertainment content piece ${i+1}/${count}:`, error);
        // Continue with the next one even if this one fails
      }
    }
    
    console.log(`Successfully created ${createdIds.length}/${count} entertainment content pieces`);
    return createdIds;
  } catch (error) {
    console.error('Error in entertainment batch generation:', error);
    return [];
  }
}