/**
 * Behavioral Intelligence Engine
 * Detects behavioral anti-patterns, computes Edge Score,
 * and generates pre-trade behavioral feedback.
 * Pure computation — no side effects.
 */

import type { Trade, MarketContextSnapshot } from "./tradePatternEngine";

/* ──────────────────── Types ──────────────────── */

export interface BehavioralFlag {
  type: string;
  label: string;
  description: string;
  severity: "info" | "warning" | "danger";
}

export interface PreTradeFeedback {
  expectancy: "positive" | "negative" | "neutral" | "unknown";
  confidence: number; // 0-100
  message: string;
  warnings: string[];
  historicalWinRate: number | null;
  matchingTrades: number;
}

export interface EdgeScoreBreakdown {
  overall: number; // 0-100
  discipline: number;
  contextAwareness: number;
  patternAdherence: number;
  trend: "improving" | "declining" | "stable";
}

export interface TimeCluster {
  hour: number;
  label: string;
  trades: number;
  winRate: number;
  avgPnl: number;
}

export interface BehavioralInsight {
  id: string;
  message: string;
  type: "positive" | "negative" | "neutral";
  confidence: number;
  tradeCount: number;
}

/* ──────────────────── Behavioral Detection ──────────────────── */

const BEHAVIORAL_PATTERNS = {
  revenge_trade: {
    label: "Revenge Trade",
    description: "Entered within 30min of a losing trade",
    severity: "danger" as const,
  },
  late_breakout: {
    label: "Late Breakout Entry",
    description: "Entered during expansion after significant move",
    severity: "warning" as const,
  },
  ignored_pre_trade: {
    label: "Skipped Pre-Trade Check",
    description: "Entered without completing pre-trade check",
    severity: "warning" as const,
  },
  counter_bias: {
    label: "Counter-Bias Trade",
    description: "Traded against your own bias signal",
    severity: "info" as const,
  },
  high_fear_long: {
    label: "Long in Extreme Fear",
    description: "Went long when sentiment was in extreme fear",
    severity: "info" as const,
  },
  compression_entry: {
    label: "Compression Entry",
    description: "Entered during low-volatility compression regime",
    severity: "info" as const,
  },
};

/**
 * Detect behavioral flags for a new trade given recent trade history
 */
export function detectBehavioralFlags(
  currentTrade: {
    direction: string;
    market_context: MarketContextSnapshot;
    pre_trade_check_skipped: boolean;
    entry_time: string;
  },
  recentTrades: Trade[]
): BehavioralFlag[] {
  const flags: BehavioralFlag[] = [];
  const ctx = currentTrade.market_context;
  const entryTime = new Date(currentTrade.entry_time).getTime();

  // Revenge trade: lost within last 30 minutes
  const thirtyMinAgo = entryTime - 30 * 60 * 1000;
  const recentLoss = recentTrades.find(
    (t) =>
      t.outcome === "loss" &&
      t.exit_time &&
      new Date(t.exit_time).getTime() > thirtyMinAgo &&
      new Date(t.exit_time).getTime() < entryTime
  );
  if (recentLoss) {
    flags.push({ type: "revenge_trade", ...BEHAVIORAL_PATTERNS.revenge_trade });
  }

  // Skipped pre-trade check
  if (currentTrade.pre_trade_check_skipped) {
    flags.push({ type: "ignored_pre_trade", ...BEHAVIORAL_PATTERNS.ignored_pre_trade });
  }

  // Late breakout entry
  if (ctx.regime === "expansion" && (ctx.volatility_score ?? 0) > 70) {
    flags.push({ type: "late_breakout", ...BEHAVIORAL_PATTERNS.late_breakout });
  }

  // Counter-bias trade
  if (ctx.bias_label) {
    const isBullish = ctx.bias_label.toLowerCase().includes("bullish");
    const isBearish = ctx.bias_label.toLowerCase().includes("bearish");
    if ((isBullish && currentTrade.direction === "short") || (isBearish && currentTrade.direction === "long")) {
      flags.push({ type: "counter_bias", ...BEHAVIORAL_PATTERNS.counter_bias });
    }
  }

  // Long in extreme fear
  if (ctx.fear_greed != null && ctx.fear_greed <= 20 && currentTrade.direction === "long") {
    flags.push({ type: "high_fear_long", ...BEHAVIORAL_PATTERNS.high_fear_long });
  }

  // Compression entry
  if (ctx.regime === "compression") {
    flags.push({ type: "compression_entry", ...BEHAVIORAL_PATTERNS.compression_entry });
  }

  return flags;
}

