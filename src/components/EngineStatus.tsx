import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import {
  Cpu, Activity, Shield, Zap, AlertTriangle,
  CheckCircle2, XCircle, Clock, TrendingUp
} from 'lucide-react';

export default function EngineStatus() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { botConfig, positions, wallet, engineLogs } = useTrading();

  const openPositions = positions.filter(p => p.status === 'open');
  const totalDCAOrders = openPositions.reduce((sum, p) => sum + p.dcaOrders.length, 0);
  const maxDCASlots = openPositions.length * botConfig.dcaSettings.maxBuyOrders;
  const lastLog = engineLogs[0] || 'Engine initialized';

  return (
    <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-bold ${colors.text} flex items-center gap-2`}>
          <Cpu className={`w-4 h-4 ${colors.accent}`} />
          Engine Status
        </h3>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${botConfig.isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className={`text-[10px] ${botConfig.isRunning ? 'text-green-400' : 'text-red-400'}`}>
            {botConfig.isRunning ? 'ACTIVE' : 'STOPPED'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusItem
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Mode"
          value={botConfig.tradingMode.toUpperCase()}
          color={colors.accent}
          colors={colors}
        />
        <StatusItem
          icon={<Shield className="w-3.5 h-3.5" />}
          label="No-Loss"
          value={botConfig.noLossSell ? 'ON' : 'OFF'}
          color={botConfig.noLossSell ? 'text-green-400' : 'text-red-400'}
          colors={colors}
        />
        <StatusItem
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Positions"
          value={`${openPositions.length} open`}
          color={colors.text}
          colors={colors}
        />
        <StatusItem
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="DCA Slots"
          value={`${totalDCAOrders}/${maxDCASlots || '∞'}`}
          color={colors.textSecondary}
          colors={colors}
        />
      </div>

      {/* DCA Config Summary */}
      <div className={`mt-3 p-2 rounded-lg ${colors.bgSecondary} border ${colors.border}`}>
        <p className={`text-[10px] ${colors.textMuted} mb-1`}>DCA Configuration</p>
        <div className="flex flex-wrap gap-3 text-[10px]">
          <span className={colors.textSecondary}>
            Initial: <span className={`font-mono ${colors.text}`}>${botConfig.dcaSettings.initialBuy}</span>
          </span>
          <span className={colors.textSecondary}>
            Add: <span className={`font-mono ${colors.text}`}>${botConfig.dcaSettings.additionalBuy}</span>
          </span>
          <span className={colors.textSecondary}>
            Trigger: <span className={`font-mono ${colors.text}`}>{botConfig.dcaSettings.dcaTriggerPercent}%</span>
          </span>
          <span className={colors.textSecondary}>
            Max: <span className={`font-mono ${colors.text}`}>{botConfig.dcaSettings.maxBuyOrders}</span>
          </span>
          <span className={colors.textSecondary}>
            Target: <span className={`font-mono text-green-400`}>{botConfig.dcaSettings.profitTargetPercent}%</span>
          </span>
          <span className={colors.textSecondary}>
            Fee: <span className={`font-mono ${colors.text}`}>{botConfig.dcaSettings.tradingFeePercent}%</span>
          </span>
          <span className={colors.textSecondary}>
            Slip: <span className={`font-mono ${colors.text}`}>{botConfig.dcaSettings.slippagePercent}%</span>
          </span>
        </div>
      </div>

      {/* Last Activity */}
      <div className={`mt-2 flex items-center gap-2 text-[10px] ${colors.textMuted}`}>
        <Clock className="w-3 h-3" />
        <span className="truncate">{lastLog}</span>
      </div>
    </div>
  );
}

interface StatusItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  colors: any;
}

function StatusItem({ icon, label, value, color, colors }: StatusItemProps) {
  return (
    <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
      <div className={`flex items-center gap-1 mb-0.5 ${colors.textMuted}`}>
        {icon}
        <span className="text-[9px]">{label}</span>
      </div>
      <p className={`text-xs font-bold ${color}`}>{value}</p>
    </div>
  );
}
