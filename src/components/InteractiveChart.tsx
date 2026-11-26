import React, { useMemo, useRef, useState } from 'react';
import { CandlePoint, ChartMode, Instrument, Timeframe } from '../types/market';
import { TIMEFRAMES } from '../data/marketData';
import { formatCompactVolume, formatRawPrice } from '../utils/formatters';

interface InteractiveChartProps {
  instrument: Instrument;
  candles: CandlePoint[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  chartMode: ChartMode;
  onChartModeChange: (mode: ChartMode) => void;
  height?: number;
}

function computeEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  instrument,
  candles,
  timeframe,
  onTimeframeChange,
  chartMode,
  onChartModeChange,
  height = 340,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showEma20, setShowEma20] = useState<boolean>(true);
  const [showEma50, setShowEma50] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  const viewWidth = 760;
  const viewHeight = height;
  const padLeft = 10;
  const padRight = 68;
  const padTop = 16;
  const padBottom = 26;
  const plotWidth = viewWidth - padLeft - padRight;
  const plotHeight = viewHeight - padTop - padBottom;

  const { minPrice, maxPrice, maxVol, ema20, ema50 } = useMemo(() => {
    if (candles.length === 0) {
      return { minPrice: 0, maxPrice: 1, maxVol: 1, ema20: [], ema50: [] };
    }
    const closes = candles.map((c) => c.close);
    const e20 = computeEMA(closes, 12);
    const e50 = computeEMA(closes, 26);

    let lo = Infinity;
    let hi = -Infinity;
    let mv = 0;

    candles.forEach((c, idx) => {
      if (c.low < lo) lo = c.low;
      if (c.high > hi) hi = c.high;
      if (showEma20 && e20[idx] < lo) lo = e20[idx];
      if (showEma20 && e20[idx] > hi) hi = e20[idx];
      if (showEma50 && e50[idx] < lo) lo = e50[idx];
      if (showEma50 && e50[idx] > hi) hi = e50[idx];
      if (c.volume > mv) mv = c.volume;
    });

    const span = hi - lo || hi * 0.01 || 1;
    return {
      minPrice: lo - span * 0.08,
      maxPrice: hi + span * 0.08,
      maxVol: mv || 1,
      ema20: e20,
      ema50: e50,
    };
  }, [candles, showEma20, showEma50]);

  const priceRange = maxPrice - minPrice || 1;
  const volReserve = showVolume ? plotHeight * 0.18 : 0;
  const pricePlotHeight = plotHeight - volReserve;

  const priceToY = (p: number) =>
    padTop + pricePlotHeight - ((p - minPrice) / priceRange) * pricePlotHeight;

  const indexToX = (i: number) => {
    if (candles.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (i / (candles.length - 1)) * plotWidth;
  };

  const activeCandle =
    hoverIndex !== null && candles[hoverIndex]
      ? candles[hoverIndex]
      : candles[candles.length - 1];

  const isOverallUp =
    candles.length > 1
      ? candles[candles.length - 1].close >= candles[0].open
      : instrument.changePct >= 0;

  const areaColor = isOverallUp ? '#089981' : '#f23645';

  const linePath = useMemo(() => {
    if (candles.length === 0) return '';
    return candles
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${indexToX(i).toFixed(2)} ${priceToY(c.close).toFixed(2)}`)
      .join(' ');
  }, [candles, minPrice, maxPrice, plotWidth, pricePlotHeight]);

  const areaPath = useMemo(() => {
    if (!linePath || candles.length === 0) return '';
    const lastX = indexToX(candles.length - 1).toFixed(2);
    const firstX = indexToX(0).toFixed(2);
    const bottomY = (padTop + pricePlotHeight).toFixed(2);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, candles.length, pricePlotHeight]);

  const ema20Path = useMemo(() => {
    if (!showEma20 || ema20.length === 0) return '';
    return ema20
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${indexToX(i).toFixed(2)} ${priceToY(v).toFixed(2)}`)
      .join(' ');
  }, [showEma20, ema20, minPrice, maxPrice, plotWidth, pricePlotHeight]);

  const ema50Path = useMemo(() => {
    if (!showEma50 || ema50.length === 0) return '';
    return ema50
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${indexToX(i).toFixed(2)} ${priceToY(v).toFixed(2)}`)
      .join(' ');
  }, [showEma50, ema50, minPrice, maxPrice, plotWidth, pricePlotHeight]);

  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: number[] = [];
    for (let i = 0; i < count; i++) {
      ticks.push(minPrice + (priceRange * i) / (count - 1));
    }
    return ticks;
  }, [minPrice, priceRange]);

  const xTickIndices = useMemo(() => {
    if (candles.length < 5) return [];
    const step = Math.floor((candles.length - 1) / 4);
    return [0, step, step * 2, step * 3, candles.length - 1];
  }, [candles.length]);

  const handlePointerMove = (clientX: number) => {
    if (!svgRef.current || candles.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * viewWidth;
    const clampedX = Math.max(padLeft, Math.min(padLeft + plotWidth, relX));
    const ratio = (clampedX - padLeft) / plotWidth;
    const idx = Math.round(ratio * (candles.length - 1));
    setHoverIndex(Math.max(0, Math.min(candles.length - 1, idx)));
  };

  const candleWidth = Math.max(2.5, Math.min(10, (plotWidth / Math.max(candles.length, 1)) * 0.62));
  const currentPriceY = Math.max(padTop, Math.min(padTop + pricePlotHeight, priceToY(instrument.price)));

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] overflow-hidden">
      {/* Toolbar: Timeframe segmented filter + Chart mode + Technical indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#2a2e39] bg-[#171b26]">
        {/* Segmented Timeframe Filter */}
        <div className="flex items-center gap-0.5 bg-[#1e222d] rounded-[4px] p-0.5 border border-[#2a2e39]">
          {TIMEFRAMES.map((tf) => {
            const active = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`relative px-2.5 py-1.5 min-h-[32px] font-mono text-[11px] font-semibold tracking-wider rounded-[3px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#242835] text-[#d1d4dc]'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                {tf}
                {active && (
                  <span
                    className="absolute left-1 right-1 bottom-0 h-[2px] bg-[#2962ff] rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Chart Mode & Overlay Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-0.5 bg-[#1e222d] rounded-[4px] p-0.5 border border-[#2a2e39]">
            {(['Candles', 'Area', 'Line'] as ChartMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChartModeChange(mode)}
                className={`px-2 py-1 text-[11px] font-medium rounded-[3px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  chartMode === mode
                    ? 'bg-[#2962ff] text-white'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowEma20((v) => !v)}
            className={`px-2 py-1 text-[11px] font-mono rounded-[4px] border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              showEma20
                ? 'bg-[#242835] border-[#2962ff] text-[#b6c4ff]'
                : 'bg-[#1e222d] border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            EMA 12
          </button>

          <button
            type="button"
            onClick={() => setShowEma50((v) => !v)}
            className={`px-2 py-1 text-[11px] font-mono rounded-[4px] border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              showEma50
                ? 'bg-[#242835] border-[#ffb59a] text-[#ffb59a]'
                : 'bg-[#1e222d] border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            EMA 26
          </button>

          <button
            type="button"
            onClick={() => setShowVolume((v) => !v)}
            className={`px-2 py-1 text-[11px] font-mono rounded-[4px] border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              showVolume
                ? 'bg-[#242835] border-[#363a45] text-[#d1d4dc]'
                : 'bg-[#1e222d] border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            VOL
          </button>
        </div>
      </div>

      {/* Live OHLCV Crosshair Readout Bar */}
      {activeCandle && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-1.5 border-b border-[#2a2e39] bg-[#131722] text-[11px] font-mono tabular-nums">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[#787b86]">{activeCandle.label}</span>
            <span className="text-[#787b86]">
              O{' '}
              <span className="text-[#d1d4dc]">
                {formatRawPrice(activeCandle.open, instrument.decimals, instrument.unitPrefix ?? '', instrument.unitSuffix ?? '')}
              </span>
            </span>
            <span className="text-[#787b86]">
              H{' '}
              <span className="text-[#089981]">
                {formatRawPrice(activeCandle.high, instrument.decimals, instrument.unitPrefix ?? '', instrument.unitSuffix ?? '')}
              </span>
            </span>
            <span className="text-[#787b86]">
              L{' '}
              <span className="text-[#f23645]">
                {formatRawPrice(activeCandle.low, instrument.decimals, instrument.unitPrefix ?? '', instrument.unitSuffix ?? '')}
              </span>
            </span>
            <span className="text-[#787b86]">
              C{' '}
              <span className={activeCandle.close >= activeCandle.open ? 'text-[#089981]' : 'text-[#f23645]'}>
                {formatRawPrice(activeCandle.close, instrument.decimals, instrument.unitPrefix ?? '', instrument.unitSuffix ?? '')}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[#787b86]">
            <span>
              Vol <span className="text-[#d1d4dc]">{formatCompactVolume(activeCandle.volume)}</span>
            </span>
            {showEma20 && ema20.length > 0 && (
              <span className="hidden sm:inline text-[#b6c4ff]">
                EMA12{' '}
                {formatRawPrice(
                  ema20[hoverIndex ?? candles.length - 1],
                  instrument.decimals,
                  instrument.unitPrefix ?? '',
                  instrument.unitSuffix ?? ''
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main SVG Plot Area */}
      <div className="relative bg-[#131722] select-none touch-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="w-full h-auto block cursor-crosshair"
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseLeave={() => setHoverIndex(null)}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`areaGrad-${instrument.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaColor} stopOpacity="0.24" />
              <stop offset="100%" stopColor={areaColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Price Gridlines */}
          {yTicks.map((tick, idx) => {
            const y = priceToY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotWidth}
                  y2={y}
                  stroke="#2a2e39"
                  strokeWidth="0.75"
                  strokeDasharray="2 3"
                />
                <text
                  x={padLeft + plotWidth + 6}
                  y={y + 3.5}
                  fill="#787b86"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatRawPrice(tick, instrument.decimals)}
                </text>
              </g>
            );
          })}

          {/* Vertical Time Gridlines & X-Axis Labels */}
          {xTickIndices.map((idx) => {
            const x = indexToX(idx);
            const lbl = candles[idx]?.label ?? '';
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotHeight}
                  stroke="#2a2e39"
                  strokeWidth="0.6"
                  strokeOpacity="0.55"
                />
                <text
                  x={x}
                  y={viewHeight - 7}
                  textAnchor={idx === 0 ? 'start' : idx === candles.length - 1 ? 'end' : 'middle'}
                  fill="#787b86"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {lbl}
                </text>
              </g>
            );
          })}

          {/* Volume Histogram Bars */}
          {showVolume &&
            candles.map((c, i) => {
              const x = indexToX(i);
              const barH = Math.max(2, (c.volume / maxVol) * (volReserve - 6));
              const isBull = c.close >= c.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x - candleWidth / 2}
                  y={padTop + plotHeight - barH}
                  width={candleWidth}
                  height={barH}
                  fill={isBull ? '#089981' : '#f23645'}
                  fillOpacity="0.28"
                />
              );
            })}

          {/* Area or Line Mode */}
          {chartMode === 'Area' && (
            <>
              <path d={areaPath} fill={`url(#areaGrad-${instrument.symbol})`} />
              <path
                d={linePath}
                fill="none"
                stroke={areaColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </>
          )}

          {chartMode === 'Line' && (
            <path
              d={linePath}
              fill="none"
              stroke="#2962ff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}

          {/* Candles Mode */}
          {chartMode === 'Candles' &&
            candles.map((c, i) => {
              const x = indexToX(i);
              const yOpen = priceToY(c.open);
              const yClose = priceToY(c.close);
              const yHigh = priceToY(c.high);
              const yLow = priceToY(c.low);
              const isBull = c.close >= c.open;
              const color = isBull ? '#089981' : '#f23645';
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

              return (
                <g key={i}>
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="0.6"
                  />
                </g>
              );
            })}

          {/* EMA Overlays */}
          {showEma20 && ema20Path && (
            <path
              d={ema20Path}
              fill="none"
              stroke="#b6c4ff"
              strokeWidth="1.25"
              strokeOpacity="0.85"
            />
          )}
          {showEma50 && ema50Path && (
            <path
              d={ema50Path}
              fill="none"
              stroke="#ffb59a"
              strokeWidth="1.25"
              strokeOpacity="0.85"
            />
          )}

          {/* Current Market Price Reference Line + Right Axis Pill */}
          <line
            x1={padLeft}
            y1={currentPriceY}
            x2={padLeft + plotWidth}
            y2={currentPriceY}
            stroke={instrument.changePct >= 0 ? '#089981' : '#f23645'}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <rect
            x={padLeft + plotWidth + 2}
            y={currentPriceY - 9}
            width={62}
            height={18}
            rx={2}
            fill={instrument.changePct >= 0 ? '#089981' : '#f23645'}
          />
          <text
            x={padLeft + plotWidth + 6}
            y={currentPriceY + 3.5}
            fill="#ffffff"
            fontSize="10"
            fontWeight="600"
            fontFamily="JetBrains Mono, monospace"
          >
            {formatRawPrice(instrument.price, instrument.decimals)}
          </text>

          {/* Interactive Crosshair Overlay */}
          {hoverIndex !== null && candles[hoverIndex] && (
            <g>
              <line
                x1={indexToX(hoverIndex)}
                y1={padTop}
                x2={indexToX(hoverIndex)}
                y2={padTop + plotHeight}
                stroke="#787b86"
                strokeWidth="0.9"
                strokeDasharray="3 3"
              />
              <line
                x1={padLeft}
                y1={priceToY(candles[hoverIndex].close)}
                x2={padLeft + plotWidth}
                y2={priceToY(candles[hoverIndex].close)}
                stroke="#787b86"
                strokeWidth="0.9"
                strokeDasharray="3 3"
              />
              <circle
                cx={indexToX(hoverIndex)}
                cy={priceToY(candles[hoverIndex].close)}
                r="4"
                fill="#2962ff"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <rect
                x={padLeft + plotWidth + 2}
                y={priceToY(candles[hoverIndex].close) - 9}
                width={62}
                height={18}
                rx={2}
                fill="#2962ff"
              />
              <text
                x={padLeft + plotWidth + 6}
                y={priceToY(candles[hoverIndex].close) + 3.5}
                fill="#ffffff"
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {formatRawPrice(candles[hoverIndex].close, instrument.decimals)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
