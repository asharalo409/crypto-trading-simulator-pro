import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BacktestEngine, BacktestResult, BacktestConfig } from '../engine/BacktestEngine';
import { marketDataService } from '../services/BinanceAPI';
import { CSVExportService } from '../services/CSVExport';
import { SUPPORTED_COINS } from '../data/coins';
import {
  TrendingUp, Play, Download, AlertTriangle,
  BarChart3, Target, DollarSign, Percent, Clock,
  Activity, Award, TrendingDown
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

export default function BacktestingPanel() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<BacktestConfig>({
    coin: 'BTC',
    initialBalance: 10000,
    strategy: 'dca',
    dcaSettings: {
      initialBuy: 10,
      additionalBuy: 10,
      dcaTriggerPercent: 3,
      maxBuyOrders: 4,
      profitTargetPercent: 1.5,
      tradingFeePercent: 0.1,
      slippagePercent: 0.05,
    },
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    endDate: Date.now(),
  });

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fetch historical candles
      const candles = await marketDataService.getKlines(config.coin, '1h', 1000);
      
      if (candles.length < 50) {
        throw new Error('Not enough historical data for backtest');
      }

      // Run backtest
      const engine = new BacktestEngine(config, candles);
      const backtestResult = engine.run();
      
      setResult(backtestResult);
    } catch (err: any) {
      setError(err.message || 'Backtest failed');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!result) return;

    const csv = CSVExportService.exportBacktestResults(result);
    CSVExportService.downloadCSV(csv, `backtest-${result.config.coin}-${Date.now()}.csv`);
  };

  const strategies = [
    { id: 'dca' as const, label: 'DCA Strategy', desc: 'Dollar Cost Averaging' },
    { id: 'no-loss-hold' as const, label: 'No-Loss Hold', desc: 'Hold until profit' },
    { id: 'smart-trend' as const, label: 'Smart Trend', desc: 'Trend following' },
    { id: 'scalping' as const, label: 'Scalping', desc: 'Quick trades' },
  ];

  return (
    <div className="space-y-4">
      {/* Configuration */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-4 flex items-center gap-2`}>
          <Target className={`w-4 h-4 ${colors.accent}`} />
          Backtest Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Coin Selection */}
          <div>
            <label className={`text-[10px] ${colors.textMuted} mb-1 block`}>Coin</label>
            <select
              value={config.coin}
              onChange={(e) => setConfig({ ...config, coin: e.target.value })}
              className={`w-full ${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 text-xs`}
            >
              {SUPPORTED_COINS.map(coin => (
                <option key={coin.symbol} value={coin.symbol}>{coin.symbol}/USDT</option>
              ))}
            </select>
          </div>

          {/* Strategy Selection */}
          <div>
            <label className={`text-[10px] ${colors.textMuted} mb-1 block`}>Strategy</label>
            <select
              value={config.strategy}
              onChange={(e) => setConfig({ ...config, strategy: e.target.value as any })}
              className={`w-full ${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 text-xs`}
            >
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Initial Balance */}
          <div>
            <label className={`text-[10px] ${colors.textMuted} mb-1 block`}>Initial Balance ($)</label>
            <input
              type="number"
              value={config.initialBalance}
              onChange={(e) => setConfig({ ...config, initialBalance: Number(e.target.value) })}
              className={`w-full ${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 text-xs font-mono`}
            />
          </div>

          {/* DCA Settings */}
          <div>
            <label className={`text-[10px] ${colors.textMuted} mb-1 block`}>Initial Buy ($)</label>
            <input
              type="number"
              value={config.dcaSettings.initialBuy}
              onChange={(e) => setConfig({
                ...config,
                dcaSettings: { ...config.dcaSettings, initialBuy: Number(e.target.value) }
              })}
              className={`w-full ${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 text-xs font-mono`}
            />
          </div>

          <div>
            <label className={`text-[10px] ${colors.textMuted} mb-1 block`}>DCA Trigger (%)</label>
            <input
              type="number"
              value={config.dcaSettings.dcaTriggerPercent}
              onChange={(e) => setConfig({
                ...config,
                dcaSettings: { ...config.dcaSettings, dcaTriggerPercent: Number(e.target.value) }
              })}
              className={`w-full ${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 text-xs font-mono`}
            />
          </div>

          <div>
            <label className={`text-[10px] ${colors.textMuted} mb-1 block`}>Profit Target (%)</label>
            <input
              type="number"
              value={config.dcaSettings.profitTargetPercent}
              onChange={(e) => setConfig({
                ...config,
                dcaSettings: { ...config.dcaSettings, profitTargetPercent: Number(e.target.value) }
              })}
              className={`w-full ${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 text-xs font-mono`}
            />
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={runBacktest}
          disabled={loading}
          className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            loading
              ? `${colors.bgSecondary} ${colors.textMuted} cursor-not-allowed`
              : `bg-gradient-to-r ${colors.gradient} text-black hover:opacity-90`
          }`}
        >
          <Play className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Running Backtest...' : 'Run Backtest'}
        </button>

        {/* Error */}
        {error && (
          <div className={`mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <ResultCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Final Balance"
              value={`$${result.finalBalance.toFixed(2)}`}
              color={result.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
              colors={colors}
            />
            <ResultCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Total P/L"
              value={`${result.totalPnl >= 0 ? '+' : ''}$${result.totalPnl.toFixed(2)}`}
              color={result.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
              colors={colors}
            />
            <ResultCard
              icon={<Percent className="w-4 h-4" />}
              label="P/L %"
              value={`${result.totalPnlPercent.toFixed(2)}%`}
              color={result.totalPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}
              colors={colors}
            />
            <ResultCard
              icon={<Award className="w-4 h-4" />}
              label="Win Rate"
              value={`${result.winRate.toFixed(1)}%`}
              color="text-blue-400"
              colors={colors}
            />
            <ResultCard
              icon={<TrendingDown className="w-4 h-4" />}
              label="Max Drawdown"
              value={`${result.maxDrawdownPercent.toFixed(2)}%`}
              color="text-orange-400"
              colors={colors}
            />
            <ResultCard
              icon={<Activity className="w-4 h-4" />}
              label="Total Trades"
              value={result.totalTrades.toString()}
              color={colors.text}
              colors={colors}
            />
          </div>

          {/* Equity Curve */}
          <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
            <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
              <BarChart3 className={`w-4 h-4 ${colors.accent}`} />
              Equity Curve
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.equityCurve}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c853" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00c853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10, fill: colors.chartText }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 10, fill: colors.chartText }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#00c853"
                  fill="url(#equityGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Stats */}
          <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
            <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
              <Activity className={`w-4 h-4 ${colors.accent}`} />
              Detailed Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <StatItem label="Initial Balance" value={`$${result.initialBalance.toFixed(2)}`} colors={colors} />
              <StatItem label="Final Balance" value={`$${result.finalBalance.toFixed(2)}`} colors={colors} />
              <StatItem label="Total P/L" value={`$${result.totalPnl.toFixed(2)}`} colors={colors} />
              <StatItem label="Realized P/L" value={`$${result.realizedPnl.toFixed(2)}`} colors={colors} />
              <StatItem label="Buy Count" value={result.buyCount.toString()} colors={colors} />
              <StatItem label="Sell Count" value={result.sellCount.toString()} colors={colors} />
              <StatItem label="DCA Count" value={result.dcaCount.toString()} colors={colors} />
              <StatItem label="Win Rate" value={`${result.winRate.toFixed(1)}%`} colors={colors} />
              <StatItem label="Profit Factor" value={result.profitFactor.toFixed(2)} colors={colors} />
              <StatItem label="Max Drawdown" value={`$${result.maxDrawdown.toFixed(2)}`} colors={colors} />
              <StatItem label="Max Drawdown %" value={`${result.maxDrawdownPercent.toFixed(2)}%`} colors={colors} />
              <StatItem label="Sharpe Ratio" value={result.sharpeRatio.toFixed(2)} colors={colors} />
              <StatItem label="Duration" value={result.duration} colors={colors} />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportResults}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${colors.bgSecondary} ${colors.text} border ${colors.border} hover:${colors.bgHover}`}
          >
            <Download className="w-4 h-4" />
            Export Results to CSV
          </button>
        </>
      )}

      {/* Disclaimer */}
      <div className={`p-3 rounded-lg ${colors.bgSecondary} border border-yellow-500/20`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className={`w-4 h-4 ${colors.warning} flex-shrink-0 mt-0.5`} />
          <div className={`text-[10px] ${colors.textMuted}`}>
            <p className={`font-medium ${colors.warning} mb-1`}>⚠️ Backtest Disclaimer</p>
            <p>• Backtest results are SIMULATED and do not guarantee future profits</p>
            <p>• Past performance does not indicate future results</p>
            <p>• Uses historical closed candles only (no look-ahead bias)</p>
            <p>• Includes simulated fees and slippage</p>
            <p>• For educational purposes only</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResultCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  colors: any;
}

function ResultCard({ icon, label, value, color, colors }: ResultCardProps) {
  return (
    <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-3`}>
      <div className={`flex items-center gap-1 mb-1 ${colors.textMuted}`}>
        {icon}
        <span className="text-[9px]">{label}</span>
      </div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  colors: any;
}

function StatItem({ label, value, colors }: StatItemProps) {
  return (
    <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
      <p className={`text-[9px] ${colors.textMuted}`}>{label}</p>
      <p className={`text-xs font-bold ${colors.text} font-mono`}>{value}</p>
    </div>
  );
}
