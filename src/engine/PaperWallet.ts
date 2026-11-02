/**
 * PaperWallet - Virtual wallet management for paper trading
 * Uses Decimal.js for precision calculations
 */
import Decimal from 'decimal.js';

export interface WalletBalance {
  totalBalance: Decimal;
  availableBalance: Decimal;
  investedBalance: Decimal;
  realizedPnl: Decimal;
  unrealizedPnl: Decimal;
}

export class PaperWallet {
  private balance: Decimal;
  private invested: Decimal;
  private realizedPnl: Decimal;
  private unrealizedPnl: Decimal;
  private initialBalance: Decimal;

  constructor(initialBalance: number = 10000) {
    this.initialBalance = new Decimal(initialBalance);
    this.balance = new Decimal(initialBalance);
    this.invested = new Decimal(0);
    this.realizedPnl = new Decimal(0);
    this.unrealizedPnl = new Decimal(0);
  }

  getBalance(): WalletBalance {
    return {
      totalBalance: this.balance.plus(this.invested).plus(this.unrealizedPnl),
      availableBalance: this.balance,
      investedBalance: this.invested,
      realizedPnl: this.realizedPnl,
      unrealizedPnl: this.unrealizedPnl,
    };
  }

  getTotalBalance(): number {
    return this.balance.plus(this.invested).plus(this.unrealizedPnl).toNumber();
  }

  getAvailableBalance(): number {
    return this.balance.toNumber();
  }

  getInvestedBalance(): number {
    return this.invested.toNumber();
  }

  getRealizedPnl(): number {
    return this.realizedPnl.toNumber();
  }

  getUnrealizedPnl(): number {
    return this.unrealizedPnl.toNumber();
  }

  getTodayPnl(): number {
    // Simplified: returns realized + unrealized
    return this.realizedPnl.plus(this.unrealizedPnl).toNumber();
  }

  /**
   * Deduct funds for a BUY order
   * Returns the actual amount deducted (including fees)
   */
  deductForBuy(amount: number, feePercent: number): { success: boolean; deducted: number; fee: number } {
    const amountDec = new Decimal(amount);
    const feeDec = amountDec.mul(new Decimal(feePercent).div(100));
    const totalDeducted = amountDec.plus(feeDec);

    if (this.balance.lessThan(totalDeducted)) {
      return { success: false, deducted: 0, fee: 0 };
    }

    this.balance = this.balance.minus(totalDeducted);
    this.invested = this.invested.plus(amountDec);

    return {
      success: true,
      deducted: totalDeducted.toNumber(),
      fee: feeDec.toNumber(),
    };
  }

  /**
   * Add funds from a SELL order
   * Returns the actual amount received (after fees)
   */
  addFromSell(grossAmount: number, feePercent: number): { received: number; fee: number } {
    const grossDec = new Decimal(grossAmount);
    const feeDec = grossDec.mul(new Decimal(feePercent).div(100));
    const netReceived = grossDec.minus(feeDec);

    this.balance = this.balance.plus(netReceived);

    return {
      received: netReceived.toNumber(),
      fee: feeDec.toNumber(),
    };
  }

  /**
   * Record realized profit/loss from closing a position
   */
  recordRealizedPnl(pnl: number): void {
    this.realizedPnl = this.realizedPnl.plus(new Decimal(pnl));
  }

  /**
   * Update unrealized P/L based on current positions
   */
  updateUnrealizedPnl(totalUnrealized: number): void {
    this.unrealizedPnl = new Decimal(totalUnrealized);
  }

  /**
   * Release invested amount when position is closed
   */
  releaseInvested(amount: number): void {
    this.invested = this.invested.minus(new Decimal(amount));
    if (this.invested.lessThan(0)) {
      this.invested = new Decimal(0);
    }
  }

  /**
   * Check if wallet has sufficient funds
   */
  hasSufficientFunds(amount: number): boolean {
    return this.balance.greaterThanOrEqualTo(new Decimal(amount));
  }

  /**
   * Serialize wallet state for persistence
   */
  serialize(): string {
    return JSON.stringify({
      balance: this.balance.toString(),
      invested: this.invested.toString(),
      realizedPnl: this.realizedPnl.toString(),
      unrealizedPnl: this.unrealizedPnl.toString(),
      initialBalance: this.initialBalance.toString(),
    });
  }

  /**
   * Restore wallet from serialized state
   */
  static deserialize(data: string): PaperWallet {
    const parsed = JSON.parse(data);
    const wallet = new PaperWallet(0);
    wallet.balance = new Decimal(parsed.balance);
    wallet.invested = new Decimal(parsed.invested);
    wallet.realizedPnl = new Decimal(parsed.realizedPnl);
    wallet.unrealizedPnl = new Decimal(parsed.unrealizedPnl);
    wallet.initialBalance = new Decimal(parsed.initialBalance);
    return wallet;
  }
}
