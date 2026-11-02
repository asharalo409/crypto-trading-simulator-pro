import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import { CSVExportService } from '../services/CSVExport';
import { SUPPORTED_COINS } from '../data/coins';
import {
  BarChart3, Download, FileText, Clock,
  TrendingUp, TrendingDown, DollarSign, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AdvancedAnalytics() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { trades, positions, wallet } = useTrading();
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'dca'>('all');
  const [coinFilter, setCoinFilter] = useState<string>('all');

  const filteredTrades = trades.filter(trade => {
    if (filter === 'buy' && trade.side !== 'BUY') return false;
    if (filter === 'sell' && trade.side !== 'SELL') return false;
    if (filter === 'dca' && !trade.isDCA) return false;
    if (coinFilter !== 'all' && trade.coin !== coinFilter) return false;
    return true;
  });

  const exportTrades = () => {
    const csv = CSVExportService.exportTrades(filteredTrades);
    CSVExportService.downloadCSV(csv, `trades-${Date.now()}.csv`);
  };

  const exportPositions = () => {
    const csv = CSVExportService.exportPositions(positions);
    CSVExportService.downloadCSV(csv, `positions-${Date.now()}.csv`);
  };

  const exportAll = () => {
    CSVExportService.exportAll(trades, positions, wallet);
  };

  // Calculate analytics
  const totalVolume = trades.reduce((sum, t) => sum + t.total, 0);
  const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);
  const avgTradeSize = trades.length > 0 ? totalVolume / trades.length : 0;

  // P/L by coin
  const plByCoin = SUPPORTED_COINS.map(coin => {
    const coinTrades = trades.filter(t => t.coin === coin.symbol);
    const pnl = coinTrades.reduce((sum, t) => sum + t.pnl, 0);
    return { coin: coin.symbol, pnl, trades: coinTrades.length };
  }).filter(d => d.trades > 0);

  // Daily P/L
  const dailyPL = trades.reduce((acc, trade) => {
    const date = new Date(trade.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = 0;
    acc[date] += trade.pnl;
    return acc;
  }, {} as Record<string, number>);

  const dailyPLData = Object.entries(dailyPL).map(([date, pnl]) => ({
    date,
    pnl: Number(pnl.toFixed(2)),
  }));

  // Trade size distribution
  const tradeSizeDistribution = [
    { range: '< $5', count: trades.filter(t => t.total < 5).length },
    { range: '$5-10', count: trades.filter(t => t.total >= 5 && t.total < 10).length },
    { range: '$10-25', count: trades.filter(t => t.total >= 10 && t.total < 25).length },
    { range: '$25-50', count: trades.filter(t => t.total >= 25 && t.total < 50).length },
    { range: '$50+', count: trades.filter(t => t.total >= 50).length },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-3`}>
          <div className={`flex items-center gap-1 mb-1 ${colors.textMuted}`}>
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-[9px]">Total Volume</span>
          </div>
          <p className={`text-sm font-bold ${colors.text}`}>${totalVolume.toFixed(2)}</p>
        </div>
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-3`}>
          <div className={`flex items-center gap-1 mb-1 ${colors.textMuted}`}>
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-[9px]">Total Fees</span>
          </div>
          <p className={`text-sm font-bold ${colors.warning}`}>${totalFees.toFixed(4)}</p>
        </div>
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-3`}>
          <div className={`flex items-center gap-1 mb-1 ${colors.textMuted}`}>
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[9px]">Avg Trade Size</span>
          </div>
          <p className={`text-sm font-bold ${colors.text}`}>${avgTradeSize.toFixed(2)}</p>
        </div>
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-3`}>
          <div className={`flex items-center gap-1 mb-1 ${colors.textMuted}`}>
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[9px]">Total Trades</span>
          </div>
          <p className={`text-sm font-bold ${colors.text}`}>{trades.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* P/L by Coin */}
        {plByCoin.length > 0 && (
          <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
            <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
              <BarChart3 className={`w-4 h-4 ${colors.accent}`} />
              P/L by Coin
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={plByCoin}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                <XAxis dataKey="coin" tick={{ fontSize: 10, fill: colors.chartText }} />
                <YAxis tick={{ fontSize: 10, fill: colors.chartText }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {plByCoin.map((entry, index) => (
                    <Cell key={index} fill={entry.pnl >= 0 ? '#00c853' : '#ff1744'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Daily P/L */}
        {dailyPLData.length > 0 && (
          <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
            <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
              <TrendingUp className={`w-4 h-4 ${colors.accent}`} />
              Daily P/L
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyPLData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: colors.chartText }} />
                <YAxis tick={{ fontSize: 10, fill: colors.chartText }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="pnl" stroke="#f0b90b" strokeWidth={2} dot={{ fill: '#f0b90b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trade Size Distribution */}
        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
          <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
            <BarChart3 className={`w-4 h-4 ${colors.accent}`} />
            Trade Size Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tradeSizeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: colors.chartText }} />
              <YAxis tick={{ fontSize: 10, fill: colors.chartText }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#7c4dff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold ${colors.text} flex items-center gap-2`}>
            <FileText className={`w-4 h-4 ${colors.accent}`} />
            Trade Journal
          </h3>
          <div className="flex gap-2">
            <button
              onClick={exportTrades}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs ${colors.bgSecondary} ${colors.textSecondary} border ${colors.border} hover:${colors.bgHover}`}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className={`${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-2 py-1 text-xs`}
          >
            <option value="all">All Trades</option>
            <option value="buy">BUY Only</option>
            <option value="sell">SELL Only</option>
            <option value="dca">DCA Only</option>
          </select>
          <select
            value={coinFilter}
            onChange={(e) => setCoinFilter(e.target.value)}
            className={`${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-2 py-1 text-xs`}
          >
            <option value="all">All Coins</option>
            {SUPPORTED_COINS.map(coin => (
              <option key={coin.symbol} value={coin.symbol}>{coin.symbol}</option>
            ))}
          </select>
        </div>

        {/* Trade List */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {filteredTrades.length === 0 ? (
            <p className={`text-xs ${colors.textMuted} text-center py-8`}>No trades found</p>
          ) : (
            filteredTrades.map(trade => (
              <div key={trade.id} className={`flex items-center justify-between p-2 rounded-lg ${colors.bgSecondary} text-xs`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${colors.accent}`}>
                    {SUPPORTED_COINS.find(c => c.symbol === trade.coin)?.icon || '●'}
                  </span>
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
                    <span className={colors.textMuted}>
                      {new Date(trade.timestamp).toLocaleString()}
                    </span>
                    {trade.pnl !== 0 && (
                      <span className={trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}>
                        {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Export All */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
          <Download className={`w-4 h-4 ${colors.accent}`} />
          Export All Data
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={exportTrades}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs ${colors.bgSecondary} ${colors.text} border ${colors.border} hover:${colors.bgHover}`}
          >
            <FileText className="w-4 h-4" />
            Export Trades
          </button>
          <button
            onClick={exportPositions}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs ${colors.bgSecondary} ${colors.text} border ${colors.border} hover:${colors.bgHover}`}
          >
            <FileText className="w-4 h-4" />
            Export Positions
          </button>
          <button
            onClick={exportAll}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs bg-gradient-to-r ${colors.gradient} text-black hover:opacity-90`}
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>
      </div>
    </div>
  );
}
