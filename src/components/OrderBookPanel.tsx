import React, { useMemo, useState } from 'react';
import { Instrument } from '../types/market';
import { generateOrderBook, generateRecentTrades } from '../data/marketData';
import { formatRawPrice } from '../utils/formatters';

interface OrderBookPanelProps {
  instrument: Instrument;
  onSelectPrice?: (price: number) => void;
}

export const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ instrument, onSelectPrice }) => {
  const [tab, setTab] = useState<'book' | 'trades'>('book');

  const book = useMemo(() => generateOrderBook(instrument), [instrument.symbol, Math.round(instrument.price * 100)]);
  const trades = useMemo(() => generateRecentTrades(instrument), [instrument.symbol, Math.round(instrument.price * 100)]);

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2e39] bg-[#171b26]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('book')}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-[3px] transition-colors cursor-pointer ${
              tab === 'book'
                ? 'bg-[#242835] text-[#d1d4dc] border border-[#363a45]'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            Order Book
          </button>
          <button
            type="button"
            onClick={() => setTab('trades')}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-[3px] transition-colors cursor-pointer ${
              tab === 'trades'
                ? 'bg-[#242835] text-[#d1d4dc] border border-[#363a45]'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            Recent Trades
          </button>
        </div>
        <span className="font-mono tabular-nums text-[11px] text-[#787b86]">
          Spread {formatRawPrice(book.spread, instrument.decimals)} ({book.spreadPct.toFixed(3)}%)
        </span>
      </div>

      {tab === 'book' ? (
        <div className="p-2">
          <div className="grid grid-cols-3 px-1.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#787b86]">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks */}
          <div className="space-y-[2px]">
            {book.asks.map((level, i) => (
              <button
                key={`ask-${i}`}
                type="button"
                onClick={() => onSelectPrice?.(Number(level.price.toFixed(instrument.decimals)))}
                className="relative w-full grid grid-cols-3 items-center px-1.5 py-[3px] text-[12px] font-mono tabular-nums hover:bg-[#242835] rounded-[2px] cursor-pointer text-left"
              >
                <div
                  className="absolute inset-y-0 right-0 bg-[#f23645]/12 pointer-events-none"
                  style={{ width: `${level.depthPct}%` }}
                />
                <span className="relative text-[#f23645]">
                  {formatRawPrice(level.price, instrument.decimals)}
                </span>
                <span className="relative text-right text-[#d1d4dc]">{level.size}</span>
                <span className="relative text-right text-[#787b86]">{level.total}</span>
              </button>
            ))}
          </div>

          {/* Mid-Market Divider */}
          <div className="my-1.5 px-1.5 py-1 bg-[#131722] border-y border-[#2a2e39] flex items-center justify-between font-mono tabular-nums text-[12px]">
            <span className={instrument.changePct >= 0 ? 'text-[#089981] font-semibold' : 'text-[#f23645] font-semibold'}>
              {formatRawPrice(instrument.price, instrument.decimals, instrument.unitPrefix ?? '', instrument.unitSuffix ?? '')}
            </span>
            <span className="text-[11px] text-[#787b86]">Mid Market</span>
          </div>

          {/* Bids */}
          <div className="space-y-[2px]">
            {book.bids.map((level, i) => (
              <button
                key={`bid-${i}`}
                type="button"
                onClick={() => onSelectPrice?.(Number(level.price.toFixed(instrument.decimals)))}
                className="relative w-full grid grid-cols-3 items-center px-1.5 py-[3px] text-[12px] font-mono tabular-nums hover:bg-[#242835] rounded-[2px] cursor-pointer text-left"
              >
                <div
                  className="absolute inset-y-0 right-0 bg-[#089981]/12 pointer-events-none"
                  style={{ width: `${level.depthPct}%` }}
                />
                <span className="relative text-[#089981]">
                  {formatRawPrice(level.price, instrument.decimals)}
                </span>
                <span className="relative text-right text-[#d1d4dc]">{level.size}</span>
                <span className="relative text-right text-[#787b86]">{level.total}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-2">
          <div className="grid grid-cols-3 px-1.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#787b86]">
            <span>Time</span>
            <span className="text-right">Price</span>
            <span className="text-right">Size</span>
          </div>
          <div className="divide-y divide-[#2a2e39]/60">
            {trades.map((tr) => (
              <div
                key={tr.id}
                className="grid grid-cols-3 items-center px-1.5 py-1 text-[12px] font-mono tabular-nums"
              >
                <span className="text-[#787b86]">{tr.time}</span>
                <span className={`text-right ${tr.side === 'buy' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {formatRawPrice(tr.price, instrument.decimals)}
                </span>
                <span className="text-right text-[#d1d4dc]">{tr.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
