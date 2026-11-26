import {
  AssetClass,
  CandlePoint,
  Instrument,
  Order,
  OrderBookLevel,
  Position,
  PriceAlert,
  Timeframe,
  TradePrint,
  WatchlistGroup,
} from '../types/market';

export const ASSET_CLASSES: AssetClass[] = [
  'Indices',
  'Stocks',
  'Crypto',
  'Futures',
  'Forex',
  'Bonds',
];

export const TIMEFRAMES: Timeframe[] = ['1D', '5D', '1M', '1Y', 'ALL'];

// Deterministic PRNG for consistent initial sparklines and candles
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildSparkline(prevClose: number, currentPrice: number, volatility: number, seedKey: string): number[] {
  const rand = seededRandom(hashString(seedKey));
  const points = 24;
  const arr: number[] = [prevClose];
  const drift = (currentPrice - prevClose) / points;
  for (let i = 1; i < points - 1; i++) {
    const noise = (rand() - 0.5) * prevClose * volatility * 1.4;
    const prev = arr[i - 1];
    const targetBlend = prevClose + drift * i;
    arr.push(prev * 0.45 + (targetBlend + noise) * 0.55);
  }
  arr.push(currentPrice);
  return arr;
}

interface RawInstrumentSeed {
  symbol: string;
  name: string;
  exchange: string;
  assetClass: AssetClass;
  price: number;
  prevClose: number;
  volume: number;
  marketCap?: string;
  decimals: number;
  unitPrefix?: string;
  unitSuffix?: string;
  volatility: number;
  monogramBg: string;
  monogramText: string;
  sector?: string;
}

