/**
 * Onboarding Template Engine
 *
 * Deterministic mapping from user preferences to a dashboard template.
 * No AI inference, no randomness — pure config lookup.
 */

export interface OnboardingInput {
  trading_style: string | null;
  preferred_assets: string | null;
  priority_focus: string | null;
  experience_level: string | null;
}

export interface WidgetSpec {
  type: string;
}

export interface OnboardingTemplate {
  dashboardName: string;
  widgets: WidgetSpec[];
}

/* ── Base widget bundles by trading style ── */

const STYLE_BUNDLES: Record<string, string[]> = {
  scalper: [
    "crypto_price", "structure_scanner", "volatility_regime",
    "session_monitor", "mtf_confluence", "fear_greed",
  ],
  intraday: [
    "crypto_price", "multi_tracker", "structure_scanner",
    "session_monitor", "news", "fear_greed",
  ],
  swing: [
    "multi_tracker", "market_recap", "market_context",
    "mtf_confluence", "volatility_regime", "daily_brief",
  ],
  long_term: [
    "multi_tracker", "market_context", "market_recap",
    "news", "macro_news", "global_indices",
  ],
};

/* ── Asset overlays — add/swap widgets based on preferred asset class ── */

const ASSET_OVERLAYS: Record<string, string[]> = {
  crypto: ["crypto_price", "fear_greed"],
  stocks: ["stock_tracker", "global_indices"],
  forex: ["forex_rates"],
  mixed: ["crypto_price", "stock_tracker", "forex_rates", "global_indices"],
};

/* ── Focus overlays — boost widgets tied to priority ── */

const FOCUS_OVERLAYS: Record<string, string[]> = {
  trend_direction: ["structure_scanner", "mtf_confluence"],
  entry_signals: ["structure_scanner", "session_monitor", "volatility_regime"],
  volatility: ["volatility_regime", "fear_greed"],
  macro_context: ["macro_news", "daily_brief", "market_context"],
};

/* ── Experience caps ── */

const MAX_WIDGETS: Record<string, number> = {
  beginner: 4,
  intermediate: 6,
  advanced: 8,
};

/* ── Advanced-only widgets (hidden from beginners) ── */

const ADVANCED_WIDGETS = new Set([
  "structure_scanner", "mtf_confluence", "volatility_regime",
  "backtester", "correlation_matrix",
]);

/* ── Dashboard name generator ── */

function buildName(input: OnboardingInput): string {
  const style = input.trading_style ?? "trading";
  const asset = input.preferred_assets ?? "market";
  const label = style.charAt(0).toUpperCase() + style.slice(1);
  const assetLabel = asset.charAt(0).toUpperCase() + asset.slice(1);
  return `${label} ${assetLabel} Dashboard`;
}

/* ── Main engine ── */

export function generateTemplate(input: OnboardingInput): OnboardingTemplate {
  const style = input.trading_style ?? "swing";
  const asset = input.preferred_assets ?? "crypto";
  const focus = input.priority_focus ?? "trend_direction";
  const level = input.experience_level ?? "intermediate";

  // 1. Start with style bundle
  const pool = new Set<string>(STYLE_BUNDLES[style] ?? STYLE_BUNDLES.swing);

  // 2. Merge asset overlay
  for (const w of ASSET_OVERLAYS[asset] ?? ASSET_OVERLAYS.crypto) {
    pool.add(w);
  }

  // 3. Merge focus overlay
  for (const w of FOCUS_OVERLAYS[focus] ?? FOCUS_OVERLAYS.trend_direction) {
    pool.add(w);
  }

  // 4. Filter by experience
  let widgets = [...pool];
  if (level === "beginner") {
    widgets = widgets.filter((w) => !ADVANCED_WIDGETS.has(w));
  }

  // 5. Cap count
  const max = MAX_WIDGETS[level] ?? 6;
  widgets = widgets.slice(0, max);

  return {
    dashboardName: buildName(input),
    widgets: widgets.map((type) => ({ type })),
  };
}

/* ── Default minimal template (for skip) ── */

export function generateDefaultTemplate(): OnboardingTemplate {
  return {
    dashboardName: "My Dashboard",
    widgets: [
      { type: "crypto_price" },
      { type: "multi_tracker" },
      { type: "news" },
      { type: "fear_greed" },
    ],
  };
}
