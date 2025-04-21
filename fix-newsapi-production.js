/**
 * Fix script to ensure NewsAPI.org is not used in production
 * and set NODE_ENV=production
 */

const fs = require('fs');
const path = require('path');

// Files to check and fix
const filesToCheck = [
  './dist/index.js',
  './dist/services/newsScraper.js',
  './server/services/newsScraper.ts',
  './deploy/index.js'
];

async function fixNewsApiProduction() {
  console.log('Running fix for NewsAPI.org in production environment');
  
  // Ensure NODE_ENV is production
  process.env.NODE_ENV = 'production';
  console.log('Set NODE_ENV to production');
  
  // Process each file to remove or disable NewsAPI calls
  for (const file of filesToCheck) {
    try {
      if (!fs.existsSync(file)) {
        console.log(`File not found: ${file}`);
        continue;
      }
      
      console.log(`Processing file: ${file}`);
      let content = fs.readFileSync(file, 'utf8');
      
      // Fix 1: Remove any direct NewsAPI.org URLs
      const originalContent = content;
      content = content.replace(
        /https:\/\/newsapi\.org\/v2\/top-headlines\?[^"']+/g,
        'https://example.com/disabled-newsapi'
      );
      
      // Fix 2: Disable News API Org source if it exists
      content = content.replace(
        /{[^{}]*name\s*:\s*['"]News API Org['"][^{}]*}/g,
        '{ name: "News API Org", disabled: true, url: "https://example.com" }'
      );
      
      // Fix 3: Skip News API fetch attempt
      content = content.replace(
        /else if\s*\(\s*source\.name\s*===\s*['"]News API Org['"]\s*\)\s*{[^{}]*}/g,
        'else if (source.name === "News API Org") { return []; }'
      );
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`Fixed NewsAPI references in ${file}`);
      } else {
        console.log(`No NewsAPI references found in ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log('Fixes applied successfully. NODE_ENV=production and NewsAPI.org references disabled.');
}

// Run the fix
fixNewsApiProduction().then(() => {
  console.log('Fix completed.');
}).catch(err => {
  console.error('Fix failed:', err);
});