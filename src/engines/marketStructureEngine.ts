/**
 * Market Structure Engine
 * Detects: Swing Highs/Lows, HH/HL/LH/LL, BOS, ChoCH
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
}

export interface MarketStructureResult {
  swingPoints: SwingPoint[];
  signals: StructureSignal[];
  currentBias: Bias;
  lastSwingHigh: number | null;
  lastSwingLow: number | null;
}

/**
 * Detect swing highs and lows using N-bar lookback.
 * A swing high: candle.high > N candles before AND after.
 * A swing low: candle.low < N candles before AND after.
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
 * Classify swing points and detect structure breaks.
 */
export function analyzeMarketStructure(candles: Candle[], lookback = 3): MarketStructureResult {
  if (candles.length < lookback * 3) {
    return { swingPoints: [], signals: [], currentBias: "neutral", lastSwingHigh: null, lastSwingLow: null };
  }

  const { highs, lows } = detectSwings(candles, lookback);

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
        label = "HH"; // First high
      } else {
        label = swing.price > lastHigh ? "HH" : "LH";
      }

      // BOS bullish: new HH breaks previous high (continuation)
      if (label === "HH" && lastHigh !== null && bias === "bullish") {
        signals.push({
          index: swing.index,
          time: swing.time,
          price: swing.price,
          event: "BOS",
          direction: "bullish",
          brokenLevel: lastHigh,
        });
      }

      // ChoCH bearish: LH after bullish bias
      if (label === "LH" && bias === "bullish") {
        signals.push({
          index: swing.index,
          time: swing.time,
          price: swing.price,
          event: "ChoCH",
          direction: "bearish",
          brokenLevel: lastHigh,
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

      // BOS bearish: new LL breaks previous low (continuation)
      if (label === "LL" && lastLow !== null && bias === "bearish") {
        signals.push({
          index: swing.index,
          time: swing.time,
          price: swing.price,
          event: "BOS",
          direction: "bearish",
          brokenLevel: lastLow,
        });
      }

      // ChoCH bullish: HL after bearish bias
      if (label === "HL" && bias === "bearish") {
        signals.push({
          index: swing.index,
          time: swing.time,
          price: swing.price,
          event: "ChoCH",
          direction: "bullish",
          brokenLevel: lastLow,
        });
        bias = "bullish";
      }

      if (label === "LL") bias = "bearish";
      lastLow = swing.price;
    }

    swingPoints.push({ ...swing, label });
  }

  return {
    swingPoints,
    signals,
    currentBias: bias,
    lastSwingHigh: lastHigh,
    lastSwingLow: lastLow,
  };
}
