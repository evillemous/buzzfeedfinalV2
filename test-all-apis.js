// API test utility for yourbuzzfeed content generation features
import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:5000';

// Test API connection
async function testAPIConnection() {
  try {
    const response = await fetch(`${BASE_URL}/api/ai/test-connection`);
    const data = await response.json();
    console.log('API connection test:', data);
    return data.success;
  } catch (error) {
    console.error('Error connecting to API:', error.message);
    return false;
  }
}

// Test batch content generation
async function testBatchGeneration(count = 2, listiclePercentage = 50) {
  console.log(`Generating ${count} articles (${listiclePercentage}% listicles)...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/batch-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        count,
        listiclePercentage
      })
    });
    
    const data = await response.json();
    console.log('Batch generation completed:', data);
    return data;
  } catch (error) {
    console.error('Error in batch generation:', error.message);
  }
}

// Test single article generation
async function testGenerateArticle(topic) {
  console.log(`Generating article about "${topic}"...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/create-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        categoryId: 2,
        targetLength: 800
      })
    });
    
    const data = await response.json();
    console.log('Article created:', data);
    return data;
  } catch (error) {
    console.error('Error creating article:', error.message);
  }
}

// Test news scraping
async function testScrapeNews() {
  console.log('Initiating news scraping...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/news/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('News scraping completed:', data);
    return data;
  } catch (error) {
    console.error('Error scraping news:', error.message);
  }
}

// Test entertainment content generation
async function testEntertainmentContent(count = 3, listiclePercentage = 60) {
  console.log(`Generating ${count} entertainment content pieces (${listiclePercentage}% listicles)...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/entertainment/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        count,
        listiclePercentage
      })
    });
    
    const data = await response.json();
    console.log('Entertainment content generated:', data);
    return data;
  } catch (error) {
    console.error('Error generating entertainment content:', error.message);
  }
}

// Test single entertainment article generation
async function testEntertainmentArticle() {
  console.log('Generating entertainment article...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/entertainment/generate-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Entertainment article generated:', data);
    return data;
  } catch (error) {
    console.error('Error generating entertainment article:', error.message);
  }
}

// Test entertainment listicle generation
async function testEntertainmentListicle() {
  console.log('Generating entertainment listicle...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/entertainment/generate-listicle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Entertainment listicle generated:', data);
    return data;
  } catch (error) {
    console.error('Error generating entertainment listicle:', error.message);
  }
}

// Run a specific test based on command line arguments
async function runTests() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const testType = args[0] || 'connection';
  
  console.log(`==== Running test: ${testType} ====`);
  
  // Check API connection first
  const connected = await testAPIConnection();
  if (!connected) {
    console.error('API connection failed, aborting tests');
    return;
  }
  
  // Run the requested test
  switch (testType) {
    case 'connection':
      // Already tested connection above
      break;
      
    case 'batch':
      const count = args[1] ? parseInt(args[1]) : 2;
      const listiclePercentage = args[2] ? parseInt(args[2]) : 50;
      await testBatchGeneration(count, listiclePercentage);
      break;
      
    case 'article':
      const topic = args[1] || 'Technology trends in 2025';
      await testGenerateArticle(topic);
      break;
      
    case 'news':
      await testScrapeNews();
      break;
      
    case 'entertainment':
      if (args[1] === 'article') {
        await testEntertainmentArticle();
      } else if (args[1] === 'listicle') {
        await testEntertainmentListicle();
      } else {
        const count = args[1] ? parseInt(args[1]) : 2;
        const listiclePercentage = args[2] ? parseInt(args[2]) : 60;
        await testEntertainmentContent(count, listiclePercentage);
      }
      break;
      
    case 'all':
      console.log('\n=== Running all tests ===');
      // Run a small sample of each test
      await testBatchGeneration(1, 50);
      await testGenerateArticle('Artificial Intelligence');
      await testScrapeNews();
      await testEntertainmentContent(1, 100);
      await testEntertainmentArticle();
      await testEntertainmentListicle();
      console.log('\n=== All tests completed ===');
      break;
      
    default:
      console.error(`Unknown test type: ${testType}`);
      console.log('Available tests: connection, batch, article, news, entertainment, all');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test failed with error:', error);
});