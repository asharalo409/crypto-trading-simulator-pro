import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrading } from '../contexts/TradingContext';
import { Theme, Language } from '../types';
import {
  Activity, BarChart3, Settings, Globe, Palette,
  Play, Square, Menu, X, Zap, LineChart, FlaskConical
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { theme, setTheme, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { botConfig, toggleBot } = useTrading();
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const themes: { value: Theme; label: string }[] = [
    { value: 'cyberpunk', label: t('cyberpunk') },
    { value: 'binance', label: t('binanceDark') },
    { value: 'tokyo', label: t('tokyoMidnight') },
    { value: 'matrix', label: t('matrixGreen') },
    { value: 'oled', label: t('oledBlack') },
  ];

  const tabs = [
    { id: 'dashboard', label: t('dashboard'), icon: BarChart3 },
    { id: 'radar', label: t('marketRadar'), icon: Activity },
    { id: 'trading', label: t('trading'), icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'backtest', label: 'Backtest', icon: FlaskConical },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <header className={`${colors.bgSecondary} border-b ${colors.border} sticky top-0 z-50`}>
      <div className="max-w-[1920px] mx-auto px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-sm font-bold ${colors.text}`}>{t('appTitle')}</h1>
              <p className={`text-xs ${colors.textMuted}`}>{t('paperTrading')} • {t('virtualBalance')}: $10,000</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? `${colors.bgHover} ${colors.accent} font-medium`
                    : `${colors.textSecondary} hover:${colors.text}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Bot Status */}
            <button
              onClick={toggleBot}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                botConfig.isRunning
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {botConfig.isRunning ? <Play className="w-3 h-3" /> : <Square className="w-3 h-3" />}
              <span className="hidden sm:inline">{botConfig.isRunning ? t('botRunning') : t('botStopped')}</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs ${colors.textSecondary} ${colors.bgCard} border ${colors.border}`}
            >
              <Globe className="w-3 h-3" />
              {language === 'en' ? 'বাং' : 'EN'}
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg ${colors.textSecondary} ${colors.bgCard} border ${colors.border}`}
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className={`md:hidden p-1.5 rounded-lg ${colors.textSecondary}`}
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Theme Selector Dropdown */}
        {showSettings && (
          <div className={`absolute right-3 top-14 ${colors.bgCard} border ${colors.border} rounded-xl p-3 shadow-2xl z-50 min-w-[200px]`}>
            <p className={`text-xs ${colors.textMuted} mb-2`}>{t('theme')}</p>
            <div className="space-y-1">
              {themes.map(th => (
                <button
                  key={th.value}
                  onClick={() => { setTheme(th.value); setShowSettings(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    theme === th.value
                      ? `${colors.bgHover} ${colors.accent}`
                      : `${colors.textSecondary} hover:${colors.text}`
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className={`md:hidden mt-2 pb-2 border-t ${colors.border}`}>
            <nav className="flex flex-col gap-1 pt-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileMenu(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    activeTab === tab.id
                      ? `${colors.bgHover} ${colors.accent}`
                      : colors.textSecondary
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
