import React, { useMemo, useState } from 'react';
import { Instrument, Order, Position } from '../types/market';
import {
  formatCurrency,
  formatDeltaPct,
  formatInstrumentPrice,
  formatRawPrice,
} from '../utils/formatters';

interface PortfolioScreenProps {
  instruments: Instrument[];
  positions: Position[];
  orders: Order[];
  buyingPower: number;
  onSelectInstrument: (symbol: string) => void;
  onClosePosition: (symbol: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export const PortfolioScreen: React.FC<PortfolioScreenProps> = ({
  instruments,
  positions,
  orders,
  buyingPower,
  onSelectInstrument,
  onClosePosition,
  onCancelOrder,
}) => {
  const [ordersTab, setOrdersTab] = useState<'open' | 'history'>('open');

  const enrichedPositions = useMemo(() => {
    return positions.map((pos) => {
      const inst = instruments.find((i) => i.symbol === pos.symbol);
      const currentPrice = inst?.price ?? pos.avgEntry;
      const marketValue = pos.quantity * currentPrice;
      const costBasis = pos.quantity * pos.avgEntry;
      const unrealizedPnl = marketValue - costBasis;
      const unrealizedPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
      const dayPnl = inst ? pos.quantity * inst.change : 0;
      return {
        ...pos,
        inst,
        currentPrice,
        marketValue,
        unrealizedPnl,
        unrealizedPct,
        dayPnl,
      };
    });
  }, [positions, instruments]);

  const summary = useMemo(() => {
    const positionsValue = enrichedPositions.reduce((sum, p) => sum + p.marketValue, 0);
    const totalEquity = buyingPower + positionsValue;
    const totalUnrealized = enrichedPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const totalDayPnl = enrichedPositions.reduce((sum, p) => sum + p.dayPnl, 0);
    const totalCost = enrichedPositions.reduce((sum, p) => sum + p.quantity * p.avgEntry, 0);
    const unrealizedPct = totalCost > 0 ? (totalUnrealized / totalCost) * 100 : 0;

    return {
      positionsValue,
      totalEquity,
      totalUnrealized,
      unrealizedPct,
      totalDayPnl,
    };
  }, [enrichedPositions, buyingPower]);

  const openOrders = orders.filter((o) => o.status === 'open');
  const historyOrders = orders.filter((o) => o.status !== 'open');

  return (
    <div className="space-y-4">
      {/* Account Equity Summary */}
      <section
        aria-label="Account Summary"
        className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[12px] text-[#787b86]">Total Account Equity</div>
            <div className="font-display tabular-nums text-[30px] leading-[36px] font-bold text-[#dfe2f2] tracking-[-0.02em] mt-0.5">
              {formatCurrency(summary.totalEquity)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[13px] font-mono tabular-nums">
              <span className={summary.totalUnrealized >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}>
                {formatCurrency(summary.totalUnrealized, true)}
              </span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-[2px] ${
                  summary.totalUnrealized >= 0
                    ? 'bg-[#089981]/12 text-[#089981]'
                    : 'bg-[#f23645]/12 text-[#f23645]'
                }`}
              >
                {formatDeltaPct(summary.unrealizedPct)}
              </span>
              <span className="text-[#787b86] font-sans text-[12px]">Unrealized</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5 text-left sm:text-right">
            <div>
              <div className="text-[11px] text-[#787b86]">Day P&L</div>
              <div
                className={`font-mono tabular-nums text-[14px] font-semibold mt-0.5 ${
                  summary.totalDayPnl >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {formatCurrency(summary.totalDayPnl, true)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#787b86]">Invested</div>
              <div className="font-mono tabular-nums text-[14px] font-semibold text-[#d1d4dc] mt-0.5">
                {formatCurrency(summary.positionsValue)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#787b86]">Buying Power</div>
              <div className="font-mono tabular-nums text-[14px] font-semibold text-[#d1d4dc] mt-0.5">
                {formatCurrency(buyingPower)}
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Bar */}
        {summary.totalEquity > 0 && (
          <div className="mt-4 pt-3 border-t border-[#2a2e39]">
            <div className="flex items-center justify-between text-[11px] text-[#787b86] mb-1.5">
              <span>Capital Allocation</span>
              <span className="font-mono tabular-nums">
                {((summary.positionsValue / summary.totalEquity) * 100).toFixed(1)}% Deployed ·{' '}
                {((buyingPower / summary.totalEquity) * 100).toFixed(1)}% Cash
              </span>
            </div>
            <div className="h-2 w-full bg-[#131722] rounded-[2px] overflow-hidden flex">
              {enrichedPositions.map((p, idx) => {
                const pct = (p.marketValue / summary.totalEquity) * 100;
                const colors = ['#2962ff', '#089981', '#b6c4ff', '#ffb59a', '#c4c6d2'];
                return (
                  <div
                    key={p.symbol}
                    style={{
                      width: `${Math.max(1, pct)}%`,
                      backgroundColor: colors[idx % colors.length],
                    }}
                    title={`${p.symbol}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Open Positions */}
      <section
        aria-label="Open Positions"
        className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#171b26] border-b border-[#2a2e39]">
          <h2 className="font-display text-[15px] font-semibold text-[#dfe2f2]">
            Open Positions · {enrichedPositions.length}
          </h2>
          <span className="text-[11px] text-[#787b86]">Live Mark-to-Market</span>
        </div>

        {enrichedPositions.length > 0 ? (
          <div className="divide-y divide-[#2a2e39]">
            {enrichedPositions.map((pos) => {
              const isUp = pos.unrealizedPnl >= 0;
              return (
                <div
                  key={pos.symbol}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 hover:bg-[#242835]/70 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectInstrument(pos.symbol)}
                    className="flex items-center gap-2.5 text-left min-w-[160px] flex-1 cursor-pointer"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                      style={{
                        backgroundColor: pos.inst?.monogramBg ?? '#2962ff',
                        color: pos.inst?.monogramText ?? '#ffffff',
                      }}
                    >
                      {pos.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-[#d1d4dc]">
                          {pos.symbol}
                        </span>
                        <span className="text-[11px] text-[#787b86] font-mono tabular-nums">
                          {pos.quantity} units
                        </span>
                      </div>
                      <div className="text-[12px] text-[#787b86] font-mono tabular-nums">
                        Avg {formatRawPrice(pos.avgEntry, pos.inst?.decimals ?? 2, '$')} · Mark{' '}
                        {pos.inst ? formatInstrumentPrice(pos.inst) : formatCurrency(pos.currentPrice)}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-[14px] font-medium text-[#d1d4dc]">
                        {formatCurrency(pos.marketValue)}
                      </div>
                      <div
                        className={`font-mono tabular-nums text-[12px] font-medium ${
                          isUp ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {formatCurrency(pos.unrealizedPnl, true)} ({formatDeltaPct(pos.unrealizedPct)})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onClosePosition(pos.symbol)}
                      className="h-8 px-2.5 bg-[#171b26] hover:bg-[#f23645]/15 hover:text-[#f23645] hover:border-[#f23645]/40 border border-[#2a2e39] rounded-[4px] text-[12px] font-medium text-[#d1d4dc] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-[13px] text-[#787b86]">
            No open positions. Select any instrument from Markets to place a trade.
          </div>
        )}
      </section>

      {/* Open Orders & Execution History */}
      <section
        aria-label="Orders"
        className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 py-2 bg-[#171b26] border-b border-[#2a2e39]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOrdersTab('open')}
              className={`px-2.5 py-1 text-[12px] font-medium rounded-[3px] cursor-pointer ${
                ordersTab === 'open'
                  ? 'bg-[#242835] text-[#d1d4dc] border border-[#363a45]'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              Working Orders ({openOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setOrdersTab('history')}
              className={`px-2.5 py-1 text-[12px] font-medium rounded-[3px] cursor-pointer ${
                ordersTab === 'history'
                  ? 'bg-[#242835] text-[#d1d4dc] border border-[#363a45]'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              Order History ({historyOrders.length})
            </button>
          </div>
        </div>

        {ordersTab === 'open' ? (
          openOrders.length > 0 ? (
            <div className="divide-y divide-[#2a2e39]">
              {openOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-semibold uppercase ${
                          ord.side === 'buy' ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {ord.side}
                      </span>
                      <span className="text-[13px] font-bold text-[#d1d4dc]">
                        {ord.symbol}
                      </span>
                      <span className="text-[12px] text-[#787b86] font-mono tabular-nums">
                        {ord.quantity} @ Limit {formatCurrency(ord.limitPrice ?? 0)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#787b86]">
                      {ord.id} · {ord.createdAt} · Working
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCancelOrder(ord.id)}
                    className="h-8 px-2.5 bg-[#171b26] hover:bg-[#242835] border border-[#2a2e39] rounded-[4px] text-[12px] text-[#d1d4dc] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-[13px] text-[#787b86]">
              No working limit orders.
            </div>
          )
        ) : historyOrders.length > 0 ? (
          <div className="divide-y divide-[#2a2e39]">
            {historyOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono font-semibold uppercase ${
                        ord.side === 'buy' ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {ord.side}
                    </span>
                    <span className="text-[13px] font-bold text-[#d1d4dc]">{ord.symbol}</span>
                    <span className="text-[12px] text-[#787b86] font-mono tabular-nums">
                      {ord.quantity} units
                    </span>
                  </div>
                  <div className="text-[11px] text-[#787b86]">
                    {ord.id} · {ord.createdAt} ·{' '}
                    <span className={ord.status === 'filled' ? 'text-[#089981]' : 'text-[#787b86]'}>
                      {ord.status === 'filled' ? 'Filled' : 'Cancelled'}
                    </span>
                  </div>
                </div>
                <div className="font-mono tabular-nums text-[13px] text-[#d1d4dc]">
                  {ord.executedPrice
                    ? formatCurrency(ord.executedPrice)
                    : ord.limitPrice
                    ? formatCurrency(ord.limitPrice)
                    : '—'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-[13px] text-[#787b86]">
            No executed orders yet.
          </div>
        )}
      </section>
    </div>
  );
};
