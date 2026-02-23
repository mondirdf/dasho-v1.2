/**
 * Market Structure Engine
 * Detects: Swing Highs/Lows, HH/HL/LH/LL, BOS, ChoCH
 * Includes: RSI calculation for confirmation signals
 * 
 * Pure computation — no side effects, no API calls.
 * Operates on OHLC candle arrays.
 */

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SwingType = "HH" | "HL" | "LH" | "LL";
export type StructureEvent = "BOS" | "ChoCH";
export type Bias = "bullish" | "bearish" | "neutral";

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  type: "high" | "low";
  label: SwingType;
}

export interface StructureSignal {
  index: number;
  time: number;
  price: number;
  event: StructureEvent;
  direction: "bullish" | "bearish";
  /** The swing point that was broken */
  brokenLevel: number;
  /** RSI value at the time of signal */
  rsi?: number;
  /** Whether RSI confirms the signal (divergence check) */
  rsiConfirmed?: boolean;
  /** Volume spike confirmation */
  volumeSpike?: boolean;
}

export interface MarketStructureResult {
  swingPoints: SwingPoint[];
  signals: StructureSignal[];
  currentBias: Bias;
  lastSwingHigh: number | null;
  lastSwingLow: number | null;
  /** Current RSI value */
  currentRSI: number | null;
  /** RSI array for recent candles */
  rsiValues: number[];
  /** Support/Resistance zones from swing points */
  keyLevels: { price: number; type: "support" | "resistance"; strength: number }[];
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (closes.length < period + 1) return rsi;

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  // Fill initial RSI values as 50 for the first `period` candles
  for (let i = 0; i < period; i++) rsi.push(50);

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + rs));

  // Subsequent values using smoothed averages
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const currentRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + currentRS));
  }

  return rsi;
}

/**
 * Detect volume spikes (volume > 1.5x average of last 20 candles)
 */
function isVolumeSpike(candles: Candle[], index: number, lookback = 20): boolean {
  if (index < lookback) return false;
  let avgVol = 0;
  for (let i = index - lookback; i < index; i++) {
    avgVol += candles[i].volume;
  }
  avgVol /= lookback;
  return avgVol > 0 && candles[index].volume > avgVol * 1.5;
}

/**
 * Detect swing highs and lows using N-bar lookback.
 */
function detectSwings(candles: Candle[], lookback = 3): { highs: { index: number; price: number; time: number }[]; lows: { index: number; price: number; time: number }[] } {
  const highs: { index: number; price: number; time: number }[] = [];
  const lows: { index: number; price: number; time: number }[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
        isHigh = false;
      }
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
        isLow = false;
      }
    }

    if (isHigh) highs.push({ index: i, price: candles[i].high, time: candles[i].openTime });
    if (isLow) lows.push({ index: i, price: candles[i].low, time: candles[i].openTime });
  }

  return { highs, lows };
}

/**
 * Extract key support/resistance levels from swing points
 */