const RAW_SEEDS: RawInstrumentSeed[] = [
  // Indices
  {
    symbol: 'SPX',
    name: 'S&P 500 Index',
    exchange: 'SP',
    assetClass: 'Indices',
    price: 5984.42,
    prevClose: 5931.18,
    volume: 2480000000,
    decimals: 2,
    volatility: 0.0045,
    monogramBg: '#2962ff',
    monogramText: '#ffffff',
    sector: 'US Broad Market',
  },
  {
    symbol: 'NDX',
    name: 'Nasdaq 100 Index',
    exchange: 'NASDAQ',
    assetClass: 'Indices',
    price: 20842.15,
    prevClose: 20594.80,
    volume: 1940000000,
    decimals: 2,
    volatility: 0.0065,
    monogramBg: '#089981',
    monogramText: '#ffffff',
    sector: 'US Large-Cap Tech',
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones Industrial',
    exchange: 'DJ',
    assetClass: 'Indices',
    price: 44128.60,
    prevClose: 44265.10,
    volume: 412000000,
    decimals: 2,
    volatility: 0.0038,
    monogramBg: '#313441',
    monogramText: '#dfe2f2',
    sector: 'US Blue Chip',
  },
  {
    symbol: 'RUT',
    name: 'Russell 2000 Index',
    exchange: 'RUSSELL',
    assetClass: 'Indices',
    price: 2348.90,
    prevClose: 2324.45,
    volume: 785000000,
    decimals: 2,
    volatility: 0.0075,
    monogramBg: '#262a35',
    monogramText: '#b6c4ff',
    sector: 'US Small Cap',
  },
  {
    symbol: 'VIX',
    name: 'CBOE Volatility Index',
    exchange: 'CBOE',
    assetClass: 'Indices',
    price: 14.82,
    prevClose: 15.94,
    volume: 31200000,
    decimals: 2,
    volatility: 0.025,
    monogramBg: '#c74500',
    monogramText: '#fff4f1',
    sector: 'Volatility',
  },
  {
    symbol: 'NI225',
    name: 'Nikkei 225 Index',
    exchange: 'TSE',
    assetClass: 'Indices',
    price: 38914.50,
    prevClose: 38620.00,
    volume: 1120000000,
    decimals: 2,
    volatility: 0.006,
    monogramBg: '#262a35',
    monogramText: '#dfe2f2',
    sector: 'Japan Equity',
  },

  // Stocks
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    price: 146.84,
    prevClose: 141.92,
    volume: 248310000,
    marketCap: '$3.60T',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.015,
    monogramBg: '#089981',
    monogramText: '#ffffff',
    sector: 'Semiconductors',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    price: 234.18,
    prevClose: 232.45,
    volume: 48920000,
    marketCap: '$3.54T',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.008,
    monogramBg: '#313441',
    monogramText: '#ffffff',
    sector: 'Consumer Tech',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    price: 428.72,
    prevClose: 431.90,
    volume: 21450000,
    marketCap: '$3.18T',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.0085,
    monogramBg: '#2962ff',
    monogramText: '#ffffff',
    sector: 'Cloud & Enterprise',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    price: 212.45,
    prevClose: 208.10,
    volume: 39810000,
    marketCap: '$2.23T',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.011,
    monogramBg: '#c74500',
    monogramText: '#ffffff',
    sector: 'Cloud & Commerce',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    price: 589.30,
    prevClose: 594.85,
    volume: 14620000,
    marketCap: '$1.49T',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.012,
    monogramBg: '#2962ff',
    monogramText: '#ffffff',
    sector: 'Interactive Media',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    price: 342.16,
    prevClose: 334.70,
    volume: 86420000,
    marketCap: '$1.10T',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.022,
    monogramBg: '#f23645',
    monogramText: '#ffffff',
    sector: 'Automotive & Energy',
  },
  {
    symbol: 'AVGO',
    name: 'Broadcom Inc.',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    price: 178.92,
    prevClose: 174.30,
    volume: 28140000,
    marketCap: '$835B',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.014,
    monogramBg: '#93000a',
    monogramText: '#ffdad6',
    sector: 'Semiconductors',
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    assetClass: 'Stocks',
    price: 244.65,
    prevClose: 246.12,
    volume: 9410000,
    marketCap: '$692B',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.0075,
    monogramBg: '#313441',
    monogramText: '#dfe2f2',
    sector: 'Money Center Banks',
  },

  // Crypto
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    exchange: 'COINBASE',
    assetClass: 'Crypto',
    price: 94820.50,
    prevClose: 91640.00,
    volume: 42800000000,
    marketCap: '$1.87T',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.019,
    monogramBg: '#c74500',
    monogramText: '#ffffff',
    sector: 'Layer 1 Digital Asset',
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    exchange: 'COINBASE',
    assetClass: 'Crypto',
    price: 3384.20,
    prevClose: 3290.80,
    volume: 21400000000,
    marketCap: '$407B',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.022,
    monogramBg: '#2962ff',
    monogramText: '#ffffff',
    sector: 'Smart Contract L1',
  },
  {
    symbol: 'SOLUSD',
    name: 'Solana / US Dollar',
    exchange: 'BINANCE',
    assetClass: 'Crypto',
    price: 238.64,
    prevClose: 245.10,
    volume: 6940000000,
    marketCap: '$112B',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.028,
    monogramBg: '#089981',
    monogramText: '#ffffff',
    sector: 'High-Throughput L1',
  },
  {
    symbol: 'XRPUSD',
    name: 'XRP / US Dollar',
    exchange: 'BITSTAMP',
    assetClass: 'Crypto',
    price: 1.4820,
    prevClose: 1.4190,
    volume: 5120000000,
    marketCap: '$84B',
    decimals: 4,
    unitPrefix: '$',
    volatility: 0.026,
    monogramBg: '#313441',
    monogramText: '#dfe2f2',
    sector: 'Settlement Network',
  },
  {
    symbol: 'AVAXUSD',
    name: 'Avalanche / US Dollar',
    exchange: 'COINBASE',
    assetClass: 'Crypto',
    price: 42.18,
    prevClose: 43.05,
    volume: 890000000,
    marketCap: '$17.2B',
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.029,
    monogramBg: '#f23645',
    monogramText: '#ffffff',
    sector: 'Subnet L1',
  },

  // Futures
  {
    symbol: 'ES1!',
    name: 'E-mini S&P 500 Futures',
    exchange: 'CME',
    assetClass: 'Futures',
    price: 6012.25,
    prevClose: 5960.50,
    volume: 1640000,
    decimals: 2,
    volatility: 0.0045,
    monogramBg: '#2962ff',
    monogramText: '#ffffff',
    sector: 'Equity Index Futures',
  },
  {
    symbol: 'NQ1!',
    name: 'E-mini Nasdaq-100 Futures',
    exchange: 'CME',
    assetClass: 'Futures',
    price: 20945.50,
    prevClose: 20710.25,
    volume: 682000,
    decimals: 2,
    volatility: 0.0065,
    monogramBg: '#089981',
    monogramText: '#ffffff',
    sector: 'Tech Index Futures',
  },
  {
    symbol: 'GC1!',
    name: 'Gold Futures',
    exchange: 'COMEX',
    assetClass: 'Futures',
    price: 2684.40,
    prevClose: 2662.10,
    volume: 214000,
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.006,
    monogramBg: '#c74500',
    monogramText: '#fff4f1',
    sector: 'Precious Metals',
  },
  {
    symbol: 'CL1!',
    name: 'WTI Crude Oil Futures',
    exchange: 'NYMEX',
    assetClass: 'Futures',
    price: 68.94,
    prevClose: 70.18,
    volume: 392000,
    decimals: 2,
    unitPrefix: '$',
    volatility: 0.013,
    monogramBg: '#313441',
    monogramText: '#dfe2f2',
    sector: 'Energy',
  },
  {
    symbol: 'ZB1!',
    name: '30-Year US Treasury Bond',
    exchange: 'CBOT',
    assetClass: 'Futures',
    price: 117.44,
    prevClose: 116.88,
    volume: 295000,
    decimals: 2,
    volatility: 0.005,
    monogramBg: '#262a35',
    monogramText: '#b6c4ff',
    sector: 'Rates Futures',
  },

  // Forex
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    exchange: 'FXCM',
    assetClass: 'Forex',
    price: 1.0542,
    prevClose: 1.0518,
    volume: 142000000,
    decimals: 4,
    volatility: 0.0022,
    monogramBg: '#2962ff',
    monogramText: '#ffffff',
    sector: 'G10 Major',
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    exchange: 'FXCM',
    assetClass: 'Forex',
    price: 152.84,
    prevClose: 153.46,
    volume: 118000000,
    decimals: 2,
    volatility: 0.0032,
    monogramBg: '#313441',
    monogramText: '#dfe2f2',
    sector: 'G10 Major',
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    exchange: 'FXCM',
    assetClass: 'Forex',
    price: 1.2648,
    prevClose: 1.2612,
    volume: 86000000,
    decimals: 4,
    volatility: 0.0028,
    monogramBg: '#089981',
    monogramText: '#ffffff',
    sector: 'G10 Major',
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    exchange: 'OANDA',
    assetClass: 'Forex',
    price: 0.8846,
    prevClose: 0.8871,
    volume: 54000000,
    decimals: 4,
    volatility: 0.0025,
    monogramBg: '#93000a',
    monogramText: '#ffdad6',
    sector: 'G10 Major',
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    exchange: 'OANDA',
    assetClass: 'Forex',
    price: 0.6514,
    prevClose: 0.6492,
    volume: 49000000,
    decimals: 4,
    volatility: 0.0035,
    monogramBg: '#262a35',
    monogramText: '#dfe2f2',
    sector: 'Commodity FX',
  },

  // Bonds
  {
    symbol: 'US10Y',
    name: 'US 10-Year Treasury Yield',
    exchange: 'TVC',
    assetClass: 'Bonds',
    price: 4.284,
    prevClose: 4.332,
    volume: 84000000,
    decimals: 3,
    unitSuffix: '%',
    volatility: 0.007,
    monogramBg: '#2962ff',
    monogramText: '#ffffff',
    sector: 'Sovereign Benchmark',
  },
  {
    symbol: 'US02Y',
    name: 'US 2-Year Treasury Yield',
    exchange: 'TVC',
    assetClass: 'Bonds',
    price: 4.216,
    prevClose: 4.248,
    volume: 62000000,
    decimals: 3,
    unitSuffix: '%',
    volatility: 0.006,
    monogramBg: '#313441',
    monogramText: '#dfe2f2',
    sector: 'Front-End Rates',
  },
  {
    symbol: 'US30Y',
    name: 'US 30-Year Treasury Yield',
    exchange: 'TVC',
    assetClass: 'Bonds',
    price: 4.462,
    prevClose: 4.498,
    volume: 41000000,
    decimals: 3,
    unitSuffix: '%',
    volatility: 0.007,
    monogramBg: '#262a35',
    monogramText: '#b6c4ff',
    sector: 'Long Duration',
  },
  {
    symbol: 'DE10Y',
    name: 'Germany 10-Year Bund Yield',
    exchange: 'TVC',
    assetClass: 'Bonds',
    price: 2.248,
    prevClose: 2.221,
    volume: 29000000,
    decimals: 3,
    unitSuffix: '%',
    volatility: 0.009,
    monogramBg: '#c74500',
    monogramText: '#fff4f1',
    sector: 'Eurozone Benchmark',
  },
];

