import fs from 'fs';
import fetch from 'node-fetch';

// Configuration
const API_BASE = 'http://localhost:5000';
const LOGIN_ENDPOINT = '/api/auth/login';
const ARTICLES_ENDPOINT = '/api/articles';

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Global variable to store session cookie
let sessionCookie = '';

// Function to authenticate and get session
async function authenticate() {
  try {
    console.log('🔐 Authenticating with admin credentials...');
    
    const response = await fetch(`${API_BASE}${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    // Extract session cookie from response headers
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      sessionCookie = cookies.split(';')[0];
      console.log('✅ Successfully authenticated');
      return true;
    }
    
    throw new Error('No session cookie received');
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return false;
  }
}

// Function to create a single article
async function createArticle(articleData, index) {
  try {
    const response = await fetch(`${API_BASE}${ARTICLES_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(articleData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    console.log(`✅ ${index}/50 - Created: ${articleData.title}`);
    return { success: true, data: result };
  } catch (error) {
    console.error(`❌ ${index}/50 - Failed: ${articleData.title}`);
    console.error(`   Error: ${error.message}`);
    return { success: false, error: error.message, title: articleData.title };
  }
}

// Function to create articles in batches with delay
async function batchCreateArticles(articles, batchSize = 5, delayMs = 1000) {
  const results = [];
  const failed = [];
  
  console.log(`\n📝 Creating ${articles.length} articles in batches of ${batchSize}...`);
  
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(articles.length/batchSize)}`);
    
    // Process batch in parallel
    const batchPromises = batch.map((article, index) => 
      createArticle(article, i + index + 1)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Collect results
    batchResults.forEach(result => {
      if (result.success) {
        results.push(result.data);
      } else {
        failed.push(result);
      }
    });
    
    // Add delay between batches to avoid overwhelming the server
    if (i + batchSize < articles.length) {
      console.log(`   ⏳ Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return { results, failed };
}

// Function to load articles from JSON file
function loadArticles() {
  try {
    const data = fs.readFileSync('article-drafts.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading articles:', error.message);
    return [];
  }
}

// Function to generate summary report
function generateReport(results, failed) {
  console.log('\n📊 BATCH CREATION SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Successfully created: ${results.length} articles`);
  console.log(`❌ Failed to create: ${failed.length} articles`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Articles:');
    failed.forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure.title}`);
      console.log(`      Error: ${failure.error}`);
    });
  }
  
  // Save results to files
  if (results.length > 0) {
    fs.writeFileSync('created-articles.json', JSON.stringify(results, null, 2));
    console.log('📁 Successfully created articles saved to: created-articles.json');
  }
  
  if (failed.length > 0) {
    fs.writeFileSync('failed-articles.json', JSON.stringify(failed, null, 2));
    console.log('📁 Failed articles saved to: failed-articles.json');
  }
}

// Main execution function
async function main() {
  console.log('🚀 Starting batch article creation process...');
  
  // Load articles
  const articles = loadArticles();
  if (articles.length === 0) {
    console.error('❌ No articles loaded. Make sure article-drafts.json exists.');
    return;
  }
  
  console.log(`📚 Loaded ${articles.length} articles for creation`);
  
  // Authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error('❌ Cannot proceed without authentication');
    return;
  }
  
  // Create articles
  const { results, failed } = await batchCreateArticles(articles);
  
  // Generate report
  generateReport(results, failed);
  
  console.log('\n🎉 Batch creation process completed!');
}

// Error handling for the main process
main().catch(error => {
  console.error('❌ Fatal error in batch creation:', error);
  process.exit(1);
});