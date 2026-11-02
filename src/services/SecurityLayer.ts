/**
 * Security Layer - Validation, Authorization, and Audit Logging
 * 
 * Features:
 * - User settings validation
 * - Input sanitization
 * - Rate limiting
 * - Audit logging
 * - Authorization checks
 */

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: any;
}

export class SecurityLayer {
  private auditLog: AuditLogEntry[] = [];
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // Initialize audit log from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ctsp-audit-log');
      if (saved) {
        try {
          this.auditLog = JSON.parse(saved);
        } catch {
          this.auditLog = [];
        }
      }
    }
  }

  /**
   * Validate bot configuration
   */
  validateBotConfig(config: any): ValidationResult {
    const errors: string[] = [];

    // Validate trading mode
    const validModes = ['smart-trend', 'scalping', 'no-loss-hold', 'dca'];
    if (!validModes.includes(config.tradingMode)) {
      errors.push('Invalid trading mode');
    }

    // Validate DCA settings
    if (config.dcaSettings) {
      const dca = config.dcaSettings;

      if (dca.initialBuy < 1 || dca.initialBuy > 1000) {
        errors.push('Initial buy must be between $1 and $1000');
      }

      if (dca.additionalBuy < 1 || dca.additionalBuy > 1000) {
        errors.push('Additional buy must be between $1 and $1000');
      }

      if (dca.dcaTriggerPercent < 0.5 || dca.dcaTriggerPercent > 50) {
        errors.push('DCA trigger must be between 0.5% and 50%');
      }

      if (dca.maxBuyOrders < 1 || dca.maxBuyOrders > 10) {
        errors.push('Max buy orders must be between 1 and 10');
      }

      if (dca.profitTargetPercent < 0.1 || dca.profitTargetPercent > 100) {
        errors.push('Profit target must be between 0.1% and 100%');
      }

      if (dca.tradingFeePercent < 0 || dca.tradingFeePercent > 1) {
        errors.push('Trading fee must be between 0% and 1%');
      }

      if (dca.slippagePercent < 0 || dca.slippagePercent > 1) {
        errors.push('Slippage must be between 0% and 1%');
      }
    }

    // Validate risk settings
    if (config.maxInvestmentPerCoin !== undefined) {
      if (config.maxInvestmentPerCoin < 10 || config.maxInvestmentPerCoin > 10000) {
        errors.push('Max investment per coin must be between $10 and $10,000');
      }
    }

    if (config.stopLossPercent !== undefined) {
      if (config.stopLossPercent < 0.1 || config.stopLossPercent > 50) {
        errors.push('Stop loss must be between 0.1% and 50%');
      }
    }

    if (config.takeProfitPercent !== undefined) {
      if (config.takeProfitPercent < 0.1 || config.takeProfitPercent > 100) {
        errors.push('Take profit must be between 0.1% and 100%');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeConfig(config) : undefined,
    };
  }

  /**
   * Validate Telegram settings
   */
  validateTelegramSettings(settings: any): ValidationResult {
    const errors: string[] = [];

    if (settings.botToken) {
      // Telegram bot tokens are 45-46 characters
      if (settings.botToken.length < 40 || settings.botToken.length > 50) {
        errors.push('Invalid bot token format');
      }

      // Check for common invalid patterns
      if (!/^[0-9]+:[A-Za-z0-9_-]+$/.test(settings.botToken)) {
        errors.push('Bot token format is invalid');
      }
    }

    if (settings.chatId) {
      // Chat IDs are numeric
      if (!/^-?[0-9]+$/.test(settings.chatId)) {
        errors.push('Chat ID must be numeric');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeTelegramSettings(settings) : undefined,
    };
  }

  /**
   * Sanitize configuration (remove dangerous values)
   */
  private sanitizeConfig(config: any): any {
    return {
      ...config,
      // Ensure numeric values are actually numbers
      dcaSettings: config.dcaSettings ? {
        ...config.dcaSettings,
        initialBuy: Number(config.dcaSettings.initialBuy),
        additionalBuy: Number(config.dcaSettings.additionalBuy),
        dcaTriggerPercent: Number(config.dcaSettings.dcaTriggerPercent),
        maxBuyOrders: Math.floor(Number(config.dcaSettings.maxBuyOrders)),
        profitTargetPercent: Number(config.dcaSettings.profitTargetPercent),
        tradingFeePercent: Number(config.dcaSettings.tradingFeePercent),
        slippagePercent: Number(config.dcaSettings.slippagePercent),
      } : undefined,
      maxInvestmentPerCoin: config.maxInvestmentPerCoin ? Number(config.maxInvestmentPerCoin) : undefined,
      stopLossPercent: config.stopLossPercent ? Number(config.stopLossPercent) : undefined,
      takeProfitPercent: config.takeProfitPercent ? Number(config.takeProfitPercent) : undefined,
    };
  }

  /**
   * Sanitize Telegram settings
   */
  private sanitizeTelegramSettings(settings: any): any {
    return {
      ...settings,
      botToken: settings.botToken ? String(settings.botToken).trim() : undefined,
      chatId: settings.chatId ? String(settings.chatId).trim() : undefined,
    };
  }

  /**
   * Check rate limit for an action
   */
  checkRateLimit(userId: string, action: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    
    let limit = this.rateLimits.get(key);
    
    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      limit = { count: 0, resetTime: now + windowMs };
      this.rateLimits.set(key, limit);
    }
    
    if (limit.count >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    limit.count++;
    return true;
  }

  /**
   * Log audit entry
   */
  logAudit(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    success: boolean,
    error?: string
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId,
      action,
      resource,
      details,
      success,
      error,
    };

    this.auditLog.push(entry);

    // Keep only last 5000 entries
    if (this.auditLog.length > 5000) {
      this.auditLog = this.auditLog.slice(-5000);
    }

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ctsp-audit-log', JSON.stringify(this.auditLog));
      } catch {
        // Storage full or unavailable
      }
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(userId?: string, limit: number = 100): AuditLogEntry[] {
    let logs = this.auditLog;
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    
    return logs.slice(-limit).reverse();
  }

  /**
   * Clear audit log
   */
  clearAuditLog(userId?: string): void {
    if (userId) {
      this.auditLog = this.auditLog.filter(log => log.userId !== userId);
    } else {
      this.auditLog = [];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('ctsp-audit-log', JSON.stringify(this.auditLog));
    }
  }

  /**
   * Sanitize user input (prevent XSS)
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  }

  /**
   * Validate coin symbol
   */
  validateCoinSymbol(symbol: string): boolean {
    const validCoins = [
      'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA',
      'DOGE', 'AVAX', 'TRX', 'LINK', 'POL', 'LTC'
    ];
    return validCoins.includes(symbol.toUpperCase());
  }

  /**
   * Validate trade amount
   */
  validateTradeAmount(amount: number, min: number = 1, max: number = 1000): ValidationResult {
    const errors: string[] = [];

    if (isNaN(amount)) {
      errors.push('Amount must be a number');
    } else if (amount < min) {
      errors.push(`Amount must be at least $${min}`);
    } else if (amount > max) {
      errors.push(`Amount must not exceed $${max}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if user is authorized to access resource
   */
  checkAuthorization(userId: string, resource: string, action: string): boolean {
    // In a real app, this would check against Supabase RLS
    // For now, we just log the attempt
    this.logAudit(userId, action, resource, {}, true);
    return true;
  }

  /**
   * Get security stats
   */
  getStats(): {
    auditLogCount: number;
    rateLimitEntries: number;
    lastAuditEntry: AuditLogEntry | null;
  } {
    return {
      auditLogCount: this.auditLog.length,
      rateLimitEntries: this.rateLimits.size,
      lastAuditEntry: this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1] : null,
    };
  }
}

// Export singleton instance
export const securityLayer = new SecurityLayer();
