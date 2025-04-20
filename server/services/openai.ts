import OpenAI from "openai";

// Initialize OpenAI client with API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '' 
});

// Content types
export type ContentType = 'article' | 'listicle';

/**
 * Generate article content using OpenAI
 * 
 * @param topic The topic to generate content about
 * @param targetLength Target word count for the article
 * @returns Generated article content with HTML formatting
 */
export async function generateArticleContent(topic: string, targetLength: number = 800): Promise<{ 
  title: string;
  content: string;
  excerpt: string;
}> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional content writer creating articles for a viral news website called yourbuzzfeed.
          Create engaging, click-worthy content that will make readers want to share the article.
          Format the response as HTML with proper paragraph (<p>), heading (<h2>, <h3>), and list (<ul>, <li>) tags.
          Write approximately ${targetLength} words.
          Include 4-6 subheadings to break up the content.
          The article should be optimized for AdSense placement with good paragraph breaks.
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

    // Parse the JSON response
    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      title: result.title || 'Generated Article',
      content: result.content || '<p>Content could not be generated</p>',
      excerpt: result.excerpt || 'Generated excerpt'
    };
  } catch (error) {
    console.error('Error generating article content:', error);
    throw new Error('Failed to generate article content');
  }
}

/**
 * Generate article ideas based on a category or trend
 * 
 * @param category Category or trend to generate ideas for
 * @param count Number of ideas to generate
 * @returns Array of article ideas
 */
export async function generateArticleIdeas(category: string, count: number = 5): Promise<string[]> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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

    // Parse the JSON response
    const content = response.choices[0].message.content || '{"ideas":[]}';
    const result = JSON.parse(content);
    return result.ideas || [];
  } catch (error) {
    console.error('Error generating article ideas:', error);
    throw new Error('Failed to generate article ideas');
  }
}

/**
 * Generate listicle content using OpenAI
 * 
 * @param topic The list topic to generate
 * @param numItems Number of items in the list (5-20)
 * @param targetLength Target word count for the listicle
 * @returns Generated listicle content with HTML formatting
 */
export async function generateListicleContent(
  topic: string, 
  numItems: number = 10, 
  targetLength: number = 1000
): Promise<{ 
  title: string;
  content: string;
  excerpt: string;
}> {
  try {
    // Ensure number of items is within reasonable bounds
    numItems = Math.max(5, Math.min(20, numItems));
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional content writer creating viral listicles for a website called yourbuzzfeed.
          Create an engaging, shareable listicle with exactly ${numItems} items.
          The title should be catchy and include the number of items (e.g., "10 Shocking Ways..." or "${numItems} Incredible Facts...").
          Format the response as HTML with:
          - Each list item should have an <h2> heading with the item number, e.g., "<h2>1. Item Title</h2>"
          - Each item should have 1-3 paragraphs of engaging content
          - Add occasional <img> placeholder tags with alt text but empty src (will be replaced later)
          - Write approximately ${targetLength} words total
          - The listicle should be optimized for AdSense placement with good paragraph breaks
          
          Output must be in this JSON format: { 
            "title": "catchy title with the number ${numItems} in it", 
            "content": "full HTML content with numbered list items", 
            "excerpt": "compelling 1-2 sentence excerpt that teases the content" 
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

    // Parse the JSON response
    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      title: result.title || `${numItems} Amazing Facts About ${topic}`,
      content: result.content || `<p>Content could not be generated</p>`,
      excerpt: result.excerpt || `Discover these ${numItems} incredible facts about ${topic}!`
    };
  } catch (error) {
    console.error('Error generating listicle content:', error);
    throw new Error('Failed to generate listicle content');
  }
}

/**
 * Generate multiple articles in batch across different categories
 * 
 * @param count Number of articles to generate
 * @param listiclePercentage Percentage of content that should be listicles (0-100)
 * @returns Array of generated content
 */
export async function batchGenerateContent(
  count: number = 10,
  listiclePercentage: number = 40
): Promise<Array<{
  title: string;
  content: string;
  excerpt: string;
  contentType: ContentType;
  category?: string;
}>> {
  try {
    console.log(`OpenAI batchGenerateContent called with count=${count}, listiclePercentage=${listiclePercentage}`);
    
    // Get topic suggestions for batch generation
    console.log('Calling OpenAI to get topic suggestions');
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

    // Parse the topics response
    const topicsContent = response.choices[0].message.content || '{"topics":[]}';
    console.log('Raw OpenAI response for topics:', topicsContent);
    
    // Fix potential JSON issues by ensuring we have a valid topics array
    let topicsResult;
    try {
      topicsResult = JSON.parse(topicsContent);
      console.log('Parsed topics result:', JSON.stringify(topicsResult));
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Attempting to fix malformed JSON response...');
      
      // Try to extract an array from the response if it's not valid JSON
      if (topicsContent.includes('"topic":') && topicsContent.includes('"category":')) {
        try {
          // If it looks like a single object without an array wrapper
          if (topicsContent.trim().startsWith('{') && !topicsContent.includes('"topics":')) {
            const singleTopic = JSON.parse(topicsContent);
            topicsResult = { topics: [singleTopic] };
            console.log('Fixed single topic response:', JSON.stringify(topicsResult));
          } else {
            // Try to create a simple wrapper if we have topic objects
            topicsResult = { topics: [JSON.parse(topicsContent)] };
            console.log('Created topics array from response:', JSON.stringify(topicsResult));
          }
        } catch (fallbackError) {
          console.error('Failed to fix JSON response:', fallbackError);
          topicsResult = { topics: [] };
        }
      } else {
        topicsResult = { topics: [] };
      }
    }
    
    // Extract topics, ensuring we always have an array
    const topics = Array.isArray(topicsResult.topics) ? topicsResult.topics : 
                  (topicsResult.topic ? [topicsResult] : []);
    console.log(`Got ${topics.length} topics from OpenAI`);
    
    // For actual testing, let's reduce the number of topics to 2 or use all if less than 2
    const limitedTopics = topics.length > 2 ? topics.slice(0, 2) : topics;
    console.log('Working with topics for testing:', JSON.stringify(limitedTopics));
    
    // Generate content for each topic
    console.log('Generating content for each topic...');
    const results = await Promise.all(
      limitedTopics.map(async (topicInfo: { topic: string; category: string; contentType: ContentType }) => {
        try {
          console.log(`Generating content for topic: "${topicInfo.topic}" (${topicInfo.contentType})`);
          let generatedContent;
          
          if (topicInfo.contentType === 'listicle') {
            // Random number of items between 7 and 15
            const numItems = Math.floor(Math.random() * 9) + 7;
            console.log(`Generating listicle with ${numItems} items`);
            generatedContent = await generateListicleContent(topicInfo.topic, numItems);
          } else {
            console.log('Generating regular article');
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
    
    // Filter out any null results from failed generations
    const filteredResults = results.filter(item => item !== null);
    console.log(`Successfully generated ${filteredResults.length} content items out of ${limitedTopics.length} topics`);
    
    return filteredResults;
  } catch (error) {
    console.error('Error in batch content generation:', error);
    throw new Error('Failed to generate batch content');
  }
}