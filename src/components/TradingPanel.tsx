import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import { SUPPORTED_COINS } from '../data/coins';
import {
  Zap, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Clock, DollarSign, Target, ChevronRight
} from 'lucide-react';

export default function TradingPanel() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { botConfig, positions, trades, toggleNoLoss, setTradingMode } = useTrading();

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

  return (
    <div className="space-y-4">
      {/* Trading Mode Selection */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
          <Zap className={`w-4 h-4 ${colors.accent}`} />
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

      {/* No-Loss Hold Toggle */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold ${colors.text} flex items-center gap-2`}>
            <Shield className={`w-4 h-4 ${colors.accent}`} />
            {t('noLossSell')}
          </h3>
          <button
            onClick={toggleNoLoss}
            className={`relative w-12 h-6 rounded-full transition-all ${
              botConfig.noLossSell ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
              botConfig.noLossSell ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>
        <div className={`flex items-start gap-2 p-3 rounded-lg ${colors.bgSecondary} border ${colors.border}`}>
          <AlertTriangle className={`w-4 h-4 ${colors.warning} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`text-xs font-medium ${colors.warning}`}>{t('riskWarning')}</p>
            <p className={`text-[10px] ${colors.textMuted} mt-1`}>{t('riskText')}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
            <p className={`text-[10px] ${colors.textMuted}`}>Status</p>
            <p className={`text-xs font-bold ${botConfig.noLossSell ? 'text-green-400' : 'text-red-400'}`}>
              {botConfig.noLossSell ? `${t('on')} - Profit Only` : `${t('off')} - Stop Loss Active`}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
            <p className={`text-[10px] ${colors.textMuted}`}>Mode</p>
            <p className={`text-xs font-bold ${colors.accent}`}>
              {botConfig.isRunning ? t('botRunning') : t('botStopped')}
            </p>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
          <TrendingUp className={`w-4 h-4 ${colors.accent}`} />
          {t('positions')} ({positions.length})
        </h3>
        {positions.length === 0 ? (
          <p className={`text-xs ${colors.textMuted} text-center py-4`}>{t('noPositions')}</p>
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
                        DCA: {pos.dcaOrders.length}/{4}
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
                <div className="grid grid-cols-4 gap-2 text-[10px]">
                  <div>
                    <span className={colors.textMuted}>Avg Entry</span>
                    <p className={`font-mono ${colors.text}`}>${pos.avgEntryPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className={colors.textMuted}>Current</span>
                    <p className={`font-mono ${colors.text}`}>${pos.currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className={colors.textMuted}>Target</span>
                    <p className={`font-mono text-green-400`}>${pos.profitTargetPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className={colors.textMuted}>Invested</span>
                    <p className={`font-mono ${colors.text}`}>${pos.totalCost.toFixed(2)}</p>
                  </div>
                </div>
                {/* DCA Orders */}
                <div className="mt-2 flex gap-1">
                  {pos.dcaOrders.map(order => (
                    <div key={order.id} className={`flex-1 p-1 rounded text-center ${colors.bgCard} border ${colors.border}`}>
                      <p className={`text-[8px] ${colors.textMuted}`}>#{order.orderNumber}</p>
                      <p className={`text-[10px] font-mono ${colors.text}`}>${order.price.toFixed(2)}</p>
                    </div>
                  ))}
                  {Array.from({ length: 4 - pos.dcaOrders.length }).map((_, i) => (
                    <div key={`empty-${i}`} className={`flex-1 p-1 rounded text-center border border-dashed ${colors.border}`}>
                      <p className={`text-[8px] ${colors.textMuted}`}>#{pos.dcaOrders.length + i + 1}</p>
                      <p className={`text-[10px] ${colors.textMuted}`}>-</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Trades */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
          <Clock className={`w-4 h-4 ${colors.accent}`} />
          {t('recentTrades')}
        </h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {trades.map(trade => (
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
                    <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">DCA</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono ${colors.text}`}>${trade.total.toFixed(2)}</p>
                {trade.pnl !== 0 && (
                  <p className={`text-[10px] ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
