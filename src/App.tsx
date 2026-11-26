import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Briefcase,
  CandlestickChart,
  Pause,
  Play,
  Star,
} from 'lucide-react';
import {
  INITIAL_ALERTS,
  INITIAL_INSTRUMENTS,
  INITIAL_ORDERS,
  INITIAL_POSITIONS,
  INITIAL_WATCHLISTS,
  generateCandles,
} from './data/marketData';
import {
  ChartMode,
  Instrument,
  Order,
  Position,
  PriceAlert,
  ScreenTab,
  Timeframe,
  WatchlistGroup,
} from './types/market';
import {
  formatCurrency,
  formatDeltaPct,
  formatInstrumentPrice,
} from './utils/formatters';
import { MarketsScreen } from './components/MarketsScreen';
import { ChartScreen } from './components/ChartScreen';
import { WatchlistScreen } from './components/WatchlistScreen';
import { PortfolioScreen } from './components/PortfolioScreen';
import { OrderTicketPanel } from './components/OrderTicketPanel';
import { InteractiveChart } from './components/InteractiveChart';

interface ToastMessage {
  id: string;
  text: string;
  tone: 'info' | 'up' | 'down';
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenTab>('markets');
  const [instruments, setInstruments] = useState<Instrument[]>(INITIAL_INSTRUMENTS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartMode, setChartMode] = useState<ChartMode>('Candles');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);

  const [watchlists, setWatchlists] = useState<WatchlistGroup[]>(INITIAL_WATCHLISTS);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>(INITIAL_WATCHLISTS[0].id);

  const [buyingPower, setBuyingPower] = useState<number>(64250.0);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [alerts, setAlerts] = useState<PriceAlert[]>(INITIAL_ALERTS);

  const [mobileTradeOpen, setMobileTradeOpen] = useState<boolean>(false);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [prefillLimitPrice, setPrefillLimitPrice] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const pushToast = useCallback((text: string, tone: 'info' | 'up' | 'down' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToast({ id, text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedInstrument = useMemo(
    () => instruments.find((i) => i.symbol === selectedSymbol) ?? instruments[0],
    [instruments, selectedSymbol]
  );

  const watchlistedSet = useMemo(() => {
    const set = new Set<string>();
    watchlists.forEach((wl) => wl.symbols.forEach((s) => set.add(s)));
    return set;
  }, [watchlists]);

  const candles = useMemo(() => {
    const base = generateCandles(selectedInstrument, timeframe);
    if (base.length > 0) {
      const last = base[base.length - 1];
      base[base.length - 1] = {
        ...last,
        close: selectedInstrument.price,
        high: Math.max(last.high, selectedInstrument.price),
        low: Math.min(last.low, selectedInstrument.price),
      };
    }
    return base;
  }, [selectedInstrument, timeframe]);

  // Live Market Simulation Loop
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setInstruments((prev) =>
        prev.map((inst) => {
          // ~55% chance to tick each interval for realistic asynchronous tape feel
          if (Math.random() > 0.55) return inst;
          const stepPct = (Math.random() - 0.492) * inst.volatility * 0.28;
          const rawNext = inst.price * (1 + stepPct);
          const factor = Math.pow(10, inst.decimals);
          const nextPrice = Math.max(1 / factor, Math.round(rawNext * factor) / factor);
          const nextChange = nextPrice - inst.prevClose;
          const nextChangePct = (nextChange / inst.prevClose) * 100;
          const nextSparkline = [...inst.sparkline.slice(1), nextPrice];

          return {
            ...inst,
            price: nextPrice,
            high: Math.max(inst.high, nextPrice),
            low: Math.min(inst.low, nextPrice),
            change: nextChange,
            changePct: nextChangePct,
            volume: inst.volume + Math.round(Math.random() * 1400),
            sparkline: nextSparkline,
          };
        })
      );
    }, 1600);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Evaluate Price Alerts on live instrument ticks
  useEffect(() => {
    setAlerts((prevAlerts) => {
      let changed = false;
      const next = prevAlerts.map((al) => {
        if (al.triggered) return al;
        const inst = instruments.find((i) => i.symbol === al.symbol);
        if (!inst) return al;
        const hit =
          (al.condition === 'above' && inst.price >= al.targetPrice) ||
          (al.condition === 'below' && inst.price <= al.targetPrice);
        if (hit) {
          changed = true;
          pushToast(
            `Price Alert: ${inst.symbol} crossed ${al.condition} ${formatInstrumentPrice(inst)}`,
            al.condition === 'above' ? 'up' : 'down'
          );
          return { ...al, triggered: true };
        }
        return al;
      });
      return changed ? next : prevAlerts;
    });
  }, [instruments, pushToast]);

  // Evaluate Open Limit Orders on live instrument ticks
  useEffect(() => {
    setOrders((prevOrders) => {
      const openLimits = prevOrders.filter((o) => o.status === 'open' && o.type === 'limit' && o.limitPrice);
      if (openLimits.length === 0) return prevOrders;

      let filledAny = false;
      const newlyFilled: Order[] = [];

      const updatedOrders = prevOrders.map((ord) => {
        if (ord.status !== 'open' || ord.type !== 'limit' || !ord.limitPrice) return ord;
        const inst = instruments.find((i) => i.symbol === ord.symbol);
        if (!inst) return ord;

        const shouldFill =
          (ord.side === 'buy' && inst.price <= ord.limitPrice) ||
          (ord.side === 'sell' && inst.price >= ord.limitPrice);

        if (shouldFill) {
          filledAny = true;
          const filledOrder: Order = {
            ...ord,
            status: 'filled',
            executedPrice: ord.limitPrice,
          };
          newlyFilled.push(filledOrder);
          return filledOrder;
        }
        return ord;
      });

      if (filledAny) {
        newlyFilled.forEach((ord) => {
          const fillPx = ord.executedPrice ?? 0;
          if (ord.side === 'buy') {
            setBuyingPower((bp) => Math.max(0, bp - ord.quantity * fillPx));
            setPositions((posList) => {
              const existing = posList.find((p) => p.symbol === ord.symbol);
              if (existing) {
                const newQty = existing.quantity + ord.quantity;
                const newAvg =
                  (existing.quantity * existing.avgEntry + ord.quantity * fillPx) / newQty;
                return posList.map((p) =>
                  p.symbol === ord.symbol ? { ...p, quantity: newQty, avgEntry: newAvg } : p
                );
              }
              return [
                ...posList,
                {
                  symbol: ord.symbol,
                  side: 'long',
                  quantity: ord.quantity,
                  avgEntry: fillPx,
                  openedAt: 'Just now',
                },
              ];
            });
          } else {
            setBuyingPower((bp) => bp + ord.quantity * fillPx);
            setPositions((posList) =>
              posList
                .map((p) =>
                  p.symbol === ord.symbol ? { ...p, quantity: p.quantity - ord.quantity } : p
                )
                .filter((p) => p.quantity > 0.00001)
            );
          }
          pushToast(
            `Limit ${ord.side.toUpperCase()} filled: ${ord.quantity} ${ord.symbol} @ ${formatCurrency(fillPx)}`,
            ord.side === 'buy' ? 'up' : 'down'
          );
        });
        return updatedOrders;
      }

      return prevOrders;
    });
  }, [instruments, pushToast]);

  const handleSelectInstrument = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      setPrefillLimitPrice(null);
      if (window.innerWidth < 1024 && activeScreen === 'markets') {
        setActiveScreen('chart');
      }
    },
    [activeScreen]
  );

  const handleToggleWatchlist = useCallback(
    (symbol: string) => {
      setWatchlists((prev) => {
        const targetList = prev.find((w) => w.id === activeWatchlistId) ?? prev[0];
        if (!targetList) return prev;

        const isInActive = targetList.symbols.includes(symbol);
        const isInAny = prev.some((w) => w.symbols.includes(symbol));

        if (isInAny && !isInActive) {
          // Remove from whichever list contains it
          pushToast(`Removed ${symbol} from watchlists`, 'info');
          return prev.map((w) => ({
            ...w,
            symbols: w.symbols.filter((s) => s !== symbol),
          }));
        }

        if (isInActive) {
          pushToast(`Removed ${symbol} from ${targetList.name}`, 'info');
          return prev.map((w) =>
            w.id === targetList.id
              ? { ...w, symbols: w.symbols.filter((s) => s !== symbol) }
              : w
          );
        }

        pushToast(`Added ${symbol} to ${targetList.name}`, 'up');
        return prev.map((w) =>
          w.id === targetList.id ? { ...w, symbols: [symbol, ...w.symbols] } : w
        );
      });
    },
    [activeWatchlistId, pushToast]
  );

  const handleCreateWatchlist = useCallback(
    (name: string) => {
      const id = `wl-${Date.now()}`;
      setWatchlists((prev) => [...prev, { id, name, symbols: [] }]);
      setActiveWatchlistId(id);
      pushToast(`Created watchlist "${name}"`, 'info');
    },
    [pushToast]
  );

  const handleAddSymbolToWatchlist = useCallback(
    (watchlistId: string, symbol: string) => {
      setWatchlists((prev) =>
        prev.map((w) =>
          w.id === watchlistId && !w.symbols.includes(symbol)
            ? { ...w, symbols: [symbol, ...w.symbols] }
            : w
        )
      );
      pushToast(`Added ${symbol} to watchlist`, 'up');
    },
    [pushToast]
  );

  const handleSubmitOrder = useCallback(
    (payload: {
      symbol: string;
      side: 'buy' | 'sell';
      type: 'market' | 'limit';
      quantity: number;
      limitPrice?: number;
    }) => {
      const inst = instruments.find((i) => i.symbol === payload.symbol);
      if (!inst) return;

      const execPrice = payload.type === 'market' ? inst.price : payload.limitPrice ?? inst.price;
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

      if (payload.type === 'market') {
        const totalCost = payload.quantity * execPrice;
        if (payload.side === 'buy') {
          setBuyingPower((bp) => Math.max(0, bp - totalCost));
          setPositions((prev) => {
            const existing = prev.find((p) => p.symbol === payload.symbol);
            if (existing) {
              const newQty = existing.quantity + payload.quantity;
              const newAvg =
                (existing.quantity * existing.avgEntry + payload.quantity * execPrice) / newQty;
              return prev.map((p) =>
                p.symbol === payload.symbol ? { ...p, quantity: newQty, avgEntry: newAvg } : p
              );
            }
            return [
              ...prev,
              {
                symbol: payload.symbol,
                side: 'long',
                quantity: payload.quantity,
                avgEntry: execPrice,
                openedAt: 'Just now',
              },
            ];
          });
        } else {
          setBuyingPower((bp) => bp + totalCost);
          setPositions((prev) =>
            prev
              .map((p) =>
                p.symbol === payload.symbol
                  ? { ...p, quantity: p.quantity - payload.quantity }
                  : p
              )
              .filter((p) => p.quantity > 0.00001)
          );
        }

        const filledOrder: Order = {
          id: orderId,
          symbol: payload.symbol,
          side: payload.side,
          type: 'market',
          quantity: payload.quantity,
          executedPrice: execPrice,
          status: 'filled',
          createdAt: 'Just now',
        };
        setOrders((prev) => [filledOrder, ...prev]);
        pushToast(
          `Executed ${payload.side.toUpperCase()} ${payload.quantity} ${payload.symbol} @ ${formatInstrumentPrice(inst)}`,
          payload.side === 'buy' ? 'up' : 'down'
        );
      } else {
        const workingOrder: Order = {
          id: orderId,
          symbol: payload.symbol,
          side: payload.side,
          type: 'limit',
          quantity: payload.quantity,
          limitPrice: execPrice,
          status: 'open',
          createdAt: 'Just now',
        };
        setOrders((prev) => [workingOrder, ...prev]);
        pushToast(
          `Placed Limit ${payload.side.toUpperCase()} ${payload.quantity} ${payload.symbol} @ ${formatCurrency(execPrice)}`,
          'info'
        );
      }
    },
    [instruments, pushToast]
  );

  const handleClosePosition = useCallback(
    (symbol: string) => {
      const pos = positions.find((p) => p.symbol === symbol);
      if (!pos) return;
      handleSubmitOrder({
        symbol,
        side: 'sell',
        type: 'market',
        quantity: pos.quantity,
      });
    },
    [positions, handleSubmitOrder]
  );

  const handleCancelOrder = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );
      pushToast(`Cancelled order ${orderId}`, 'info');
    },
    [pushToast]
  );

  const handleCreateAlert = useCallback(
    (symbol: string, condition: 'above' | 'below', targetPrice: number) => {
      const id = `ALT-${Math.floor(100 + Math.random() * 900)}`;
      setAlerts((prev) => [
        {
          id,
          symbol,
          condition,
          targetPrice,
          triggered: false,
          createdAt: 'Just now',
        },
        ...prev,
      ]);
      pushToast(`Alert set: ${symbol} ${condition} ${targetPrice}`, 'info');
    },
    [pushToast]
  );

  const handleDeleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const heldQuantity = useMemo(
    () => positions.find((p) => p.symbol === selectedInstrument.symbol)?.quantity ?? 0,
    [positions, selectedInstrument.symbol]
  );

  const navItems: { id: ScreenTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'markets', label: 'Markets', icon: Activity },
    { id: 'chart', label: 'Charts', icon: CandlestickChart },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-[#0f131e] text-[#d1d4dc] flex flex-col">
      {/* Top Bar: Clean 3-Zone Contract on Desktop, Compact 48px Sticky Header on Mobile */}
      <header className="sticky top-0 z-40 h-12 lg:h-14 bg-[#171b26]/95 backdrop-blur-md border-b border-[#2a2e39]">
        <div className="max-w-[1440px] mx-auto h-full px-3 lg:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveScreen('markets')}
            className="flex items-center gap-2 font-display text-[17px] font-bold tracking-tight text-[#dfe2f2] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-6 h-6 rounded-[4px] bg-[#2962ff] flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </span>
            <span>Apex Markets</span>
          </button>

          {/* Zone 2: Single-Line Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveScreen(item.id)}
                  className={`relative py-1 text-[14px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active ? 'text-white' : 'text-[#787b86] hover:text-[#d1d4dc]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-[15px] h-[2px] bg-[#2962ff]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTradeSide('buy');
                if (window.innerWidth < 1024) {
                  setMobileTradeOpen(true);
                } else {
                  setActiveScreen('chart');
                }
              }}
              className="h-8 lg:h-9 px-3.5 bg-[#2962ff] hover:bg-[#1e53e5] active:opacity-85 text-white text-[13px] font-semibold rounded-[4px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              Trade {selectedInstrument.symbol}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Sub-Toolbar: Selected Symbol Quick Strip & Quote Stream Control */}
      <div className="border-b border-[#2a2e39] bg-[#131722]">
        <div className="max-w-[1440px] mx-auto px-3 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 text-[12px]">
            <button
              type="button"
              onClick={() => setActiveScreen('chart')}
              className="flex items-center gap-2 hover:text-white cursor-pointer truncate"
            >
              <span className="font-bold text-[#dfe2f2]">{selectedInstrument.symbol}</span>
              <span className="font-mono tabular-nums text-[#d1d4dc]">
                {formatInstrumentPrice(selectedInstrument)}
              </span>
              <span
                className={`font-mono tabular-nums ${
                  selectedInstrument.changePct >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {formatDeltaPct(selectedInstrument.changePct)}
              </span>
            </button>
            <span className="hidden sm:inline text-[#2a2e39]" aria-hidden="true">
              |
            </span>
            <span className="hidden sm:inline text-[#787b86] font-mono tabular-nums">
              Equity {formatCurrency(buyingPower + positions.reduce((s, p) => {
                const inst = instruments.find((i) => i.symbol === p.symbol);
                return s + p.quantity * (inst?.price ?? p.avgEntry);
              }, 0))}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsStreaming((v) => !v)}
            className="px-2.5 py-1 rounded-[4px] bg-[#1e222d] hover:bg-[#242835] border border-[#2a2e39] text-[11px] font-mono text-[#d1d4dc] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isStreaming ? (
              <>
                <Pause className="w-3 h-3 text-[#787b86]" />
                <span>Pause Feed</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#2962ff]" />
                <span>Resume Feed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Workspace (Responsive Mobile Single-Column -> Desktop Multi-Column Terminal) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 lg:px-6 pt-4 pb-20 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Primary Screen Viewport (8 columns on Desktop) */}
          <div className="lg:col-span-8 min-w-0">
            {activeScreen === 'markets' && (
              <MarketsScreen
                instruments={instruments}
                selectedSymbol={selectedSymbol}
                watchlistedSymbols={watchlistedSet}
                onSelectInstrument={handleSelectInstrument}
                onToggleWatchlist={handleToggleWatchlist}
              />
            )}

            {activeScreen === 'chart' && (
              <ChartScreen
                instrument={selectedInstrument}
                candles={candles}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                chartMode={chartMode}
                onChartModeChange={setChartMode}
                isWatchlisted={watchlistedSet.has(selectedInstrument.symbol)}
                onToggleWatchlist={handleToggleWatchlist}
                onSelectOrderBookPrice={(price) => {
                  setPrefillLimitPrice(price);
                  if (window.innerWidth < 1024) setMobileTradeOpen(true);
                }}
                onOpenTradeDrawer={(side) => {
                  setTradeSide(side);
                  setMobileTradeOpen(true);
                }}
                onCreateAlert={handleCreateAlert}
              />
            )}

            {activeScreen === 'watchlist' && (
              <WatchlistScreen
                instruments={instruments}
                watchlists={watchlists}
                activeWatchlistId={activeWatchlistId}
                selectedSymbol={selectedSymbol}
                alerts={alerts}
                onSelectWatchlist={setActiveWatchlistId}
                onCreateWatchlist={handleCreateWatchlist}
                onAddSymbolToWatchlist={handleAddSymbolToWatchlist}
                onToggleWatchlist={handleToggleWatchlist}
                onSelectInstrument={(sym) => {
                  setSelectedSymbol(sym);
                  setActiveScreen('chart');
                }}
                onCreateAlert={handleCreateAlert}
                onDeleteAlert={handleDeleteAlert}
              />
            )}

            {activeScreen === 'portfolio' && (
              <PortfolioScreen
                instruments={instruments}
                positions={positions}
                orders={orders}
                buyingPower={buyingPower}
                onSelectInstrument={(sym) => {
                  setSelectedSymbol(sym);
                  setActiveScreen('chart');
                }}
                onClosePosition={handleClosePosition}
                onCancelOrder={handleCancelOrder}
              />
            )}
          </div>

          {/* Desktop Right Execution & Chart Rail (4 columns, hidden on mobile) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-4 sticky top-[72px]">
            {activeScreen !== 'chart' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[15px] font-bold text-[#dfe2f2]">
                      {selectedInstrument.symbol}
                    </span>
                    <span className="text-[12px] text-[#787b86]">
                      {selectedInstrument.exchange}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('chart')}
                    className="text-[12px] text-[#b6c4ff] hover:text-white cursor-pointer"
                  >
                    Expand Chart
                  </button>
                </div>
                <InteractiveChart
                  instrument={selectedInstrument}
                  candles={candles}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  chartMode={chartMode}
                  onChartModeChange={setChartMode}
                  height={230}
                />
              </div>
            )}

            <OrderTicketPanel
              instrument={selectedInstrument}
              buyingPower={buyingPower}
              heldQuantity={heldQuantity}
              initialSide={tradeSide}
              prefillLimitPrice={prefillLimitPrice}
              onSubmitOrder={handleSubmitOrder}
            />
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar (56px height; combined with 48px top header = 104px, <=15% mobile height) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#242835]/95 backdrop-blur-md border-t border-[#363a45] shadow-[0_-4px_12px_rgba(0,0,0,0.4)] grid grid-cols-4"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer transition-colors ${
                active ? 'text-[#b6c4ff]' : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-[#2962ff]' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Sheet Order Ticket Drawer */}
      {mobileTradeOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-[2px]"
          onClick={() => setMobileTradeOpen(false)}
        >
          <div
            className="w-full bg-[#1e222d] border-t border-[#363a45] rounded-t-[12px] p-3 pb-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#434656] rounded-full mx-auto mb-3" />
            <OrderTicketPanel
              instrument={selectedInstrument}
              buyingPower={buyingPower}
              heldQuantity={heldQuantity}
              initialSide={tradeSide}
              prefillLimitPrice={prefillLimitPrice}
              onSubmitOrder={handleSubmitOrder}
              onClose={() => setMobileTradeOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Action / Alert Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 lg:bottom-5 right-3 lg:right-6 z-50 max-w-sm bg-[#242835] border border-[#363a45] shadow-[0_4px_12px_rgba(0,0,0,0.4)] rounded-[4px] px-3.5 py-2.5 flex items-center gap-2.5"
        >
          <span
            className={`w-1.5 h-4 rounded-full shrink-0 ${
              toast.tone === 'up'
                ? 'bg-[#089981]'
                : toast.tone === 'down'
                ? 'bg-[#f23645]'
                : 'bg-[#2962ff]'
            }`}
            aria-hidden="true"
          />
          <span className="text-[13px] text-[#dfe2f2]">{toast.text}</span>
        </div>
      )}
    </div>
  );
}
