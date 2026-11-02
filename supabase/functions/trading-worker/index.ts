/**
 * Supabase Edge Function - Scheduled Paper Trading Worker
 * 
 * This function runs every 1 minute via Supabase pg_cron
 * It processes closed candles and executes paper trading logic
 * 
 * IMPORTANT: This is a SIMULATION worker. No real trading orders.
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (server-side only)
 * - TELEGRAM_BOT_TOKEN: (Optional) Telegram bot token
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface Position {
  id: string
  user_id: string
  coin: string
  avg_entry_price: number
  quantity: number
  total_cost: number
  current_price: number
  profit_target_price: number
  unrealized_pnl: number
  status: string
}

interface BotConfig {
  user_id: string
  is_running: boolean
  no_loss_sell: boolean
  trading_mode: string
  initial_buy: number
  additional_buy: number
  dca_trigger_percent: number
  max_buy_orders: number
  profit_target_percent: number
  trading_fee_percent: number
  slippage_percent: number
  max_investment_per_coin: number
  stop_loss_percent: number
  take_profit_percent: number
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
      
      // Filter only closed candles
      return data
        .filter((k: any[]) => k[6] <= now) // closeTime <= now
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
      console.warn(`Failed to fetch from ${baseUrl}:`, error)
      continue
    }
  }
  
  throw new Error(`Failed to fetch candles for ${symbol}`)
}

/**
 * Fetch current prices for all coins
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
      console.warn(`Failed to fetch prices from ${baseUrl}:`, error)
      continue
    }
  }
  
  throw new Error('Failed to fetch prices from all endpoints')
}

/**
 * Check if candle was already processed (idempotency)
 */
async function wasCandleProcessed(
  supabase: any,
  userId: string,
  coin: string,
  candleTime: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('processed_candles')
    .select('id')
    .eq('user_id', userId)
    .eq('coin', coin)
    .eq('candle_time', candleTime)
    .single()
  
  return !!data
}

/**
 * Mark candle as processed
 */
