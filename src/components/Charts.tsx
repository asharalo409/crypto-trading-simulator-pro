import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import { generateCandleData, generateEquityCurve } from '../contexts/chartHelpers';
import { SUPPORTED_COINS, BASE_PRICES } from '../data/coins';
import { createChart, IChartApi, CandlestickSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import {
  BarChart3, PieChart, TrendingUp, Clock, Activity,
  Target, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
  Legend
} from 'recharts';

export default function Charts() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { snapshots, trades } = useTrading();
  const candleRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [selectedCoin, setSelectedCoin] = useState('BTC');

  // Candlestick Chart
  useEffect(() => {
    if (!candleRef.current) return;
    
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(candleRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: colors.chartText,
      },
      grid: {
        vertLines: { color: colors.chartGrid },
        horzLines: { color: colors.chartGrid },
      },
      width: candleRef.current.clientWidth,
      height: 350,
      timeScale: {
        borderColor: colors.chartGrid,
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: colors.chartGrid,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#ff1744',
      borderUpColor: '#00c853',
      borderDownColor: '#ff1744',
      wickUpColor: '#00c853',
      wickDownColor: '#ff1744',
    });

    const data = generateCandleData(BASE_PRICES[selectedCoin]);
    candleSeries.setData(data as any);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (candleRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: candleRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [selectedCoin, colors]);

  // Equity curve data
  const equityData = generateEquityCurve();

  // Daily P/L data
  const dailyPnlData = equityData.map((d: { date: string; balance: number; pnl: number }, i: number) => ({
    date: d.date,
    pnl: i > 0 ? d.balance - equityData[i - 1].balance : 0,
  }));

  // Hourly P/L data (simulated)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    pnl: (Math.random() - 0.4) * 5,
  }));

  // Coin allocation
  const allocationData = [
    { name: 'AVAX', value: 20, color: '#ff6b6b' },
    { name: 'SOL', value: 20, color: '#4ecdc4' },
    { name: 'ETH', value: 50, color: '#45b7d1' },
    { name: 'USDT', value: 9750, color: '#96ceb4' },
  ];

  // Trading volume data
  const volumeData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    volume: Math.random() * 1000 + 200,
  }));

  // Win/Loss data
  const winLossData = [
    { name: 'Wins', value: 20, color: '#00c853' },
    { name: 'Losses', value: 8, color: '#ff1744' },
  ];

  // Buy/Sell distribution
  const buySellData = [
    { name: 'Buys', value: 18, color: '#00c853' },
    { name: 'Sells', value: 10, color: '#ff6b6b' },
  ];

  // DCA Entry data
  const dcaData = [
    { order: 'Buy 1', price: 37.20, qty: 0.269 },
    { order: 'Buy 2', price: 36.08, qty: 0.277 },
    { order: 'Buy 3', price: 35.00, qty: 0.286 },
    { order: 'Buy 4', price: 33.95, qty: 0.295 },
  ];

  const chartCardClass = `${colors.bgCard} border ${colors.border} rounded-xl p-3 overflow-hidden`;
  const chartTitleClass = `text-xs font-bold ${colors.text} mb-2 flex items-center gap-2`;

  return (
    <div className="space-y-4">
      {/* Candlestick Chart */}
      <div className={chartCardClass}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={chartTitleClass}>
            <BarChart3 className={`w-4 h-4 ${colors.accent}`} />
            {t('candlestickChart')} - {selectedCoin}/USDT
          </h3>
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            className={`${colors.bgSecondary} ${colors.text} border ${colors.border} rounded-lg px-2 py-1 text-xs`}
          >
            {SUPPORTED_COINS.map(coin => (
              <option key={coin.symbol} value={coin.symbol}>{coin.symbol}/USDT</option>
            ))}
          </select>
        </div>
        <div ref={candleRef} className="w-full" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Equity Curve */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <TrendingUp className={`w-4 h-4 ${colors.accent}`} />
            {t('equityCurve')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c853" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c853" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: colors.chartText }} interval={5} />
              <YAxis tick={{ fontSize: 9, fill: colors.chartText }} domain={['auto', 'auto']} />
              <Area type="monotone" dataKey="balance" stroke="#00c853" fill="url(#equityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Total P/L Graph */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <Activity className={`w-4 h-4 ${colors.accent}`} />
            {t('profitLossGraph')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: colors.chartText }} interval={5} />
              <YAxis tick={{ fontSize: 9, fill: colors.chartText }} />
              <Line type="monotone" dataKey="pnl" stroke="#f0b90b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily P/L */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <Clock className={`w-4 h-4 ${colors.accent}`} />
            {t('dailyPnl')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyPnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: colors.chartText }} interval={5} />
              <YAxis tick={{ fontSize: 9, fill: colors.chartText }} />
              <Bar dataKey="pnl" fill="#4ecdc4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly P/L */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <Clock className={`w-4 h-4 ${colors.accent}`} />
            {t('hourlyPnl')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="hour" tick={{ fontSize: 8, fill: colors.chartText }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: colors.chartText }} />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? '#00c853' : '#ff1744'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Coin Allocation */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <PieChart className={`w-4 h-4 ${colors.accent}`} />
            {t('coinAllocation')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RePieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {allocationData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* Trading Volume */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <BarChart3 className={`w-4 h-4 ${colors.accent}`} />
            {t('tradingVolume')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: colors.chartText }} />
              <YAxis tick={{ fontSize: 9, fill: colors.chartText }} />
              <Bar dataKey="volume" fill="#7c4dff" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win Rate */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <Target className={`w-4 h-4 ${colors.accent}`} />
            {t('winRateGraph')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RePieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {winLossData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* Buy/Sell Distribution */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <ArrowUpCircle className={`w-4 h-4 ${colors.accent}`} />
            {t('buySellDist')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={buySellData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis type="number" tick={{ fontSize: 9, fill: colors.chartText }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: colors.chartText }} width={40} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {buySellData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DCA Entry Graph */}
        <div className={chartCardClass}>
          <h3 className={chartTitleClass}>
            <ArrowDownCircle className={`w-4 h-4 ${colors.accent}`} />
            {t('dcaEntryGraph')} (AVAX)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dcaData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="order" tick={{ fontSize: 9, fill: colors.chartText }} />
              <YAxis tick={{ fontSize: 9, fill: colors.chartText }} />
              <Bar dataKey="price" fill="#ff6b9d" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
