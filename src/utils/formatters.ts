import { Instrument } from '../types/market';

const MINUS_SIGN = '\u2212'; // Strict typographic minus sign (−) per design spec

export function formatRawPrice(
  value: number,
  decimals: number = 2,
  prefix: string = '',
  suffix: string = ''
): string {
  const absVal = Math.abs(value);
  const formatted = absVal.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = value < 0 ? MINUS_SIGN : '';
  return `${sign}${prefix}${formatted}${suffix}`;
}

export function formatInstrumentPrice(inst: Pick<Instrument, 'price' | 'decimals' | 'unitPrefix' | 'unitSuffix'>): string {
  return formatRawPrice(inst.price, inst.decimals, inst.unitPrefix ?? '', inst.unitSuffix ?? '');
}

export function formatDeltaPct(pct: number): string {
  const abs = Math.abs(pct).toFixed(2);
  if (pct > 0) return `+${abs}%`;
  if (pct < 0) return `${MINUS_SIGN}${abs}%`;
  return `0.00%`;
}

export function formatSignedChange(
  change: number,
  decimals: number = 2,
  prefix: string = '',
  suffix: string = ''
): string {
  const abs = Math.abs(change).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (change > 0) return `+${prefix}${abs}${suffix}`;
  if (change < 0) return `${MINUS_SIGN}${prefix}${abs}${suffix}`;
  return `${prefix}${abs}${suffix}`;
}

export function formatCurrency(value: number, showSign: boolean = false): string {
  const abs = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value < 0) return `${MINUS_SIGN}$${abs}`;
  if (showSign && value > 0) return `+$${abs}`;
  return `$${abs}`;
}

export function formatCompactVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toLocaleString('en-US');
}
