import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import { SignalType } from '../types';
import { SUPPORTED_COINS } from '../data/coins';
import {
  Activity, TrendingUp, TrendingDown, Minus,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Target, Shield
} from 'lucide-react';

export default function MarketRadar() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { signals, positions } = useTrading();

  const getSignalColor = (signal: SignalType) => {
    switch (signal) {
      case 'BUY': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'SELL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'DCA': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'HOLD': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'WAIT': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP': return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
      case 'DOWN': return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
      default: return <Minus className="w-3.5 h-3.5 text-yellow-400" />;
    }
  };

  const formatPrice = (price: number, symbol: string) => {
    if (price >= 1000) return `$${price.toFixed(2)}`;
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    return `$${(vol / 1e3).toFixed(1)}K`;
  };

  const getCoinIcon = (symbol: string) => {
    const coin = SUPPORTED_COINS.find(c => c.symbol === symbol);
    return coin?.icon || '●';
  };

  return (
    <div className={`${colors.bgCard} border ${colors.border} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${colors.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${colors.accent}`} />
          <h3 className={`text-sm font-bold ${colors.text}`}>{t('marketRadar')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={`${colors.bgSecondary} ${colors.textMuted}`}>
              <th className="px-3 py-2 text-left">{t('coin')}</th>
              <th className="px-3 py-2 text-right">{t('price')}</th>
              <th className="px-3 py-2 text-right">{t('change24h')}</th>
              <th className="px-3 py-2 text-right">{t('rsi')}</th>
              <th className="px-3 py-2 text-right">{t('ema20')}</th>
              <th className="px-3 py-2 text-right">{t('ema50')}</th>
              <th className="px-3 py-2 text-right">{t('macd')}</th>
              <th className="px-3 py-2 text-right">{t('volume')}</th>
              <th className="px-3 py-2 text-center">{t('trend')}</th>
              <th className="px-3 py-2 text-center">{t('signal')}</th>
              <th className="px-3 py-2 text-center">{t('oversold')}</th>
              <th className="px-3 py-2 text-right">{t('nextDca')}</th>
              <th className="px-3 py-2 text-right">{t('avgEntry')}</th>
              <th className="px-3 py-2 text-right">{t('profitTarget2')}</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal, i) => {
              const hasPosition = positions.some(p => p.coin === signal.coin);
              return (
                <tr key={i} className={`border-t ${colors.border} hover:${colors.bgHover} transition-colors`}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${colors.accent}`}>{getCoinIcon(signal.coin)}</span>
                      <span className={`font-medium ${colors.text}`}>{signal.coin}</span>
                      {hasPosition && <Shield className="w-3 h-3 text-blue-400" />}
                    </div>
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${colors.text}`}>
                    {formatPrice(signal.currentPrice, signal.coin)}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${signal.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h}%
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${signal.rsi < 30 ? 'text-green-400' : signal.rsi > 70 ? 'text-red-400' : colors.textSecondary}`}>
                    {signal.rsi}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${colors.textSecondary}`}>
                    {formatPrice(signal.ema20, signal.coin)}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${colors.textSecondary}`}>
                    {formatPrice(signal.ema50, signal.coin)}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${signal.macd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {signal.macd.toFixed(4)}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${colors.textSecondary}`}>
                    {formatVolume(signal.volume)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(signal.trend)}
                      <span className={`text-[10px] ${signal.trend === 'UP' ? 'text-green-400' : signal.trend === 'DOWN' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {t(signal.trend as any)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSignalColor(signal.signal)}`}>
                      {t(signal.signal as any)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {signal.oversold ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mx-auto" />
                    ) : (
                      <span className={`${colors.textMuted}`}>-</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${colors.textMuted}`}>
                    {signal.nextDcaPrice ? formatPrice(signal.nextDcaPrice, signal.coin) : '-'}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${hasPosition ? colors.accent : colors.textMuted}`}>
                    {signal.avgEntryPrice ? formatPrice(signal.avgEntryPrice, signal.coin) : '-'}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${hasPosition ? 'text-green-400' : colors.textMuted}`}>
                    {signal.profitTargetPrice ? formatPrice(signal.profitTargetPrice, signal.coin) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
        {signals.map((signal, i) => {
          const hasPosition = positions.some(p => p.coin === signal.coin);
          return (
            <div key={i} className={`${colors.bgSecondary} border ${colors.border} rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${colors.accent}`}>{getCoinIcon(signal.coin)}</span>
                  <div>
                    <span className={`text-sm font-bold ${colors.text}`}>{signal.coin}</span>
                    {hasPosition && <Shield className="w-3 h-3 text-blue-400 inline ml-1" />}
                  </div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSignalColor(signal.signal)}`}>
                  {t(signal.signal as any)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className={colors.textMuted}>{t('price')}</span>
                  <p className={`font-mono ${colors.text}`}>{formatPrice(signal.currentPrice, signal.coin)}</p>
                </div>
                <div>
                  <span className={colors.textMuted}>{t('change24h')}</span>
                  <p className={`font-mono ${signal.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h}%
                  </p>
                </div>
                <div>
                  <span className={colors.textMuted}>{t('rsi')}</span>
                  <p className={`font-mono ${signal.rsi < 30 ? 'text-green-400' : signal.rsi > 70 ? 'text-red-400' : colors.textSecondary}`}>
                    {signal.rsi}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(signal.trend)}
                  <span className={`${signal.trend === 'UP' ? 'text-green-400' : signal.trend === 'DOWN' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {t(signal.trend as any)}
                  </span>
                </div>
                <div>
                  <span className={colors.textMuted}>{t('volume')}</span>
                  <p className={`font-mono ${colors.textSecondary}`}>{formatVolume(signal.volume)}</p>
                </div>
                {signal.oversold && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{t('oversold')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
