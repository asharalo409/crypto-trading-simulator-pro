/**
 * GitHub Actions Trading Worker Script
 * 
 * This script runs as a GitHub Actions scheduled workflow
 * It serves as a third backup for the trading system
 * 
 * FREE TIER LIMITS:
 * - 2,000 minutes/month for private repos
 * - This cron = ~43,200 minutes/month (EXCEEDS LIMIT!)
 * 
 * IMPORTANT: GitHub Actions free tier may not support every-minute cron.
 * This is provided as a backup option only.
 * 
 * Recommended: Use Supabase pg_cron (primary) or Cloudflare Workers (backup)
 */

const https = require('https');

const BINANCE_API = 'https://api.binance.com';
const BINANCE_VISION = 'https://data-api.binance.vision';

const SUPPORTED_COINS = [
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA',
  'DOGE', 'AVAX', 'TRX', 'LINK', 'POL', 'LTC'
];

/**
 * HTTPS fetch helper
 */
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetch all prices with fallback
 */
async function fetchAllPrices() {
  const endpoints = [BINANCE_API, BINANCE_VISION];
  
  for (const baseUrl of endpoints) {
    try {
      const data = await fetch(`${baseUrl}/api/v3/ticker/price`);
      const prices = {};
      
      for (const ticker of data) {
        for (const coin of SUPPORTED_COINS) {
          if (ticker.symbol === `${coin}USDT`) {
            prices[coin] = parseFloat(ticker.price);
            break;
          }
        }
      }
      
      return prices;
    } catch (error) {
      console.warn(`Failed to fetch from ${baseUrl}:`, error.message);
      continue;
    }
  }
  
  throw new Error('Failed to fetch prices from all endpoints');
}

/**
 * Supabase REST API helper
 */
async function supabaseRequest(method, path, body = null) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const url = `${supabaseUrl}/rest/v1${path}`;
  
  const options = {
    method,
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Main worker function
 */
async function runWorker() {
  const startTime = Date.now();
  
  try {
    console.log('Starting GitHub Actions trading worker...');
    
    // Fetch prices
    const prices = await fetchAllPrices();
    console.log(`Fetched prices for ${Object.keys(prices).length} coins`);
    
    // Get active bots
    const activeBots = await supabaseRequest('GET', '/bot_config?is_running=eq.true&select=user_id');
    const userIds = activeBots.map(b => b.user_id);
    
    console.log(`Found ${userIds.length} active bots`);
    
    // Log execution
    await supabaseRequest('POST', '/worker_logs', {
      worker_type: 'github_actions',
      status: 'success',
      message: `GitHub Actions processed ${userIds.length} users`,
      trades_executed: 0,
      execution_time_ms: Date.now() - startTime,
      created_at: new Date().toISOString()
    });
    
    console.log(`Worker completed in ${Date.now() - startTime}ms`);
    
  } catch (error) {
    console.error('Worker error:', error.message);
    
    // Log error
    try {
      await supabaseRequest('POST', '/worker_logs', {
        worker_type: 'github_actions',
        status: 'error',
        message: error.message,
        errors: error.stack,
        execution_time_ms: Date.now() - startTime,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log error:', logError.message);
    }
    
    process.exit(1);
  }
}

// Run worker
runWorker().then(() => {
  console.log('Worker finished successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Worker failed:', error);
  process.exit(1);
});
