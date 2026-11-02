/**
 * BacktestEngine - Historical strategy testing
 * 
 * Simulates trading strategies on historical data
 * Uses Decimal.js for precision calculations
 * Avoids look-ahead bias by using only closed candles
 * 
 * IMPORTANT: Backtest results are SIMULATED and do not guarantee future profits.
 */
import Decimal from 'decimal.js';
import { CandleData } from '../services/BinanceAPI';

export interface BacktestConfig {
  coin: string;
  initialBalance: number;
  strategy: 'dca' | 'no-loss-hold' | 'smart-trend' | 'scalping';
  dcaSettings: {
    initialBuy: number;
    additionalBuy: number;
    dcaTriggerPercent: number;
    maxBuyOrders: number;
    profitTargetPercent: number;
    tradingFeePercent: number;
    slippagePercent: number;
  };
  startDate: number;
  endDate: number;
}

export interface BacktestTrade {
  timestamp: number;
  type: 'BUY' | 'SELL' | 'DCA';
  price: number;
  quantity: number;
  total: number;
  fee: number;
  pnl?: number;
  dcaOrderNumber?: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  initialBalance: number;
  finalBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTrades: number;
  buyCount: number;
  sellCount: number;
  dcaCount: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
  equityCurve: { timestamp: number; balance: number }[];
  duration: string;
}

export class BacktestEngine {
  private config: BacktestConfig;
  private candles: CandleData[];
  private balance: Decimal;
  private invested: Decimal;
  private trades: BacktestTrade[];
  private equityCurve: { timestamp: number; balance: number }[];
  private position: {
    coin: string;
    quantity: Decimal;
    avgEntryPrice: Decimal;
    totalCost: Decimal;
    dcaOrders: number;
  } | null;

  constructor(config: BacktestConfig, candles: CandleData[]) {
    this.config = config;
    this.candles = candles.filter(c => c.closeTime >= config.startDate && c.closeTime <= config.endDate);
    this.balance = new Decimal(config.initialBalance);
    this.invested = new Decimal(0);
    this.trades = [];
    this.equityCurve = [];
    this.position = null;
  }

  /**
   * Run backtest simulation
   */
  run(): BacktestResult {
    // Process each closed candle
    for (let i = 1; i < this.candles.length; i++) {
      const candle = this.candles[i];
      const previousCandle = this.candles[i - 1];
      
      // Record equity curve
      const totalBalance = this.balance.plus(this.invested).plus(this.calculateUnrealizedPnl(candle.close));
      this.equityCurve.push({
        timestamp: candle.closeTime,
        balance: totalBalance.toNumber(),
      });

      // Check if we have a position
      if (this.position) {
        // Check DCA trigger
        this.checkDCATrigger(candle);
        
        // Check sell conditions
        this.checkSellConditions(candle);
      } else {
        // Check for new entry
        this.checkEntrySignal(candle, previousCandle);
      }
    }

    // Close any open position at the end
    if (this.position) {
      const lastCandle = this.candles[this.candles.length - 1];
      this.closePosition(lastCandle.close, lastCandle.closeTime, true);
    }

    return this.calculateResults();
  }

  /**
   * Check DCA trigger
   */
  private checkDCATrigger(candle: CandleData): void {
    if (!this.position) return;
    if (this.position.dcaOrders >= this.config.dcaSettings.maxBuyOrders) return;

    const triggerPrice = this.position.avgEntryPrice.mul(
      new Decimal(1).minus(new Decimal(this.config.dcaSettings.dcaTriggerPercent).div(100))
    );

    // Use low price to check if trigger was hit
    if (new Decimal(candle.low).lessThanOrEqualTo(triggerPrice)) {
      this.executeDCA(candle.close, candle.closeTime);
    }
  }

  /**
   * Execute DCA buy
   */
  private executeDCA(price: number, timestamp: number): void {
    if (!this.position) return;

    const buyAmount = new Decimal(this.config.dcaSettings.additionalBuy);
    const fee = buyAmount.mul(new Decimal(this.config.dcaSettings.tradingFeePercent).div(100));
    const totalCost = buyAmount.plus(fee);

    if (this.balance.lessThan(totalCost)) return;

    // Apply slippage
    const executionPrice = new Decimal(price).mul(
      new Decimal(1).plus(new Decimal(this.config.dcaSettings.slippagePercent).div(100))
    );

    const quantity = buyAmount.div(executionPrice);

    // Update position
    this.position.quantity = this.position.quantity.plus(quantity);
    this.position.totalCost = this.position.totalCost.plus(buyAmount);
    this.position.avgEntryPrice = this.position.totalCost.div(this.position.quantity);
    this.position.dcaOrders++;

    // Update balance
    this.balance = this.balance.minus(totalCost);
    this.invested = this.invested.plus(buyAmount);

    // Record trade
    this.trades.push({
      timestamp,
      type: 'DCA',
      price: executionPrice.toNumber(),
      quantity: quantity.toNumber(),
      total: buyAmount.toNumber(),
      fee: fee.toNumber(),
      dcaOrderNumber: this.position.dcaOrders,
    });
  }

