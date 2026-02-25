/**
 * Trade Pattern Detection Engine (v2)
 * Analyzes historical trades to find win/loss patterns correlated with market conditions.
 * Includes time-of-day clustering, behavioral flag analysis, and NL insights.
 * Pure computation — no side effects.
 */

export interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  outcome: string | null;
  entry_time: string;
  exit_time: string | null;
  market_context: MarketContextSnapshot;
  tags: string[];
  pre_trade_check_skipped?: boolean;
  behavioral_flags?: any[];
  entry_hour?: number;
  rule_violations?: string[];
}

export interface MarketContextSnapshot {
  regime?: string;
  volatility_score?: number;
  bias_label?: string;
  bias_score?: number;
  fear_greed?: number;
  session?: string;
  confidence?: number;
  news_intensity?: string;
}

export interface PatternInsight {
  label: string;
  description: string;
  winRate: number;
  tradeCount: number;
  avgPnl: number;
  type: "positive" | "negative" | "neutral";
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalPnl: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldTime: number;
  longestWinStreak: number;
  longestLoseStreak: number;
}

export interface PatternAnalysis {
  stats: TradeStats;
  insights: PatternInsight[];
  bestConditions: PatternInsight[];
  worstConditions: PatternInsight[];
}

/* ──────────────────── Stats ──────────────────── */

function computeStreaks(trades: Trade[]): { winStreak: number; loseStreak: number } {
  let maxWin = 0, maxLose = 0, curWin = 0, curLose = 0;
  const sorted = [...trades]
    .filter((t) => t.outcome)
    .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime());
  for (const t of sorted) {
    if (t.outcome === "win") { curWin++; curLose = 0; maxWin = Math.max(maxWin, curWin); }
    else if (t.outcome === "loss") { curLose++; curWin = 0; maxLose = Math.max(maxLose, curLose); }
    else { curWin = 0; curLose = 0; }
  }
  return { winStreak: maxWin, loseStreak: maxLose };
}

function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter((t) => t.outcome && t.pnl != null);
  const wins = closed.filter((t) => t.outcome === "win");
  const losses = closed.filter((t) => t.outcome === "loss");
  const breakevens = closed.filter((t) => t.outcome === "breakeven");

  const winPnls = wins.map((t) => t.pnl!);
  const lossPnls = losses.map((t) => Math.abs(t.pnl!));

  const avgWin = winPnls.length ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0;

  const totalWin = winPnls.reduce((a, b) => a + b, 0);
  const totalLoss = lossPnls.reduce((a, b) => a + b, 0);

  let avgHoldTime = 0;
  const withExit = closed.filter((t) => t.exit_time);
  if (withExit.length) {
    const totalHours = withExit.reduce((sum, t) => {
      const diff = new Date(t.exit_time!).getTime() - new Date(t.entry_time).getTime();
      return sum + diff / (1000 * 60 * 60);
    }, 0);
    avgHoldTime = totalHours / withExit.length;
  }

  const allPnls = closed.map((t) => t.pnl!);
  const { winStreak, loseStreak } = computeStreaks(closed);

  return {
    totalTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    avgWin,
    avgLoss,
    profitFactor: totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Infinity : 0,
    totalPnl: allPnls.reduce((a, b) => a + b, 0),
    bestTrade: allPnls.length ? Math.max(...allPnls) : 0,
    worstTrade: allPnls.length ? Math.min(...allPnls) : 0,
    avgHoldTime,
    longestWinStreak: winStreak,
    longestLoseStreak: loseStreak,
  };
}

/* ──────────────────── Pattern Detection ──────────────────── */

function analyzeByCondition(
  trades: Trade[],
  extractor: (t: Trade) => string | undefined,
  conditionLabel: string
): PatternInsight[] {
  const groups = new Map<string, Trade[]>();

  for (const t of trades) {
    if (!t.outcome || t.pnl == null) continue;
    const key = extractor(t);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const insights: PatternInsight[] = [];

  for (const [value, group] of groups) {
    if (group.length < 2) continue;

    const wins = group.filter((t) => t.outcome === "win").length;
    const winRate = (wins / group.length) * 100;
    const avgPnl = group.reduce((s, t) => s + (t.pnl ?? 0), 0) / group.length;

    insights.push({
      label: `${conditionLabel}: ${value}`,
      description: `${group.length} trades in ${value} — ${winRate.toFixed(0)}% win rate`,
      winRate,
      tradeCount: group.length,
      avgPnl,
      type: winRate >= 60 ? "positive" : winRate <= 40 ? "negative" : "neutral",
    });
  }

  return insights;
}

/* ──────────────────── Main ──────────────────── */

export function analyzeTradePatterns(trades: Trade[]): PatternAnalysis {
  const stats = computeStats(trades);

  const allInsights: PatternInsight[] = [
    ...analyzeByCondition(trades, (t) => t.market_context.regime, "Regime"),
    ...analyzeByCondition(trades, (t) => t.market_context.session, "Session"),
    ...analyzeByCondition(trades, (t) => t.market_context.bias_label, "Bias"),
    ...analyzeByCondition(trades, (t) => t.direction, "Direction"),
    ...analyzeByCondition(trades, (t) => t.symbol, "Symbol"),
    // Time of day
    ...analyzeByCondition(trades, (t) => {
      const hour = t.entry_hour ?? new Date(t.entry_time).getUTCHours();
      const block = Math.floor(hour / 4) * 4;
      const labels: Record<number, string> = { 0: "00-04 UTC", 4: "04-08 UTC", 8: "08-12 UTC", 12: "12-16 UTC", 16: "16-20 UTC", 20: "20-00 UTC" };
      return labels[block];
    }, "Time"),
    // Sentiment zone
    ...analyzeByCondition(trades, (t) => {
      const fg = t.market_context.fear_greed;
      if (fg == null) return undefined;
      if (fg <= 25) return "Extreme Fear";
      if (fg <= 45) return "Fear";
      if (fg <= 55) return "Neutral";
      if (fg <= 75) return "Greed";
      return "Extreme Greed";
    }, "Sentiment"),
    // Pre-trade check skipped vs followed
    ...analyzeByCondition(trades, (t) => {
      if (t.pre_trade_check_skipped === undefined) return undefined;
      return t.pre_trade_check_skipped ? "Check Skipped" : "Check Followed";
    }, "Discipline"),
    // Behavioral flags
    ...analyzeByCondition(trades, (t) => {
      if (!Array.isArray(t.behavioral_flags) || t.behavioral_flags.length === 0) return "Clean Entry";
      const flagTypes = t.behavioral_flags.map((f: any) => typeof f === "string" ? f : f?.type || "unknown");
      return flagTypes[0]; // primary flag
    }, "Behavior"),
  ];

  allInsights.sort((a, b) => {
    const sigA = a.tradeCount * Math.abs(a.winRate - 50);
    const sigB = b.tradeCount * Math.abs(b.winRate - 50);
    return sigB - sigA;
  });

  return {
    stats,
    insights: allInsights.slice(0, 12),
    bestConditions: allInsights.filter((i) => i.type === "positive").slice(0, 5),
    worstConditions: allInsights.filter((i) => i.type === "negative").slice(0, 5),
  };
}
