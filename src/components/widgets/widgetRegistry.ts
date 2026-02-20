/**
 * Widget Registry — Single source of truth for all widget definitions.
 *
 * Each widget entry contains:
 * - meta: display info (label, icon, category, description)
 * - visual: styling presets applied by WidgetContainer (NOT by the widget itself)
 * - configFields: per-widget settings for WidgetSettingsModal
 *
 * Widget components MUST only render content — no container styling.
 * All backgrounds, borders, shadows, animations, and decorations
 * are handled exclusively by WidgetContainer using this registry.
 *
 * @see WIDGET_GUIDE.md for how to add new widgets.
 */

import type { LucideIcon } from "lucide-react";
import {
  LineChart, BarChart3, Gauge, Globe, Newspaper,
  TrendingUp, Cloud, Gamepad2, Clock, Lock,
} from "lucide-react";

/* ──────────────────────────── Visual Presets ──────────────────────────── */

/** Background style presets */
export const BG_PRESETS = {
  glass: "glass",
  solid: "solid",
  gradient: "gradient",
  subtle: "subtle",
} as const;
export type BgPreset = keyof typeof BG_PRESETS;

/** Animation presets */
export const ANIMATION_PRESETS = {
  none: "none",
  fadeIn: "fadeIn",
  slideUp: "slideUp",
  pulse: "pulse",
} as const;
export type AnimationPreset = keyof typeof ANIMATION_PRESETS;

/** Shadow level presets */
export const SHADOW_PRESETS = {
  none: "none",
  sm: "sm",
  md: "md",
  lg: "lg",
  glow: "glow",
} as const;
export type ShadowPreset = keyof typeof SHADOW_PRESETS;

/** Layout variant presets */
export const LAYOUT_PRESETS = {
  default: "default",
  compact: "compact",
  padded: "padded",
  fullbleed: "fullbleed",
} as const;
export type LayoutPreset = keyof typeof LAYOUT_PRESETS;

/* ──────────────────────────── Types ──────────────────────────── */

export interface WidgetVisual {
  bg: BgPreset;
  shadow: ShadowPreset;
  layout: LayoutPreset;
  animation: AnimationPreset;
  accentHsl?: string;
  decorative?: boolean;
  hoverLift?: boolean;
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "toggle" | "select";
  options?: { label: string; value: string }[];
  defaultValue?: any;
  placeholder?: string;
}

export interface WidgetConstraints {
  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
}

export interface WidgetRegistryEntry {
  type: string;
  category: string;
  assetType: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  iconColor: string;
  available: boolean;
  visual: WidgetVisual;
  defaultSize: { w: number; h: number };
  constraints: WidgetConstraints;
  configFields: ConfigField[];
}

/* ──────────────────────────── Supported coins ──────────────────────────── */

import { COIN_OPTIONS as COINS_FROM_CONFIG, WIDGET_CONFIG_FIELDS } from "@/config/site";
const COIN_OPTIONS = [...COINS_FROM_CONFIG];

/* ──────────────────────────── Registry ──────────────────────────── */

export const WIDGET_REGISTRY: WidgetRegistryEntry[] = [
  // ── Crypto Price ──
  {
    type: "crypto_price",
    category: "crypto",
    assetType: "crypto",
    label: "Price Tracker",
    desc: "Single coin price tracker with sparkline",
    icon: LineChart,
    iconColor: "text-primary",
    available: true,
    visual: {
      bg: "glass", shadow: "md", layout: "default", animation: "fadeIn",
      accentHsl: "263 70% 60%", decorative: true, hoverLift: true,
    },
    defaultSize: { w: 4, h: 3 },
    constraints: { minW: 3, minH: 2, maxW: 8, maxH: 6 },
    configFields: WIDGET_CONFIG_FIELDS.crypto_price || [],
  },
  // ── Multi Tracker ──
  {
    type: "multi_tracker",
    category: "crypto",
    assetType: "crypto",
    label: "Multi Tracker",
    desc: "Track multiple coins at once",
    icon: BarChart3,
    iconColor: "text-accent",
    available: true,
    visual: {
      bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true,
    },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 12, maxH: 8 },
    configFields: WIDGET_CONFIG_FIELDS.multi_tracker || [],
  },
  // ── Fear & Greed ──
  {
    type: "fear_greed",
    category: "crypto",
    assetType: "crypto",
    label: "Fear & Greed",
    desc: "Market sentiment index gauge",
    icon: Gauge,
    iconColor: "text-success",
    available: true,
    visual: {
      bg: "glass", shadow: "md", layout: "default", animation: "fadeIn",
      decorative: true, hoverLift: true,
    },
    defaultSize: { w: 3, h: 3 },
    constraints: { minW: 2, minH: 2, maxW: 6, maxH: 5 },
    configFields: WIDGET_CONFIG_FIELDS.fear_greed || [],
  },
  // ── Market Context ──
  {
    type: "market_context",
    category: "crypto",
    assetType: "crypto",
    label: "Market Context",
    desc: "Overall market statistics",
    icon: Globe,
    iconColor: "text-primary",
    available: true,
    visual: {
      bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true,
    },
    defaultSize: { w: 4, h: 3 },
    constraints: { minW: 3, minH: 2, maxW: 8, maxH: 5 },
    configFields: WIDGET_CONFIG_FIELDS.market_context || [],
  },
  // ── News ──
  {
    type: "news",
    category: "news",
    assetType: "crypto",
    label: "News Feed",
    desc: "Latest market news articles",
    icon: Newspaper,
    iconColor: "text-warning",
    available: true,
    visual: {
      bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true,
    },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 12, maxH: 10 },
    configFields: WIDGET_CONFIG_FIELDS.news || [],
  },
  // ── Coming Soon: Stocks ──
  {
    type: "stock_price", category: "stocks", assetType: "stocks",
    label: "Stock Price", desc: "Real-time stock quotes",
    icon: TrendingUp, iconColor: "text-success", available: false,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 }, constraints: { minW: 3, minH: 2 }, configFields: [],
  },
  {
    type: "stock_chart", category: "stocks", assetType: "stocks",
    label: "Stock Chart", desc: "Interactive stock charts",
    icon: LineChart, iconColor: "text-primary", available: false,
    visual: { bg: "glass", shadow: "lg", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 6, h: 4 }, constraints: { minW: 4, minH: 3 }, configFields: [],
  },
  // ── Coming Soon: Forex ──
  {
    type: "forex_rates", category: "forex", assetType: "forex",
    label: "Forex Rates", desc: "Live currency exchange rates",
    icon: BarChart3, iconColor: "text-accent", available: false,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 }, constraints: { minW: 3, minH: 2 }, configFields: [],
  },
  // ── Coming Soon: Commodities ──
  {
    type: "commodities_tracker", category: "commodities", assetType: "commodities",
    label: "Commodities", desc: "Gold, oil, and commodity prices",
    icon: TrendingUp, iconColor: "text-warning", available: false,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 }, constraints: { minW: 3, minH: 2 }, configFields: [],
  },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

export function getWidgetDef(type: string): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY.find((e) => e.type === type);
}

export function getAvailableWidgets(): WidgetRegistryEntry[] {
  return WIDGET_REGISTRY.filter((e) => e.available);
}

export function getWidgetConstraints(type: string): WidgetConstraints {
  const def = getWidgetDef(type);
  return def?.constraints ?? { minW: 2, minH: 2 };
}

export { WIDGET_CATEGORIES } from "@/config/site";
