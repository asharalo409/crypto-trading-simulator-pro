import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import { SUPPORTED_COINS } from '../data/coins';
import {
  Zap, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Clock, DollarSign, Target, ChevronRight, Play, Square,
  RefreshCw, Terminal, ArrowUpCircle, ArrowDownCircle,
  Activity, Info
} from 'lucide-react';

export default function TradingPanel() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    botConfig, positions, closedPositions, trades, engineLogs,
    toggleBot, toggleNoLoss, setTradingMode, manualBuy, manualSell, resetEngine
  } = useTrading();

  const [showManualTrade, setShowManualTrade] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [tradeAmount, setTradeAmount] = useState('10');
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [activeSection, setActiveSection] = useState<'controls' | 'positions' | 'closed' | 'trades' | 'logs'>('controls');

  const modes = [
    { id: 'smart-trend' as const, label: t('smartTrend'), icon: TrendingUp, desc: 'Trend following with EMA crossover' },
    { id: 'scalping' as const, label: t('scalping'), icon: Zap, desc: 'Quick trades on small movements' },
    { id: 'no-loss-hold' as const, label: t('noLossHold'), icon: Shield, desc: 'Hold until profit, never sell at loss' },
    { id: 'dca' as const, label: t('dcaMode'), icon: Target, desc: 'Dollar Cost Averaging strategy' },
  ];

  const getCoinIcon = (symbol: string) => {
    const coin = SUPPORTED_COINS.find(c => c.symbol === symbol);
    return coin?.icon || '●';
  };

  const handleManualBuy = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount < 1) {
      setTradeMessage({ type: 'error', text: 'Minimum trade: $1' });
      return;
    }
    if (amount > 1000) {
      setTradeMessage({ type: 'error', text: 'Maximum single trade: $1,000' });
      return;
    }
    const result = manualBuy(selectedCoin, amount);
    setTradeMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    setTimeout(() => setTradeMessage(null), 3000);
  };

  const handleManualSell = () => {
    const result = manualSell(selectedCoin);
    setTradeMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    setTimeout(() => setTradeMessage(null), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the engine? All positions and trades will be lost.')) {
      resetEngine();
    }
  };

  const sections = [
    { id: 'controls' as const, label: 'Controls', icon: Zap },
    { id: 'positions' as const, label: `Open (${positions.length})`, icon: Activity },
    { id: 'closed' as const, label: `Closed (${closedPositions.length})`, icon: ArrowDownCircle },
    { id: 'trades' as const, label: `Trades (${trades.length})`, icon: Clock },
    { id: 'logs' as const, label: 'Logs', icon: Terminal },
  ];

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-1 flex gap-1 overflow-x-auto`}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSection === section.id
                ? `${colors.bgHover} ${colors.accent}`
                : `${colors.textSecondary} hover:${colors.text}`
            }`}
          >
            <section.icon className="w-3.5 h-3.5" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Controls Section */}
      {activeSection === 'controls' && (
        <div className="space-y-4">
          {/* Bot Controls */}
          <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
            <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
              <Zap className={`w-4 h-4 ${colors.accent}`} />
              Bot Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={toggleBot}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  botConfig.isRunning
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                }`}
              >
                {botConfig.isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {botConfig.isRunning ? t('stopBot') : t('startBot')}
              </button>
              <button
                onClick={toggleNoLoss}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  botConfig.noLossSell
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                    : `${colors.bgSecondary} ${colors.textSecondary} border ${colors.border}`
                }`}
              >
                <Shield className="w-4 h-4" />
                {t('noLossSell')}: {botConfig.noLossSell ? t('on') : t('off')}
              </button>
              <button
                onClick={handleReset}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${colors.bgSecondary} ${colors.textSecondary} border ${colors.border} hover:bg-red-500/20 hover:text-red-400`}
              >
                <RefreshCw className="w-4 h-4" />
                Reset Engine
              </button>
            </div>
          </div>

          {/* Trading Mode */}
          <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
            <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
              <Target className={`w-4 h-4 ${colors.accent}`} />
              {t('tradingMode')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {modes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setTradingMode(mode.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    botConfig.tradingMode === mode.id
                      ? `${colors.bgHover} border-current ${colors.accent}`
                      : `${colors.bgSecondary} ${colors.border} ${colors.textSecondary} hover:${colors.bgHover}`
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <mode.icon className={`w-4 h-4 ${botConfig.tradingMode === mode.id ? colors.accent : ''}`} />
                    <span className={`text-xs font-bold ${botConfig.tradingMode === mode.id ? colors.accent : colors.text}`}>
                      {mode.label}
                    </span>
                  </div>
                  <p className={`text-[10px] ${colors.textMuted}`}>{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* No-Loss Warning */}
          <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
            <div className={`flex items-start gap-2 p-3 rounded-lg ${colors.bgSecondary} border border-yellow-500/20`}>
              <AlertTriangle className={`w-4 h-4 ${colors.warning} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`text-xs font-medium ${colors.warning}`}>{t('riskWarning')}</p>
                <p className={`text-[10px] ${colors.textMuted} mt-1`}>{t('riskText')}</p>
                <div className={`mt-2 text-[10px] ${colors.textMuted} space-y-0.5`}>
                  <p>• No-Loss Mode profit guarantee নয়।</p>
                  <p>• Capital আটকে থাকতে পারে (locked capital)।</p>
                  <p>• Coin value আরও কমতে পারে।</p>
                  <p>• Maximum 4 DCA orders per position।</p>
                  <p>• No leverage, no borrowing, no Martingale।</p>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Trading */}
          <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
            <button
              onClick={() => setShowManualTrade(!showManualTrade)}
              className={`w-full flex items-center justify-between text-sm font-bold ${colors.text}`}
            >
              <span className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${colors.accent}`} />
                Manual Paper Trading
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showManualTrade ? 'rotate-90' : ''}`} />
            </button>

            {showManualTrade && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`text-[10px] ${colors.textMuted} mb-1 block`}>Coin</label>
                    <select
                      value={selectedCoin}
                      onChange={(e) => setSelectedCoin(e.target.value)}
                      className={`w-full ${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 text-xs`}
                    >
                      {SUPPORTED_COINS.map(coin => (
                        <option key={coin.symbol} value={coin.symbol}>{coin.symbol}/USDT</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[10px] ${colors.textMuted} mb-1 block`}>Amount ($)</label>
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      min="1"
                      max="1000"
                      className={`w-full ${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 text-xs font-mono`}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={handleManualBuy}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      BUY
                    </button>
                    <button
                      onClick={handleManualSell}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      SELL
                    </button>
                  </div>
                </div>

                {tradeMessage && (
                  <div className={`p-2 rounded-lg text-xs ${
                    tradeMessage.type === 'success' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {tradeMessage.text}
                  </div>
                )}

                <div className={`p-2 rounded-lg ${colors.bgSecondary} text-[10px] ${colors.textMuted}`}>
                  <Info className="w-3 h-3 inline mr-1" />
                  Paper trading only. No real money. Min: $1, Max: $1,000. Fees & slippage applied.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Open Positions */}
      {activeSection === 'positions' && (
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
          <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
            <Activity className={`w-4 h-4 ${colors.accent}`} />
            Open Positions ({positions.length})
          </h3>
          {positions.length === 0 ? (
            <p className={`text-xs ${colors.textMuted} text-center py-8`}>{t('noPositions')}</p>
          ) : (
            <div className="space-y-2">
              {positions.map(pos => (
                <div key={pos.id} className={`${colors.bgSecondary} border ${colors.border} rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${colors.accent}`}>{getCoinIcon(pos.coin)}</span>
                      <div>
                        <span className={`text-sm font-bold ${colors.text}`}>{pos.coin}/USDT</span>
                        <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          DCA: {pos.dcaOrders.length}/{botConfig.dcaSettings.maxBuyOrders}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${pos.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                      </p>
                      <p className={`text-[10px] ${pos.unrealizedPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.unrealizedPnlPercent >= 0 ? '+' : ''}{pos.unrealizedPnlPercent}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mb-2">
                    <div>
                      <span className={colors.textMuted}>Avg Entry</span>
                      <p className={`font-mono ${colors.text}`}>${pos.avgEntryPrice.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className={colors.textMuted}>Current</span>
                      <p className={`font-mono ${colors.text}`}>${pos.currentPrice.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className={colors.textMuted}>Target</span>
                      <p className={`font-mono text-green-400`}>${pos.profitTargetPrice.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className={colors.textMuted}>Invested</span>
                      <p className={`font-mono ${colors.text}`}>${pos.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                  {/* DCA Orders */}
                  <div className="flex gap-1">
                    {pos.dcaOrders.map(order => (
                      <div key={order.id} className={`flex-1 p-1 rounded text-center ${colors.bgCard} border ${colors.border}`}>
                        <p className={`text-[8px] ${colors.textMuted}`}>#{order.orderNumber}</p>
                        <p className={`text-[10px] font-mono ${colors.text}`}>${order.price.toFixed(2)}</p>
                        <p className={`text-[8px] ${colors.textMuted}`}>{order.quantity.toFixed(4)}</p>
                      </div>
                    ))}
                    {Array.from({ length: botConfig.dcaSettings.maxBuyOrders - pos.dcaOrders.length }).map((_, i) => (
                      <div key={`empty-${i}`} className={`flex-1 p-1 rounded text-center border border-dashed ${colors.border}`}>
                        <p className={`text-[8px] ${colors.textMuted}`}>#{pos.dcaOrders.length + i + 1}</p>
                        <p className={`text-[10px] ${colors.textMuted}`}>-</p>
                        <p className={`text-[8px] ${colors.textMuted}`}>pending</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Closed Positions */}
      {activeSection === 'closed' && (
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
          <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
            <ArrowDownCircle className={`w-4 h-4 ${colors.accent}`} />
            Closed Positions ({closedPositions.length})
          </h3>
          {closedPositions.length === 0 ? (
            <p className={`text-xs ${colors.textMuted} text-center py-8`}>No closed positions yet</p>
          ) : (
            <div className="space-y-2">
              {closedPositions.map(pos => (
                <div key={pos.id} className={`${colors.bgSecondary} border ${colors.border} rounded-lg p-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${colors.accent}`}>{getCoinIcon(pos.coin)}</span>
                      <div>
                        <span className={`text-sm font-bold ${colors.text}`}>{pos.coin}/USDT</span>
                        <p className={`text-[10px] ${colors.textMuted}`}>
                          {pos.dcaOrders.length} DCA orders • Closed {new Date(pos.closedAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${(pos.realizedPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(pos.realizedPnl || 0) >= 0 ? '+' : ''}${(pos.realizedPnl || 0).toFixed(2)}
                      </p>
                      <p className={`text-[10px] ${colors.textMuted}`}>
                        Entry: ${pos.avgEntryPrice.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trade History */}
      {activeSection === 'trades' && (
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
          <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
            <Clock className={`w-4 h-4 ${colors.accent}`} />
            {t('recentTrades')} ({trades.length})
          </h3>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {trades.length === 0 ? (
              <p className={`text-xs ${colors.textMuted} text-center py-8`}>No trades yet</p>
            ) : (
              trades.map(trade => (
                <div key={trade.id} className={`flex items-center justify-between p-2 rounded-lg ${colors.bgSecondary} text-xs`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${colors.accent}`}>{getCoinIcon(trade.coin)}</span>
                    <div>
                      <span className={`font-medium ${colors.text}`}>{trade.coin}</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                        trade.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                      {trade.isDCA && (
                        <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">
                          DCA #{trade.dcaOrderNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono ${colors.text}`}>
                      ${trade.price.toFixed(4)} × {trade.quantity.toFixed(6)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={colors.textMuted}>Fee: ${trade.fee.toFixed(4)}</span>
                      {trade.pnl !== 0 && (
                        <span className={trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}>
                          P/L: {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Engine Logs */}
      {activeSection === 'logs' && (
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
          <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
            <Terminal className={`w-4 h-4 ${colors.accent}`} />
            Engine Logs
          </h3>
          <div className={`${colors.bgSecondary} rounded-lg p-3 max-h-[400px] overflow-y-auto font-mono text-[10px]`}>
            {engineLogs.length === 0 ? (
              <p className={colors.textMuted}>No logs yet. Engine will log trades and events here.</p>
            ) : (
              engineLogs.map((log, i) => (
                <div key={i} className={`py-0.5 ${
                  log.includes('❌') ? 'text-red-400' :
                  log.includes('📈') ? 'text-green-400' :
                  log.includes('📉') ? 'text-red-400' :
                  log.includes('⚠️') ? 'text-yellow-400' :
                  log.includes('🟢') ? 'text-green-400' :
                  log.includes('🔴') ? 'text-red-400' :
                  colors.textSecondary
                }`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
