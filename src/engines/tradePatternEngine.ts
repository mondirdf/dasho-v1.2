/**
 * Trade Pattern Detection Engine
 * Analyzes historical trades to find win/loss patterns correlated with market conditions.
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
}

export interface MarketContextSnapshot {
  regime?: string;        // compression | expansion | trending | distribution
  volatility_score?: number;
  bias_label?: string;    // Strong Bullish → Strong Bearish
  bias_score?: number;
  fear_greed?: number;
  session?: string;       // Asian | London | New York | Off
  confidence?: number;
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
  avgHoldTime: number; // hours
}

export interface PatternAnalysis {
  stats: TradeStats;
  insights: PatternInsight[];
  bestConditions: PatternInsight[];
  worstConditions: PatternInsight[];
}

/* ──────────────────── Stats ──────────────────── */

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

  // Average hold time in hours
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
    if (group.length < 2) continue; // need at least 2 trades for pattern

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
    // By regime
    ...analyzeByCondition(trades, (t) => t.market_context.regime, "Regime"),
    // By session
    ...analyzeByCondition(trades, (t) => t.market_context.session, "Session"),
    // By bias
    ...analyzeByCondition(trades, (t) => t.market_context.bias_label, "Bias"),
    // By direction
    ...analyzeByCondition(trades, (t) => t.direction, "Direction"),
    // By symbol
    ...analyzeByCondition(trades, (t) => t.symbol, "Symbol"),
    // By fear/greed zone
    ...analyzeByCondition(trades, (t) => {
      const fg = t.market_context.fear_greed;
      if (fg == null) return undefined;
      if (fg <= 25) return "Extreme Fear";
      if (fg <= 45) return "Fear";
      if (fg <= 55) return "Neutral";
      if (fg <= 75) return "Greed";
      return "Extreme Greed";
    }, "Sentiment"),
  ];

  // Sort by significance (trade count * deviation from 50%)
  allInsights.sort((a, b) => {
    const sigA = a.tradeCount * Math.abs(a.winRate - 50);
    const sigB = b.tradeCount * Math.abs(b.winRate - 50);
    return sigB - sigA;
  });

  const bestConditions = allInsights
    .filter((i) => i.type === "positive")
    .slice(0, 5);

  const worstConditions = allInsights
    .filter((i) => i.type === "negative")
    .slice(0, 5);

  return {
    stats,
    insights: allInsights.slice(0, 10),
    bestConditions,
    worstConditions,
  };
}
