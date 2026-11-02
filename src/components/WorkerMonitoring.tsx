import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { marketDataService } from '../services/BinanceAPI';
import {
  Server, Activity, Clock, AlertTriangle, CheckCircle2,
  XCircle, RefreshCw, Wifi, WifiOff, Zap, Database
} from 'lucide-react';

interface WorkerStatus {
  lastExecution: string | null;
  executionCount: number;
  errorCount: number;
  avgExecutionTime: number;
  isHealthy: boolean;
}

export default function WorkerMonitoring() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({
    lastExecution: null,
    executionCount: 0,
    errorCount: 0,
    avgExecutionTime: 0,
    isHealthy: false,
  });
  const [apiHealth, setApiHealth] = useState<{ binance: boolean; coingecko: boolean }>({
    binance: false,
    coingecko: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    setIsRefreshing(true);
    
    try {
      // Check API health
      const health = await marketDataService.checkHealth();
      setApiHealth(health);
      
      // Simulate worker status (in real app, fetch from Supabase)
      const stats = marketDataService.getStats();
      setWorkerStatus({
        lastExecution: new Date().toISOString(),
        executionCount: stats.requestCount,
        errorCount: 0,
        avgExecutionTime: 150,
        isHealthy: health.binance || health.coingecko,
      });
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const workerTypes = [
    {
      name: 'Supabase pg_cron',
      status: 'primary',
      schedule: 'Every 1 minute',
      description: 'Primary scheduler using Supabase Edge Functions',
      icon: Database,
      color: 'text-green-400',
    },
    {
      name: 'Cloudflare Workers',
      status: 'backup',
      schedule: 'Every 1 minute',
      description: 'Backup scheduler (100k requests/day free)',
      icon: Zap,
      color: 'text-orange-400',
    },
    {
      name: 'GitHub Actions',
      status: 'tertiary',
      schedule: 'Every 1 minute',
      description: 'Third backup (2k minutes/month free)',
      icon: Server,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold ${colors.text} flex items-center gap-2`}>
          <Server className={`w-4 h-4 ${colors.accent}`} />
          Worker Monitoring
        </h3>
        <button
          onClick={checkHealth}
          disabled={isRefreshing}
          className={`p-1.5 rounded-lg ${colors.bgSecondary} border ${colors.border} ${colors.textSecondary} hover:${colors.text} disabled:opacity-50`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Worker Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatusCard
          icon={<Clock className="w-4 h-4" />}
          label="Last Execution"
          value={workerStatus.lastExecution 
            ? new Date(workerStatus.lastExecution).toLocaleTimeString()
            : 'Never'}
          color={workerStatus.isHealthy ? 'text-green-400' : 'text-red-400'}
          colors={colors}
        />
        <StatusCard
          icon={<Activity className="w-4 h-4" />}
          label="Executions"
          value={workerStatus.executionCount.toString()}
          color={colors.text}
          colors={colors}
        />
        <StatusCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Errors"
          value={workerStatus.errorCount.toString()}
          color={workerStatus.errorCount > 0 ? 'text-red-400' : 'text-green-400'}
          colors={colors}
        />
        <StatusCard
          icon={<Zap className="w-4 h-4" />}
          label="Avg Time"
          value={`${workerStatus.avgExecutionTime}ms`}
          color={colors.textSecondary}
          colors={colors}
        />
      </div>

      {/* API Health */}
      <div className={`p-3 rounded-lg ${colors.bgSecondary} border ${colors.border} mb-4`}>
        <p className={`text-xs ${colors.textMuted} mb-2`}>Market Data APIs</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {apiHealth.binance ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs ${colors.text}`}>Binance</span>
          </div>
          <div className="flex items-center gap-2">
            {apiHealth.coingecko ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs ${colors.text}`}>CoinGecko</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className={`text-[10px] ${colors.textMuted}`}>
              Requests: {marketDataService.getStats().requestCount}
            </span>
          </div>
        </div>
      </div>

      {/* Worker Types */}
      <div className="space-y-2">
        <p className={`text-xs ${colors.textMuted}`}>Scheduled Workers</p>
        {workerTypes.map((worker, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-3 rounded-lg ${colors.bgSecondary} border ${colors.border}`}
          >
            <div className="flex items-center gap-3">
              <worker.icon className={`w-5 h-5 ${worker.color}`} />
              <div>
                <p className={`text-xs font-medium ${colors.text}`}>{worker.name}</p>
                <p className={`text-[10px] ${colors.textMuted}`}>{worker.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  worker.status === 'primary' ? 'bg-green-400' :
                  worker.status === 'backup' ? 'bg-orange-400' :
                  'bg-blue-400'
                }`} />
                <span className={`text-[10px] ${worker.color} capitalize`}>
                  {worker.status}
                </span>
              </div>
              <p className={`text-[10px] ${colors.textMuted}`}>{worker.schedule}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Free Tier Info */}
      <div className={`mt-4 p-3 rounded-lg ${colors.bgSecondary} border border-yellow-500/20`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className={`w-4 h-4 ${colors.warning} flex-shrink-0 mt-0.5`} />
          <div className={`text-[10px] ${colors.textMuted}`}>
            <p className={`font-medium ${colors.warning} mb-1`}>Free Tier Limits</p>
            <p>• Supabase pg_cron: Unlimited (recommended)</p>
            <p>• Cloudflare Workers: 100k requests/day</p>
            <p>• GitHub Actions: 2k minutes/month</p>
            <p>• No credit card required for any service</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  colors: any;
}

function StatusCard({ icon, label, value, color, colors }: StatusCardProps) {
  return (
    <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
      <div className={`flex items-center gap-1 mb-1 ${colors.textMuted}`}>
        {icon}
        <span className="text-[9px]">{label}</span>
      </div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
