/**
 * Early Insight Engine — "Low Confidence Insight Engine"
 * Generates probabilistic behavioral insights after just 3 trades
 * using heuristic pattern detection instead of strict statistical thresholds.
 * 
 * Pure computation — no side effects.
 */

import type { Trade } from "./tradePatternEngine";

/* ──────────────────── Types ──────────────────── */

export interface EarlyInsight {
  id: string;
  pattern: string;
  message: string;
  type: "positive" | "negative" | "neutral";
  confidence: number; // 0-100
  tradeCount: number;
  isEarly: boolean; // always true when < 20 trades
  improvementHint: string;
}

export interface EarlyInsightResult {
  insights: EarlyInsight[];
  totalTrades: number;
  maturityLevel: "early" | "developing" | "mature";
  maturityPercent: number; // 0-100 progress toward mature
}

/* ──────────────────── Heuristic Detectors ──────────────────── */

function detectLateBreakoutPattern(closed: Trade[]): EarlyInsight | null {
  const expansionTrades = closed.filter(
    (t) => t.market_context.regime === "expansion"
  );
  if (expansionTrades.length < 1) return null;

  const losses = expansionTrades.filter((t) => t.outcome === "loss").length;
  const lossRate = expansionTrades.length > 0 ? (losses / expansionTrades.length) * 100 : 0;

  if (lossRate > 50 || (expansionTrades.length >= 2 && losses >= 2)) {
    return {
      id: "early_late_breakout",
      pattern: "Late Breakout Entry",
      message: `You entered ${expansionTrades.length} trade${expansionTrades.length > 1 ? "s" : ""} during expansion — ${losses} resulted in losses.`,
      type: "negative",
      confidence: Math.min(65, 25 + expansionTrades.length * 12),
      tradeCount: expansionTrades.length,
      isEarly: true,
      improvementHint: "Wait for pullback entries instead of chasing moves.",
    };
  }
  return null;
}

function detectCompressionTrading(closed: Trade[]): EarlyInsight | null {
  const compressionTrades = closed.filter(
    (t) => t.market_context.regime === "compression"
  );
  if (compressionTrades.length < 1) return null;

  const losses = compressionTrades.filter((t) => t.outcome === "loss").length;
  const lossRate = compressionTrades.length > 0 ? (losses / compressionTrades.length) * 100 : 0;

  if (lossRate >= 50) {
    return {
      id: "early_compression_trading",
      pattern: "Compression Trading",
      message: `Trading in compression has ${lossRate.toFixed(0)}% loss rate across ${compressionTrades.length} trades.`,
      type: "negative",
      confidence: Math.min(60, 20 + compressionTrades.length * 10),
      tradeCount: compressionTrades.length,
      isEarly: true,
      improvementHint: "Avoid entries during low-volatility compression — wait for breakout confirmation.",
    };
  }
  return null;
}

function detectOvertradingAfterLoss(closed: Trade[]): EarlyInsight | null {
  let revengeCount = 0;
  let revengeLosses = 0;

  for (let i = 1; i < closed.length; i++) {
    const prev = closed[i - 1];
    const curr = closed[i];
    if (prev.outcome === "loss" && prev.exit_time && curr.entry_time) {
      const gap = new Date(curr.entry_time).getTime() - new Date(prev.exit_time).getTime();
      if (gap < 60 * 60 * 1000) { // within 1 hour
        revengeCount++;
        if (curr.outcome === "loss") revengeLosses++;
      }
    }
  }

  if (revengeCount >= 1) {
    return {
      id: "early_overtrading",
      pattern: "Overtrading After Loss",
      message: `${revengeCount} trade${revengeCount > 1 ? "s" : ""} entered within 1h of a loss — ${revengeLosses} also lost.`,
      type: "negative",
      confidence: Math.min(60, 25 + revengeCount * 15),
      tradeCount: revengeCount,
      isEarly: true,
      improvementHint: "Take a break after losses. Wait at least 1 hour before re-entering.",
    };
  }
  return null;
}

