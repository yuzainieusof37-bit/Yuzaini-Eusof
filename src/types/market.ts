export type AssetClass = 'Indices' | 'Stocks' | 'Crypto' | 'Futures' | 'Forex' | 'Bonds';

export type Timeframe = '1D' | '5D' | '1M' | '1Y' | 'ALL';

export type ScreenTab = 'markets' | 'chart' | 'watchlist' | 'portfolio';

export type ChartMode = 'Candles' | 'Area' | 'Line';

export type SortField = 'symbol' | 'price' | 'changePct' | 'volume';
export type SortDirection = 'asc' | 'desc';

export interface Instrument {
  symbol: string;
  name: string;
  exchange: string;
  assetClass: AssetClass;
  price: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap?: string;
  decimals: number;
  unitPrefix?: string;
  unitSuffix?: string;
  volatility: number;
  monogramBg: string;
  monogramText: string;
  sparkline: number[];
  sector?: string;
}

export interface CandlePoint {
  time: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  depthPct: number;
}

export interface TradePrint {
  id: string;
  time: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  avgEntry: number;
  openedAt: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  limitPrice?: number;
  executedPrice?: number;
  status: 'open' | 'filled' | 'cancelled';
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  triggered: boolean;
  createdAt: string;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  symbols: string[];
}
