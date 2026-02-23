/**
 * Backtest Engine
 * Tests simple trading strategies on historical OHLC data.
 * Pure computation — no side effects.
 */

import { type Candle, analyzeMarketStructure } from "./marketStructureEngine";

export type StrategyType = "bos_entry" | "choch_reversal" | "rsi_oversold" | "ema_cross" | "breakout";

export interface BacktestConfig {
  strategy: StrategyType;
  direction: "long" | "short" | "both";
  /** Risk-reward ratio for TP (e.g., 2 = 2:1 RR) */
  rrRatio: number;
  /** Stop loss as % of entry price */
  slPercent: number;
  /** RSI threshold for rsi_oversold strategy */
  rsiThreshold?: number;
  /** EMA periods for ema_cross */
  emaFast?: number;
  emaSlow?: number;
}

export interface BacktestTrade {
  entryIndex: number;
  entryTime: number;
  entryPrice: number;
  exitIndex: number;
  exitTime: number;
  exitPrice: number;
  direction: "long" | "short";
  pnlPercent: number;
  result: "win" | "loss";
  reason: string;
}

export interface BacktestResult {
  trades: BacktestTrade[];
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalPnl: number;
  maxDrawdown: number;
  sharpeApprox: number;
  strategyLabel: string;
}

function calculateEMA(closes: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  ema[0] = closes[0];
  for (let i = 1; i < closes.length; i++) {
    ema[i] = closes[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change; else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    const curRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + curRS);
  }
  return rsi;
}

const STRATEGY_LABELS: Record<StrategyType, string> = {
  bos_entry: "BOS Entry",
  choch_reversal: "ChoCH Reversal",
  rsi_oversold: "RSI Oversold/Overbought",
  ema_cross: "EMA Crossover",
  breakout: "Range Breakout",
};

/**
 * Run a backtest on historical candles with the given strategy config.
 */
