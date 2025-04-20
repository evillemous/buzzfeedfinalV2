# YourbuzzFeed Content Generation Guide

This guide explains how to use the automated content generation features to populate your site with engaging articles.

## Overview

The site includes multiple content generation mechanisms:

1. **Batch Content Generation** - Creates multiple articles across different categories
2. **News Scraping** - Automatically fetches current headlines and generates news articles
3. **Entertainment Content** - Creates entertainment-focused articles and listicles
4. **Single Article Generation** - Creates individual articles on specific topics

## Getting Started

The system is configured to automatically scrape news every 4 hours. This behavior is initialized when the server starts.

## Testing Content Generation Features

You can use the test utility to generate content. Run the following commands from the project root:

```bash
# First install the node-fetch package needed by the test script
npm install node-fetch

# Test all content generation features
node test-all-apis.js all

# Test batch content generation (2 articles, 50% listicles)
node test-all-apis.js batch 2 50

# Generate content about a specific topic
node test-all-apis.js article "Climate change solutions"

# Manually trigger news scraping
node test-all-apis.js news

# Generate entertainment content (2 pieces, 60% listicles)
node test-all-apis.js entertainment 2 60

# Generate a single entertainment article
node test-all-apis.js entertainment article

# Generate a single entertainment listicle
node test-all-apis.js entertainment listicle
```

## API Endpoints

For developers, the following API endpoints are available:

### Batch Content Generation
- **URL**: `/api/ai/batch-generate`
- **Method**: POST
- **Body**: 
  ```json
  {
    "count": 5,
    "listiclePercentage": 40
  }
  ```

### News Scraping
- **URL**: `/api/news/scrape`
- **Method**: POST
- **Body**: none required

### Entertainment Content Generation
- **URL**: `/api/entertainment/generate`
- **Method**: POST
- **Body**: 
  ```json
  {
    "count": 3,
    "listiclePercentage": 60
  }
  ```

### Single Entertainment Article
- **URL**: `/api/entertainment/generate-article`
- **Method**: POST
- **Body**: none required

### Entertainment Listicle
- **URL**: `/api/entertainment/generate-listicle`
- **Method**: POST
- **Body**: none required

## Strategic Content Generation

For the most effective ad-driven site, consider:

1. **Mix Content Types** - Aim for 60% listicles (which split content across multiple pages) and 40% standard articles
2. **Generate Trending Content** - Use the news scraper to keep content fresh and current
3. **Focus on Entertainment** - Entertainment content typically gets more social sharing and page views
4. **Batch Generate on Schedule** - Consider setting up a cron job to generate fresh content daily

## API Keys

This system requires two API keys:
- **OpenAI API Key** - For generating article content
- **Unsplash Access Key** - For fetching relevant images

Make sure these are properly set in your environment variables.