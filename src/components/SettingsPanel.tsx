import React, { useState } from 'react';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import { Theme, Language } from '../types';
import {
  Settings, Palette, Globe, Sliders, DollarSign,
  Percent, Hash, Save, Check, Info, Send, Shield
} from 'lucide-react';
import TelegramSettings from './TelegramSettings';
import AuditLogViewer from './AuditLogViewer';

export default function SettingsPanel() {
  const { theme, setTheme, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { botConfig, updateDCASettings } = useTrading();
  const [saved, setSaved] = useState(false);

  const themes: { value: Theme; label: string; preview: string }[] = [
    { value: 'cyberpunk', label: t('cyberpunk'), preview: 'from-cyan-400 to-fuchsia-500' },
    { value: 'binance', label: t('binanceDark'), preview: 'from-yellow-400 to-yellow-600' },
    { value: 'tokyo', label: t('tokyoMidnight'), preview: 'from-pink-400 to-purple-500' },
    { value: 'matrix', label: t('matrixGreen'), preview: 'from-green-400 to-green-600' },
    { value: 'oled', label: t('oledBlack'), preview: 'from-blue-400 to-purple-400' },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Theme Selection */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-4 flex items-center gap-2`}>
          <Palette className={`w-4 h-4 ${colors.accent}`} />
          {t('theme')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themes.map(th => (
            <button
              key={th.value}
              onClick={() => setTheme(th.value)}
              className={`p-3 rounded-xl border transition-all ${
                theme === th.value
                  ? `${colors.bgHover} border-current ${colors.accent}`
                  : `${colors.bgSecondary} ${colors.border}`
              }`}
            >
              <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${th.preview} mb-2`} />
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${theme === th.value ? colors.accent : colors.text}`}>
                  {th.label}
                </span>
                {theme === th.value && <Check className={`w-4 h-4 ${colors.accent}`} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-4 flex items-center gap-2`}>
          <Globe className={`w-4 h-4 ${colors.accent}`} />
          {t('language')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLanguage('bn')}
            className={`p-4 rounded-xl border transition-all ${
              language === 'bn'
                ? `${colors.bgHover} border-current ${colors.accent}`
                : `${colors.bgSecondary} ${colors.border}`
            }`}
          >
            <p className={`text-2xl mb-1`}>🇧🇩</p>
            <p className={`text-sm font-medium ${language === 'bn' ? colors.accent : colors.text}`}>
              {t('bangla')}
            </p>
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border transition-all ${
              language === 'en'
                ? `${colors.bgHover} border-current ${colors.accent}`
                : `${colors.bgSecondary} ${colors.border}`
            }`}
          >
            <p className={`text-2xl mb-1`}>🇺🇸</p>
            <p className={`text-sm font-medium ${language === 'en' ? colors.accent : colors.text}`}>
              {t('english')}
            </p>
          </button>
        </div>
      </div>

      {/* DCA Settings */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-4 flex items-center gap-2`}>
          <Sliders className={`w-4 h-4 ${colors.accent}`} />
          {t('dcaSettings')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingInput
            label={t('initialBuy')}
            value={botConfig.dcaSettings.initialBuy}
            onChange={(v) => updateDCASettings({ initialBuy: Number(v) })}
            prefix="$"
            icon={<DollarSign className="w-3.5 h-3.5" />}
            colors={colors}
          />
          <SettingInput
            label={t('additionalBuy')}
            value={botConfig.dcaSettings.additionalBuy}
            onChange={(v) => updateDCASettings({ additionalBuy: Number(v) })}
            prefix="$"
            icon={<DollarSign className="w-3.5 h-3.5" />}
            colors={colors}
          />
          <SettingInput
            label={t('dcaTrigger')}
            value={botConfig.dcaSettings.dcaTriggerPercent}
            onChange={(v) => updateDCASettings({ dcaTriggerPercent: Number(v) })}
            suffix="%"
            icon={<Percent className="w-3.5 h-3.5" />}
            colors={colors}
          />
          <SettingInput
            label={t('maxOrders')}
            value={botConfig.dcaSettings.maxBuyOrders}
            onChange={(v) => updateDCASettings({ maxBuyOrders: Number(v) })}
            icon={<Hash className="w-3.5 h-3.5" />}
            colors={colors}
          />
          <SettingInput
            label={t('profitTarget')}
            value={botConfig.dcaSettings.profitTargetPercent}
            onChange={(v) => updateDCASettings({ profitTargetPercent: Number(v) })}
            suffix="%"
            icon={<Percent className="w-3.5 h-3.5" />}
            colors={colors}
          />
          <SettingInput
            label={t('tradingFee')}
            value={botConfig.dcaSettings.tradingFeePercent}
            onChange={(v) => updateDCASettings({ tradingFeePercent: Number(v) })}
            suffix="%"
            icon={<Percent className="w-3.5 h-3.5" />}
            colors={colors}
          />
          <SettingInput
            label={t('slippage')}
            value={botConfig.dcaSettings.slippagePercent}
            onChange={(v) => updateDCASettings({ slippagePercent: Number(v) })}
            suffix="%"
            icon={<Percent className="w-3.5 h-3.5" />}
            colors={colors}
          />
        </div>

        <div className={`mt-4 p-3 rounded-lg ${colors.bgSecondary} border ${colors.border}`}>
          <div className="flex items-start gap-2">
            <Info className={`w-4 h-4 ${colors.accent} flex-shrink-0 mt-0.5`} />
            <div className={`text-[10px] ${colors.textMuted}`}>
              <p>• Maximum 4 DCA orders per position</p>
              <p>• DCA triggers on {botConfig.dcaSettings.dcaTriggerPercent}% price drop from last buy</p>
              <p>• Sell triggers at avg entry + fees + slippage + {botConfig.dcaSettings.profitTargetPercent}% profit</p>
              <p>• Trading fee: {botConfig.dcaSettings.tradingFeePercent}% per side</p>
              <p>• Simulated slippage: {botConfig.dcaSettings.slippagePercent}%</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : `bg-gradient-to-r ${colors.gradient} text-black hover:opacity-90`
          }`}
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Saved!' : t('save')}
        </button>
      </div>

      {/* System Info */}
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
          <Settings className={`w-4 h-4 ${colors.accent}`} />
          System Info
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
            <p className={colors.textMuted}>Version</p>
            <p className={`${colors.text} font-mono`}>4.0.0</p>
          </div>
          <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
            <p className={colors.textMuted}>Engine</p>
            <p className={`${colors.text} font-mono`}>Paper Trading</p>
          </div>
          <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
            <p className={colors.textMuted}>Data Source</p>
            <p className={`${colors.text} font-mono`}>Binance API</p>
          </div>
          <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
            <p className={colors.textMuted}>Supported Coins</p>
            <p className={`${colors.text} font-mono`}>12</p>
          </div>
          <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
            <p className={colors.textMuted}>Starting Balance</p>
            <p className={`${colors.text} font-mono`}>$10,000</p>
          </div>
          <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
            <p className={colors.textMuted}>Status</p>
            <p className={`font-mono ${botConfig.isRunning ? 'text-green-400' : 'text-red-400'}`}>
              {botConfig.isRunning ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Telegram Notifications */}
      <TelegramSettings />

      {/* Audit Log */}
      <AuditLogViewer />
    </div>
  );
}

interface SettingInputProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  colors: ThemeColors;
}

function SettingInput({ label, value, onChange, prefix, suffix, icon, colors }: SettingInputProps) {
  return (
    <div>
      <label className={`text-[10px] ${colors.textMuted} mb-1 flex items-center gap-1`}>
        {icon}
        {label}
      </label>
      <div className={`flex items-center ${colors.bgSecondary} border ${colors.border} rounded-lg overflow-hidden`}>
        {prefix && <span className={`px-2 text-xs ${colors.textMuted}`}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-2 py-2 text-xs ${colors.text} bg-transparent outline-none font-mono`}
          step="any"
        />
        {suffix && <span className={`px-2 text-xs ${colors.textMuted}`}>{suffix}</span>}
      </div>
    </div>
  );
}
