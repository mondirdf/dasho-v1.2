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
  Activity, Zap, Grid3X3,
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
  // ── AI Market Recap (Primary — always sorted first) ──
  {
    type: "market_recap",
    category: "market",
    assetType: "crypto",
    label: "AI Market Recap",
    desc: "AI-powered 24h market summary",
    icon: TrendingUp,
    iconColor: "text-primary",
    available: true,
    visual: {
      bg: "gradient", shadow: "glow", layout: "default", animation: "fadeIn",
      accentHsl: "263 70% 60%", decorative: true, hoverLift: true,
    },
    defaultSize: { w: 6, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 12, maxH: 6 },
    configFields: WIDGET_CONFIG_FIELDS.market_recap || [],
  },
  // ── Stocks ──
  {
    type: "stock_tracker",
    category: "stocks",
    assetType: "stocks",
    label: "Stock Tracker",
    desc: "Track major stock prices in real-time",
    icon: TrendingUp,
    iconColor: "text-success",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 8, maxH: 8 },
    configFields: [
      { key: "symbols", label: "Symbols (comma-separated)", type: "text" as const, defaultValue: "AAPL,MSFT,GOOGL,AMZN,TSLA", placeholder: "AAPL,MSFT,GOOGL" },
      { key: "maxItems", label: "Max Items", type: "number" as const, defaultValue: 10 },
      { key: "showVolume", label: "Show Volume", type: "toggle" as const, defaultValue: false },
    ],
  },
  // ── Forex ──
  {
    type: "forex_rates",
    category: "forex",
    assetType: "forex",
    label: "Forex Rates",
    desc: "Live currency exchange rates",
    icon: BarChart3,
    iconColor: "text-accent",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 8, maxH: 8 },
    configFields: [
      { key: "maxItems", label: "Max Items", type: "number" as const, defaultValue: 10 },
    ],
  },
  // ── Commodities ──
  {
    type: "commodities_tracker",
    category: "commodities",
    assetType: "commodities",
    label: "Commodities",
    desc: "Gold, oil, and commodity prices",
    icon: TrendingUp,
    iconColor: "text-warning",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 },
    constraints: { minW: 3, minH: 2, maxW: 8, maxH: 6 },
    configFields: [],
  },
  // ── Global Indices ──
  {
    type: "global_indices",
    category: "indices",
    assetType: "indices",
    label: "Global Indices",
    desc: "S&P 500, NASDAQ, Dow Jones tracking",
    icon: Globe,
    iconColor: "text-primary",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 },
    constraints: { minW: 3, minH: 2, maxW: 8, maxH: 6 },
    configFields: [],
  },
  // ── Macro News ──
  {
    type: "macro_news",
    category: "news",
    assetType: "market",
    label: "Macro News",
    desc: "Business and market headline news",
    icon: Newspaper,
    iconColor: "text-accent",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 12, maxH: 10 },
    configFields: [
      { key: "maxArticles", label: "Max Articles", type: "number" as const, defaultValue: 5 },
    ],
  },
  // ── PRO: Market Structure Scanner ──
  {
    type: "structure_scanner",
    category: "pro",
    assetType: "crypto",
    label: "Structure Scanner",
    desc: "BOS, ChoCH, HH/HL/LH/LL detection",
    icon: Activity,
    iconColor: "text-primary",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 8, maxH: 8 },
    configFields: [
      { key: "symbol", label: "Symbol", type: "select" as const, defaultValue: "BTC", options: [
        { label: "BTC", value: "BTC" }, { label: "ETH", value: "ETH" }, { label: "SOL", value: "SOL" },
      ]},
      { key: "timeframe", label: "Timeframe", type: "select" as const, defaultValue: "1h", options: [
        { label: "5m", value: "5m" }, { label: "15m", value: "15m" }, { label: "1h", value: "1h" }, { label: "4h", value: "4h" }, { label: "1d", value: "1d" },
      ]},
    ],
  },
  // ── PRO: Volatility Regime ──
  {
    type: "volatility_regime",
    category: "pro",
    assetType: "crypto",
    label: "Volatility Regime",
    desc: "Compression/Expansion/Trending classifier",
    icon: Zap,
    iconColor: "text-warning",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 8, maxH: 8 },
    configFields: [
      { key: "symbol", label: "Symbol", type: "select" as const, defaultValue: "BTC", options: [
        { label: "BTC", value: "BTC" }, { label: "ETH", value: "ETH" }, { label: "SOL", value: "SOL" },
      ]},
      { key: "timeframe", label: "Timeframe", type: "select" as const, defaultValue: "1h", options: [
        { label: "5m", value: "5m" }, { label: "15m", value: "15m" }, { label: "1h", value: "1h" }, { label: "4h", value: "4h" }, { label: "1d", value: "1d" },
      ]},
    ],
  },
  // ── PRO: MTF Confluence Grid ──
  {
    type: "mtf_confluence",
    category: "pro",
    assetType: "crypto",
    label: "MTF Confluence",
    desc: "Multi-timeframe bias alignment matrix",
    icon: Grid3X3,
    iconColor: "text-accent",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 5, h: 4 },
    constraints: { minW: 4, minH: 3, maxW: 8, maxH: 8 },
    configFields: [
      { key: "symbol", label: "Symbol", type: "select" as const, defaultValue: "BTC", options: [
        { label: "BTC", value: "BTC" }, { label: "ETH", value: "ETH" }, { label: "SOL", value: "SOL" },
      ]},
    ],
  },
  // ── PRO: Session & Killzone Monitor ──
  {
    type: "session_monitor",
    category: "pro",
    assetType: "crypto",
    label: "Session Monitor",
    desc: "Trading sessions & killzone tracker",
    icon: Clock,
    iconColor: "text-success",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 3, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 6, maxH: 8 },
    configFields: [],
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
