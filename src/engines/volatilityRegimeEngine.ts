/**
 * Volatility Regime Engine
 * Classifies current market into: Compression, Expansion, Distribution, Trending
 * 
 * Uses: ATR ratio, Bollinger Band width percentile, ADX approximation
 */

import type { Candle } from "./marketStructureEngine";

export type VolatilityRegime = "compression" | "expansion" | "trending" | "distribution";

export interface VolatilityResult {
  regime: VolatilityRegime;
  regimeScore: number; // 0-100, higher = more volatile
  atrShort: number;
  atrLong: number;
  atrRatio: number;
  bbWidth: number;
  bbWidthPercentile: number;
  adx: number;
  description: string;
}

/** Calculate True Range for a candle */
function trueRange(candle: Candle, prev: Candle): number {
  return Math.max(
    candle.high - candle.low,
    Math.abs(candle.high - prev.close),
    Math.abs(candle.low - prev.close)
  );
}

/** Calculate ATR over period */
function calcATR(candles: Candle[], period: number): number {
  if (candles.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    trs.push(trueRange(candles[i], candles[i - 1]));
  }
  const recent = trs.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

/** Simple Moving Average */
function sma(values: number[], period: number): number {
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/** Standard deviation */
function stddev(values: number[], period: number): number {
  const slice = values.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
  return Math.sqrt(variance);
}

/** Bollinger Band width as % of middle band */
function bbWidth(closes: number[], period = 20, mult = 2): number {
  if (closes.length < period) return 0;
  const mid = sma(closes, period);
  const sd = stddev(closes, period);
  const upper = mid + mult * sd;
  const lower = mid - mult * sd;
  return mid > 0 ? ((upper - lower) / mid) * 100 : 0;
}

/** BB Width percentile over lookback */
function bbWidthPercentile(closes: number[], period = 20, lookback = 100): number {
  if (closes.length < lookback) return 50;
  const widths: number[] = [];
  for (let i = period; i <= closes.length; i++) {
    const slice = closes.slice(i - period, i);
    const mid = slice.reduce((a, b) => a + b, 0) / slice.length;
    const sd = Math.sqrt(slice.reduce((a, b) => a + (b - mid) ** 2, 0) / slice.length);
    widths.push(mid > 0 ? ((2 * 2 * sd) / mid) * 100 : 0);
  }
  const current = widths[widths.length - 1];
  const recentWidths = widths.slice(-lookback);
  const below = recentWidths.filter((w) => w < current).length;
  return (below / recentWidths.length) * 100;
}

/** Simplified ADX approximation using directional movement */
function calcADX(candles: Candle[], period = 14): number {
  if (candles.length < period * 2) return 0;

  let plusDM = 0, minusDM = 0, atr = 0;

  // Initial sum
  for (let i = 1; i <= period; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    plusDM += upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM += downMove > upMove && downMove > 0 ? downMove : 0;
    atr += trueRange(candles[i], candles[i - 1]);
  }

  let smoothPlusDM = plusDM;
  let smoothMinusDM = minusDM;
  let smoothATR = atr;

  const dxValues: number[] = [];

  for (let i = period + 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    const currentPlusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const currentMinusDM = downMove > upMove && downMove > 0 ? downMove : 0;
    const tr = trueRange(candles[i], candles[i - 1]);

    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + currentPlusDM;
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + currentMinusDM;
    smoothATR = smoothATR - smoothATR / period + tr;

    const plusDI = smoothATR > 0 ? (smoothPlusDM / smoothATR) * 100 : 0;
    const minusDI = smoothATR > 0 ? (smoothMinusDM / smoothATR) * 100 : 0;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    dxValues.push(dx);
  }

  if (dxValues.length < period) return 0;
  // ADX is smoothed DX
  const adxSlice = dxValues.slice(-period);
  return adxSlice.reduce((a, b) => a + b, 0) / adxSlice.length;
}

export function analyzeVolatilityRegime(candles: Candle[]): VolatilityResult {
  if (candles.length < 50) {
    return {
      regime: "compression",
      regimeScore: 0,
      atrShort: 0, atrLong: 0, atrRatio: 1,
      bbWidth: 0, bbWidthPercentile: 50, adx: 0,
      description: "Insufficient data",
    };
  }

  const closes = candles.map((c) => c.close);
  const atrShort = calcATR(candles, 7);
  const atrLong = calcATR(candles, 21);
  const atrRatio = atrLong > 0 ? atrShort / atrLong : 1;
  const bbW = bbWidth(closes);
  const bbPercentile = bbWidthPercentile(closes);
  const adx = calcADX(candles);

  // Regime classification
  let regime: VolatilityRegime;
  let regimeScore: number;
  let description: string;

  if (bbPercentile < 20 && atrRatio < 0.8) {
    regime = "compression";
    regimeScore = Math.max(0, 20 - bbPercentile);
    description = "Tight range — breakout likely imminent. Historical compression at this level precedes significant moves.";
  } else if (bbPercentile > 80 && atrRatio > 1.3) {
    regime = "expansion";
    regimeScore = Math.min(100, bbPercentile);
    description = "High volatility expansion. Monitor for exhaustion signals or continuation patterns.";
  } else if (adx > 25 && atrRatio > 0.9) {
    regime = "trending";
    regimeScore = Math.min(100, adx * 2);
    description = `Strong directional trend detected. ADX at ${adx.toFixed(0)} indicates sustained momentum.`;
  } else {
    regime = "distribution";
    regimeScore = 40 + (bbPercentile - 40) * 0.5;
    description = "Range-bound distribution phase. Watch for breakout direction from current range.";
  }

  return { regime, regimeScore, atrShort, atrLong, atrRatio, bbWidth: bbW, bbWidthPercentile: bbPercentile, adx, description };
}