/* ──────────────────── Pre-Trade Feedback ──────────────────── */

/**
 * Generate behavioral feedback before placing a trade.
 * Matches current conditions against historical trade outcomes.
 */
export function generatePreTradeFeedback(
  currentContext: MarketContextSnapshot,
  direction: string,
  symbol: string,
  historicalTrades: Trade[]
): PreTradeFeedback {
  const warnings: string[] = [];
  const closed = historicalTrades.filter((t) => t.outcome && t.pnl != null);

  if (closed.length < 5) {
    return {
      expectancy: "unknown",
      confidence: 0,
      message: "Not enough history to predict. Keep logging trades.",
      warnings: [],
      historicalWinRate: null,
      matchingTrades: 0,
    };
  }

  // Find matching trades by conditions
  const matching = closed.filter((t) => {
    let matches = 0;
    let total = 0;

    // Same direction
    if (t.direction === direction) matches++;
    total++;

    // Same regime
    if (currentContext.regime && t.market_context.regime === currentContext.regime) matches++;
    if (currentContext.regime) total++;

    // Similar sentiment zone
    if (currentContext.fear_greed != null && t.market_context.fear_greed != null) {
      const fgZone = (v: number) => (v <= 25 ? 0 : v <= 50 ? 1 : v <= 75 ? 2 : 3);
      if (fgZone(currentContext.fear_greed) === fgZone(t.market_context.fear_greed)) matches++;
      total++;
    }

    // Same session
    if (currentContext.session && t.market_context.session === currentContext.session) matches++;
    if (currentContext.session) total++;

    return total > 0 && matches / total >= 0.6;
  });

  if (matching.length < 3) {
    return {
      expectancy: "unknown",
      confidence: 10,
      message: "Few similar trades in history. Proceed with caution.",
      warnings: [],
      historicalWinRate: null,
      matchingTrades: matching.length,
    };
  }

  const wins = matching.filter((t) => t.outcome === "win").length;
  const winRate = (wins / matching.length) * 100;
  const avgPnl = matching.reduce((s, t) => s + (t.pnl ?? 0), 0) / matching.length;

  // Check behavioral flags correlation
  const flaggedLosses = closed.filter(
    (t) =>
      t.outcome === "loss" &&
      Array.isArray((t as any).behavioral_flags) &&
      (t as any).behavioral_flags.length > 0
  );
  if (flaggedLosses.length > closed.length * 0.3) {
    warnings.push("30%+ of your losses had behavioral flags — stay disciplined.");
  }

  // Check regime-specific warning
  if (currentContext.regime === "compression") {
    const compressionTrades = closed.filter((t) => t.market_context.regime === "compression");
    if (compressionTrades.length >= 3) {
      const compWins = compressionTrades.filter((t) => t.outcome === "win").length;
      const compWR = (compWins / compressionTrades.length) * 100;
      if (compWR < 40) {
        warnings.push(`You lose ${(100 - compWR).toFixed(0)}% in compression environments.`);
      }
    }
  }

  let expectancy: "positive" | "negative" | "neutral";
  let message: string;

  if (winRate >= 60 && avgPnl > 0) {
    expectancy = "positive";
    message = `Historically positive: ${winRate.toFixed(0)}% win rate across ${matching.length} similar setups.`;
  } else if (winRate <= 40 || avgPnl < 0) {
    expectancy = "negative";
    message = `⚠️ Historically negative: only ${winRate.toFixed(0)}% win rate in similar conditions.`;
  } else {
    expectancy = "neutral";
    message = `Mixed results: ${winRate.toFixed(0)}% win rate in similar conditions.`;
  }

  return {
    expectancy,
    confidence: Math.min(95, 20 + matching.length * 5),
    message,
    warnings,
    historicalWinRate: winRate,
    matchingTrades: matching.length,
  };
}

/* ──────────────────── Time-of-Day Clustering ──────────────────── */

