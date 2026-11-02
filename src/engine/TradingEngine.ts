/**
 * TradingEngine - Core paper trading engine
 * Handles BUY/SELL execution, DCA strategy, No-Loss Hold mode
 * All calculations use Decimal.js for precision
 * 
 * IMPORTANT: This is a SIMULATION engine. No real orders are placed.
 */
import Decimal from 'decimal.js';
import { PaperWallet } from './PaperWallet';
import { MarketAnalyzer } from './MarketAnalyzer';
import {
  Position, DCAOrder, Trade, BotConfig, DCASettings,
  TradeResult, WalletState, SignalType
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface EngineTickResult {
  tradesExecuted: Trade[];
  positionsUpdated: Position[];
  errors: string[];
  signals: Record<string, SignalType>;
}

export class TradingEngine {
  private wallet: PaperWallet;
  private positions: Position[];
  private closedPositions: Position[];
  private trades: Trade[];
  private config: BotConfig;
  private processedCandleIds: Set<string>;
  private priceHistory: Record<string, number[]>;

  constructor(
    initialBalance: number = 10000,
    config?: Partial<BotConfig>,
    existingPositions?: Position[],
    existingTrades?: Trade[],
    existingClosedPositions?: Position[]
  ) {
    this.wallet = new PaperWallet(initialBalance);
    this.positions = existingPositions || [];
    this.closedPositions = existingClosedPositions || [];
    this.trades = existingTrades || [];
    this.processedCandleIds = new Set();
    this.priceHistory = {};

    const defaultDCA: DCASettings = {
      initialBuy: 10,
      additionalBuy: 10,
      dcaTriggerPercent: 3,
      maxBuyOrders: 4,
      profitTargetPercent: 1.5,
      tradingFeePercent: 0.1,
      slippagePercent: 0.05,
    };

    this.config = {
      isRunning: true,
      noLossSell: true,
      tradingMode: 'dca',
      dcaSettings: defaultDCA,
      maxInvestmentPerCoin: 1000,
      stopLossPercent: 5,
      takeProfitPercent: 3,
      ...config,
    };
  }

  // ==================== GETTERS ====================

  getWalletState(): WalletState {
    const balance = this.wallet.getBalance();
    const openPositions = this.positions.filter(p => p.status === 'open');
    const totalTrades = this.trades.length;
    const winningTrades = this.trades.filter(t => t.side === 'SELL' && t.pnl > 0).length;
    const sellTrades = this.trades.filter(t => t.side === 'SELL').length;

    return {
      totalBalance: this.wallet.getTotalBalance(),
      availableBalance: this.wallet.getAvailableBalance(),
      investedBalance: this.wallet.getInvestedBalance(),
      totalPnl: new Decimal(this.wallet.getRealizedPnl())
        .plus(this.wallet.getUnrealizedPnl())
        .toDecimalPlaces(2)
        .toNumber(),
      unrealizedPnl: this.wallet.getUnrealizedPnl(),
      realizedPnl: this.wallet.getRealizedPnl(),
      todayPnl: this.wallet.getTodayPnl(),
      totalTrades,
      winRate: sellTrades > 0 
        ? new Decimal(winningTrades).div(sellTrades).mul(100).toDecimalPlaces(1).toNumber()
        : 0,
      buyCount: this.trades.filter(t => t.side === 'BUY').length,
      sellCount: sellTrades,
    };
  }

  getPositions(): Position[] {
    return this.positions;
  }

  getOpenPositions(): Position[] {
    return this.positions.filter(p => p.status === 'open');
  }

  getClosedPositions(): Position[] {
    return this.closedPositions;
  }

  getTrades(): Trade[] {
    return [...this.trades].sort((a, b) => b.timestamp - a.timestamp);
  }

  getConfig(): BotConfig {
    return { ...this.config };
  }

  // ==================== PRICE MANAGEMENT ====================

  updatePriceHistory(coin: string, price: number): void {
    if (!this.priceHistory[coin]) {
      this.priceHistory[coin] = [];
    }
    this.priceHistory[coin].push(price);
    // Keep last 100 prices
    if (this.priceHistory[coin].length > 100) {
      this.priceHistory[coin] = this.priceHistory[coin].slice(-100);
    }
  }

  getCurrentPrice(coin: string): number {
    const history = this.priceHistory[coin];
    return history && history.length > 0 ? history[history.length - 1] : 0;
  }

  // ==================== CORE TRADING LOGIC ====================

  /**
   * Execute a BUY order
   * Calculates quantity, fees, slippage using Decimal.js
   */
  executeBuy(coin: string, amount: number, isDCA: boolean = false, dcaOrderNumber?: number): TradeResult {
    const currentPrice = this.getCurrentPrice(coin);
    if (currentPrice <= 0) {
      return { success: false, error: 'Invalid price' };
    }

    const settings = this.config.dcaSettings;

    // Check if position already exists
    const existingPosition = this.positions.find(p => p.coin === coin && p.status === 'open');

    // Check max investment limit
    if (existingPosition) {
      const totalInvested = new Decimal(existingPosition.totalCost).plus(amount);
      if (totalInvested.greaterThan(this.config.maxInvestmentPerCoin)) {
        return { success: false, error: 'Max investment limit reached for this coin' };
      }
    }

    // Check max DCA orders
    if (isDCA && existingPosition) {
      if (existingPosition.dcaOrders.length >= settings.maxBuyOrders) {
        return { success: false, error: 'Maximum DCA orders reached' };
      }
    }

    // Check available balance
    const feeAmount = new Decimal(amount)
      .mul(new Decimal(settings.tradingFeePercent).div(100));
    const totalCost = new Decimal(amount).plus(feeAmount);

    if (!this.wallet.hasSufficientFunds(totalCost.toNumber())) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Apply slippage
    const slippageMultiplier = new Decimal(1).plus(
      new Decimal(settings.slippagePercent).div(100)
    );
    const executionPrice = new Decimal(currentPrice).mul(slippageMultiplier).toDecimalPlaces(8).toNumber();

    // Calculate quantity
    const quantity = new Decimal(amount)
      .div(new Decimal(executionPrice))
      .toDecimalPlaces(8)
      .toNumber();

    // Deduct from wallet
    const deduction = this.wallet.deductForBuy(amount, settings.tradingFeePercent);
    if (!deduction.success) {
      return { success: false, error: 'Wallet deduction failed' };
    }

    // Create trade record
    const trade: Trade = {
      id: uuidv4(),
      coin,
      side: 'BUY',
      price: executionPrice,
      quantity,
      total: amount,
      fee: deduction.fee,
      pnl: 0,
      timestamp: Date.now(),
      isDCA,
      positionId: existingPosition?.id || uuidv4(),
      dcaOrderNumber: dcaOrderNumber || (existingPosition ? existingPosition.dcaOrders.length + 1 : 1),
    };

    // Create or update position
    if (existingPosition) {
      // Add DCA order
      const dcaOrder: DCAOrder = {
        id: uuidv4(),
        orderNumber: trade.dcaOrderNumber!,
        price: executionPrice,
        quantity,
        cost: amount,
        fee: deduction.fee,
        timestamp: trade.timestamp,
      };

      existingPosition.dcaOrders.push(dcaOrder);
      
      // Recalculate average entry price
      const totalQuantity = new Decimal(existingPosition.quantity).plus(quantity);
      const totalCostAll = new Decimal(existingPosition.totalCost).plus(amount);
      const avgEntry = totalCostAll.div(totalQuantity).toDecimalPlaces(8).toNumber();

      existingPosition.quantity = totalQuantity.toNumber();
      existingPosition.totalCost = totalCostAll.toNumber();
      existingPosition.avgEntryPrice = avgEntry;
      existingPosition.entryPrice = avgEntry;

      // Recalculate profit target
      existingPosition.profitTargetPrice = this.calculateProfitTarget(avgEntry, settings);
    } else {
      // Create new position
      const profitTarget = this.calculateProfitTarget(executionPrice, settings);
      const newPosition: Position = {
        id: trade.positionId,
        coin,
        side: 'LONG',
        entryPrice: executionPrice,
        quantity,
        totalCost: amount,
        currentPrice,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        dcaOrders: [{
          id: uuidv4(),
          orderNumber: 1,
          price: executionPrice,
          quantity,
          cost: amount,
          fee: deduction.fee,
          timestamp: trade.timestamp,
        }],
        avgEntryPrice: executionPrice,
        profitTargetPrice: profitTarget,
        status: 'open',
        openedAt: trade.timestamp,
      };
      this.positions.push(newPosition);
    }

    this.trades.push(trade);
    this.updateUnrealizedPnl();

    return { success: true, trade };
  }

  /**
   * Execute a SELL order
   * Only sells if profit target is met (when No-Loss mode is ON)
   */
  executeSell(coin: string, forceSell: boolean = false): TradeResult {
    const position = this.positions.find(p => p.coin === coin && p.status === 'open');
    if (!position) {
      return { success: false, error: 'No open position for this coin' };
    }

    const currentPrice = this.getCurrentPrice(coin);
    if (currentPrice <= 0) {
      return { success: false, error: 'Invalid price' };
    }

    const settings = this.config.dcaSettings;

    // Apply slippage (sell at slightly lower price)
    const slippageMultiplier = new Decimal(1).minus(
      new Decimal(settings.slippagePercent).div(100)
    );
    const executionPrice = new Decimal(currentPrice).mul(slippageMultiplier).toDecimalPlaces(8).toNumber();

    // Calculate gross proceeds
    const grossProceeds = new Decimal(position.quantity).mul(executionPrice);
    const feeAmount = grossProceeds.mul(new Decimal(settings.tradingFeePercent).div(100));
    const netProceeds = grossProceeds.minus(feeAmount);

    // Calculate P/L
    const pnl = netProceeds.minus(new Decimal(position.totalCost)).toDecimalPlaces(4).toNumber();

    // No-Loss Hold Mode check
    if (this.config.noLossSell && !forceSell) {
      if (pnl <= 0) {
        return { 
          success: false, 
          error: `No-Loss Mode: Cannot sell at loss. P/L: $${pnl.toFixed(2)}. Target: $${position.profitTargetPrice.toFixed(4)}`
        };
      }

      // Check if profit target is met
      if (executionPrice < position.profitTargetPrice) {
        return {
          success: false,
          error: `Profit target not met. Current: $${executionPrice.toFixed(4)}, Target: $${position.profitTargetPrice.toFixed(4)}`
        };
      }
    }

    // Stop Loss check (only when No-Loss is OFF)
    if (!this.config.noLossSell) {
      const lossPercent = new Decimal(position.avgEntryPrice).minus(currentPrice)
        .div(position.avgEntryPrice).mul(100).toNumber();
      
      if (lossPercent >= this.config.stopLossPercent) {
        // Stop loss triggered - allow sell even at loss
        // Continue with sell
      }
    }

    // Execute sell
    const sellResult = this.wallet.addFromSell(grossProceeds.toNumber(), settings.tradingFeePercent);

    // Record realized P/L
    this.wallet.recordRealizedPnl(pnl);
    this.wallet.releaseInvested(position.totalCost);

    // Create trade record
    const trade: Trade = {
      id: uuidv4(),
      coin,
      side: 'SELL',
      price: executionPrice,
      quantity: position.quantity,
      total: grossProceeds.toDecimalPlaces(4).toNumber(),
      fee: sellResult.fee,
      pnl,
      timestamp: Date.now(),
      isDCA: false,
      positionId: position.id,
    };

    // Close position
    position.status = 'closed';
    position.closedAt = trade.timestamp;
    position.realizedPnl = pnl;
    position.currentPrice = currentPrice;

    // Move to closed positions
    this.closedPositions.push({ ...position });
    this.positions = this.positions.filter(p => p.id !== position.id);

    this.trades.push(trade);
    this.updateUnrealizedPnl();

    return { success: true, trade };
  }

  /**
   * Process a market tick - check all positions and signals
   */
  processTick(prices: Record<string, number>): EngineTickResult {
    const result: EngineTickResult = {
      tradesExecuted: [],
      positionsUpdated: [],
      errors: [],
      signals: {},
    };

    if (!this.config.isRunning) {
      return result;
    }

    // Update price history
    for (const [coin, price] of Object.entries(prices)) {
      this.updatePriceHistory(coin, price);
    }

    // Check each coin for trading opportunities
    for (const [coin, price] of Object.entries(prices)) {
      try {
        const history = this.priceHistory[coin];
        if (!history || history.length < 20) continue;

        const indicators = MarketAnalyzer.getIndicators(history);
        const priceChange24h = this.calculate24hChange(history);
        const signal = MarketAnalyzer.generateSignal(indicators, price, priceChange24h);
        result.signals[coin] = signal;

        // Check existing positions
        const position = this.positions.find(p => p.coin === coin && p.status === 'open');

        if (position) {
          // Update position current price and unrealized P/L
          this.updatePositionPnl(position, price);
          result.positionsUpdated.push(position);

          // Check DCA trigger
          if (signal === 'DCA' || this.shouldDCA(position, price)) {
            const dcaResult = this.executeDCA(coin, price, position);
            if (dcaResult.success && dcaResult.trade) {
              result.tradesExecuted.push(dcaResult.trade);
            }
          }

          // Check sell conditions
          if (this.shouldSell(position, price, signal)) {
            const sellResult = this.executeSell(coin);
            if (sellResult.success && sellResult.trade) {
              result.tradesExecuted.push(sellResult.trade);
            }
          }
        } else {
          // No position - check for new entry
          if (signal === 'BUY' && this.config.tradingMode === 'dca') {
            const buyResult = this.executeBuy(coin, this.config.dcaSettings.initialBuy, false);
            if (buyResult.success && buyResult.trade) {
              result.tradesExecuted.push(buyResult.trade);
            }
          }
        }
      } catch (error) {
        result.errors.push(`Error processing ${coin}: ${error}`);
      }
    }

    return result;
  }

  // ==================== DCA LOGIC ====================

  /**
   * Check if DCA should be triggered
   */
  private shouldDCA(position: Position, currentPrice: number): boolean {
    const settings = this.config.dcaSettings;

    // Max orders check
    if (position.dcaOrders.length >= settings.maxBuyOrders) return false;

    // Get last buy price
    const lastBuy = position.dcaOrders[position.dcaOrders.length - 1];
    const triggerPrice = new Decimal(lastBuy.price)
      .mul(new Decimal(1).minus(new Decimal(settings.dcaTriggerPercent).div(100)))
      .toNumber();

    return currentPrice <= triggerPrice;
  }

  /**
   * Execute DCA buy
   */
  private executeDCA(coin: string, currentPrice: number, position: Position): TradeResult {
    const settings = this.config.dcaSettings;
    const orderNumber = position.dcaOrders.length + 1;

    return this.executeBuy(coin, settings.additionalBuy, true, orderNumber);
  }

  // ==================== SELL LOGIC ====================

  /**
   * Check if position should be sold
   */
  private shouldSell(position: Position, currentPrice: number, signal: SignalType): boolean {
    const settings = this.config.dcaSettings;

    if (this.config.noLossSell) {
      // No-Loss mode: only sell at profit
      const slippageMultiplier = new Decimal(1).minus(
        new Decimal(settings.slippagePercent).div(100)
      );
      const executionPrice = new Decimal(currentPrice).mul(slippageMultiplier).toNumber();
      
      return executionPrice >= position.profitTargetPrice;
    } else {
      // Normal mode: check stop loss and take profit
      const pnlPercent = new Decimal(currentPrice).minus(position.avgEntryPrice)
        .div(position.avgEntryPrice).mul(100).toNumber();

      // Take profit
      if (pnlPercent >= this.config.takeProfitPercent) return true;

      // Stop loss
      if (pnlPercent <= -this.config.stopLossPercent) return true;

      // Signal-based sell
      if (signal === 'SELL' && pnlPercent > 0) return true;

      return false;
    }
  }

  // ==================== CALCULATIONS ====================

  /**
   * Calculate profit target price including fees and slippage
   */
  private calculateProfitTarget(avgEntryPrice: number, settings: DCASettings): number {
    const entry = new Decimal(avgEntryPrice);
    
    // Total fees (buy + sell)
    const totalFeePercent = new Decimal(settings.tradingFeePercent).mul(2);
    
    // Total slippage (buy + sell)
    const totalSlippagePercent = new Decimal(settings.slippagePercent).mul(2);
    
    // Profit target
    const profitPercent = new Decimal(settings.profitTargetPercent);
    
    // Required price increase
    const requiredIncrease = totalFeePercent.plus(totalSlippagePercent).plus(profitPercent);
    
    const targetPrice = entry.mul(
      new Decimal(1).plus(requiredIncrease.div(100))
    ).toDecimalPlaces(8).toNumber();

    return targetPrice;
  }

  /**
   * Update position unrealized P/L
   */
  private updatePositionPnl(position: Position, currentPrice: number): void {
    position.currentPrice = currentPrice;
    
    const currentValue = new Decimal(position.quantity).mul(currentPrice);
    const unrealizedPnl = currentValue.minus(new Decimal(position.totalCost)).toDecimalPlaces(4).toNumber();
    const unrealizedPnlPercent = new Decimal(unrealizedPnl)
      .div(new Decimal(position.totalCost))
      .mul(100)
      .toDecimalPlaces(2)
      .toNumber();

    position.unrealizedPnl = unrealizedPnl;
    position.unrealizedPnlPercent = unrealizedPnlPercent;
  }

  /**
   * Update all positions' unrealized P/L
   */
  private updateUnrealizedPnl(): void {
    let totalUnrealized = 0;
    for (const position of this.positions) {
      if (position.status === 'open') {
        totalUnrealized += position.unrealizedPnl;
      }
    }
    this.wallet.updateUnrealizedPnl(totalUnrealized);
  }

  /**
   * Calculate 24h price change percentage
   */
  private calculate24hChange(history: number[]): number {
    if (history.length < 2) return 0;
    const recent = history.slice(-24); // Assuming hourly data
    if (recent.length < 2) return 0;
    
    const change = new Decimal(recent[recent.length - 1])
      .minus(recent[0])
      .div(recent[0])
      .mul(100)
      .toDecimalPlaces(2)
      .toNumber();
    
    return change;
  }

  // ==================== CONFIGURATION ====================

  updateConfig(newConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  updateDCASettings(settings: Partial<DCASettings>): void {
    this.config.dcaSettings = { ...this.config.dcaSettings, ...settings };
    
    // Recalculate profit targets for all open positions
    for (const position of this.positions) {
      if (position.status === 'open') {
        position.profitTargetPrice = this.calculateProfitTarget(
          position.avgEntryPrice,
          this.config.dcaSettings
        );
      }
    }
  }

  toggleBot(): void {
    this.config.isRunning = !this.config.isRunning;
  }

  toggleNoLoss(): void {
    this.config.noLossSell = !this.config.noLossSell;
  }

  // ==================== PERSISTENCE ====================

  serialize(): string {
    return JSON.stringify({
      wallet: this.wallet.serialize(),
      positions: this.positions,
      closedPositions: this.closedPositions,
      trades: this.trades,
      config: this.config,
      priceHistory: this.priceHistory,
    });
  }

  static deserialize(data: string): TradingEngine {
    const parsed = JSON.parse(data);
    const wallet = PaperWallet.deserialize(parsed.wallet);
    
    const engine = new TradingEngine(0);
    (engine as any).wallet = wallet;
    engine.positions = parsed.positions || [];
    engine.closedPositions = parsed.closedPositions || [];
    engine.trades = parsed.trades || [];
    engine.config = parsed.config || engine.config;
    engine.priceHistory = parsed.priceHistory || {};
    
    return engine;
  }
}
