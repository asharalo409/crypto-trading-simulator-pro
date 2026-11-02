import { BASE_PRICES } from '../data/coins';

export function generateCandleData(basePrice: number, count: number = 100) {
  const data = [];
  let price = basePrice * 0.92;
  const now = Date.now();
  
  for (let i = count; i >= 0; i--) {
    const open = price;
    const volatility = basePrice * 0.015;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      time: Math.floor((now - i * 3600000) / 1000) as any,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
    
    price = close;
  }
  return data;
}

export function generateEquityCurve() {
  const data: { date: string; balance: number; pnl: number }[] = [];
  let balance = 10000;
  const now = Date.now();
  
  for (let i = 30; i >= 0; i--) {
    const change = (Math.random() - 0.4) * 50;
    balance += change;
    data.push({
      date: new Date(now - i * 86400000).toLocaleDateString(),
      balance: Number(balance.toFixed(2)),
      pnl: Number((balance - 10000).toFixed(2)),
    });
  }
  return data;
}