  /**
   * Check sell conditions
   */
  private checkSellConditions(candle: CandleData): void {
    if (!this.position) return;

    const settings = this.config.dcaSettings;
    const profitTarget = this.position.avgEntryPrice.mul(
      new Decimal(1).plus(
        new Decimal(settings.profitTargetPercent)
          .plus(new Decimal(settings.tradingFeePercent).mul(2))
          .plus(new Decimal(settings.slippagePercent).mul(2))
      ).div(100)
    );

    // Check if high price reached profit target
    if (new Decimal(candle.high).greaterThanOrEqualTo(profitTarget)) {
      this.closePosition(candle.close, candle.closeTime, false);
    }
  }

  /**
   * Check entry signal (simplified RSI-based)
   */
  private checkEntrySignal(candle: CandleData, previousCandle: CandleData): void {
    // Simple entry condition: price dropped significantly
    const priceChange = new Decimal(candle.close).minus(previousCandle.close)
      .div(previousCandle.close).mul(100);

    if (priceChange.lessThan(-2)) { // 2% drop
      this.openPosition(candle.close, candle.closeTime);
    }
  }

  /**
   * Open new position
   */
  private openPosition(price: number, timestamp: number): void {
    const buyAmount = new Decimal(this.config.dcaSettings.initialBuy);
    const fee = buyAmount.mul(new Decimal(this.config.dcaSettings.tradingFeePercent).div(100));
    const totalCost = buyAmount.plus(fee);

    if (this.balance.lessThan(totalCost)) return;

    // Apply slippage
    const executionPrice = new Decimal(price).mul(
      new Decimal(1).plus(new Decimal(this.config.dcaSettings.slippagePercent).div(100))
    );

    const quantity = buyAmount.div(executionPrice);

    this.position = {
      coin: this.config.coin,
      quantity,
      avgEntryPrice: executionPrice,
      totalCost: buyAmount,
      dcaOrders: 1,
    };

    this.balance = this.balance.minus(totalCost);
    this.invested = this.invested.plus(buyAmount);

    this.trades.push({
      timestamp,
      type: 'BUY',
      price: executionPrice.toNumber(),
      quantity: quantity.toNumber(),
      total: buyAmount.toNumber(),
      fee: fee.toNumber(),
      dcaOrderNumber: 1,
    });
  }

  /**
   * Close position
   */
  private closePosition(price: number, timestamp: number, forceClose: boolean): void {
    if (!this.position) return;

    const settings = this.config.dcaSettings;
    
    // Apply slippage
    const executionPrice = new Decimal(price).mul(
      new Decimal(1).minus(new Decimal(settings.slippagePercent).div(100))
    );

    const grossProceeds = this.position.quantity.mul(executionPrice);
    const fee = grossProceeds.mul(new Decimal(settings.tradingFeePercent).div(100));
    const netProceeds = grossProceeds.minus(fee);
    const pnl = netProceeds.minus(this.position.totalCost);

    // Update balance
    this.balance = this.balance.plus(netProceeds);
    this.invested = this.invested.minus(this.position.totalCost);

    this.trades.push({
      timestamp,
      type: 'SELL',
      price: executionPrice.toNumber(),
      quantity: this.position.quantity.toNumber(),
      total: grossProceeds.toNumber(),
      fee: fee.toNumber(),
      pnl: pnl.toNumber(),
    });

    this.position = null;
  }

  /**
   * Calculate unrealized P/L
   */
  private calculateUnrealizedPnl(currentPrice: number): Decimal {
    if (!this.position) return new Decimal(0);

    const currentValue = this.position.quantity.mul(currentPrice);
    return currentValue.minus(this.position.totalCost);
  }

  /**
   * Calculate final results
   */
  private calculateResults(): BacktestResult {
    const finalBalance = this.balance.plus(this.invested);
    const totalPnl = finalBalance.minus(this.config.initialBalance);
    const totalPnlPercent = totalPnl.div(this.config.initialBalance).mul(100);

    const sellTrades = this.trades.filter(t => t.type === 'SELL');
    const winningTrades = sellTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = sellTrades.filter(t => (t.pnl || 0) < 0);

    const winRate = sellTrades.length > 0
      ? new Decimal(winningTrades.length).div(sellTrades.length).mul(100).toNumber()
      : 0;

    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = this.config.initialBalance;
    for (const point of this.equityCurve) {
      if (point.balance > peak) peak = point.balance;
      const drawdown = peak - point.balance;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    const maxDrawdownPercent = new Decimal(maxDrawdown).div(peak).mul(100).toNumber();

    // Calculate Sharpe ratio (simplified)
    const returns = this.equityCurve.slice(1).map((point, i) => {
      const prevBalance = this.equityCurve[i].balance;
      return (point.balance - prevBalance) / prevBalance;
    });
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Calculate duration
    const durationMs = this.candles[this.candles.length - 1].closeTime - this.candles[0].closeTime;
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    const duration = `${durationDays} days`;

    return {
      config: this.config,
      initialBalance: this.config.initialBalance,
      finalBalance: finalBalance.toNumber(),
      totalPnl: totalPnl.toNumber(),
      totalPnlPercent: totalPnlPercent.toNumber(),
      realizedPnl: sellTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      unrealizedPnl: 0,
      totalTrades: this.trades.length,
      buyCount: this.trades.filter(t => t.type === 'BUY').length,
      sellCount: sellTrades.length,
      dcaCount: this.trades.filter(t => t.type === 'DCA').length,
      winRate,
      profitFactor,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      trades: this.trades,
      equityCurve: this.equityCurve,
      duration,
    };
  }
}
