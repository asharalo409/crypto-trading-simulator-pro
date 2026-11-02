export type Theme = 'cyberpunk' | 'binance' | 'tokyo' | 'matrix' | 'oled';
export type Language = 'bn' | 'en';
export type TradingMode = 'smart-trend' | 'scalping' | 'no-loss-hold' | 'dca';
export type SignalType = 'BUY' | 'SELL' | 'HOLD' | 'DCA' | 'WAIT';

export interface Coin {
  symbol: string;
  name: string;
  icon: string;
  pair: string;
}

export interface Position {
  id: string;
  coin: string;
  side: 'LONG';
  entryPrice: number;
  quantity: number;
  totalCost: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  dcaOrders: DCAOrder[];
  avgEntryPrice: number;
  profitTargetPrice: number;
  status: 'open' | 'closed';
}

export interface DCAOrder {
  id: string;
  orderNumber: number;
  price: number;
  quantity: number;
  cost: number;
  fee: number;
  timestamp: number;
}

export interface Trade {
  id: string;
  coin: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  total: number;
  fee: number;
  pnl: number;
  timestamp: number;
  isDCA: boolean;
}

export interface MarketSignal {
  coin: string;
  signal: SignalType;
  rsi: number;
  ema20: number;
  ema50: number;
  macd: number;
  volume: number;
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  priceChange24h: number;
  currentPrice: number;
  oversold: boolean;
  nextDcaPrice?: number;
  avgEntryPrice?: number;
  profitTargetPrice?: number;
}

export interface WalletState {
  totalBalance: number;
  availableBalance: number;
  investedBalance: number;
  totalPnl: number;
  unrealizedPnl: number;
  realizedPnl: number;
  todayPnl: number;
  totalTrades: number;
  winRate: number;
  buyCount: number;
  sellCount: number;
}

export interface DCASettings {
  initialBuy: number;
  additionalBuy: number;
  dcaTriggerPercent: number;
  maxBuyOrders: number;
  profitTargetPercent: number;
  tradingFeePercent: number;
  slippagePercent: number;
}

export interface BotConfig {
  isRunning: boolean;
  noLossSell: boolean;
  tradingMode: TradingMode;
  dcaSettings: DCASettings;
}

export interface PortfolioSnapshot {
  timestamp: number;
  totalBalance: number;
  pnl: number;
}
