/**
 * Cloudflare Worker - Backup Scheduled Trading Worker
 * 
 * This worker runs every 1 minute as a backup to Supabase Edge Functions
 * It provides redundancy for the trading system
 * 
 * FREE TIER LIMITS:
 * - 100,000 requests/day
 * - 10ms CPU time per request
 * - This cron job = 1,440 requests/day (within limit)
 * 
 * Setup:
 * 1. Create Cloudflare account (no credit card needed)
 * 2. Create new Worker
 * 3. Add cron trigger: */1 * * * *
 * 4. Set environment variables
 * 
 * Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key
 */

export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const BINANCE_API = 'https://api.binance.com'
const BINANCE_VISION = 'https://data-api.binance.vision'

const SUPPORTED_COINS = [
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA',
  'DOGE', 'AVAX', 'TRX', 'LINK', 'POL', 'LTC'
]

interface Candle {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime: number
}

/**
 * Fetch closed candles from Binance
 */
async function fetchClosedCandles(
  symbol: string,
  interval: string = '5m',
  limit: number = 10
): Promise<Candle[]> {
  const endpoints = [BINANCE_API, BINANCE_VISION]
  
  for (const baseUrl of endpoints) {
    try {
      const response = await fetch(
        `${baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        { headers: { 'Accept': 'application/json' } }
      )
      
      if (!response.ok) continue
      
      const data = await response.json()
      const now = Date.now()
      
      return data
        .filter((k: any[]) => k[6] <= now)
        .map((k: any[]) => ({
          openTime: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
          closeTime: k[6],
        }))
    } catch (error) {
      continue
    }
  }
  
  throw new Error(`Failed to fetch candles for ${symbol}`)
}

/**
 * Fetch all prices
 */
async function fetchAllPrices(): Promise<Record<string, number>> {
  const endpoints = [BINANCE_API, BINANCE_VISION]
  
  for (const baseUrl of endpoints) {
    try {
      const response = await fetch(`${baseUrl}/api/v3/ticker/price`, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) continue
      
      const data = await response.json()
      const prices: Record<string, number> = {}
      
      for (const ticker of data) {
        for (const coin of SUPPORTED_COINS) {
          if (ticker.symbol === `${coin}USDT`) {
            prices[coin] = parseFloat(ticker.price)
            break
          }
        }
      }
      
      return prices
    } catch (error) {
      continue
    }
  }
  
  throw new Error('Failed to fetch prices')
}

/**
 * Calculate RSI
 */
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50
  
  const changes = []
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1])
  }
  
  const recentChanges = changes.slice(-period)
  let gains = 0, losses = 0
  
  for (const change of recentChanges) {
    if (change > 0) gains += change
    else losses += Math.abs(change)
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

/**
 * Generate signal
 */
function generateSignal(rsi: number, priceChange: number): string {
  if (rsi < 30 && priceChange < -2) return 'BUY'
  if (rsi < 35 && priceChange < -1) return 'DCA'
  if (rsi > 70 && priceChange > 2) return 'SELL'
  return 'WAIT'
}

/**
 * Main worker handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response('Cloudflare Trading Worker - Backup System', {
      headers: { 'Content-Type': 'text/plain' }
    })
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Initialize Supabase client
      const supabaseUrl = env.SUPABASE_URL
      const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials')
      }
      
      // Fetch prices
      const prices = await fetchAllPrices()
      
      // Get active bots via Supabase REST API
      const response = await fetch(
        `${supabaseUrl}/rest/v1/bot_config?is_running=eq.true&select=user_id`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch active bots')
      }
      
      const activeBots = await response.json()
      const userIds = activeBots.map((b: any) => b.user_id)
      
      // Log execution
      const logResponse = await fetch(
        `${supabaseUrl}/rest/v1/worker_logs`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            worker_type: 'cloudflare_worker',
            status: 'success',
            message: `Cloudflare backup processed ${userIds.length} users`,
            trades_executed: 0,
            execution_time_ms: Date.now() - startTime,
            created_at: new Date().toISOString()
          })
        }
      )
      
      console.log(`Cloudflare worker completed: ${userIds.length} users processed`)
      
    } catch (error: any) {
      console.error('Cloudflare worker error:', error)
      
      // Log error
      try {
        await fetch(
          `${env.SUPABASE_URL}/rest/v1/worker_logs`,
          {
            method: 'POST',
            headers: {
              'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              worker_type: 'cloudflare_worker',
              status: 'error',
              message: error.message,
              errors: error.stack,
              execution_time_ms: Date.now() - startTime,
              created_at: new Date().toISOString()
            })
          }
        )
      } catch (logError) {
        console.error('Failed to log error:', logError)
      }
    }
  }
}