export function runBacktest(candles: Candle[], config: BacktestConfig): BacktestResult {
  const trades: BacktestTrade[] = [];
  const closes = candles.map(c => c.close);

  // Generate signals based on strategy
  const entries: { index: number; direction: "long" | "short"; reason: string }[] = [];

  switch (config.strategy) {
    case "bos_entry": {
      const structure = analyzeMarketStructure(candles, 3);
      for (const sig of structure.signals) {
        if (sig.event !== "BOS") continue;
        if (config.direction !== "both" && sig.direction !== (config.direction === "long" ? "bullish" : "bearish")) continue;
        entries.push({
          index: sig.index + 1,
          direction: sig.direction === "bullish" ? "long" : "short",
          reason: `BOS ${sig.direction} @ ${sig.brokenLevel.toFixed(2)}`,
        });
      }
      break;
    }
    case "choch_reversal": {
      const structure = analyzeMarketStructure(candles, 3);
      for (const sig of structure.signals) {
        if (sig.event !== "ChoCH") continue;
        if (config.direction !== "both" && sig.direction !== (config.direction === "long" ? "bullish" : "bearish")) continue;
        entries.push({
          index: sig.index + 1,
          direction: sig.direction === "bullish" ? "long" : "short",
          reason: `ChoCH ${sig.direction}`,
        });
      }
      break;
    }
    case "rsi_oversold": {
      const rsi = calculateRSI(closes, 14);
      const threshold = config.rsiThreshold ?? 30;
      for (let i = 15; i < candles.length - 1; i++) {
        if (config.direction !== "short" && rsi[i - 1] < threshold && rsi[i] >= threshold) {
          entries.push({ index: i + 1, direction: "long", reason: `RSI bounce from ${rsi[i - 1].toFixed(1)}` });
        }
        if (config.direction !== "long" && rsi[i - 1] > (100 - threshold) && rsi[i] <= (100 - threshold)) {
          entries.push({ index: i + 1, direction: "short", reason: `RSI drop from ${rsi[i - 1].toFixed(1)}` });
        }
      }
      break;
    }
    case "ema_cross": {
      const fast = calculateEMA(closes, config.emaFast ?? 9);
      const slow = calculateEMA(closes, config.emaSlow ?? 21);
      for (let i = (config.emaSlow ?? 21) + 1; i < candles.length - 1; i++) {
        if (config.direction !== "short" && fast[i - 1] <= slow[i - 1] && fast[i] > slow[i]) {
          entries.push({ index: i + 1, direction: "long", reason: `EMA ${config.emaFast ?? 9}/${config.emaSlow ?? 21} golden cross` });
        }
        if (config.direction !== "long" && fast[i - 1] >= slow[i - 1] && fast[i] < slow[i]) {
          entries.push({ index: i + 1, direction: "short", reason: `EMA ${config.emaFast ?? 9}/${config.emaSlow ?? 21} death cross` });
        }
      }
      break;
    }
    case "breakout": {
      const lookback = 20;
      for (let i = lookback + 1; i < candles.length - 1; i++) {
        let rangeHigh = -Infinity, rangeLow = Infinity;
        for (let j = i - lookback; j < i; j++) {
          if (candles[j].high > rangeHigh) rangeHigh = candles[j].high;
          if (candles[j].low < rangeLow) rangeLow = candles[j].low;
        }
        if (config.direction !== "short" && candles[i].close > rangeHigh && candles[i - 1].close <= rangeHigh) {
          entries.push({ index: i + 1, direction: "long", reason: `Breakout above ${rangeHigh.toFixed(2)}` });
        }
        if (config.direction !== "long" && candles[i].close < rangeLow && candles[i - 1].close >= rangeLow) {
          entries.push({ index: i + 1, direction: "short", reason: `Breakdown below ${rangeLow.toFixed(2)}` });
        }
      }
      break;
    }
  }

  // Simulate trades with SL/TP
  let lastExitIndex = -1;
  for (const entry of entries) {
    if (entry.index >= candles.length || entry.index <= lastExitIndex) continue;

    const entryPrice = candles[entry.index].open;
    const sl = config.slPercent / 100;
    const tp = sl * config.rrRatio;

    let slPrice: number, tpPrice: number;
    if (entry.direction === "long") {
      slPrice = entryPrice * (1 - sl);
      tpPrice = entryPrice * (1 + tp);
    } else {
      slPrice = entryPrice * (1 + sl);
      tpPrice = entryPrice * (1 - tp);
    }

    // Walk forward to find exit
    let exitIndex = candles.length - 1;
    let exitPrice = candles[exitIndex].close;
    let result: "win" | "loss" = "loss";

    for (let j = entry.index + 1; j < candles.length; j++) {
      const c = candles[j];
      if (entry.direction === "long") {
        if (c.low <= slPrice) { exitIndex = j; exitPrice = slPrice; result = "loss"; break; }
        if (c.high >= tpPrice) { exitIndex = j; exitPrice = tpPrice; result = "win"; break; }
      } else {
        if (c.high >= slPrice) { exitIndex = j; exitPrice = slPrice; result = "loss"; break; }
        if (c.low <= tpPrice) { exitIndex = j; exitPrice = tpPrice; result = "win"; break; }
      }
    }

    const pnl = entry.direction === "long"
      ? ((exitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - exitPrice) / entryPrice) * 100;

    trades.push({
      entryIndex: entry.index,
      entryTime: candles[entry.index].openTime,
      entryPrice,
      exitIndex,
      exitTime: candles[exitIndex].openTime,
      exitPrice,
      direction: entry.direction,
      pnlPercent: pnl,
      result,
      reason: entry.reason,
    });

    lastExitIndex = exitIndex;
  }

  // Calculate stats
  const wins = trades.filter(t => t.result === "win").length;
  const losses = trades.filter(t => t.result === "loss").length;
  const winPnls = trades.filter(t => t.result === "win").map(t => t.pnlPercent);
  const lossPnls = trades.filter(t => t.result === "loss").map(t => Math.abs(t.pnlPercent));
  const avgWin = winPnls.length > 0 ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length > 0 ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0;
  const totalPnl = trades.reduce((acc, t) => acc + t.pnlPercent, 0);
  const grossProfit = winPnls.reduce((a, b) => a + b, 0);
  const grossLoss = lossPnls.reduce((a, b) => a + b, 0);
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Max drawdown
  let peak = 0, maxDD = 0, equity = 0;
  for (const t of trades) {
    equity += t.pnlPercent;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDD) maxDD = dd;
  }

  // Sharpe approximation
  const pnls = trades.map(t => t.pnlPercent);
  const meanPnl = pnls.length > 0 ? pnls.reduce((a, b) => a + b, 0) / pnls.length : 0;
  const variance = pnls.length > 1
    ? pnls.reduce((acc, p) => acc + (p - meanPnl) ** 2, 0) / (pnls.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeApprox = stdDev > 0 ? meanPnl / stdDev : 0;

  return {
    trades,
    totalTrades: trades.length,
    wins,
    losses,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    avgWin,
    avgLoss,
    profitFactor,
    totalPnl,
    maxDrawdown: maxDD,
    sharpeApprox,
    strategyLabel: STRATEGY_LABELS[config.strategy],
  };
}