async function markCandleProcessed(
  supabase: any,
  userId: string,
  coin: string,
  candleTime: number
): Promise<void> {
  await supabase
    .from('processed_candles')
    .insert({
      user_id: userId,
      coin,
      candle_time: candleTime,
      processed_at: new Date().toISOString()
    })
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
 * Generate trading signal
 */
function generateSignal(
  rsi: number,
  priceChange: number,
  trend: string
): 'BUY' | 'SELL' | 'HOLD' | 'DCA' | 'WAIT' {
  if (rsi < 30 && priceChange < -2) return 'BUY'
  if (rsi < 35 && priceChange < -1) return 'DCA'
  if (rsi > 70 && priceChange > 2) return 'SELL'
  if (Math.abs(priceChange) < 0.5 && trend === 'SIDEWAYS') return 'HOLD'
  return 'WAIT'
}

/**
 * Process a single user's trading logic
 */
async function processUser(
  supabase: any,
  userId: string,
  prices: Record<string, number>
): Promise<{ tradesExecuted: number; errors: string[] }> {
  let tradesExecuted: number = 0
  const errors: string[] = []
  
  try {
    // Get bot config
    const { data: config, error: configError } = await supabase
      .from('bot_config')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (configError || !config || !config.is_running) {
      return { tradesExecuted: 0, errors: [] }
    }
    
    // Get open positions
    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
    
    if (posError) {
      errors.push(`Failed to fetch positions: ${posError.message}`)
      return { tradesExecuted: 0, errors }
    }
    
    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('paper_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (walletError || !wallet) {
      errors.push('Wallet not found')
      return { tradesExecuted: 0, errors }
    }
    
    // Process each coin
    for (const coin of SUPPORTED_COINS) {
      try {
        const currentPrice = prices[coin]
        if (!currentPrice) continue
        
        // Fetch candles for analysis
        const candles = await fetchClosedCandles(`${coin}USDT`, '5m', 50)
        if (candles.length < 20) continue
        
        const closes = candles.map(c => c.close)
        const rsi = calculateRSI(closes)
        const priceChange = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100
        const signal = generateSignal(rsi, priceChange, 'UP')
        
        // Check existing position
        const position = positions?.find((p: Position) => p.coin === coin)
        
        if (position) {
          // Update current price
          await supabase
            .from('positions')
            .update({ current_price: currentPrice })
            .eq('id', position.id)
          
          // Check DCA trigger
          const { data: dcaOrders } = await supabase
            .from('dca_orders')
            .select('*')
            .eq('position_id', position.id)
          
          const dcaCount = dcaOrders?.length || 0
          
          if (signal === 'DCA' && dcaCount < config.max_buy_orders) {
            const lastBuy = dcaOrders?.[dcaOrders.length - 1]
            const triggerPrice = lastBuy 
              ? lastBuy.price * (1 - config.dca_trigger_percent / 100)
              : position.avg_entry_price * (1 - config.dca_trigger_percent / 100)
            
            if (currentPrice <= triggerPrice && wallet.available_balance >= config.additional_buy) {
              // Execute DCA BUY
              const fee = config.additional_buy * (config.trading_fee_percent / 100)
              const slippagePrice = currentPrice * (1 + config.slippage_percent / 100)
              const quantity = config.additional_buy / slippagePrice
              
              // Insert trade
              await supabase.from('trades').insert({
                user_id: userId,
                position_id: position.id,
                coin,
                side: 'BUY',
                price: slippagePrice,
                quantity,
                total: config.additional_buy,
                fee,
                is_dca: true,
                dca_order_number: dcaCount + 1,
                executed_at: new Date().toISOString()
              })
              
              // Insert DCA order
              await supabase.from('dca_orders').insert({
                user_id: userId,
                position_id: position.id,
                order_number: dcaCount + 1,
                price: slippagePrice,
                quantity,
                cost: config.additional_buy,
                fee,
                executed_at: new Date().toISOString()
              })
              
              // Update position
              const newTotalCost = position.total_cost + config.additional_buy
              const newQuantity = position.quantity + quantity
              const newAvgEntry = newTotalCost / newQuantity
              const profitTarget = newAvgEntry * (1 + (config.profit_target_percent + config.trading_fee_percent * 2 + config.slippage_percent * 2) / 100)
              
              await supabase
                .from('positions')
                .update({
                  quantity: newQuantity,
                  total_cost: newTotalCost,
                  avg_entry_price: newAvgEntry,
                  profit_target_price: profitTarget
                })
                .eq('id', position.id)
              
              // Update wallet
              await supabase
                .from('paper_wallets')
                .update({
                  available_balance: wallet.available_balance - config.additional_buy - fee,
                  invested_balance: wallet.invested_balance + config.additional_buy
                })
                .eq('user_id', userId)
              
              tradesExecuted++
            }
          }
          
          // Check sell conditions
          const slippageSellPrice = currentPrice * (1 - config.slippage_percent / 100)
          const grossProceeds = position.quantity * slippageSellPrice
          const sellFee = grossProceeds * (config.trading_fee_percent / 100)
          const netProceeds = grossProceeds - sellFee
          const pnl = netProceeds - position.total_cost
          
          let shouldSell = false
          
          if (config.no_loss_sell) {
            // No-Loss mode: only sell at profit target
            if (slippageSellPrice >= position.profit_target_price && pnl > 0) {
              shouldSell = true
            }
          } else {
            // Normal mode: check SL/TP
            const pnlPercent = (pnl / position.total_cost) * 100
            if (pnlPercent >= config.take_profit_percent || pnlPercent <= -config.stop_loss_percent) {
              shouldSell = true
            }
          }
          
          if (shouldSell) {
            // Execute SELL
            await supabase.from('trades').insert({
              user_id: userId,
              position_id: position.id,
              coin,
              side: 'SELL',
              price: slippageSellPrice,
              quantity: position.quantity,
              total: grossProceeds,
              fee: sellFee,
              pnl,
              is_dca: false,
              executed_at: new Date().toISOString()
            })
            
            // Close position
            await supabase
              .from('positions')
              .update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                realized_pnl: pnl,
                current_price: currentPrice
              })
              .eq('id', position.id)
            
            // Update wallet
            await supabase
              .from('paper_wallets')
              .update({
                available_balance: wallet.available_balance + netProceeds,
                invested_balance: wallet.invested_balance - position.total_cost,
                realized_pnl: wallet.realized_pnl + pnl
              })
              .eq('user_id', userId)
            
            tradesExecuted++
          }
        } else {
          // No position - check for new entry
          if (signal === 'BUY' && wallet.available_balance >= config.initial_buy) {
            const fee = config.initial_buy * (config.trading_fee_percent / 100)
            const slippagePrice = currentPrice * (1 + config.slippage_percent / 100)
            const quantity = config.initial_buy / slippagePrice
            const profitTarget = slippagePrice * (1 + (config.profit_target_percent + config.trading_fee_percent * 2 + config.slippage_percent * 2) / 100)
            
            // Create position
            const { data: newPosition } = await supabase
              .from('positions')
              .insert({
                user_id: userId,
                coin,
                side: 'LONG',
                entry_price: slippagePrice,
                quantity,
                total_cost: config.initial_buy,
                current_price: currentPrice,
                avg_entry_price: slippagePrice,
                profit_target_price: profitTarget,
                status: 'open',
                opened_at: new Date().toISOString()
              })
              .select()
              .single()
            
            if (newPosition) {
              // Insert trade
              await supabase.from('trades').insert({
                user_id: userId,
                position_id: newPosition.id,
                coin,
                side: 'BUY',
                price: slippagePrice,
                quantity,
                total: config.initial_buy,
                fee,
                is_dca: false,
                dca_order_number: 1,
                executed_at: new Date().toISOString()
              })
              
              // Insert DCA order
              await supabase.from('dca_orders').insert({
                user_id: userId,
                position_id: newPosition.id,
                order_number: 1,
                price: slippagePrice,
                quantity,
                cost: config.initial_buy,
                fee,
                executed_at: new Date().toISOString()
              })
              
              // Update wallet
              await supabase
                .from('paper_wallets')
                .update({
                  available_balance: wallet.available_balance - config.initial_buy - fee,
                  invested_balance: wallet.invested_balance + config.initial_buy
                })
                .eq('user_id', userId)
              
              tradesExecuted++
            }
          }
        }
      } catch (coinError) {
        errors.push(`Error processing ${coin}: ${coinError.message}`)
      }
    }
    
    // Update bot state
    await supabase
      .from('bot_state')
      .update({
        last_tick_time: new Date().toISOString(),
        total_ticks: supabase.rpc('increment', { row_id: userId, column: 'total_ticks' })
      })
      .eq('user_id', userId)
    
  } catch (error) {
    errors.push(`User processing error: ${error.message}`)
  }
  
  return { tradesExecuted, errors }
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  message: string
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
  } catch (error) {
    console.error('Telegram notification failed:', error)
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  const startTime = Date.now()
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Fetch all prices
    const prices = await fetchAllPrices()
    
    // Get all active users (bot running)
    const { data: activeBots, error: botsError } = await supabase
      .from('bot_config')
      .select('user_id')
      .eq('is_running', true)
    
    if (botsError) {
      throw new Error(`Failed to fetch active bots: ${botsError.message}`)
    }
    
    let totalTrades = 0
    const allErrors: string[] = []
    
    // Process each user (bounded concurrency - process in batches of 10)
    const userIds = activeBots?.map(b => b.user_id) || []
    const batchSize = 10
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      
      const results = await Promise.all(
        batch.map(userId => processUser(supabase, userId, prices))
      )
      
      for (const result of results) {
        totalTrades += result.tradesExecuted
        allErrors.push(...result.errors)
      }
    }
    
    // Log worker execution
    await supabase.from('worker_logs').insert({
      worker_type: 'supabase_edge_function',
      status: allErrors.length > 0 ? 'warning' : 'success',
      message: `Processed ${userIds.length} users, executed ${totalTrades} trades`,
      trades_executed: totalTrades,
      errors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
      execution_time_ms: Date.now() - startTime,
      created_at: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: userIds.length,
        tradesExecuted: totalTrades,
        errors: allErrors.length,
        executionTimeMs: Date.now() - startTime
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Worker error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
