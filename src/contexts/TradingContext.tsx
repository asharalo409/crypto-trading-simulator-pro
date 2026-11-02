import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  WalletState, BotConfig, Position, Trade, MarketSignal,
  PortfolioSnapshot, DCASettings, SignalType, TradingMode
} from '../types';
import { TradingEngine } from '../engine/TradingEngine';
import { SUPPORTED_COINS, BASE_PRICES } from '../data/coins';

interface TradingContextType {
  wallet: WalletState;
  botConfig: BotConfig;
  positions: Position[];
  closedPositions: Position[];
  trades: Trade[];
  signals: MarketSignal[];
  snapshots: PortfolioSnapshot[];
  prices: Record<string, number>;
  engineLogs: string[];
  toggleBot: () => void;
  toggleNoLoss: () => void;
  setTradingMode: (mode: TradingMode) => void;
  updateDCASettings: (settings: Partial<DCASettings>) => void;
  resetEngine: () => void;
  manualBuy: (coin: string, amount: number) => { success: boolean; message: string };
  manualSell: (coin: string) => { success: boolean; message: string };
}

function generatePrice(base: number, volatility: number = 0.015): number {
  const change = (Math.random() - 0.48) * volatility;
  return Number((base * (1 + change)).toFixed(8));
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<TradingEngine | null>(null);
  const [wallet, setWallet] = useState<WalletState>({
    totalBalance: 10000,
    availableBalance: 10000,
    investedBalance: 0,
    totalPnl: 0,
    unrealizedPnl: 0,
    realizedPnl: 0,
    todayPnl: 0,
    totalTrades: 0,
    winRate: 0,
    buyCount: 0,
    sellCount: 0,
  });
  const [botConfig, setBotConfig] = useState<BotConfig>({
    isRunning: true,
    noLossSell: true,
    tradingMode: 'dca',
    dcaSettings: {
      initialBuy: 10,
      additionalBuy: 10,
      dcaTriggerPercent: 3,
      maxBuyOrders: 4,
      profitTargetPercent: 1.5,
      tradingFeePercent: 0.1,
      slippagePercent: 0.05,
    },
    maxInvestmentPerCoin: 1000,
    stopLossPercent: 5,
    takeProfitPercent: 3,
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [closedPositions, setClosedPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [engineLogs, setEngineLogs] = useState<string[]>([]);
  const [snapshots] = useState<PortfolioSnapshot[]>(() => {
    const data: PortfolioSnapshot[] = [];
    let balance = 10000;
    for (let i = 30; i >= 0; i--) {
      balance += (Math.random() - 0.4) * 30;
      data.push({ timestamp: Date.now() - i * 86400000, totalBalance: balance, pnl: balance - 10000 });
    }
    return data;
  });

  // Initialize engine
  useEffect(() => {
    const saved = localStorage.getItem('ctsp-engine');
    if (saved) {
      try {
        engineRef.current = TradingEngine.deserialize(saved);
      } catch {
        engineRef.current = new TradingEngine(10000);
      }
    } else {
      engineRef.current = new TradingEngine(10000);
    }
    syncState();
  }, []);

  const syncState = useCallback(() => {
    if (!engineRef.current) return;
    
    setWallet(engineRef.current.getWalletState());
    setBotConfig(engineRef.current.getConfig());
    setPositions(engineRef.current.getOpenPositions());
    setClosedPositions(engineRef.current.getClosedPositions());
    setTrades(engineRef.current.getTrades());
  }, []);

  const addLog = useCallback((message: string) => {
    setEngineLogs(prev => {
      const newLogs = [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev];
      return newLogs.slice(0, 50);
    });
  }, []);

  // Price update and tick processing
  useEffect(() => {
    const interval = setInterval(() => {
      if (!engineRef.current) return;

      const newPrices: Record<string, number> = {};
      SUPPORTED_COINS.forEach(coin => {
        newPrices[coin.symbol] = generatePrice(BASE_PRICES[coin.symbol]);
      });
      setPrices(newPrices);

      // Process tick
      const result = engineRef.current.processTick(newPrices);
      
      if (result.tradesExecuted.length > 0) {
        result.tradesExecuted.forEach(trade => {
          addLog(`${trade.side} ${trade.coin} @ $${trade.price.toFixed(4)} | Qty: ${trade.quantity.toFixed(6)} | P/L: $${trade.pnl.toFixed(2)}`);
        });
      }

      if (result.errors.length > 0) {
        result.errors.forEach(err => addLog(`⚠️ ${err}`));
      }

      // Generate signals for UI
      const newSignals: MarketSignal[] = SUPPORTED_COINS.map(coin => {
        const price = newPrices[coin.symbol] || BASE_PRICES[coin.symbol];
        const priceChange = ((price - BASE_PRICES[coin.symbol]) / BASE_PRICES[coin.symbol]) * 100;
        const signal = result.signals[coin.symbol] || 'WAIT';
        const history = (engineRef.current as any).priceHistory?.[coin.symbol] || [price];
        
        // Calculate indicators
        const rsi = history.length >= 15 
          ? Number((Math.random() * 40 + 30).toFixed(1))
          : 50;
        const ema20 = Number((price * (1 + (Math.random() - 0.5) * 0.01)).toFixed(6));
        const ema50 = Number((price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(6));
        const macd = Number(((Math.random() - 0.5) * price * 0.005).toFixed(6));

        const position = positions.find(p => p.coin === coin.symbol);
        
        return {
          coin: coin.symbol,
          signal,
          rsi,
          ema20,
          ema50,
          macd,
          volume: Number((Math.random() * 100000000).toFixed(0)),
          trend: priceChange > 1 ? 'UP' : priceChange < -1 ? 'DOWN' : 'SIDEWAYS',
          priceChange24h: Number(priceChange.toFixed(2)),
          currentPrice: price,
          oversold: rsi < 30,
          nextDcaPrice: position 
            ? Number((position.dcaOrders[position.dcaOrders.length - 1]?.price * 0.97 || price * 0.97).toFixed(6))
            : Number((price * 0.97).toFixed(6)),
          avgEntryPrice: position?.avgEntryPrice,
          profitTargetPrice: position?.profitTargetPrice,
        };
      });
      setSignals(newSignals);

      // Sync state
      syncState();

      // Persist engine state
      try {
        localStorage.setItem('ctsp-engine', engineRef.current.serialize());
      } catch (e) {
        // Storage full or unavailable
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [syncState, addLog, positions]);

  const toggleBot = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.toggleBot();
    syncState();
    addLog(engineRef.current.getConfig().isRunning ? '🟢 Bot Started' : '🔴 Bot Stopped');
  }, [syncState, addLog]);

  const toggleNoLoss = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.toggleNoLoss();
    syncState();
    addLog(`🛡️ No-Loss Sell: ${engineRef.current.getConfig().noLossSell ? 'ON' : 'OFF'}`);
  }, [syncState, addLog]);

  const setTradingMode = useCallback((mode: TradingMode) => {
    if (!engineRef.current) return;
    engineRef.current.updateConfig({ tradingMode: mode });
    syncState();
    addLog(`📊 Trading Mode: ${mode}`);
  }, [syncState, addLog]);

  const updateDCASettings = useCallback((settings: Partial<DCASettings>) => {
    if (!engineRef.current) return;
    engineRef.current.updateDCASettings(settings);
    syncState();
    addLog(`⚙️ DCA Settings Updated`);
  }, [syncState, addLog]);

  const resetEngine = useCallback(() => {
    localStorage.removeItem('ctsp-engine');
    engineRef.current = new TradingEngine(10000);
    syncState();
    setEngineLogs([]);
    addLog('🔄 Engine Reset - Starting fresh with $10,000');
  }, [syncState, addLog]);

  const manualBuy = useCallback((coin: string, amount: number) => {
    if (!engineRef.current) return { success: false, message: 'Engine not initialized' };
    const result = engineRef.current.executeBuy(coin, amount, false);
    syncState();
    if (result.success) {
      addLog(`📈 Manual BUY ${coin} @ $${result.trade!.price.toFixed(4)}`);
      return { success: true, message: `Bought ${coin} for $${amount}` };
    }
    addLog(`❌ Manual BUY failed: ${result.error}`);
    return { success: false, message: result.error || 'Buy failed' };
  }, [syncState, addLog]);

  const manualSell = useCallback((coin: string) => {
    if (!engineRef.current) return { success: false, message: 'Engine not initialized' };
    const result = engineRef.current.executeSell(coin, true);
    syncState();
    if (result.success) {
      addLog(`📉 Manual SELL ${coin} @ $${result.trade!.price.toFixed(4)} | P/L: $${result.trade!.pnl.toFixed(2)}`);
      return { success: true, message: `Sold ${coin}. P/L: $${result.trade!.pnl.toFixed(2)}` };
    }
    addLog(`❌ Manual SELL failed: ${result.error}`);
    return { success: false, message: result.error || 'Sell failed' };
  }, [syncState, addLog]);

  return (
    <TradingContext.Provider value={{
      wallet, botConfig, positions, closedPositions, trades, signals, snapshots, prices, engineLogs,
      toggleBot, toggleNoLoss, setTradingMode, updateDCASettings, resetEngine, manualBuy, manualSell
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

export { generateCandleData, generateEquityCurve } from './chartHelpers';
