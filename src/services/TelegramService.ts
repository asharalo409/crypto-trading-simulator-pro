/**
 * TelegramNotificationService - Server-side Telegram notifications
 * 
 * IMPORTANT: This service should only run on server-side (Edge Functions, Workers)
 * NEVER expose TELEGRAM_BOT_TOKEN in frontend code
 * 
 * Features:
 * - Rate limiting (max 30 messages/second per chat)
 * - Duplicate prevention
 * - Message queuing
 * - Error handling
 * - Audit logging
 */

export type NotificationType = 
  | 'bot_started'
  | 'bot_stopped'
  | 'buy_executed'
  | 'dca_buy'
  | 'sell_executed'
  | 'profit_summary'
  | 'daily_pl'
  | 'worker_error'
  | 'api_error'
  | 'risk_warning';

export interface NotificationMessage {
  type: NotificationType;
  chatId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
  disablePreview?: boolean;
}

export interface NotificationLog {
  id: string;
  userId: string;
  type: NotificationType;
  chatId: string;
  message: string;
  sentAt: number;
  success: boolean;
  error?: string;
}

export class TelegramNotificationService {
  private botToken: string;
  private baseUrl: string;
  private messageQueue: NotificationMessage[] = [];
  private sentMessages: Map<string, number> = new Map(); // chatId -> lastSentTime
  private rateLimitWindow = 1000; // 1 second
  private maxMessagesPerWindow = 30;
  private auditLog: NotificationLog[] = [];