function extractKeyLevels(swingPoints: SwingPoint[]): { price: number; type: "support" | "resistance"; strength: number }[] {
  const levels: Map<number, { type: "support" | "resistance"; count: number }> = new Map();
  const tolerance = 0.003; // 0.3% clustering

  for (const sp of swingPoints) {
    const type = sp.type === "high" ? "resistance" : "support";
    let merged = false;

    for (const [key, val] of levels) {
      if (Math.abs(sp.price - key) / key < tolerance && val.type === type) {
        val.count++;
        merged = true;
        break;
      }
    }

    if (!merged) {
      levels.set(sp.price, { type, count: 1 });
    }
  }

  return Array.from(levels.entries())
    .map(([price, { type, count }]) => ({ price, type, strength: count }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6);
}

/**
 * Classify swing points and detect structure breaks.
 */
export function analyzeMarketStructure(candles: Candle[], lookback = 3): MarketStructureResult {
  if (candles.length < lookback * 3) {
    return { swingPoints: [], signals: [], currentBias: "neutral", lastSwingHigh: null, lastSwingLow: null, currentRSI: null, rsiValues: [], keyLevels: [] };
  }

  const { highs, lows } = detectSwings(candles, lookback);
  const closes = candles.map(c => c.close);
  const rsiValues = calculateRSI(closes, 14);

  // Merge and sort all swing points chronologically
  const allSwings = [
    ...highs.map((h) => ({ ...h, type: "high" as const })),
    ...lows.map((l) => ({ ...l, type: "low" as const })),
  ].sort((a, b) => a.index - b.index);

  const swingPoints: SwingPoint[] = [];
  const signals: StructureSignal[] = [];

  let lastHigh: number | null = null;
  let lastLow: number | null = null;
  let bias: Bias = "neutral";

  for (const swing of allSwings) {
    let label: SwingType;

    if (swing.type === "high") {
      if (lastHigh === null) {
        label = "HH";
      } else {
        label = swing.price > lastHigh ? "HH" : "LH";
      }

      // BOS bullish
      if (label === "HH" && lastHigh !== null && bias === "bullish") {
        const rsi = rsiValues[swing.index] ?? null;
        const volSpike = isVolumeSpike(candles, swing.index);
        // RSI confirmation: bullish BOS with RSI not overbought divergence
        const rsiConfirmed = rsi !== null ? rsi < 80 : undefined;
        
        signals.push({
          index: swing.index, time: swing.time, price: swing.price,
          event: "BOS", direction: "bullish", brokenLevel: lastHigh,
          rsi: rsi ?? undefined, rsiConfirmed, volumeSpike: volSpike,
        });
      }

      // ChoCH bearish
      if (label === "LH" && bias === "bullish") {
        const rsi = rsiValues[swing.index] ?? null;
        const volSpike = isVolumeSpike(candles, swing.index);
        const rsiConfirmed = rsi !== null ? rsi < 50 : undefined;
        
        signals.push({
          index: swing.index, time: swing.time, price: swing.price,
          event: "ChoCH", direction: "bearish", brokenLevel: lastHigh,
          rsi: rsi ?? undefined, rsiConfirmed, volumeSpike: volSpike,
        });
        bias = "bearish";
      }

      if (label === "HH") bias = "bullish";
      lastHigh = swing.price;
    } else {
      if (lastLow === null) {
        label = "HL";
      } else {
        label = swing.price > lastLow ? "HL" : "LL";
      }

      // BOS bearish
      if (label === "LL" && lastLow !== null && bias === "bearish") {
        const rsi = rsiValues[swing.index] ?? null;
        const volSpike = isVolumeSpike(candles, swing.index);
        const rsiConfirmed = rsi !== null ? rsi > 20 : undefined;
        
        signals.push({
          index: swing.index, time: swing.time, price: swing.price,
          event: "BOS", direction: "bearish", brokenLevel: lastLow,
          rsi: rsi ?? undefined, rsiConfirmed, volumeSpike: volSpike,
        });
      }

      // ChoCH bullish
      if (label === "HL" && bias === "bearish") {
        const rsi = rsiValues[swing.index] ?? null;
        const volSpike = isVolumeSpike(candles, swing.index);
        const rsiConfirmed = rsi !== null ? rsi > 50 : undefined;
        
        signals.push({
          index: swing.index, time: swing.time, price: swing.price,
          event: "ChoCH", direction: "bullish", brokenLevel: lastLow,
          rsi: rsi ?? undefined, rsiConfirmed, volumeSpike: volSpike,
        });
        bias = "bullish";
      }

      if (label === "LL") bias = "bearish";
      lastLow = swing.price;
    }

    swingPoints.push({ ...swing, label });
  }

  const keyLevels = extractKeyLevels(swingPoints);
  const currentRSI = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;

  return {
    swingPoints, signals, currentBias: bias,
    lastSwingHigh: lastHigh, lastSwingLow: lastLow,
    currentRSI, rsiValues, keyLevels,
  };
}
