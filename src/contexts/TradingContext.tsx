import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  WalletState, BotConfig, Position, Trade, MarketSignal,
  PortfolioSnapshot, DCASettings, SignalType, TradingMode
} from '../types';
import { SUPPORTED_COINS, BASE_PRICES } from '../data/coins';

interface TradingContextType {
  wallet: WalletState;
  botConfig: BotConfig;
  positions: Position[];
  trades: Trade[];
  signals: MarketSignal[];
  snapshots: PortfolioSnapshot[];
  prices: Record<string, number>;
  toggleBot: () => void;
  toggleNoLoss: () => void;
  setTradingMode: (mode: TradingMode) => void;
  updateDCASettings: (settings: Partial<DCASettings>) => void;
}

const defaultDCA: DCASettings = {
  initialBuy: 10,
  additionalBuy: 10,
  dcaTriggerPercent: 3,
  maxBuyOrders: 4,
  profitTargetPercent: 1.5,
  tradingFeePercent: 0.1,
  slippagePercent: 0.05,
};

const defaultWallet: WalletState = {
  totalBalance: 10000,
  availableBalance: 9750,
  investedBalance: 250,
  totalPnl: 47.82,
  unrealizedPnl: 12.35,
  realizedPnl: 35.47,
  todayPnl: 8.23,
  totalTrades: 28,
  winRate: 71.4,
  buyCount: 18,
  sellCount: 10,
};

const defaultBotConfig: BotConfig = {
  isRunning: true,
  noLossSell: true,
  tradingMode: 'dca',
  dcaSettings: defaultDCA,
};

function generatePrice(base: number, volatility: number = 0.02): number {
  const change = (Math.random() - 0.48) * volatility;
  return base * (1 + change);
}

function generateRSI(): number {
  return Math.random() * 100;
}

function generateSignal(rsi: number, priceChange: number): SignalType {
  if (rsi < 30 && priceChange < -2) return 'BUY';
  if (rsi > 70 && priceChange > 2) return 'SELL';
  if (rsi < 35) return 'DCA';
  if (Math.abs(priceChange) < 0.5) return 'HOLD';
  return 'WAIT';
}

function generateCandleData(basePrice: number, count: number = 100) {
  const data = [];
  let price = basePrice * 0.92;
  const now = Date.now();
  
  for (let i = count; i >= 0; i--) {
    const open = price;
    const volatility = basePrice * 0.015;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      time: Math.floor((now - i * 3600000) / 1000) as any,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
    
    price = close;
  }
  return data;
}