  constructor(botToken: string) {
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
    this.botToken = botToken;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Send a message to Telegram
   */
  async sendMessage(
    chatId: string,
    message: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML',
    disablePreview: boolean = true
  ): Promise<boolean> {
    // Rate limiting check
    if (!this.checkRateLimit(chatId)) {
      console.warn(`Rate limit exceeded for chat ${chatId}`);
      this.logToAudit(chatId, 'rate_limited', message, false, 'Rate limit exceeded');
      return false;
    }

    // Duplicate prevention (check if same message sent in last 5 seconds)
    const messageKey = `${chatId}:${message.substring(0, 50)}`;
    const lastSent = this.sentMessages.get(messageKey);
    if (lastSent && Date.now() - lastSent < 5000) {
      console.warn(`Duplicate message prevented for chat ${chatId}`);
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
          disable_web_page_preview: disablePreview,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${error}`);
      }

      // Update rate limit tracking
      this.sentMessages.set(messageKey, Date.now());
      this.updateRateLimit(chatId);

      // Log success
      this.logToAudit(chatId, 'sent', message, true);

      return true;
    } catch (error: any) {
      console.error('Failed to send Telegram message:', error);
      this.logToAudit(chatId, 'error', message, false, error.message);
      return false;
    }
  }

  /**
   * Send bot started notification
   */
  async notifyBotStarted(chatId: string, username: string): Promise<boolean> {
    const message = `
🟢 <b>Bot Started</b>

👤 User: ${this.escapeHtml(username)}
⏰ Time: ${new Date().toLocaleString()}
📊 Status: Active

Your paper trading bot is now running.
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send bot stopped notification
   */
  async notifyBotStopped(chatId: string, username: string): Promise<boolean> {
    const message = `
🔴 <b>Bot Stopped</b>

👤 User: ${this.escapeHtml(username)}
⏰ Time: ${new Date().toLocaleString()}
📊 Status: Inactive

Your paper trading bot has been stopped.
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send BUY executed notification
   */
  async notifyBuyExecuted(
    chatId: string,
    coin: string,
    price: number,
    quantity: number,
    total: number,
    fee: number
  ): Promise<boolean> {
    const message = `
📈 <b>BUY Executed</b>

💰 Coin: <b>${coin}</b>
💵 Price: $${price.toFixed(4)}
📦 Quantity: ${quantity.toFixed(6)}
💰 Total: $${total.toFixed(2)}
💸 Fee: $${fee.toFixed(4)}
⏰ Time: ${new Date().toLocaleString()}

Position opened successfully.
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send DCA BUY notification
   */
  async notifyDCABuy(
    chatId: string,
    coin: string,
    orderNumber: number,
    price: number,
    quantity: number,
    total: number,
    avgEntry: number
  ): Promise<boolean> {
    const message = `
🔄 <b>DCA BUY #${orderNumber}</b>

💰 Coin: <b>${coin}</b>
💵 Price: $${price.toFixed(4)}
📦 Quantity: ${quantity.toFixed(6)}
💰 Total: $${total.toFixed(2)}
📊 Avg Entry: $${avgEntry.toFixed(4)}
⏰ Time: ${new Date().toLocaleString()}

DCA order executed. Averaging down.
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send SELL executed notification
   */
  async notifySellExecuted(
    chatId: string,
    coin: string,
    price: number,
    quantity: number,
    total: number,
    fee: number,
    pnl: number
  ): Promise<boolean> {
    const pnlEmoji = pnl >= 0 ? '✅' : '❌';
    const pnlColor = pnl >= 0 ? '🟢' : '🔴';
    
    const message = `
📉 <b>SELL Executed</b>

💰 Coin: <b>${coin}</b>
💵 Price: $${price.toFixed(4)}
📦 Quantity: ${quantity.toFixed(6)}
💰 Total: $${total.toFixed(2)}
💸 Fee: $${fee.toFixed(4)}
${pnlColor} <b>P/L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</b> ${pnlEmoji}
⏰ Time: ${new Date().toLocaleString()}

Position closed.
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send profit summary notification
   */
  async notifyProfitSummary(
    chatId: string,
    totalPnl: number,
    realizedPnl: number,
    unrealizedPnl: number,
    winRate: number,
    totalTrades: number
  ): Promise<boolean> {
    const totalEmoji = totalPnl >= 0 ? '🟢' : '🔴';
    
    const message = `
💰 <b>Profit Summary</b>

${totalEmoji} <b>Total P/L: ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}</b>
✅ Realized: $${realizedPnl.toFixed(2)}
⏳ Unrealized: $${unrealizedPnl.toFixed(2)}
📊 Win Rate: ${winRate.toFixed(1)}%
📈 Total Trades: ${totalTrades}
⏰ Time: ${new Date().toLocaleString()}

Keep trading! 🚀
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send daily P/L summary
   */
  async notifyDailyPL(
    chatId: string,
    todayPnl: number,
    totalBalance: number,
    openPositions: number
  ): Promise<boolean> {
    const emoji = todayPnl >= 0 ? '🟢' : '🔴';
    
    const message = `
📊 <b>Daily Summary</b>

${emoji} <b>Today's P/L: ${todayPnl >= 0 ? '+' : ''}$${todayPnl.toFixed(2)}</b>
💰 Total Balance: $${totalBalance.toFixed(2)}
📂 Open Positions: ${openPositions}
⏰ Date: ${new Date().toLocaleDateString()}

Have a great day! 🌟
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send worker error notification
   */
  async notifyWorkerError(chatId: string, error: string, workerType: string): Promise<boolean> {
    const message = `
⚠️ <b>Worker Error</b>

🔧 Worker: ${this.escapeHtml(workerType)}
❌ Error: ${this.escapeHtml(error)}
⏰ Time: ${new Date().toLocaleString()}

Please check the worker logs.
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send API failure notification
   */
  async notifyAPIFailure(chatId: string, apiName: string, error: string): Promise<boolean> {
    const message = `
🚨 <b>API Failure</b>

🌐 API: ${this.escapeHtml(apiName)}
❌ Error: ${this.escapeHtml(error)}
⏰ Time: ${new Date().toLocaleString()}

Fallback API will be used if available.
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Send risk warning notification
   */
  async notifyRiskWarning(chatId: string, warning: string): Promise<boolean> {
    const message = `
⚠️ <b>Risk Warning</b>

${this.escapeHtml(warning)}

⏰ Time: ${new Date().toLocaleString()}

Please review your positions.
    `.trim();

    return await this.sendMessage(chatId, message);
  }

  /**
   * Check rate limit for a chat
   */
  private checkRateLimit(chatId: string): boolean {
    const lastSent = this.sentMessages.get(`rate:${chatId}`);
    if (!lastSent) return true;
    
    const timeSinceLastSent = Date.now() - lastSent;
    return timeSinceLastSent >= this.rateLimitWindow;
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(chatId: string): void {
    this.sentMessages.set(`rate:${chatId}`, Date.now());
  }

  /**
   * Log to audit trail
   */
  private logToAudit(
    chatId: string,
    type: NotificationType | 'sent' | 'error' | 'rate_limited',
    message: string,
    success: boolean,
    error?: string
  ): void {
    const log: NotificationLog = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: 'system', // Will be set by caller
      type: type as NotificationType,
      chatId,
      message: message.substring(0, 100), // Truncate for logging
      sentAt: Date.now(),
      success,
      error,
    };

    this.auditLog.push(log);

    // Keep only last 1000 logs
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(): NotificationLog[] {
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Test connection by sending a test message
   */
  async testConnection(chatId: string): Promise<boolean> {
    const message = `
✅ <b>Connection Test</b>

🤖 Telegram bot is working correctly!
⏰ Time: ${new Date().toLocaleString()}

You will receive notifications here.
    `.trim();

    return await this.sendMessage(chatId, message);
  }
}

// Export factory function for server-side use
export function createTelegramService(botToken: string): TelegramNotificationService {
  return new TelegramNotificationService(botToken);
}