function detectPreTradeCheckImpact(closed: Trade[]): EarlyInsight | null {
  const skipped = closed.filter((t) => (t as any).pre_trade_check_skipped);
  const followed = closed.filter((t) => !(t as any).pre_trade_check_skipped);

  if (skipped.length < 1 || followed.length < 1) return null;

  const skippedWR = skipped.length > 0
    ? (skipped.filter((t) => t.outcome === "win").length / skipped.length) * 100
    : 0;
  const followedWR = followed.length > 0
    ? (followed.filter((t) => t.outcome === "win").length / followed.length) * 100
    : 0;

  if (followedWR > skippedWR) {
    return {
      id: "early_pretrade_impact",
      pattern: "Pre-Trade Check Impact",
      message: `Pre-Trade Check trades win ${followedWR.toFixed(0)}% vs ${skippedWR.toFixed(0)}% when skipped.`,
      type: "positive",
      confidence: Math.min(55, 20 + (skipped.length + followed.length) * 8),
      tradeCount: skipped.length + followed.length,
      isEarly: true,
      improvementHint: "Keep using Pre-Trade Check — your data shows it helps.",
    };
  }
  return null;
}

function detectDirectionStrength(closed: Trade[]): EarlyInsight | null {
  const longs = closed.filter((t) => t.direction === "long");
  const shorts = closed.filter((t) => t.direction === "short");

  if (longs.length < 2 && shorts.length < 2) return null;

  const longWR = longs.length > 0
    ? (longs.filter((t) => t.outcome === "win").length / longs.length) * 100
    : 0;
  const shortWR = shorts.length > 0
    ? (shorts.filter((t) => t.outcome === "win").length / shorts.length) * 100
    : 0;

  if (Math.abs(longWR - shortWR) > 25 && (longs.length + shorts.length >= 3)) {
    const better = longWR > shortWR ? "long" : "short";
    const betterWR = Math.max(longWR, shortWR);
    return {
      id: "early_direction_bias",
      pattern: "Direction Preference",
      message: `${better === "long" ? "Long" : "Short"} trades winning at ${betterWR.toFixed(0)}% — early directional edge detected.`,
      type: "positive",
      confidence: Math.min(50, 20 + (longs.length + shorts.length) * 7),
      tradeCount: longs.length + shorts.length,
      isEarly: true,
      improvementHint: `Consider focusing on ${better} setups while building more data.`,
    };
  }
  return null;
}

function detectSessionPerformance(closed: Trade[]): EarlyInsight | null {
  const sessionGroups = new Map<string, { wins: number; total: number }>();

  for (const t of closed) {
    const session = t.market_context.session;
    if (!session) continue;
    const g = sessionGroups.get(session) || { wins: 0, total: 0 };
    g.total++;
    if (t.outcome === "win") g.wins++;
    sessionGroups.set(session, g);
  }

  let bestSession = "";
  let bestWR = 0;
  let bestCount = 0;

  for (const [session, g] of sessionGroups) {
    if (g.total < 2) continue;
    const wr = (g.wins / g.total) * 100;
    if (wr > bestWR) {
      bestSession = session;
      bestWR = wr;
      bestCount = g.total;
    }
  }

  if (bestSession && bestWR >= 60) {
    return {
      id: "early_session_edge",
      pattern: "Session Preference",
      message: `Best results during ${bestSession} session — ${bestWR.toFixed(0)}% win rate (${bestCount} trades).`,
      type: "positive",
      confidence: Math.min(50, 20 + bestCount * 10),
      tradeCount: bestCount,
      isEarly: true,
      improvementHint: `Focus your trading during ${bestSession} sessions.`,
    };
  }
  return null;
}

/* ──────────────────── Main ──────────────────── */

export function generateEarlyInsights(trades: Trade[]): EarlyInsightResult {
  const closed = trades
    .filter((t) => t.outcome && t.pnl != null)
    .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime());

  const totalTrades = closed.length;
  const maturityLevel: "early" | "developing" | "mature" =
    totalTrades < 10 ? "early" : totalTrades < 20 ? "developing" : "mature";
  const maturityPercent = Math.min(100, Math.round((totalTrades / 20) * 100));

  if (totalTrades < 3) {
    return { insights: [], totalTrades, maturityLevel, maturityPercent };
  }

  const detectors = [
    detectLateBreakoutPattern,
    detectCompressionTrading,
    detectOvertradingAfterLoss,
    detectPreTradeCheckImpact,
    detectDirectionStrength,
    detectSessionPerformance,
  ];

  const insights: EarlyInsight[] = [];
  for (const detector of detectors) {
    const result = detector(closed);
    if (result) insights.push(result);
  }

  // Sort by confidence descending
  insights.sort((a, b) => b.confidence - a.confidence);
  return { insights: insights.slice(0, 6), totalTrades, maturityLevel, maturityPercent };
}
