import React, { useMemo, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { Instrument, PriceAlert, WatchlistGroup } from '../types/market';
import { formatRawPrice } from '../utils/formatters';
import { QuoteRow } from './QuoteRow';

interface WatchlistScreenProps {
  instruments: Instrument[];
  watchlists: WatchlistGroup[];
  activeWatchlistId: string;
  selectedSymbol: string;
  alerts: PriceAlert[];
  onSelectWatchlist: (id: string) => void;
  onCreateWatchlist: (name: string) => void;
  onAddSymbolToWatchlist: (watchlistId: string, symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  onSelectInstrument: (symbol: string) => void;
  onCreateAlert: (symbol: string, condition: 'above' | 'below', targetPrice: number) => void;
  onDeleteAlert: (id: string) => void;
}

export const WatchlistScreen: React.FC<WatchlistScreenProps> = ({
  instruments,
  watchlists,
  activeWatchlistId,
  selectedSymbol,
  alerts,
  onSelectWatchlist,
  onCreateWatchlist,
  onAddSymbolToWatchlist,
  onToggleWatchlist,
  onSelectInstrument,
  onCreateAlert,
  onDeleteAlert,
}) => {
  const [newListName, setNewListName] = useState('');
  const [showNewList, setShowNewList] = useState(false);
  const [symbolToAdd, setSymbolToAdd] = useState('');

  const [alertSymbol, setAlertSymbol] = useState(selectedSymbol || 'NVDA');
  const [alertCond, setAlertCond] = useState<'above' | 'below'>('above');
  const [alertPrice, setAlertPrice] = useState('');

  const activeGroup = useMemo(
    () => watchlists.find((w) => w.id === activeWatchlistId) ?? watchlists[0],
    [watchlists, activeWatchlistId]
  );

  const watchedInstruments = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.symbols
      .map((sym) => instruments.find((i) => i.symbol === sym))
      .filter((i): i is Instrument => Boolean(i));
  }, [activeGroup, instruments]);

  const availableToAdd = useMemo(() => {
    if (!activeGroup) return instruments;
    const set = new Set(activeGroup.symbols);
    return instruments.filter((i) => !set.has(i.symbol));
  }, [activeGroup, instruments]);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    onCreateWatchlist(trimmed);
    setNewListName('');
    setShowNewList(false);
  };

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !symbolToAdd) return;
    onAddSymbolToWatchlist(activeGroup.id, symbolToAdd);
    setSymbolToAdd('');
  };

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(alertPrice);
    if (!price || price <= 0) return;
    onCreateAlert(alertSymbol, alertCond, price);
    setAlertPrice('');
  };

  return (
    <div className="space-y-4">
      {/* Watchlist Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {watchlists.map((wl) => {
            const active = wl.id === activeGroup?.id;
            return (
              <button
                key={wl.id}
                type="button"
                onClick={() => onSelectWatchlist(wl.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-[4px] text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#2a2e39] text-white border border-[#363a45]'
                    : 'text-[#787b86] hover:text-[#d1d4dc] border border-transparent'
                }`}
              >
                {wl.name} · {wl.symbols.length}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowNewList((v) => !v)}
          className="min-h-[36px] px-3 py-1.5 bg-[#1e222d] hover:bg-[#242835] border border-[#2a2e39] rounded-[4px] text-[12px] font-medium text-[#d1d4dc] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#2962ff]" />
          <span>New List</span>
        </button>
      </div>

      {showNewList && (
        <form
          onSubmit={handleCreateList}
          className="flex items-center gap-2 bg-[#1e222d] border border-[#2a2e39] rounded-[4px] p-2.5"
        >
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="List name (e.g. Energy & Metals)"
            className="flex-1 h-9 px-3 bg-[#131722] border border-[#2a2e39] rounded-[4px] text-[13px] text-[#d1d4dc] placeholder:text-[#787b86] focus:outline-none focus:border-[#2962ff]"
          />
          <button
            type="submit"
            className="h-9 px-3.5 bg-[#2962ff] text-white text-[13px] font-medium rounded-[4px] cursor-pointer"
          >
            Create
          </button>
        </form>
      )}

      {/* Watchlist Quote Container */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-[#171b26] border-b border-[#2a2e39]">
          <h2 className="font-display text-[15px] font-semibold text-[#dfe2f2]">
            {activeGroup?.name ?? 'Watchlist'}
          </h2>

          {availableToAdd.length > 0 && (
            <form onSubmit={handleAddSymbol} className="flex items-center gap-1.5">
              <select
                value={symbolToAdd}
                onChange={(e) => setSymbolToAdd(e.target.value)}
                aria-label="Add symbol to watchlist"
                className="h-8 px-2 bg-[#131722] border border-[#2a2e39] rounded-[4px] text-[12px] text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
              >
                <option value="">Add instrument...</option>
                {availableToAdd.map((inst) => (
                  <option key={inst.symbol} value={inst.symbol}>
                    {inst.symbol} — {inst.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!symbolToAdd}
                className="h-8 px-2.5 bg-[#2962ff] disabled:opacity-40 text-white text-[12px] font-medium rounded-[4px] cursor-pointer"
              >
                Add
              </button>
            </form>
          )}
        </div>

        {watchedInstruments.length > 0 ? (
          <div>
            {watchedInstruments.map((inst) => (
              <QuoteRow
                key={inst.symbol}
                instrument={inst}
                isSelected={inst.symbol === selectedSymbol}
                isWatchlisted={true}
                onSelect={onSelectInstrument}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-[13px] text-[#787b86]">
            No instruments in this watchlist yet. Use the selector above to add symbols.
          </div>
        )}
      </div>

      {/* Price Alerts Manager */}
      <section
        aria-label="Price Alerts"
        className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#171b26] border-b border-[#2a2e39]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#b6c4ff]" />
            <h2 className="font-display text-[15px] font-semibold text-[#dfe2f2]">
              Price Alerts
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[#787b86]">
            {alerts.filter((a) => !a.triggered).length} Active
          </span>
        </div>

        <form
          onSubmit={handleAlertSubmit}
          className="p-3 border-b border-[#2a2e39] grid grid-cols-1 sm:grid-cols-4 gap-2"
        >
          <select
            value={alertSymbol}
            onChange={(e) => setAlertSymbol(e.target.value)}
            aria-label="Alert instrument"
            className="h-9 px-2.5 bg-[#131722] border border-[#2a2e39] rounded-[4px] text-[13px] text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
          >
            {instruments.map((inst) => (
              <option key={inst.symbol} value={inst.symbol}>
                {inst.symbol} ({formatRawPrice(inst.price, inst.decimals)})
              </option>
            ))}
          </select>

          <select
            value={alertCond}
            onChange={(e) => setAlertCond(e.target.value as 'above' | 'below')}
            aria-label="Alert condition"
            className="h-9 px-2.5 bg-[#131722] border border-[#2a2e39] rounded-[4px] text-[13px] text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
          >
            <option value="above">Crosses Above</option>
            <option value="below">Crosses Below</option>
          </select>

          <input
            type="number"
            step="any"
            value={alertPrice}
            onChange={(e) => setAlertPrice(e.target.value)}
            placeholder="Target price"
            aria-label="Target price"
            className="h-9 px-2.5 bg-[#131722] border border-[#2a2e39] rounded-[4px] font-mono tabular-nums text-[13px] text-[#d1d4dc] placeholder:text-[#787b86] focus:outline-none focus:border-[#2962ff]"
          />

          <button
            type="submit"
            className="h-9 px-3 bg-[#2962ff] hover:bg-[#1e53e5] text-white text-[13px] font-medium rounded-[4px] cursor-pointer"
          >
            Add Alert
          </button>
        </form>

        {alerts.length > 0 ? (
          <div className="divide-y divide-[#2a2e39]">
            {alerts.map((al) => {
              const inst = instruments.find((i) => i.symbol === al.symbol);
              const decimals = inst?.decimals ?? 2;
              return (
                <div
                  key={al.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-[#d1d4dc]">
                        {al.symbol}
                      </span>
                      <span className="text-[12px] text-[#787b86]">
                        {al.condition === 'above' ? 'Above' : 'Below'}{' '}
                        <span className="font-mono tabular-nums text-[#d1d4dc]">
                          {formatRawPrice(
                            al.targetPrice,
                            decimals,
                            inst?.unitPrefix ?? '',
                            inst?.unitSuffix ?? ''
                          )}
                        </span>
                      </span>
                    </div>
                    <div className="text-[11px] text-[#787b86]">
                      Created {al.createdAt} ·{' '}
                      <span className={al.triggered ? 'text-[#089981] font-medium' : 'text-[#b6c4ff]'}>
                        {al.triggered ? 'Triggered' : 'Monitoring'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteAlert(al.id)}
                    aria-label={`Delete alert for ${al.symbol}`}
                    className="p-2 text-[#787b86] hover:text-[#f23645] rounded-[4px] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-[13px] text-[#787b86]">
            No price alerts configured.
          </div>
        )}
      </section>
    </div>
  );
};
