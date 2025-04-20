import OpenAI from "openai";

// Initialize OpenAI client with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      title: result.title,
      content: result.content,
      excerpt: result.excerpt
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
    const result = JSON.parse(response.choices[0].message.content);
    return result.ideas || [];
  } catch (error) {
    console.error('Error generating article ideas:', error);
    throw new Error('Failed to generate article ideas');
  }
}