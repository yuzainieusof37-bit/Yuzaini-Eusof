import React, { useMemo, useState } from 'react';
import { BellPlus, Star } from 'lucide-react';
import {
  CandlePoint,
  ChartMode,
  Instrument,
  Timeframe,
} from '../types/market';
import {
  formatCompactVolume,
  formatDeltaPct,
  formatInstrumentPrice,
  formatRawPrice,
  formatSignedChange,
} from '../utils/formatters';
import { InteractiveChart } from './InteractiveChart';
import { OrderBookPanel } from './OrderBookPanel';

interface ChartScreenProps {
  instrument: Instrument;
  candles: CandlePoint[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  chartMode: ChartMode;
  onChartModeChange: (mode: ChartMode) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onSelectOrderBookPrice: (price: number) => void;
  onOpenTradeDrawer: (side: 'buy' | 'sell') => void;
  onCreateAlert: (symbol: string, condition: 'above' | 'below', targetPrice: number) => void;
}

export const ChartScreen: React.FC<ChartScreenProps> = ({
  instrument,
  candles,
  timeframe,
  onTimeframeChange,
  chartMode,
  onChartModeChange,
  isWatchlisted,
  onToggleWatchlist,
  onSelectOrderBookPrice,
  onOpenTradeDrawer,
  onCreateAlert,
}) => {
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertTarget, setAlertTarget] = useState<string>(
    (instrument.price * 1.02).toFixed(instrument.decimals)
  );
  const [alertCond, setAlertCond] = useState<'above' | 'below'>('above');

  const isUp = instrument.changePct >= 0;

