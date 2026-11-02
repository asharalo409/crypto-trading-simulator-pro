/**
 * MarketAnalyzer - Technical analysis calculations
 * Calculates RSI, EMA, MACD, and generates signals
 */
import Decimal from 'decimal.js';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  ema20: number;
  ema50: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  volatility: number;
}

export class MarketAnalyzer {
  /**
   * Calculate RSI (Relative Strength Index)
   * Period: 14 (standard)
   */
  static calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50;

    const changes: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }

    const recentChanges = changes.slice(-period);
    let gains = 0;
    let losses = 0;

    for (const change of recentChanges) {
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return new Decimal(rsi).toDecimalPlaces(2).toNumber();
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  static calculateEMA(closes: number[], period: number): number {
    if (closes.length < period) return closes[closes.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < closes.length; i++) {
      ema = (closes[i] - ema) * multiplier + ema;
    }

    return new Decimal(ema).toDecimalPlaces(6).toNumber();
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
    if (closes.length < 26) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;

    // Simplified signal line (9-period EMA of MACD values)
    const macdValues: number[] = [];
    for (let i = 26; i <= closes.length; i++) {
      const slice = closes.slice(0, i);
      const e12 = this.calculateEMA(slice, 12);
      const e26 = this.calculateEMA(slice, 26);
      macdValues.push(e12 - e26);
    }

    const signal = macdValues.length >= 9 
      ? this.calculateEMA(macdValues, 9) 
      : macd;
    
    const histogram = macd - signal;

    return {
      macd: new Decimal(macd).toDecimalPlaces(6).toNumber(),
      signal: new Decimal(signal).toDecimalPlaces(6).toNumber(),
      histogram: new Decimal(histogram).toDecimalPlaces(6).toNumber(),
    };
  }

  /**
   * Determine trend direction
   */
  static determineTrend(closes: number[]): 'UP' | 'DOWN' | 'SIDEWAYS' {
    if (closes.length < 10) return 'SIDEWAYS';

    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, Math.min(50, closes.length));
    const currentPrice = closes[closes.length - 1];

    const priceAboveEma20 = currentPrice > ema20;
    const ema20AboveEma50 = ema20 > ema50;

    if (priceAboveEma20 && ema20AboveEma50) return 'UP';
    if (!priceAboveEma20 && !ema20AboveEma50) return 'DOWN';
    return 'SIDEWAYS';
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  static calculateVolatility(closes: number[], period: number = 20): number {
    if (closes.length < period + 1) return 0;

    const returns: number[] = [];
    const recentCloses = closes.slice(-(period + 1));
    
    for (let i = 1; i < recentCloses.length; i++) {
      const ret = (recentCloses[i] - recentCloses[i - 1]) / recentCloses[i - 1];
      returns.push(ret);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return new Decimal(Math.sqrt(variance) * 100).toDecimalPlaces(4).toNumber();
  }

  /**
   * Get all technical indicators for a price series
   */
  static getIndicators(closes: number[]): TechnicalIndicators {
    const rsi = this.calculateRSI(closes);
    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, Math.min(50, closes.length));
    const macdData = this.calculateMACD(closes);
    const trend = this.determineTrend(closes);
    const volatility = this.calculateVolatility(closes);

    return {
      rsi,
      ema20,
      ema50,
      macd: macdData.macd,
      macdSignal: macdData.signal,
      macdHistogram: macdData.histogram,
      trend,
      volatility,
    };
  }

  /**
   * Generate trading signal based on indicators
   */
  static generateSignal(
    indicators: TechnicalIndicators,
    currentPrice: number,
    priceChange24h: number
  ): 'BUY' | 'SELL' | 'HOLD' | 'DCA' | 'WAIT' {
    const { rsi, ema20, ema50, macd, trend } = indicators;

    // Strong BUY signal
    if (rsi < 30 && priceChange24h < -2 && macd > 0) return 'BUY';
    
    // DCA opportunity (oversold)
    if (rsi < 35 && priceChange24h < -1) return 'DCA';
    
    // SELL signal (overbought)
    if (rsi > 70 && priceChange24h > 2) return 'SELL';
    
    // HOLD in sideways
    if (Math.abs(priceChange24h) < 0.5 && trend === 'SIDEWAYS') return 'HOLD';
    
    // BUY on trend confirmation
    if (rsi < 50 && trend === 'UP' && currentPrice > ema20) return 'BUY';
    
    return 'WAIT';
  }
}
