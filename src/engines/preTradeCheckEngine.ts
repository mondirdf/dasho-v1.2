/**
 * Pre-Trade Check Engine
 * Combines regime, confidence, volatility, sentiment, and distribution
 * into a single actionable checkpoint with risk posture assessment.
 *
 * Pure computation — no side effects, no API calls.
 */

import type { PersonalBiasResult, BiasLabel } from "./personalBiasEngine";
import type { VolatilityResult, VolatilityRegime } from "./volatilityRegimeEngine";
import type { SessionResult } from "./sessionEngine";

/* ──────────────────────────── Types ──────────────────────────── */

export type RiskPosture = "Defensive" | "Neutral" | "Opportunistic" | "Aggressive";

export interface PreTradeCheckResult {
  /** 2-line market context sentence */
  contextSummary: string;
  /** 2-line actionable implication */
  implicationSummary: string;
  /** Risk posture derived from all signals */
  riskPosture: RiskPosture;
  /** Checklist items with pass/fail status */
  checklist: ChecklistItem[];
  /** Number of checks passed */
  passedCount: number;
  /** Total checks */
  totalCount: number;
  /** Overall readiness 0-100 */
  readiness: number;
}

export interface ChecklistItem {
  label: string;
  description: string;
  passed: boolean | null; // null = unable to assess
}

/* ──────────────────────────── Inputs ──────────────────────────── */

export interface PreTradeInputs {
  bias?: PersonalBiasResult;
  volatility?: VolatilityResult;
  session?: SessionResult;
  fearGreed?: number; // 0-100
  hasRecentNews?: boolean; // any major news in last 12h
}

/* ──────────────────────────── Helpers ──────────────────────────── */

function biasAdj(label: BiasLabel): string {
  const map: Record<BiasLabel, string> = {
    "Strong Bullish": "Strong Bullish",
    "Bullish": "Bullish",
    "Neutral": "Neutral",
    "Bearish": "Bearish",
    "Strong Bearish": "Strong Bearish",
  };
  return map[label] ?? "Neutral";
}

function volatilityPhrase(regime: VolatilityRegime): string {
  const map: Record<VolatilityRegime, string> = {
    compression: "Low volatility compression phase",
    expansion: "High volatility expansion phase",
    trending: "Active trending phase",
    distribution: "Low volatility distribution phase",
  };
  return map[regime] ?? "Unknown volatility state";
}

function sentimentPhrase(fg: number): string {
  if (fg <= 20) return "Extreme Fear sentiment";
  if (fg <= 40) return "Fear sentiment";
  if (fg <= 60) return "Neutral sentiment";
  if (fg <= 80) return "Greed sentiment";
  return "Extreme Greed sentiment";
}

/* ──────────────────────────── Risk Posture ──────────────────────────── */

function computeRiskPosture(inputs: PreTradeInputs): RiskPosture {
  const { bias, volatility, fearGreed } = inputs;

  const biasScore = bias?.biasScore ?? 0;
  const confidence = bias?.confidence ?? 50;
  const regime = volatility?.regime ?? "distribution";
  const fg = fearGreed ?? 50;

  // Aggressive: strong bias + high confidence + trending + not extreme fear
  if (
    Math.abs(biasScore) > 0.5 &&
    confidence >= 65 &&
    regime === "trending" &&
    fg > 25
  ) {
    return "Aggressive";
  }

  // Opportunistic: moderate bias + decent confidence + not compression
  if (
    Math.abs(biasScore) > 0.2 &&
    confidence >= 50 &&
    regime !== "compression"
  ) {
    return "Opportunistic";
  }

  // Defensive: extreme fear OR high volatility expansion OR low confidence
  if (fg <= 20 || regime === "expansion" || confidence < 35) {
    return "Defensive";
  }

  return "Neutral";
}

/* ──────────────────────────── Checklist ──────────────────────────── */

