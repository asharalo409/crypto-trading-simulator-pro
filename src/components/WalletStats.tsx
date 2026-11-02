import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import {
  Wallet, TrendingUp, TrendingDown, DollarSign,
  BarChart2, PieChart, Target, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function WalletStats() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { wallet, positions } = useTrading();

  const stats = [
    { label: t('totalBalance'), value: `$${wallet.totalBalance.toFixed(2)}`, icon: Wallet, color: colors.accent },
    { label: t('availableBalance'), value: `$${wallet.availableBalance.toFixed(2)}`, icon: DollarSign, color: colors.textSecondary },
    { label: t('investedBalance'), value: `$${wallet.investedBalance.toFixed(2)}`, icon: PieChart, color: colors.textSecondary },
    { label: t('totalPnl'), value: `$${wallet.totalPnl.toFixed(2)}`, icon: TrendingUp, color: wallet.totalPnl >= 0 ? 'text-green-400' : 'text-red-400', positive: wallet.totalPnl >= 0 },
    { label: t('unrealizedPnl'), value: `$${wallet.unrealizedPnl.toFixed(2)}`, icon: Activity, color: wallet.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400', positive: wallet.unrealizedPnl >= 0 },
    { label: t('realizedPnl'), value: `$${wallet.realizedPnl.toFixed(2)}`, icon: Target, color: wallet.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400', positive: wallet.realizedPnl >= 0 },
    { label: t('todayPnl'), value: `$${wallet.todayPnl.toFixed(2)}`, icon: BarChart2, color: wallet.todayPnl >= 0 ? 'text-green-400' : 'text-red-400', positive: wallet.todayPnl >= 0 },
    { label: t('openPositions'), value: positions.length.toString(), icon: Activity, color: colors.accent },
    { label: t('totalTrades'), value: wallet.totalTrades.toString(), icon: BarChart2, color: colors.textSecondary },
    { label: t('winRate'), value: `${wallet.winRate}%`, icon: Target, color: 'text-green-400' },
    { label: t('buyCount'), value: wallet.buyCount.toString(), icon: ArrowUpRight, color: 'text-green-400' },
    { label: t('sellCount'), value: wallet.sellCount.toString(), icon: ArrowDownRight, color: 'text-blue-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`${colors.bgCard} border ${colors.border} rounded-xl p-3 transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            <span className={`text-[10px] ${colors.textMuted} truncate`}>{stat.label}</span>
          </div>
          <p className={`text-sm font-bold ${stat.color} ${stat.positive !== undefined ? '' : ''}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
