import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgCard: string;
  bgHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentSecondary: string;
  profit: string;
  loss: string;
  warning: string;
  chartGrid: string;
  chartText: string;
  gradient: string;
}

const themeColors: Record<Theme, ThemeColors> = {
  cyberpunk: {
    bg: 'bg-[#0a0a1a]',
    bgSecondary: 'bg-[#12122a]',
    bgCard: 'bg-[#1a1a3e]',
    bgHover: 'bg-[#252560]',
    text: 'text-[#e0e0ff]',
    textSecondary: 'text-[#a0a0ff]',
    textMuted: 'text-[#6060aa]',
    border: 'border-[#3030aa]',
    accent: 'text-[#00ffff]',
    accentSecondary: 'text-[#ff00ff]',
    profit: 'text-[#00ff88]',
    loss: 'text-[#ff4488]',
    warning: 'text-[#ffaa00]',
    chartGrid: '#1a1a3e',
    chartText: '#6060aa',
    gradient: 'from-[#00ffff] to-[#ff00ff]',
  },
  binance: {
    bg: 'bg-[#0b0e11]',
    bgSecondary: 'bg-[#1e2329]',
    bgCard: 'bg-[#2b3139]',
    bgHover: 'bg-[#363c45]',
    text: 'text-[#eaecef]',
    textSecondary: 'text-[#848e9c]',
    textMuted: 'text-[#5e6673]',
    border: 'border-[#2b3139]',
    accent: 'text-[#f0b90b]',
    accentSecondary: 'text-[#f0b90b]',
    profit: 'text-[#0ecb81]',
    loss: 'text-[#f6465d]',
    warning: 'text-[#f0b90b]',
    chartGrid: '#2b3139',
    chartText: '#5e6673',
    gradient: 'from-[#f0b90b] to-[#f5d060]',
  },
  tokyo: {
    bg: 'bg-[#1a1025]',
    bgSecondary: 'bg-[#231535]',
    bgCard: 'bg-[#2d1f42]',
    bgHover: 'bg-[#3a2855]',
    text: 'text-[#f0e6ff]',
    textSecondary: 'text-[#b89cdb]',
    textMuted: 'text-[#7a5ea0]',
    border: 'border-[#3a2855]',
    accent: 'text-[#ff6b9d]',
    accentSecondary: 'text-[#c084fc]',
    profit: 'text-[#4ade80]',
    loss: 'text-[#fb7185]',
    warning: 'text-[#fbbf24]',
    chartGrid: '#2d1f42',
    chartText: '#7a5ea0',
    gradient: 'from-[#ff6b9d] to-[#c084fc]',
  },
  matrix: {
    bg: 'bg-[#000000]',
    bgSecondary: 'bg-[#001100]',
    bgCard: 'bg-[#002200]',
    bgHover: 'bg-[#003300]',
    text: 'text-[#00ff00]',
    textSecondary: 'text-[#00cc00]',
    textMuted: 'text-[#006600]',
    border: 'border-[#004400]',
    accent: 'text-[#00ff00]',
    accentSecondary: 'text-[#33ff33]',
    profit: 'text-[#00ff00]',
    loss: 'text-[#ff3333]',
    warning: 'text-[#ffff00]',
    chartGrid: '#002200',
    chartText: '#006600',
    gradient: 'from-[#00ff00] to-[#00cc00]',
  },
  oled: {
    bg: 'bg-black',
    bgSecondary: 'bg-[#0a0a0a]',
    bgCard: 'bg-[#111111]',
    bgHover: 'bg-[#1a1a1a]',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    textMuted: 'text-gray-600',
    border: 'border-gray-800',
    accent: 'text-blue-400',
    accentSecondary: 'text-purple-400',
    profit: 'text-green-400',
    loss: 'text-red-400',
    warning: 'text-yellow-400',
    chartGrid: '#111111',
    chartText: '#333333',
    gradient: 'from-blue-400 to-purple-400',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('ctsp-theme');
    return (saved as Theme) || 'cyberpunk';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('ctsp-theme', newTheme);
  };

  useEffect(() => {
    localStorage.setItem('ctsp-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themeColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
