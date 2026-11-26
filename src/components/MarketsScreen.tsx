import React, { useMemo, useState } from 'react';
import { ArrowDownUp, Search, X } from 'lucide-react';
import { ASSET_CLASSES } from '../data/marketData';
import {
  AssetClass,
  Instrument,
  SortDirection,
  SortField,
} from '../types/market';
import { formatDeltaPct, formatInstrumentPrice } from '../utils/formatters';
import { QuoteRow } from './QuoteRow';
import { Sparkline } from './Sparkline';

interface MarketsScreenProps {
  instruments: Instrument[];
  selectedSymbol: string;
  watchlistedSymbols: Set<string>;
  onSelectInstrument: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
}

const FEATURED_BENCHMARKS = ['SPX', 'NDX', 'BTCUSD', 'EURUSD'];

export const MarketsScreen: React.FC<MarketsScreenProps> = ({
  instruments,
  selectedSymbol,
  watchlistedSymbols,
  onSelectInstrument,
  onToggleWatchlist,
}) => {
  const [activeCategory, setActiveCategory] = useState<AssetClass | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const benchmarkCards = useMemo(
    () =>
      FEATURED_BENCHMARKS.map((sym) => instruments.find((i) => i.symbol === sym)).filter(
        (i): i is Instrument => Boolean(i)
      ),
    [instruments]
  );

  const filteredQuotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = instruments.filter((inst) => {
      const catMatch = activeCategory === 'All' || inst.assetClass === activeCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        inst.symbol.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q) ||
        inst.exchange.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortField === 'price') cmp = a.price - b.price;
      else if (sortField === 'changePct') cmp = a.changePct - b.changePct;
      else cmp = a.volume - b.volume;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [instruments, activeCategory, searchQuery, sortField, sortDirection]);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'symbol' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Global Benchmark Summary Strip (4-Column Grid on Desktop, 2-Column on Mobile) */}
      <section aria-label="Global Market Benchmarks">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {benchmarkCards.map((inst) => {
            const isUp = inst.changePct >= 0;
            const isSelected = inst.symbol === selectedSymbol;
            return (
              <button
                key={inst.symbol}
                type="button"
                onClick={() => onSelectInstrument(inst.symbol)}
                className={`text-left p-3 rounded-[4px] border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#242835] border-[#2962ff]'
                    : 'bg-[#1e222d] border-[#2a2e39] hover:bg-[#242835]/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold tracking-[0.02em] text-[#dfe2f2] truncate">
                      {inst.symbol}
                    </div>
                    <div className="text-[11px] text-[#787b86] truncate">{inst.name}</div>
                  </div>
                  <Sparkline data={inst.sparkline} isPositive={isUp} width={52} height={20} />
                </div>

                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="font-mono tabular-nums text-[15px] font-semibold text-[#d1d4dc]">
                    {formatInstrumentPrice(inst)}
                  </span>
                  <span
                    className={`font-mono tabular-nums text-[11px] font-medium px-1.5 py-[1px] rounded-[2px] ${
                      isUp
                        ? 'bg-[#089981]/12 text-[#089981]'
                        : 'bg-[#f23645]/12 text-[#f23645]'
                    }`}
                  >
                    {formatDeltaPct(inst.changePct)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Search & Symbol Lookup Input (40px height, inset #1e222d, focus border #2962ff without glow rings) */}
      <div className="relative">
        <Search
          className="w-4 h-4 text-[#787b86] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ticker, company, or exchange (e.g. NVDA, BTC, SPX)..."
          aria-label="Search ticker or instrument"
          className="w-full h-10 pl-9 pr-9 bg-[#1e222d] border border-[#2a2e39] rounded-[4px] text-[14px] text-[#d1d4dc] placeholder:text-[#787b86] focus:outline-none focus:border-[#2962ff] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#787b86] hover:text-[#d1d4dc] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Asset Class Horizontal Scroll Tabs */}
      <div
        role="tablist"
        aria-label="Asset Classes"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
      >
        {(['All', ...ASSET_CLASSES] as const).map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`min-h-[36px] px-3 py-1.5 rounded-[4px] text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#2a2e39] text-white border border-[#363a45]'
                  : 'text-[#787b86] hover:text-[#d1d4dc] border border-transparent'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Quote List Container */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] overflow-hidden">
        {/* Column Header & Sort Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#171b26] border-b border-[#2a2e39] text-[11px] font-mono uppercase tracking-wider text-[#787b86]">
          <button
            type="button"
            onClick={() => handleSortToggle('symbol')}
            className="flex items-center gap-1 hover:text-[#d1d4dc] cursor-pointer"
          >
            <span>Symbol</span>
            <ArrowDownUp className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline w-[64px] text-center">Trend</span>
            <div className="flex items-center gap-3 w-[92px] justify-end">
              <button
                type="button"
                onClick={() => handleSortToggle('price')}
                className={`hover:text-[#d1d4dc] cursor-pointer ${
                  sortField === 'price' ? 'text-[#b6c4ff]' : ''
                }`}
              >
                Last
              </button>
              <button
                type="button"
                onClick={() => handleSortToggle('changePct')}
                className={`hover:text-[#d1d4dc] cursor-pointer ${
                  sortField === 'changePct' ? 'text-[#b6c4ff]' : ''
                }`}
              >
                Chg%
              </button>
            </div>
          </div>
        </div>

        {/* Rows */}
        {filteredQuotes.length > 0 ? (
          <div>
            {filteredQuotes.map((inst) => (
              <QuoteRow
                key={inst.symbol}
                instrument={inst}
                isSelected={inst.symbol === selectedSymbol}
                isWatchlisted={watchlistedSymbols.has(inst.symbol)}
                onSelect={onSelectInstrument}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center space-y-2">
            <p className="text-[14px] text-[#d1d4dc]">
              No instruments matched "{searchQuery}"
            </p>
            <p className="text-[12px] text-[#787b86]">
              Try searching a ticker like NVDA, BTCUSD, SPX, or clear your asset filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="mt-2 px-3 py-1.5 bg-[#2962ff] text-white text-[13px] font-medium rounded-[4px] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