export function clusterByTimeOfDay(trades: Trade[]): TimeCluster[] {
  const closed = trades.filter((t) => t.outcome && t.pnl != null);
  const buckets = new Map<number, Trade[]>();

  for (const t of closed) {
    const hour = (t as any).entry_hour ?? new Date(t.entry_time).getUTCHours();
    // Group into 4-hour blocks
    const block = Math.floor(hour / 4) * 4;
    if (!buckets.has(block)) buckets.set(block, []);
    buckets.get(block)!.push(t);
  }

  const labels: Record<number, string> = {
    0: "00-04 UTC",
    4: "04-08 UTC",
    8: "08-12 UTC",
    12: "12-16 UTC",
    16: "16-20 UTC",
    20: "20-00 UTC",
  };

  return Array.from(buckets.entries())
    .map(([hour, group]) => {
      const wins = group.filter((t) => t.outcome === "win").length;
      return {
        hour,
        label: labels[hour] || `${hour}-${hour + 4} UTC`,
        trades: group.length,
        winRate: group.length ? (wins / group.length) * 100 : 0,
        avgPnl: group.reduce((s, t) => s + (t.pnl ?? 0), 0) / group.length,
      };
    })
    .sort((a, b) => a.hour - b.hour);
}

/* ──────────────────── Edge Score ──────────────────── */

export function computeEdgeScore(
  trades: Trade[],
  previousScore: number = 50
): EdgeScoreBreakdown {
  const closed = trades.filter((t) => t.outcome && t.pnl != null);

  if (closed.length < 3) {
    return { overall: previousScore, discipline: 50, contextAwareness: 50, patternAdherence: 50, trend: "stable" };
  }

  // Discipline: % of trades without behavioral flags
  const flagged = closed.filter(
    (t) => Array.isArray((t as any).behavioral_flags) && (t as any).behavioral_flags.length > 0
  );
  const discipline = ((closed.length - flagged.length) / closed.length) * 100;

  // Context Awareness: win rate in favorable conditions (trending/expansion + aligned bias)
  const favorableTrades = closed.filter((t) => {
    const r = t.market_context.regime;
    const favorable = r === "trending" || r === "expansion";
    const aligned =
      (t.direction === "long" && t.market_context.bias_label?.toLowerCase().includes("bullish")) ||
      (t.direction === "short" && t.market_context.bias_label?.toLowerCase().includes("bearish"));
    return favorable && aligned;
  });
  const contextAwareness = favorableTrades.length >= 2
    ? (favorableTrades.filter((t) => t.outcome === "win").length / favorableTrades.length) * 100
    : 50;

  // Pattern Adherence: did user avoid bad conditions? 
  const badConditionTrades = closed.filter(
    (t) => t.market_context.regime === "compression" || (t as any).pre_trade_check_skipped
  );
  const patternAdherence = closed.length > 0
    ? ((closed.length - badConditionTrades.length) / closed.length) * 100
    : 50;

  const overall = Math.round(discipline * 0.35 + contextAwareness * 0.35 + patternAdherence * 0.3);

  // Trend: compare to previous
  const diff = overall - previousScore;
  const trend: "improving" | "declining" | "stable" =
    diff > 3 ? "improving" : diff < -3 ? "declining" : "stable";

  return { overall, discipline: Math.round(discipline), contextAwareness: Math.round(contextAwareness), patternAdherence: Math.round(patternAdherence), trend };
}

/* ──────────────────── Natural Language Insights ──────────────────── */

