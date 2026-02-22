/**
 * Multi-Timeframe Confluence Engine
 * Analyzes bias alignment across multiple timeframes.
 * 
 * Per timeframe: trend direction + strength + key level proximity
 * Output: confluence matrix with alignment score
 */

import type { Candle } from "./marketStructureEngine";
import { analyzeMarketStructure, type Bias } from "./marketStructureEngine";

export type TrendStrength = "strong" | "moderate" | "weak";

export interface TimeframeBias {
  timeframe: string;
  bias: Bias;
  strength: TrendStrength;
  /** EMA alignment score: 1 = fully aligned, 0 = chopped */
  emaAlignment: number;
  /** Price position relative to key MAs */
  priceAboveEma20: boolean;
  priceAboveEma50: boolean;
  /** Last structure event */
  lastStructure: string | null;
  /** Current close price */
  close: number;
}

export interface ConfluenceResult {
  timeframes: TimeframeBias[];
  /** Overall confluence score 0-100 */
  confluenceScore: number;
  /** Dominant bias across timeframes */
  dominantBias: Bias;
  /** Number of timeframes aligned with dominant bias */
  alignedCount: number;
  totalCount: number;
}

/** Calculate EMA */
function ema(values: number[], period: number): number[] {
  const result: number[] = [];
  const mult = 2 / (period + 1);
  let prev = values[0];
  result.push(prev);

  for (let i = 1; i < values.length; i++) {
    const current = (values[i] - prev) * mult + prev;
    result.push(current);
    prev = current;
  }
  return result;
}

/** Analyze a single timeframe */
function analyzeTimeframe(candles: Candle[], timeframe: string): TimeframeBias {
  const closes = candles.map((c) => c.close);
  const currentClose = closes[closes.length - 1] ?? 0;

  // EMA calculations
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const currentEma20 = ema20[ema20.length - 1] ?? 0;
  const currentEma50 = ema50[ema50.length - 1] ?? 0;

  const priceAboveEma20 = currentClose > currentEma20;
  const priceAboveEma50 = currentClose > currentEma50;
  const emasBullish = currentEma20 > currentEma50;

  // EMA alignment: how well are EMAs stacked
  let emaAlignment = 0;
  if (priceAboveEma20 && priceAboveEma50 && emasBullish) emaAlignment = 1;
  else if (!priceAboveEma20 && !priceAboveEma50 && !emasBullish) emaAlignment = 1;
  else if ((priceAboveEma20 && emasBullish) || (!priceAboveEma20 && !emasBullish)) emaAlignment = 0.6;
  else emaAlignment = 0.3;

  // Market structure analysis
  const structure = analyzeMarketStructure(candles, 3);
  const lastSignal = structure.signals[structure.signals.length - 1];

  // Determine bias from structure + EMAs
  let bias: Bias = structure.currentBias;
  if (bias === "neutral") {
    bias = emasBullish ? "bullish" : priceAboveEma50 ? "bullish" : "bearish";
  }

  // Strength
  let strength: TrendStrength = "weak";
  if (emaAlignment >= 0.9 && structure.currentBias !== "neutral") strength = "strong";
  else if (emaAlignment >= 0.5) strength = "moderate";

  return {
    timeframe,
    bias,
    strength,
    emaAlignment,
    priceAboveEma20,
    priceAboveEma50,
    lastStructure: lastSignal ? `${lastSignal.event} ${lastSignal.direction}` : null,
    close: currentClose,
  };
}

export function analyzeConfluence(
  candlesByTimeframe: Map<string, Candle[]>,
  timeframeOrder: string[] = ["5m", "15m", "1h", "4h", "1d"]
): ConfluenceResult {
  const timeframes: TimeframeBias[] = [];

  for (const tf of timeframeOrder) {
    const candles = candlesByTimeframe.get(tf);
    if (!candles || candles.length < 50) {
      timeframes.push({
        timeframe: tf,
        bias: "neutral",
        strength: "weak",
        emaAlignment: 0,
        priceAboveEma20: false,
        priceAboveEma50: false,
        lastStructure: null,
        close: 0,
      });
      continue;
    }
    timeframes.push(analyzeTimeframe(candles, tf));
  }

  // Calculate confluence
  const bullishCount = timeframes.filter((t) => t.bias === "bullish").length;
  const bearishCount = timeframes.filter((t) => t.bias === "bearish").length;
  const total = timeframes.length;

  const dominantBias: Bias =
    bullishCount > bearishCount ? "bullish" :
    bearishCount > bullishCount ? "bearish" : "neutral";

  const alignedCount = dominantBias === "bullish" ? bullishCount :
    dominantBias === "bearish" ? bearishCount : 0;

  // Weight higher timeframes more
  const weights = [1, 1.5, 2, 2.5, 3]; // 5m, 15m, 1h, 4h, 1d
  let weightedAligned = 0;
  let totalWeight = 0;

  timeframes.forEach((tf, i) => {
    const w = weights[i] ?? 1;
    totalWeight += w;
    if (tf.bias === dominantBias) {
      weightedAligned += w * tf.emaAlignment;
    }
  });

  const confluenceScore = Math.round((weightedAligned / totalWeight) * 100);

  return {
    timeframes,
    confluenceScore,
    dominantBias,
    alignedCount,
    totalCount: total,
  };
}
