import { Coin } from '../types';

export const SUPPORTED_COINS: Coin[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', pair: 'BTC/USDT' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', pair: 'ETH/USDT' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', pair: 'SOL/USDT' },
  { symbol: 'BNB', name: 'BNB', icon: '◆', pair: 'BNB/USDT' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕', pair: 'XRP/USDT' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳', pair: 'ADA/USDT' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', pair: 'DOGE/USDT' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '▲', pair: 'AVAX/USDT' },
  { symbol: 'TRX', name: 'TRON', icon: '⟁', pair: 'TRX/USDT' },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬡', pair: 'LINK/USDT' },
  { symbol: 'POL', name: 'Polygon', icon: '⬢', pair: 'POL/USDT' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'Ł', pair: 'LTC/USDT' },
];

export const BASE_PRICES: Record<string, number> = {
  BTC: 104500,
  ETH: 3920,
  SOL: 178,
  BNB: 715,
  XRP: 2.45,
  ADA: 0.82,
  DOGE: 0.228,
  AVAX: 38.5,
  TRX: 0.265,
  LINK: 18.75,
  POL: 0.48,
  LTC: 105,
};