export function generateNLInsights(trades: Trade[]): BehavioralInsight[] {
  const closed = trades.filter((t) => t.outcome && t.pnl != null);
  if (closed.length < 5) return [];

  const insights: BehavioralInsight[] = [];

  // Regime insights
  const regimeGroups = new Map<string, Trade[]>();
  for (const t of closed) {
    const r = t.market_context.regime;
    if (!r) continue;
    if (!regimeGroups.has(r)) regimeGroups.set(r, []);
    regimeGroups.get(r)!.push(t);
  }

  for (const [regime, group] of regimeGroups) {
    if (group.length < 3) continue;
    const wins = group.filter((t) => t.outcome === "win").length;
    const wr = (wins / group.length) * 100;
    if (wr >= 65) {
      insights.push({
        id: `regime_${regime}_good`,
        message: `You win ${wr.toFixed(0)}% in ${regime} environments (${group.length} trades).`,
        type: "positive",
        confidence: Math.min(90, 40 + group.length * 5),
        tradeCount: group.length,
      });
    } else if (wr <= 35) {
      insights.push({
        id: `regime_${regime}_bad`,
        message: `You lose ${(100 - wr).toFixed(0)}% in ${regime} environments (${group.length} trades).`,
        type: "negative",
        confidence: Math.min(90, 40 + group.length * 5),
        tradeCount: group.length,
      });
    }
  }

  // Time-of-day insights
  const timeClusters = clusterByTimeOfDay(closed);
  for (const tc of timeClusters) {
    if (tc.trades < 3) continue;
    if (tc.winRate >= 65) {
      insights.push({
        id: `time_${tc.hour}_good`,
        message: `Your best window: ${tc.label} with ${tc.winRate.toFixed(0)}% win rate.`,
        type: "positive",
        confidence: Math.min(85, 30 + tc.trades * 5),
        tradeCount: tc.trades,
      });
    } else if (tc.winRate <= 35) {
      insights.push({
        id: `time_${tc.hour}_bad`,
        message: `Avoid ${tc.label} — only ${tc.winRate.toFixed(0)}% win rate across ${tc.trades} trades.`,
        type: "negative",
        confidence: Math.min(85, 30 + tc.trades * 5),
        tradeCount: tc.trades,
      });
    }
  }

  // Revenge trade insight
  const revengeTrades = closed.filter(
    (t) =>
      Array.isArray((t as any).behavioral_flags) &&
      (t as any).behavioral_flags.some((f: any) => (typeof f === "string" ? f : f?.type) === "revenge_trade")
  );
  if (revengeTrades.length >= 2) {
    const revengeLosses = revengeTrades.filter((t) => t.outcome === "loss").length;
    const lossRate = (revengeLosses / revengeTrades.length) * 100;
    if (lossRate > 50) {
      insights.push({
        id: "revenge_pattern",
        message: `Revenge trades cost you: ${lossRate.toFixed(0)}% loss rate on ${revengeTrades.length} revenge entries.`,
        type: "negative",
        confidence: Math.min(90, 50 + revengeTrades.length * 10),
        tradeCount: revengeTrades.length,
      });
    }
  }

  // Pre-trade check correlation
  const skippedCheck = closed.filter((t) => (t as any).pre_trade_check_skipped);
  const followedCheck = closed.filter((t) => !(t as any).pre_trade_check_skipped);
  if (skippedCheck.length >= 3 && followedCheck.length >= 3) {
    const skippedWR = (skippedCheck.filter((t) => t.outcome === "win").length / skippedCheck.length) * 100;
    const followedWR = (followedCheck.filter((t) => t.outcome === "win").length / followedCheck.length) * 100;
    const diff = followedWR - skippedWR;
    if (diff > 15) {
      insights.push({
        id: "pre_trade_check_impact",
        message: `Pre-Trade Check adds +${diff.toFixed(0)}% to your win rate. Don't skip it.`,
        type: "positive",
        confidence: Math.min(90, 40 + (skippedCheck.length + followedCheck.length) * 3),
        tradeCount: skippedCheck.length + followedCheck.length,
      });
    }
  }

  // Direction bias
  const longs = closed.filter((t) => t.direction === "long");
  const shorts = closed.filter((t) => t.direction === "short");
  if (longs.length >= 3 && shorts.length >= 3) {
    const longWR = (longs.filter((t) => t.outcome === "win").length / longs.length) * 100;
    const shortWR = (shorts.filter((t) => t.outcome === "win").length / shorts.length) * 100;
    if (Math.abs(longWR - shortWR) > 20) {
      const better = longWR > shortWR ? "long" : "short";
      const betterWR = Math.max(longWR, shortWR);
      insights.push({
        id: "direction_bias",
        message: `You're a better ${better} trader: ${betterWR.toFixed(0)}% win rate vs ${Math.min(longWR, shortWR).toFixed(0)}% the other way.`,
        type: "neutral",
        confidence: 70,
        tradeCount: longs.length + shorts.length,
      });
    }
  }

  // Sort by confidence
  insights.sort((a, b) => b.confidence - a.confidence);
  return insights.slice(0, 8);
}