function generateEquityCurve() {
  const data = [];
  let balance = 10000;
  const now = Date.now();
  
  for (let i = 30; i >= 0; i--) {
    const change = (Math.random() - 0.4) * 50;
    balance += change;
    data.push({
      date: new Date(now - i * 86400000).toLocaleDateString(),
      balance: Number(balance.toFixed(2)),
      pnl: Number((balance - 10000).toFixed(2)),
    });
  }
  return data;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [botConfig, setBotConfig] = useState<BotConfig>(defaultBotConfig);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [positions] = useState<Position[]>([
    {
      id: '1',
      coin: 'AVAX',
      side: 'LONG',
      entryPrice: 36.80,
      quantity: 0.543,
      totalCost: 20,
      currentPrice: 38.5,
      unrealizedPnl: 0.92,
      unrealizedPnlPercent: 4.6,
      dcaOrders: [
        { id: 'd1', orderNumber: 1, price: 37.20, quantity: 0.269, cost: 10, fee: 0.01, timestamp: Date.now() - 86400000 },
        { id: 'd2', orderNumber: 2, price: 36.08, quantity: 0.277, cost: 10, fee: 0.01, timestamp: Date.now() - 43200000 },
      ],
      avgEntryPrice: 36.64,
      profitTargetPrice: 37.27,
      status: 'open',
    },
    {
      id: '2',
      coin: 'SOL',
      side: 'LONG',
      entryPrice: 172.50,
      quantity: 0.116,
      totalCost: 20,
      currentPrice: 178,
      unrealizedPnl: 0.64,
      unrealizedPnlPercent: 3.19,
      dcaOrders: [
        { id: 'd3', orderNumber: 1, price: 174.00, quantity: 0.057, cost: 10, fee: 0.01, timestamp: Date.now() - 172800000 },
        { id: 'd4', orderNumber: 2, price: 171.00, quantity: 0.059, cost: 10, fee: 0.01, timestamp: Date.now() - 86400000 },
      ],
      avgEntryPrice: 172.50,
      profitTargetPrice: 175.09,
      status: 'open',
    },
    {
      id: '3',
      coin: 'ETH',
      side: 'LONG',
      entryPrice: 3880,
      quantity: 0.0129,
      totalCost: 50,
      currentPrice: 3920,
      unrealizedPnl: 0.52,
      unrealizedPnlPercent: 1.03,
      dcaOrders: [
        { id: 'd5', orderNumber: 1, price: 3900, quantity: 0.0064, cost: 25, fee: 0.025, timestamp: Date.now() - 259200000 },
        { id: 'd6', orderNumber: 2, price: 3860, quantity: 0.0065, cost: 25, fee: 0.025, timestamp: Date.now() - 172800000 },
      ],
      avgEntryPrice: 3880,
      profitTargetPrice: 3919.36,
      status: 'open',
    },
  ]);
  const [trades] = useState<Trade[]>([
    { id: 't1', coin: 'AVAX', side: 'BUY', price: 37.20, quantity: 0.269, total: 10, fee: 0.01, pnl: 0, timestamp: Date.now() - 86400000, isDCA: false },
    { id: 't2', coin: 'AVAX', side: 'BUY', price: 36.08, quantity: 0.277, total: 10, fee: 0.01, pnl: 0, timestamp: Date.now() - 43200000, isDCA: true },
    { id: 't3', coin: 'SOL', side: 'BUY', price: 174.00, quantity: 0.057, total: 10, fee: 0.01, pnl: 0, timestamp: Date.now() - 172800000, isDCA: false },
    { id: 't4', coin: 'SOL', side: 'BUY', price: 171.00, quantity: 0.059, total: 10, fee: 0.01, pnl: 0, timestamp: Date.now() - 86400000, isDCA: true },
    { id: 't5', coin: 'DOGE', side: 'SELL', price: 0.235, quantity: 4255, total: 10, fee: 0.01, pnl: 0.82, timestamp: Date.now() - 259200000, isDCA: false },
    { id: 't6', coin: 'XRP', side: 'SELL', price: 2.52, quantity: 396, total: 10, fee: 0.01, pnl: 1.23, timestamp: Date.now() - 345600000, isDCA: false },
    { id: 't7', coin: 'LINK', side: 'SELL', price: 19.20, quantity: 5.2, total: 10, fee: 0.01, pnl: 0.55, timestamp: Date.now() - 432000000, isDCA: false },
    { id: 't8', coin: 'BTC', side: 'SELL', price: 105200, quantity: 0.00095, total: 10, fee: 0.01, pnl: 0.42, timestamp: Date.now() - 518400000, isDCA: false },
  ]);
  const [snapshots] = useState<PortfolioSnapshot[]>(() => {
    const data: PortfolioSnapshot[] = [];
    let balance = 10000;
    for (let i = 30; i >= 0; i--) {
      balance += (Math.random() - 0.4) * 30;
      data.push({ timestamp: Date.now() - i * 86400000, totalBalance: balance, pnl: balance - 10000 });
    }
    return data;
  });

  // Update prices periodically
  useEffect(() => {
    const updatePrices = () => {
      const newPrices: Record<string, number> = {};
      SUPPORTED_COINS.forEach(coin => {
        const base = BASE_PRICES[coin.symbol];
        newPrices[coin.symbol] = generatePrice(base);
      });
      setPrices(newPrices);

      // Generate signals
      const newSignals: MarketSignal[] = SUPPORTED_COINS.map(coin => {
        const price = newPrices[coin.symbol] || BASE_PRICES[coin.symbol];
        const priceChange = ((price - BASE_PRICES[coin.symbol]) / BASE_PRICES[coin.symbol]) * 100;
        const rsi = generateRSI();
        const signal = generateSignal(rsi, priceChange);
        
        return {
          coin: coin.symbol,
          signal,
          rsi: Number(rsi.toFixed(1)),
          ema20: Number((price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(4)),
          ema50: Number((price * (1 + (Math.random() - 0.5) * 0.04)).toFixed(4)),
          macd: Number(((Math.random() - 0.5) * price * 0.01).toFixed(4)),
          volume: Number((Math.random() * 100000000).toFixed(0)),
          trend: priceChange > 1 ? 'UP' : priceChange < -1 ? 'DOWN' : 'SIDEWAYS',
          priceChange24h: Number(priceChange.toFixed(2)),
          currentPrice: price,
          oversold: rsi < 30,
          nextDcaPrice: Number((price * 0.97).toFixed(4)),
          avgEntryPrice: positions.find(p => p.coin === coin.symbol)?.avgEntryPrice,
          profitTargetPrice: positions.find(p => p.coin === coin.symbol)?.profitTargetPrice,
        };
      });
      setSignals(newSignals);
    };

    updatePrices();
    const interval = setInterval(updatePrices, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleBot = useCallback(() => {
    setBotConfig(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const toggleNoLoss = useCallback(() => {
    setBotConfig(prev => ({ ...prev, noLossSell: !prev.noLossSell }));
  }, []);

  const setTradingMode = useCallback((mode: TradingMode) => {
    setBotConfig(prev => ({ ...prev, tradingMode: mode }));
  }, []);

  const updateDCASettings = useCallback((settings: Partial<DCASettings>) => {
    setBotConfig(prev => ({
      ...prev,
      dcaSettings: { ...prev.dcaSettings, ...settings }
    }));
  }, []);

  return (
    <TradingContext.Provider value={{
      wallet, botConfig, positions, trades, signals, snapshots, prices,
      toggleBot, toggleNoLoss, setTradingMode, updateDCASettings
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be used within TradingProvider');
  return context;
}

export { generateCandleData, generateEquityCurve };
