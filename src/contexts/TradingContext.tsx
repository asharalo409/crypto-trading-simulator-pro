import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  WalletState, BotConfig, Position, Trade, MarketSignal,
  PortfolioSnapshot, DCASettings, SignalType, TradingMode
} from '../types';
import { TradingEngine } from '../engine/TradingEngine';
import { SUPPORTED_COINS, BASE_PRICES } from '../data/coins';
import { marketDataService } from '../services/BinanceAPI';

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
    const updatePrices = async () => {
      if (!engineRef.current) return;

      try {
        // Fetch real prices from Binance API with fallback
        const newPrices = await marketDataService.getAllPrices();
        
        // Fill in any missing prices with base prices
        SUPPORTED_COINS.forEach(coin => {
          if (!newPrices[coin.symbol]) {
            newPrices[coin.symbol] = BASE_PRICES[coin.symbol];
          }
        });
        
        setPrices(newPrices);

        // Process tick with real prices
        const result = engineRef.current.processTick(newPrices);
        
        if (result.tradesExecuted.length > 0) {
          result.tradesExecuted.forEach(trade => {
            addLog(`${trade.side} ${trade.coin} @ $${trade.price.toFixed(4)} | Qty: ${trade.quantity.toFixed(6)} | P/L: $${trade.pnl.toFixed(2)}`);
          });
        }

        if (result.errors.length > 0) {
          result.errors.forEach(err => addLog(`⚠️ ${err}`));
        }

        // Generate signals for UI using real candle data
        const newSignals: MarketSignal[] = await Promise.all(
          SUPPORTED_COINS.map(async (coin) => {
            const price = newPrices[coin.symbol] || BASE_PRICES[coin.symbol];
            const signal = result.signals[coin.symbol] || 'WAIT';
            
            // Fetch real candle data for technical analysis
            let rsi = 50;
            let ema20 = price;
            let ema50 = price;
            let macd = 0;
            let volume = 0;
            let priceChange24h = 0;
            
            try {
              const candles = await marketDataService.getKlines(coin.symbol, '1h', 100);
              if (candles.length > 0) {
                const closes = candles.map(c => c.close);
                
                // Calculate RSI from real data
                if (closes.length >= 15) {
                  const gains: number[] = [];
                  const losses: number[] = [];
                  for (let i = 1; i < closes.length; i++) {
                    const change = closes[i] - closes[i - 1];
                    if (change > 0) gains.push(change);
                    else losses.push(Math.abs(change));
                  }
                  const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
                  const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
                  if (avgLoss > 0) {
                    const rs = avgGain / avgLoss;
                    rsi = 100 - (100 / (1 + rs));
                  }
                }
                
                // Calculate EMA from real data
                if (closes.length >= 20) {
                  const multiplier = 2 / (20 + 1);
                  ema20 = closes.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
                  for (let i = 20; i < closes.length; i++) {
                    ema20 = (closes[i] - ema20) * multiplier + ema20;
                  }
                }
                
                if (closes.length >= 50) {
                  const multiplier = 2 / (50 + 1);
                  ema50 = closes.slice(0, 50).reduce((a, b) => a + b, 0) / 50;
                  for (let i = 50; i < closes.length; i++) {
                    ema50 = (closes[i] - ema50) * multiplier + ema50;
                  }
                }
                
                // Calculate MACD from real data
                if (closes.length >= 26) {
                  const ema12 = closes.slice(-12).reduce((a, b) => a + b, 0) / 12;
                  const ema26Val = closes.slice(-26).reduce((a, b) => a + b, 0) / 26;
                  macd = ema12 - ema26Val;
                }
                
                // Get volume from latest candle
                volume = candles[candles.length - 1].volume;
                
                // Calculate 24h price change
                if (closes.length >= 24) {
                  const price24hAgo = closes[closes.length - 24];
                  priceChange24h = ((price - price24hAgo) / price24hAgo) * 100;
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch candles for ${coin.symbol}:`, error);
            }

            const position = positions.find(p => p.coin === coin.symbol);
            
            return {
              coin: coin.symbol,
              signal,
              rsi: Number(rsi.toFixed(1)),
              ema20: Number(ema20.toFixed(6)),
              ema50: Number(ema50.toFixed(6)),
              macd: Number(macd.toFixed(6)),
              volume: Number(volume.toFixed(0)),
              trend: priceChange24h > 1 ? 'UP' : priceChange24h < -1 ? 'DOWN' : 'SIDEWAYS',
              priceChange24h: Number(priceChange24h.toFixed(2)),
              currentPrice: price,
              oversold: rsi < 30,
              nextDcaPrice: position 
                ? Number((position.dcaOrders[position.dcaOrders.length - 1]?.price * 0.97 || price * 0.97).toFixed(6))
                : Number((price * 0.97).toFixed(6)),
              avgEntryPrice: position?.avgEntryPrice,
              profitTargetPrice: position?.profitTargetPrice,
            };
          })
        );
        setSignals(newSignals);

        // Sync state
        syncState();

        // Persist engine state
        try {
          localStorage.setItem('ctsp-engine', engineRef.current.serialize());
        } catch (e) {
          // Storage full or unavailable
        }
      } catch (error) {
        console.error('Failed to update prices:', error);
        addLog(`❌ Price update failed: ${error}`);
      }
    };

    // Initial update
    updatePrices();

    // Update every 5 seconds
    const interval = setInterval(updatePrices, 5000);

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