export const INITIAL_INSTRUMENTS: Instrument[] = RAW_SEEDS.map((s) => {
  const change = s.price - s.prevClose;
  const changePct = (change / s.prevClose) * 100;
  const spreadAbs = s.price * s.volatility;
  const high = Math.max(s.price, s.prevClose) + spreadAbs * 0.42;
  const low = Math.min(s.price, s.prevClose) - spreadAbs * 0.38;
  const open = s.prevClose + change * 0.18;

  return {
    ...s,
    open,
    high,
    low,
    change,
    changePct,
    sparkline: buildSparkline(s.prevClose, s.price, s.volatility, s.symbol),
  };
});

export function generateCandles(instrument: Instrument, timeframe: Timeframe): CandlePoint[] {
  const counts: Record<Timeframe, number> = {
    '1D': 48,
    '5D': 52,
    '1M': 60,
    '1Y': 64,
    'ALL': 72,
  };
  const stepMs: Record<Timeframe, number> = {
    '1D': 15 * 60 * 1000,
    '5D': 2 * 60 * 60 * 1000,
    '1M': 12 * 60 * 60 * 1000,
    '1Y': 5 * 24 * 60 * 60 * 1000,
    'ALL': 30 * 24 * 60 * 60 * 1000,
  };
  const scaleMult: Record<Timeframe, number> = {
    '1D': 1,
    '5D': 2.2,
    '1M': 4.5,
    '1Y': 12.0,
    'ALL': 22.0,
  };

  const n = counts[timeframe];
  const step = stepMs[timeframe];
  const volMult = scaleMult[timeframe];
  const rand = seededRandom(hashString(`${instrument.symbol}-${timeframe}`));

  const now = Date.now();
  const startPrice =
    timeframe === '1D'
      ? instrument.prevClose
      : instrument.price * (1 - (rand() * 0.18 - 0.04) * (timeframe === 'ALL' ? 1.8 : 1));

  const points: CandlePoint[] = [];
  let prevClose = startPrice;
  const stepDrift = (instrument.price - startPrice) / n;

  for (let i = 0; i < n; i++) {
    const t = now - (n - 1 - i) * step;
    const d = new Date(t);

    let label = '';
    if (timeframe === '1D') {
      label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (timeframe === '5D' || timeframe === '1M') {
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    const open = prevClose;
    const barVol = instrument.volatility * Math.sqrt(volMult) * 0.55;
    const delta = stepDrift + (rand() - 0.48) * open * barVol;
    const close = i === n - 1 ? instrument.price : Math.max(open * 0.4, open + delta);
    const wickUp = Math.abs(rand()) * open * barVol * 0.65;
    const wickDown = Math.abs(rand()) * open * barVol * 0.65;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const baseBarVolume = instrument.volume / n;
    const volume = Math.round(baseBarVolume * (0.55 + rand() * 1.1));

    points.push({ time: t, label, open, high, low, close, volume });
    prevClose = close;
  }

  return points;
}

export function generateOrderBook(instrument: Instrument): {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  spread: number;
  spreadPct: number;
} {
  const rand = seededRandom(hashString(`${instrument.symbol}-book-${Math.round(instrument.price * 100)}`));
  const tick = Math.max(1 / Math.pow(10, instrument.decimals), instrument.price * 0.00035);

  const asksRaw: { price: number; size: number }[] = [];
  const bidsRaw: { price: number; size: number }[] = [];

  for (let i = 1; i <= 7; i++) {
    const askPrice = instrument.price + tick * i;
    const bidPrice = Math.max(0.0001, instrument.price - tick * i);
    const baseSize = instrument.price > 1000 ? 1.5 + rand() * 8 : 40 + rand() * 480;
    asksRaw.push({ price: askPrice, size: Number(baseSize.toFixed(instrument.price > 1000 ? 3 : 0)) });
    bidsRaw.push({ price: bidPrice, size: Number((baseSize * (0.85 + rand() * 0.4)).toFixed(instrument.price > 1000 ? 3 : 0)) });
  }

  let askCum = 0;
  const asks: OrderBookLevel[] = asksRaw.map((row) => {
    askCum += row.size;
    return { ...row, total: Number(askCum.toFixed(3)), depthPct: 0 };
  });

  let bidCum = 0;
  const bids: OrderBookLevel[] = bidsRaw.map((row) => {
    bidCum += row.size;
    return { ...row, total: Number(bidCum.toFixed(3)), depthPct: 0 };
  });

  const maxDepth = Math.max(askCum, bidCum, 1);
  asks.forEach((a) => (a.depthPct = Math.round((a.total / maxDepth) * 100)));
  bids.forEach((b) => (b.depthPct = Math.round((b.total / maxDepth) * 100)));

  const spread = asks[0].price - bids[0].price;
  const spreadPct = (spread / instrument.price) * 100;

  return {
    asks: asks.reverse(), // Highest ask on top, tightest ask right above spread
    bids,
    spread,
    spreadPct,
  };
}

export function generateRecentTrades(instrument: Instrument): TradePrint[] {
  const rand = seededRandom(hashString(`${instrument.symbol}-trades`));
  const now = Date.now();
  const prints: TradePrint[] = [];
  for (let i = 0; i < 12; i++) {
    const t = new Date(now - i * 4200);
    const jitter = (rand() - 0.5) * instrument.price * 0.0009;
    const price = instrument.price + jitter;
    const size =
      instrument.price > 1000
        ? Number((0.05 + rand() * 1.4).toFixed(3))
        : Math.round(12 + rand() * 340);
    prints.push({
      id: `${instrument.symbol}-${i}`,
      time: t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price,
      size,
      side: rand() > 0.46 ? 'buy' : 'sell',
    });
  }
  return prints;
}

export const INITIAL_WATCHLISTS: WatchlistGroup[] = [
  {
    id: 'wl-core',
    name: 'Core Tech & AI',
    symbols: ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'AVGO', 'NDX'],
  },
  {
    id: 'wl-macro',
    name: 'Macro & Rates',
    symbols: ['SPX', 'ES1!', 'GC1!', 'EURUSD', 'USDJPY', 'US10Y'],
  },
  {
    id: 'wl-crypto',
    name: 'Digital Assets',
    symbols: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD'],
  },
];

export const INITIAL_POSITIONS: Position[] = [
  { symbol: 'NVDA', side: 'long', quantity: 140, avgEntry: 138.20, openedAt: 'Nov 19, 09:42' },
  { symbol: 'AAPL', side: 'long', quantity: 85, avgEntry: 229.10, openedAt: 'Nov 21, 14:15' },
  { symbol: 'BTCUSD', side: 'long', quantity: 0.42, avgEntry: 89450.00, openedAt: 'Nov 22, 19:08' },
  { symbol: 'MSFT', side: 'long', quantity: 35, avgEntry: 434.50, openedAt: 'Nov 24, 11:20' },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-8421',
    symbol: 'NVDA',
    side: 'buy',
    type: 'limit',
    quantity: 40,
    limitPrice: 143.50,
    status: 'open',
    createdAt: 'Today, 09:34',
  },
  {
    id: 'ORD-8419',
    symbol: 'ETHUSD',
    side: 'buy',
    type: 'limit',
    quantity: 3.5,
    limitPrice: 3250.00,
    status: 'open',
    createdAt: 'Today, 08:12',
  },
  {
    id: 'ORD-8394',
    symbol: 'AMZN',
    side: 'buy',
    type: 'market',
    quantity: 60,
    executedPrice: 209.85,
    status: 'filled',
    createdAt: 'Yesterday, 15:48',
  },
];

export const INITIAL_ALERTS: PriceAlert[] = [
  {
    id: 'ALT-101',
    symbol: 'NVDA',
    condition: 'above',
    targetPrice: 150.00,
    triggered: false,
    createdAt: 'Today, 09:30',
  },
  {
    id: 'ALT-102',
    symbol: 'BTCUSD',
    condition: 'above',
    targetPrice: 95000.00,
    triggered: false,
    createdAt: 'Today, 10:05',
  },
  {
    id: 'ALT-103',
    symbol: 'US10Y',
    condition: 'below',
    targetPrice: 4.250,
    triggered: false,
    createdAt: 'Yesterday, 16:00',
  },
];
