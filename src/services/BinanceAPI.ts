/**
 * BinanceAPI - Public REST API client for market data
 * Uses Binance Public API (no authentication required)
 * Includes fallback to data-api.binance.vision
 * 
 * IMPORTANT: This is for MARKET DATA ONLY. No trading orders.
 */

export interface CandleData {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface TickerPrice {
  symbol: string;
  price: number;
}

const BINANCE_API = 'https://api.binance.com';
const BINANCE_VISION = 'https://data-api.binance.vision';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

const SUPPORTED_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT',
  'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT',
  'TRXUSDT', 'LINKUSDT', 'POLUSDT', 'LTCUSDT'
];

export class BinanceAPI {
  private baseUrl: string;
  private fallbackUrl: string;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private rateLimitDelay: number = 100; // ms between requests

  constructor() {
    this.baseUrl = BINANCE_API;
    this.fallbackUrl = BINANCE_VISION;
  }

  /**
   * Rate limiting - Binance allows 1200 requests/minute
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Fetch with fallback
   */
  private async fetchWithFallback(endpoint: string): Promise<any> {
    await this.rateLimit();

    try {
      // Try primary API
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`Primary API failed, trying fallback: ${error}`);
      
      try {
        // Try fallback API
        const response = await fetch(`${this.fallbackUrl}${endpoint}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (fallbackError) {
        console.error(`Both APIs failed: ${fallbackError}`);
        throw new Error('All API endpoints failed');
      }
    }
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      const data = await this.fetchWithFallback(`/api/v3/ticker/price?symbol=${symbol}`);
      return parseFloat(data.price);
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get all prices
   */
  async getAllPrices(): Promise<Record<string, number>> {
    try {
      const data = await this.fetchWithFallback('/api/v3/ticker/price');
      const prices: Record<string, number> = {};
      
      for (const ticker of data) {
        if (SUPPORTED_PAIRS.includes(ticker.symbol)) {
          const coin = ticker.symbol.replace('USDT', '');
          prices[coin] = parseFloat(ticker.price);
        }
      }
      
      return prices;
    } catch (error) {
      console.error('Failed to get all prices:', error);
      throw error;
    }
  }

  /**
   * Get klines (candlestick data)
   * @param symbol Trading pair (e.g., BTCUSDT)
   * @param interval Time interval (1m, 5m, 15m, 1h, 4h, 1d)
   * @param limit Number of candles (max 1000)
   */
  async getKlines(symbol: string, interval: string = '1h', limit: number = 100): Promise<CandleData[]> {
    try {
      const data = await this.fetchWithFallback(
        `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      return data.map((kline: any[]) => ({
        openTime: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
      }));
    } catch (error) {
      console.error(`Failed to get klines for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get 24hr ticker statistics
   */
  async get24hrTicker(symbol: string): Promise<any> {
    try {
      return await this.fetchWithFallback(`/api/v3/ticker/24hr?symbol=${symbol}`);
    } catch (error) {
      console.error(`Failed to get 24hr ticker for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Check API connectivity
   */
  async ping(): Promise<boolean> {
    try {
      await this.fetchWithFallback('/api/v3/ping');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get server time
   */
  async getServerTime(): Promise<number> {
    try {
      const data = await this.fetchWithFallback('/api/v3/time');
      return data.serverTime;
    } catch (error) {
      console.error('Failed to get server time:', error);
      return Date.now();
    }
  }

  /**
   * Get request count (for monitoring)
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset request counter
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

/**
 * CoinGecko API - Alternative data source
 */
export class CoinGeckoAPI {
  private baseUrl = COINGECKO_API;

  async getCoinPrice(coinId: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      const data = await response.json();
      return data[coinId]?.usd || 0;
    } catch (error) {
      console.error(`CoinGecko API failed for ${coinId}:`, error);
      throw error;
    }
  }

  async getAllPrices(): Promise<Record<string, number>> {
    const coinIds = 'bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,tron,chainlink,polygon-ecosystem-token,litecoin';
    
    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinIds}&vs_currencies=usd`
      );
      const data = await response.json();
      
      const symbolMap: Record<string, string> = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'solana': 'SOL',
        'binancecoin': 'BNB',
        'ripple': 'XRP',
        'cardano': 'ADA',
        'dogecoin': 'DOGE',
        'avalanche-2': 'AVAX',
        'tron': 'TRX',
        'chainlink': 'LINK',
        'polygon-ecosystem-token': 'POL',
        'litecoin': 'LTC',
      };

      const prices: Record<string, number> = {};
      for (const [id, symbol] of Object.entries(symbolMap)) {
        if (data[id]?.usd) {
          prices[symbol] = data[id].usd;
        }
      }

      return prices;
    } catch (error) {
      console.error('CoinGecko API failed:', error);
      throw error;
    }
  }
}

/**
 * MarketDataService - Unified market data provider with fallbacks
 */
export class MarketDataService {
  private binanceAPI: BinanceAPI;
  private coingeckoAPI: CoinGeckoAPI;
  private useFallback: boolean = false;

  constructor() {
    this.binanceAPI = new BinanceAPI();
    this.coingeckoAPI = new CoinGeckoAPI();
  }

  /**
   * Get all prices with automatic fallback
   */
  async getAllPrices(): Promise<Record<string, number>> {
    try {
      // Try Binance first
      const prices = await this.binanceAPI.getAllPrices();
      this.useFallback = false;
      return prices;
    } catch (error) {
      console.warn('Binance API failed, trying CoinGecko:', error);
      
      try {
        // Fallback to CoinGecko
        const prices = await this.coingeckoAPI.getAllPrices();
        this.useFallback = true;
        return prices;
      } catch (fallbackError) {
        console.error('All market data APIs failed:', fallbackError);
        throw new Error('Unable to fetch market data from any source');
      }
    }
  }

  /**
   * Get klines for a specific coin
   */
  async getKlines(symbol: string, interval: string = '1h', limit: number = 100): Promise<CandleData[]> {
    return await this.binanceAPI.getKlines(`${symbol}USDT`, interval, limit);
  }

  /**
   * Check if using fallback API
   */
  isUsingFallback(): boolean {
    return this.useFallback;
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{ binance: boolean; coingecko: boolean }> {
    const binance = await this.binanceAPI.ping();
    let coingecko = false;
    
    try {
      await this.coingeckoAPI.getCoinPrice('bitcoin');
      coingecko = true;
    } catch {
      coingecko = false;
    }

    return { binance, coingecko };
  }

  /**
   * Get API stats
   */
  getStats() {
    return {
      requestCount: this.binanceAPI.getRequestCount(),
      usingFallback: this.useFallback,
    };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