function buildChecklist(inputs: PreTradeInputs): ChecklistItem[] {
  const { bias, volatility, fearGreed, hasRecentNews } = inputs;

  const items: ChecklistItem[] = [
    {
      label: "Trade aligned with regime?",
      description: bias
        ? `Market regime is ${biasAdj(bias.biasLabel)}. Ensure your trade direction matches.`
        : "No regime data available.",
      passed: bias ? Math.abs(bias.biasScore) > 0.15 : null,
    },
    {
      label: "Is volatility expanding or compressing?",
      description: volatility
        ? `Volatility is in ${volatility.regime} phase. ${
            volatility.regime === "compression"
              ? "Breakouts may be imminent."
              : volatility.regime === "expansion"
              ? "Moves may be overextended."
              : "Conditions favor continuation."
          }`
        : "No volatility data available.",
      passed: volatility
        ? volatility.regime === "trending" || volatility.regime === "compression"
        : null,
    },
    {
      label: "Any major news in last 12h?",
      description:
        hasRecentNews === true
          ? "Recent headlines detected. Factor in news risk before entry."
          : hasRecentNews === false
          ? "No major news detected. Lower event risk."
          : "Unable to assess news status.",
      passed: hasRecentNews === undefined ? null : !hasRecentNews,
    },
    {
      label: "Is confidence > 55%?",
      description: bias
        ? `Current confidence is ${bias.confidence}%. ${
            bias.confidence > 55
              ? "Sufficient signal alignment."
              : "Consider waiting for stronger confirmation."
          }`
        : "No confidence data available.",
      passed: bias ? bias.confidence > 55 : null,
    },
  ];

  return items;
}

/* ──────────────────────────── Main ──────────────────────────── */

export function computePreTradeCheck(inputs: PreTradeInputs): PreTradeCheckResult {
  const { bias, volatility, fearGreed } = inputs;

  // Context summary
  const biasText = bias
    ? `${biasAdj(bias.biasLabel)} (${bias.confidence}% confidence)`
    : "Unknown regime";
  const volText = volatility
    ? volatilityPhrase(volatility.regime)
    : "Unknown volatility";
  const contextSummary = `Market Context: ${biasText}. ${volText}.`;

  // Implication summary
  let implication: string;
  const regime = volatility?.regime ?? "distribution";
  const biasScore = bias?.biasScore ?? 0;
  const confidence = bias?.confidence ?? 50;

  if (regime === "compression") {
    implication =
      "Breakout conditions building. Wait for directional confirmation before committing. Tight stops recommended.";
  } else if (regime === "expansion") {
    implication =
      "High volatility — moves may overextend. Reduce position sizes and avoid chasing. Wait for pullback entries.";
  } else if (regime === "trending" && Math.abs(biasScore) > 0.4 && confidence > 55) {
    implication =
      "Trending conditions with aligned signals. Follow the regime direction. Trail stops to protect gains.";
  } else if (regime === "distribution") {
    implication =
      "Breakouts are unreliable. Short-term trades preferred. Avoid aggressive entries against the range.";
  } else {
    implication =
      "Mixed signals — exercise caution. Smaller positions and wider stops recommended until clarity improves.";
  }

  // Sentiment overlay
  if (fearGreed !== undefined && (fearGreed <= 15 || fearGreed >= 85)) {
    const extreme = fearGreed <= 15 ? "Extreme Fear" : "Extreme Greed";
    implication += ` ${extreme} detected — contrarian caution advised.`;
  }

  const riskPosture = computeRiskPosture(inputs);
  const checklist = buildChecklist(inputs);
  const passedCount = checklist.filter((c) => c.passed === true).length;
  const totalCount = checklist.filter((c) => c.passed !== null).length;
  const readiness = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return {
    contextSummary,
    implicationSummary: implication,
    riskPosture,
    checklist,
    passedCount,
    totalCount,
    readiness,
  };
}
