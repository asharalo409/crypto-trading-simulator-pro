/**
 * Supabase Edge Function - Telegram Notification Worker
 * 
 * This function sends Telegram notifications for trading events
 * It's called by the main trading worker when events occur
 * 
 * Environment Variables:
 * - TELEGRAM_BOT_TOKEN: Telegram bot token (server-side only)
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationRequest {
  userId: string
  type: 'bot_started' | 'bot_stopped' | 'buy_executed' | 'dca_buy' | 'sell_executed' | 'profit_summary' | 'daily_pl' | 'worker_error' | 'api_error' | 'risk_warning'
  data: any
}

/**
 * Send Telegram message
 */
async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Telegram API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

/**
 * Format notification message based on type
 */
function formatMessage(type: string, data: any): string {
  const timestamp = new Date().toLocaleString()

  switch (type) {
    case 'bot_started':
      return `
🟢 <b>Bot Started</b>

👤 User: ${escapeHtml(data.username || 'Unknown')}
⏰ Time: ${timestamp}
📊 Status: Active

Your paper trading bot is now running.
      `.trim()

    case 'bot_stopped':
      return `
🔴 <b>Bot Stopped</b>

👤 User: ${escapeHtml(data.username || 'Unknown')}
⏰ Time: ${timestamp}
📊 Status: Inactive

Your paper trading bot has been stopped.
      `.trim()

    case 'buy_executed':
      return `
📈 <b>BUY Executed</b>

💰 Coin: <b>${data.coin}</b>
💵 Price: $${data.price.toFixed(4)}
📦 Quantity: ${data.quantity.toFixed(6)}
💰 Total: $${data.total.toFixed(2)}
💸 Fee: $${data.fee.toFixed(4)}
⏰ Time: ${timestamp}

Position opened successfully.
      `.trim()

    case 'dca_buy':
      return `
🔄 <b>DCA BUY #${data.orderNumber}</b>

💰 Coin: <b>${data.coin}</b>
💵 Price: $${data.price.toFixed(4)}
📦 Quantity: ${data.quantity.toFixed(6)}
💰 Total: $${data.total.toFixed(2)}
📊 Avg Entry: $${data.avgEntry.toFixed(4)}
⏰ Time: ${timestamp}

DCA order executed. Averaging down.
      `.trim()

    case 'sell_executed':
      const pnlEmoji = data.pnl >= 0 ? '✅' : '❌'
      const pnlColor = data.pnl >= 0 ? '🟢' : '🔴'
      return `
📉 <b>SELL Executed</b>

💰 Coin: <b>${data.coin}</b>
💵 Price: $${data.price.toFixed(4)}
📦 Quantity: ${data.quantity.toFixed(6)}
💰 Total: $${data.total.toFixed(2)}
💸 Fee: $${data.fee.toFixed(4)}
${pnlColor} <b>P/L: ${data.pnl >= 0 ? '+' : ''}$${data.pnl.toFixed(2)}</b> ${pnlEmoji}
⏰ Time: ${timestamp}

Position closed.
      `.trim()

    case 'profit_summary':
      const totalEmoji = data.totalPnl >= 0 ? '🟢' : '🔴'
      return `
💰 <b>Profit Summary</b>

${totalEmoji} <b>Total P/L: ${data.totalPnl >= 0 ? '+' : ''}$${data.totalPnl.toFixed(2)}</b>
✅ Realized: $${data.realizedPnl.toFixed(2)}
⏳ Unrealized: $${data.unrealizedPnl.toFixed(2)}
📊 Win Rate: ${data.winRate.toFixed(1)}%
📈 Total Trades: ${data.totalTrades}
⏰ Time: ${timestamp}

Keep trading! 🚀
      `.trim()

    case 'daily_pl':
      const dailyEmoji = data.todayPnl >= 0 ? '🟢' : '🔴'
      return `
📊 <b>Daily Summary</b>

${dailyEmoji} <b>Today's P/L: ${data.todayPnl >= 0 ? '+' : ''}$${data.todayPnl.toFixed(2)}</b>
💰 Total Balance: $${data.totalBalance.toFixed(2)}
📂 Open Positions: ${data.openPositions}
⏰ Date: ${new Date().toLocaleDateString()}

Have a great day! 🌟
      `.trim()

    case 'worker_error':
      return `
⚠️ <b>Worker Error</b>

🔧 Worker: ${escapeHtml(data.workerType)}
❌ Error: ${escapeHtml(data.error)}
⏰ Time: ${timestamp}

Please check the worker logs.
      `.trim()

    case 'api_error':
      return `
🚨 <b>API Failure</b>

🌐 API: ${escapeHtml(data.apiName)}
❌ Error: ${escapeHtml(data.error)}
⏰ Time: ${timestamp}

Fallback API will be used if available.
      `.trim()

    case 'risk_warning':
      return `
⚠️ <b>Risk Warning</b>

${escapeHtml(data.warning)}

⏰ Time: ${timestamp}

Please review your positions.
      `.trim()

    default:
      return `Unknown notification type: ${type}`
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Main handler
 */
serve(async (req) => {
  try {
    const { userId, type, data }: NotificationRequest = await req.json()

    if (!userId || !type || !data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's notification settings
    const {  settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !settings) {
      return new Response(
        JSON.stringify({ success: false, error: 'Notification settings not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if notifications are enabled for this type
    const notificationMap: Record<string, string> = {
      'buy_executed': 'notify_buy',
      'dca_buy': 'notify_dca',
      'sell_executed': 'notify_sell',
      'profit_summary': 'notify_profit',
      'daily_pl': 'notify_daily_summary',
      'worker_error': 'notify_error',
      'api_error': 'notify_error',
      'risk_warning': 'notify_error',
    }

    const settingKey = notificationMap[type]
    if (settingKey && !settings[settingKey]) {
      return new Response(
        JSON.stringify({ success: true, message: 'Notification disabled for this type' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get Telegram bot token from environment
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Telegram bot token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has Telegram configured
    if (!settings.telegram_chat_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Telegram chat ID not configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Format message
    const message = formatMessage(type, data)

    // Send notification
    const sent = await sendTelegramMessage(botToken, settings.telegram_chat_id, message)

    // Log notification
    await supabase.from('worker_logs').insert({
      user_id: userId,
      worker_type: 'telegram_notification',
      status: sent ? 'success' : 'error',
      message: `Sent ${type} notification to ${settings.telegram_chat_id}`,
      created_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ 
        success: sent, 
        message: sent ? 'Notification sent' : 'Failed to send notification' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Notification worker error:', error)

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
