import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { TradingProvider } from './contexts/TradingContext';
import Header from './components/Header';
import WalletStats from './components/WalletStats';
import MarketRadar from './components/MarketRadar';
import Charts from './components/Charts';
import TradingPanel from './components/TradingPanel';
import SettingsPanel from './components/SettingsPanel';
import EngineStatus from './components/EngineStatus';
import WorkerMonitoring from './components/WorkerMonitoring';

function AppContent() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className={`min-h-screen ${colors.bg} transition-colors duration-300`}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-[1920px] mx-auto px-3 py-4 space-y-4">
        {/* Wallet Stats - Always visible */}
        <WalletStats />

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <EngineStatus />
            <WorkerMonitoring />
            <Charts />
          </div>
        )}

        {activeTab === 'radar' && (
          <MarketRadar />
        )}

        {activeTab === 'trading' && (
          <TradingPanel />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </main>

      {/* Footer */}
      <footer className={`${colors.bgSecondary} border-t ${colors.border} mt-8`}>
        <div className="max-w-[1920px] mx-auto px-3 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className={`text-[10px] ${colors.textMuted}`}>
            Crypto Trading Simulator Pro v3.0 • Scheduled Workers Active • No Real Money
          </p>
          <p className={`text-[10px] ${colors.textMuted}`}>
            Created by Taseen Billah • Phase 3 • Not Financial Advice
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TradingProvider>
          <AppContent />
        </TradingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
