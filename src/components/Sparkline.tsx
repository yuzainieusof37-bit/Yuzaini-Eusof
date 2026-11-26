import React, { useId } from 'react';

interface SparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = React.memo(
  ({ data, isPositive, width = 64, height = 24 }) => {
    const gradientId = useId();
    if (!data || data.length < 2) {
      return <div style={{ width, height }} className="shrink-0" />;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = 2;
    const drawHeight = height - padY * 2;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = padY + drawHeight - ((val - min) / range) * drawHeight;
      return { x, y };
    });

    const linePath = points
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
      .join(' ');

    const areaPath = `${linePath} L ${width.toFixed(2)} ${height} L 0 ${height} Z`;
    const strokeColor = isPositive ? '#089981' : '#f23645';

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
);

Sparkline.displayName = 'Sparkline';