  const sessionStats = useMemo(
    () => [
      {
        label: 'Open',
        value: formatRawPrice(
          instrument.open,
          instrument.decimals,
          instrument.unitPrefix ?? '',
          instrument.unitSuffix ?? ''
        ),
      },
      {
        label: 'High',
        value: formatRawPrice(
          instrument.high,
          instrument.decimals,
          instrument.unitPrefix ?? '',
          instrument.unitSuffix ?? ''
        ),
      },
      {
        label: 'Low',
        value: formatRawPrice(
          instrument.low,
          instrument.decimals,
          instrument.unitPrefix ?? '',
          instrument.unitSuffix ?? ''
        ),
      },
      {
        label: 'Prev Close',
        value: formatRawPrice(
          instrument.prevClose,
          instrument.decimals,
          instrument.unitPrefix ?? '',
          instrument.unitSuffix ?? ''
        ),
      },
      { label: 'Volume', value: formatCompactVolume(instrument.volume) },
      { label: 'Mkt Cap', value: instrument.marketCap ?? instrument.assetClass },
    ],
    [instrument]
  );

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(alertTarget);
    if (!target || target <= 0) return;
    onCreateAlert(instrument.symbol, alertCond, target);
    setShowAlertForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Instrument Header Card */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-[13px] font-bold shrink-0"
              style={{
                backgroundColor: instrument.monogramBg,
                color: instrument.monogramText,
              }}
            >
              {instrument.symbol.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[20px] font-bold text-[#dfe2f2] tracking-tight">
                  {instrument.symbol}
                </h1>
                <span className="text-[12px] text-[#787b86]">
                  {instrument.exchange} · {instrument.assetClass}
                </span>
              </div>
              <p className="text-[13px] text-[#787b86] truncate">
                {instrument.name}
                {instrument.sector ? ` · ${instrument.sector}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAlertTarget((instrument.price * 1.02).toFixed(instrument.decimals));
                setShowAlertForm((v) => !v);
              }}
              className="min-h-[36px] px-2.5 py-1.5 rounded-[4px] bg-[#171b26] hover:bg-[#242835] border border-[#2a2e39] text-[12px] font-medium text-[#d1d4dc] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BellPlus className="w-3.5 h-3.5 text-[#b6c4ff]" />
              <span>Set Alert</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleWatchlist(instrument.symbol)}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-[4px] border text-[12px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isWatchlisted
                  ? 'bg-[#2962ff]/15 border-[#2962ff] text-[#b6c4ff]'
                  : 'bg-[#171b26] hover:bg-[#242835] border-[#2a2e39] text-[#d1d4dc]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-[#2962ff] text-[#2962ff]' : ''}`} />
              <span>{isWatchlisted ? 'Watching' : 'Watch'}</span>
            </button>
          </div>
        </div>

        {/* Live Price & Delta */}
        <div className="mt-3 pt-3 border-t border-[#2a2e39] flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono tabular-nums text-[28px] leading-[34px] font-bold text-[#dfe2f2] tracking-[-0.02em]">
              {formatInstrumentPrice(instrument)}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono tabular-nums text-[14px] font-medium ${
                  isUp ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {formatSignedChange(
                  instrument.change,
                  instrument.decimals,
                  instrument.unitPrefix ?? '',
                  instrument.unitSuffix ?? ''
                )}
              </span>
              <span
                className={`font-mono tabular-nums text-[12px] font-semibold px-1.5 py-0.5 rounded-[2px] ${
                  isUp
                    ? 'bg-[#089981]/12 text-[#089981]'
                    : 'bg-[#f23645]/12 text-[#f23645]'
                }`}
              >
                {formatDeltaPct(instrument.changePct)}
              </span>
            </div>
          </div>

          {/* Mobile Quick Trade CTA Buttons */}
          <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onOpenTradeDrawer('buy')}
              className="flex-1 sm:flex-none h-9 px-4 bg-[#089981] hover:opacity-90 text-white text-[13px] font-semibold rounded-[4px] cursor-pointer"
            >
              Buy {instrument.symbol}
            </button>
            <button
              type="button"
              onClick={() => onOpenTradeDrawer('sell')}
              className="flex-1 sm:flex-none h-9 px-4 bg-[#f23645] hover:opacity-90 text-white text-[13px] font-semibold rounded-[4px] cursor-pointer"
            >
              Sell {instrument.symbol}
            </button>
          </div>
        </div>

        {/* Inline Price Alert Creator */}
        {showAlertForm && (
          <form
            onSubmit={handleSaveAlert}
            className="mt-3 pt-3 border-t border-[#2a2e39] flex flex-wrap items-end gap-2"
          >
            <div>
              <label className="block text-[11px] text-[#787b86] mb-1">Condition</label>
              <select
                value={alertCond}
                onChange={(e) => setAlertCond(e.target.value as 'above' | 'below')}
                className="h-9 px-2.5 bg-[#131722] border border-[#2a2e39] rounded-[4px] text-[13px] text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
              >
                <option value="above">Crosses Above</option>
                <option value="below">Crosses Below</option>
              </select>
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[11px] text-[#787b86] mb-1">Target Price</label>
              <input
                type="number"
                step="any"
                value={alertTarget}
                onChange={(e) => setAlertTarget(e.target.value)}
                className="w-full h-9 px-2.5 bg-[#131722] border border-[#2a2e39] rounded-[4px] font-mono tabular-nums text-[13px] text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-4 bg-[#2962ff] text-white text-[13px] font-medium rounded-[4px] cursor-pointer"
            >
              Create Alert
            </button>
          </form>
        )}

        {/* Session Telemetry Metrics */}
        <div className="mt-3 pt-3 border-t border-[#2a2e39] grid grid-cols-3 sm:grid-cols-6 gap-3">
          {sessionStats.map((stat) => (
            <div key={stat.label}>
              <div className="text-[11px] text-[#787b86]">{stat.label}</div>
              <div className="font-mono tabular-nums text-[13px] font-medium text-[#d1d4dc] mt-0.5">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Chart */}
      <InteractiveChart
        instrument={instrument}
        candles={candles}
        timeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        chartMode={chartMode}
        onChartModeChange={onChartModeChange}
        height={320}
      />

      {/* Order Book & Recent Trades */}
      <OrderBookPanel instrument={instrument} onSelectPrice={onSelectOrderBookPrice} />
    </div>
  );
};
