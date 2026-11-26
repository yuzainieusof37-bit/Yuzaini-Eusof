import React from 'react';
import { Star } from 'lucide-react';
import { Instrument } from '../types/market';
import { formatDeltaPct, formatInstrumentPrice } from '../utils/formatters';
import { Sparkline } from './Sparkline';

interface QuoteRowProps {
  instrument: Instrument;
  isSelected?: boolean;
  isWatchlisted?: boolean;
  onSelect: (symbol: string) => void;
  onToggleWatchlist?: (symbol: string) => void;
}

export const QuoteRow: React.FC<QuoteRowProps> = React.memo(
  ({ instrument, isSelected = false, isWatchlisted = false, onSelect, onToggleWatchlist }) => {
    const isUp = instrument.changePct >= 0;

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(instrument.symbol)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(instrument.symbol);
          }
        }}
        className={`group relative flex items-center justify-between gap-2 min-h-[54px] px-3 py-2 border-b border-[#2a2e39] cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2962ff] ${
          isSelected
            ? 'bg-[#242835]'
            : 'bg-[#1e222d] hover:bg-[#242835]/75 active:bg-[#242835]'
        }`}
      >
        {/* Left Column: Monogram + Symbol + Exchange/Company descriptor */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold tracking-tight"
            style={{
              backgroundColor: instrument.monogramBg,
              color: instrument.monogramText,
            }}
            aria-hidden="true"
          >
            {instrument.symbol.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold leading-[18px] tracking-[0.02em] text-[#d1d4dc] truncate">
                {instrument.symbol}
              </span>
              {onToggleWatchlist && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(instrument.symbol);
                  }}
                  aria-label={isWatchlisted ? `Remove ${instrument.symbol} from watchlist` : `Add ${instrument.symbol} to watchlist`}
                  className="p-1 -m-1 rounded text-[#787b86] hover:text-[#d1d4dc] opacity-80 sm:opacity-0 sm:group-hover:opacity-100 data-[watched=true]:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none"
                  data-watched={isWatchlisted}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isWatchlisted ? 'fill-[#2962ff] text-[#2962ff]' : 'text-[#787b86]'
                    }`}
                  />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 text-[12px] leading-[16px] text-[#787b86] truncate">
              <span className="font-medium shrink-0">{instrument.exchange}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{instrument.name}</span>
            </div>
          </div>
        </div>

        {/* Center Column: 64px fixed Sparkline */}
        <div className="w-[64px] shrink-0 flex items-center justify-center">
          <Sparkline data={instrument.sparkline} isPositive={isUp} width={64} height={24} />
        </div>

        {/* Right Column: 88px fixed Price + Stacked Percentage Badge */}
        <div className="w-[92px] shrink-0 flex flex-col items-end justify-center gap-0.5">
          <span className="font-mono tabular-nums text-[14px] font-medium leading-[18px] text-[#d1d4dc]">
            {formatInstrumentPrice(instrument)}
          </span>
          <span
            className={`font-mono tabular-nums text-[11px] font-medium leading-[15px] px-1.5 py-[1px] rounded-[2px] ${
              isUp
                ? 'bg-[#089981]/12 text-[#089981]'
                : 'bg-[#f23645]/12 text-[#f23645]'
            }`}
          >
            {formatDeltaPct(instrument.changePct)}
          </span>
        </div>
      </div>
    );
  }
);

QuoteRow.displayName = 'QuoteRow';
