/**
 * Personal Bias Engine
 * Aggregates outputs from active widget-related engines into a single
 * directional bias with confidence and risk assessment.
 *
 * Pure computation — no side effects, no API calls, no trading recommendations.
 */

import type { MarketStructureResult, Bias } from "./marketStructureEngine";
import type { VolatilityResult, VolatilityRegime } from "./volatilityRegimeEngine";
import type { ConfluenceResult } from "./mtfConfluenceEngine";
import type { SessionResult } from "./sessionEngine";

/* ──────────────────────────── Types ──────────────────────────── */

export type BiasLabel =
  | "Strong Bullish"
  | "Bullish"
  | "Neutral"
  | "Bearish"
  | "Strong Bearish";

export type RiskLevel = "Low" | "Moderate" | "High" | "Elevated";

export interface PersonalBiasResult {
  biasLabel: BiasLabel;
  /** -1 (strong bearish) → +1 (strong bullish) */
  biasScore: number;
  /** 0–100 */
  confidence: number;
  riskLevel: RiskLevel;
  contributingEngines: string[];
  missingEngines: string[];
}

/** All possible engine outputs the bias engine can consume */
export interface EngineOutputs {
  structure?: MarketStructureResult;
  volatility?: VolatilityResult;
  confluence?: ConfluenceResult;
  session?: SessionResult;
  /** Correlation average absolute value 0-1 (pre-computed externally) */
  correlationRisk?: number;
}

/* ──────────────────────────── Widget → Engine mapping ──────────────────────────── */

const WIDGET_ENGINE_MAP: Record<string, keyof EngineOutputs> = {
  structure_scanner: "structure",
  volatility_regime: "volatility",
  mtf_confluence: "confluence",
  session_monitor: "session",
  correlation_matrix: "correlationRisk",
};

const ENGINE_LABELS: Record<keyof EngineOutputs, string> = {
  structure: "Market Structure",
  volatility: "Volatility Regime",
  confluence: "MTF Confluence",
  session: "Session Engine",
  correlationRisk: "Correlation Matrix",
};

const ALL_ENGINE_KEYS = Object.values(WIDGET_ENGINE_MAP);

/* ──────────────────────────── Score Extraction ──────────────────────────── */

function biasToScore(bias: Bias): number {
  if (bias === "bullish") return 1;
  if (bias === "bearish") return -1;
  return 0;
}

function structureScore(r: MarketStructureResult): number {
  return biasToScore(r.currentBias);
}

function confluenceScore(r: ConfluenceResult): number {
  const raw = biasToScore(r.dominantBias);
  // Scale by alignment ratio
  const alignment = r.totalCount > 0 ? r.alignedCount / r.totalCount : 0;
  return raw * alignment;
}

function volatilityScore(r: VolatilityResult): number {
  // Trending = directional bias exists, compression/distribution = neutral
  if (r.regime === "trending") return 0.3; // slight positive — trend continuation assumed
  if (r.regime === "expansion") return 0;
  return 0; // compression / distribution = no directional signal
}

function sessionActivityWeight(r: SessionResult): number {
  // Active killzone → higher confidence multiplier
  if (r.activeKillzones.length > 0) return 1.15;
  if (r.activeSessions.length >= 2) return 1.05; // overlap
  if (r.activeSessions.length === 1) return 1.0;
  return 0.85; // no session = lower confidence
}

/* ──────────────────────────── Weighting & Adjustments ──────────────────────────── */

function volatilityConfidencePenalty(regime: VolatilityRegime): number {
  // High volatility → reduce confidence
  if (regime === "expansion") return -15;
  if (regime === "distribution") return -5;
  return 0;
}

function correlationRiskPenalty(risk: number): number {
  // High average correlation → reduced diversification → lower confidence
  if (risk > 0.8) return -20;
  if (risk > 0.6) return -10;
  return 0;
}

/* ──────────────────────────── Main Computation ──────────────────────────── */

export function computePersonalBias(
  activeWidgets: string[],
  outputs: EngineOutputs,
): PersonalBiasResult {
  // Step A: determine which engines are active based on widgets
  const activeEngineKeys = new Set<keyof EngineOutputs>();
  for (const wt of activeWidgets) {
    const key = WIDGET_ENGINE_MAP[wt];
    if (key && outputs[key] !== undefined) {
      activeEngineKeys.add(key);
    }
  }

  const contributingEngines = Array.from(activeEngineKeys).map(
    (k) => ENGINE_LABELS[k],
  );
  const missingEngines = ALL_ENGINE_KEYS
    .filter((k) => !activeEngineKeys.has(k))
    .map((k) => ENGINE_LABELS[k]);

  // Step B & C: accumulate weighted scores
  let totalScore = 0;
  let totalWeight = 0;
  let confidenceBase = 60; // base confidence

  // Structure
  if (activeEngineKeys.has("structure") && outputs.structure) {
    const s = structureScore(outputs.structure);
    const weight = 1.0;
    totalScore += s * weight;
    totalWeight += weight;
  }

  // Confluence — highest weight for alignment
  if (activeEngineKeys.has("confluence") && outputs.confluence) {
    const s = confluenceScore(outputs.confluence);
    const weight = 1.5; // MTF alignment increases confidence weight
    totalScore += s * weight;
    totalWeight += weight;
    // Boost confidence if confluence is high
    confidenceBase += Math.round(outputs.confluence.confluenceScore * 0.2);
  }

  // Volatility — directional contribution is minor, but adjusts confidence
  if (activeEngineKeys.has("volatility") && outputs.volatility) {
    const s = volatilityScore(outputs.volatility);
    const weight = 0.5;
    totalScore += s * weight;
    totalWeight += weight;
    confidenceBase += volatilityConfidencePenalty(outputs.volatility.regime);
  }

  // Session — modifies confidence, not direction
  if (activeEngineKeys.has("session") && outputs.session) {
    const mult = sessionActivityWeight(outputs.session);
    confidenceBase = Math.round(confidenceBase * mult);
  }

  // Correlation risk — penalty only
  if (activeEngineKeys.has("correlationRisk") && outputs.correlationRisk !== undefined) {
    confidenceBase += correlationRiskPenalty(outputs.correlationRisk);
  }

  // Step D: compute final scores
  const finalBiasScore =
    totalWeight > 0
      ? Math.max(-1, Math.min(1, totalScore / totalWeight))
      : 0;

  let confidence = Math.max(0, Math.min(100, confidenceBase));

  // Rule 6: fewer than 2 engines → cap confidence
  if (activeEngineKeys.size < 2) {
    confidence = Math.min(confidence, 40);
  }

  // Risk level
  let riskLevel: RiskLevel;
  if (activeEngineKeys.size < 2) {
    riskLevel = "Elevated";
  } else if (confidence >= 70 && Math.abs(finalBiasScore) > 0.5) {
    riskLevel = "Low";
  } else if (confidence >= 45) {
    riskLevel = "Moderate";
  } else {
    riskLevel = "High";
  }

  // Bias label
  let biasLabel: BiasLabel;
  if (finalBiasScore >= 0.6) biasLabel = "Strong Bullish";
  else if (finalBiasScore >= 0.2) biasLabel = "Bullish";
  else if (finalBiasScore <= -0.6) biasLabel = "Strong Bearish";
  else if (finalBiasScore <= -0.2) biasLabel = "Bearish";
  else biasLabel = "Neutral";

  return {
    biasLabel,
    biasScore: Math.round(finalBiasScore * 100) / 100,
    confidence: Math.round(confidence),
    riskLevel,
    contributingEngines,
    missingEngines,
  };
}
