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
  /** Background style — applied as CSS class by WidgetContainer */
  bg: BgPreset;
  /** Shadow depth */
  shadow: ShadowPreset;
  /** Content padding layout */
  layout: LayoutPreset;
  /** Entry animation */
  animation: AnimationPreset;
  /** Accent color (HSL string without hsl()) for border/glow accents */
  accentHsl?: string;
  /** Whether to show a subtle decorative background element */
  decorative?: boolean;
  /** Hover effect enabled */
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

/** Grid size constraints for a widget */
export interface WidgetConstraints {
  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
}

export interface WidgetRegistryEntry {
  /** Unique widget type key (e.g., "crypto_price") */
  type: string;
  /** Category for grouping in the add-widget sheet */
  category: string;
  /** Display label */
  label: string;
  /** Short description */
  desc: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Icon color class */
  iconColor: string;
  /** Whether the widget is available or coming soon */
  available: boolean;
  /** Visual definition — WidgetContainer uses this, NOT the widget component */
  visual: WidgetVisual;
  /** Default grid dimensions { w, h } */
  defaultSize: { w: number; h: number };
  /** Grid size constraints — enforced by the grid layout */
  constraints: WidgetConstraints;
  /** Per-widget config fields for settings modal */
  configFields: ConfigField[];
}

/* ──────────────────────────── Registry ──────────────────────────── */

export const WIDGET_REGISTRY: WidgetRegistryEntry[] = [
  // ── Crypto ──
  {
    type: "crypto_price",
    category: "crypto",
    label: "Price Tracker",
    desc: "Single coin price tracker with sparkline",
    icon: LineChart,
    iconColor: "text-primary",
    available: true,
    visual: {
      bg: "glass",
      shadow: "md",
      layout: "default",
      animation: "fadeIn",
      accentHsl: "263 70% 60%",
      decorative: true,
      hoverLift: true,
    },
    defaultSize: { w: 4, h: 3 },
    constraints: { minW: 3, minH: 2, maxW: 8, maxH: 6 },
    configFields: [
      { key: "symbol", label: "Coin Symbol", type: "text", defaultValue: "BTC", placeholder: "e.g. BTC, ETH, SOL" },
      { key: "currency", label: "Currency", type: "select", defaultValue: "USD", options: [
        { label: "USD", value: "USD" }, { label: "EUR", value: "EUR" }, { label: "GBP", value: "GBP" },
      ]},
      { key: "showChart", label: "Show Sparkline Chart", type: "toggle", defaultValue: true },
      { key: "showMarketCap", label: "Show Market Cap", type: "toggle", defaultValue: true },
    ],
  },
  {
    type: "multi_tracker",
    category: "crypto",
    label: "Multi Tracker",
    desc: "Track multiple coins at once",
    icon: BarChart3,
    iconColor: "text-accent",
    available: true,
    visual: {
      bg: "glass",
      shadow: "md",
      layout: "default",
      animation: "fadeIn",
      hoverLift: true,
    },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 12, maxH: 8 },
    configFields: [
      { key: "symbolsText", label: "Symbols (comma-separated)", type: "text", defaultValue: "BTC,ETH,SOL,ADA,DOGE", placeholder: "BTC,ETH,SOL" },
      { key: "maxItems", label: "Max Items", type: "number", defaultValue: 10 },
      { key: "showVolume", label: "Show Volume", type: "toggle", defaultValue: false },
    ],
  },
  {
    type: "fear_greed",
    category: "crypto",
    label: "Fear & Greed",
    desc: "Market sentiment index gauge",
    icon: Gauge,
    iconColor: "text-success",
    available: true,
    visual: {
      bg: "glass",
      shadow: "md",
      layout: "default",
      animation: "fadeIn",
      decorative: true,
      hoverLift: true,
    },
    defaultSize: { w: 3, h: 3 },
    constraints: { minW: 2, minH: 2, maxW: 6, maxH: 5 },
    configFields: [
      { key: "showAlert", label: "Visual Alert on Extremes", type: "toggle", defaultValue: true },
      { key: "indicatorType", label: "Indicator Style", type: "select", defaultValue: "gauge", options: [
        { label: "Gauge", value: "gauge" }, { label: "Simple", value: "simple" },
      ]},
    ],
  },
  {
    type: "market_context",
    category: "crypto",
    label: "Market Context",
    desc: "Overall market statistics",
    icon: Globe,
    iconColor: "text-primary",
    available: true,
    visual: {
      bg: "glass",
      shadow: "md",
      layout: "default",
      animation: "fadeIn",
      hoverLift: true,
    },
    defaultSize: { w: 4, h: 3 },
    constraints: { minW: 3, minH: 2, maxW: 8, maxH: 5 },
    configFields: [
      { key: "showVolume", label: "Show Volume", type: "toggle", defaultValue: true },
      { key: "showDominance", label: "Show BTC Dominance", type: "toggle", defaultValue: true },
    ],
  },
  // ── News ──
  {
    type: "news",
    category: "news",
    label: "News Feed",
    desc: "Latest news articles",
    icon: Newspaper,
    iconColor: "text-warning",
    available: true,
    visual: {
      bg: "glass",
      shadow: "md",
      layout: "default",
      animation: "fadeIn",
      hoverLift: true,
    },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3, maxW: 12, maxH: 10 },
    configFields: [
      { key: "maxArticles", label: "Max Articles", type: "number", defaultValue: 20 },
      { key: "keyword", label: "Filter Keyword", type: "text", placeholder: "Optional keyword filter" },
      { key: "source", label: "Source Filter", type: "text", placeholder: "Optional source name" },
    ],
  },
  // ── Coming Soon ──
  {
    type: "forex_rates", category: "finance", label: "Forex Rates", desc: "Live currency exchange rates",
    icon: BarChart3, iconColor: "text-accent", available: false,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 }, constraints: { minW: 3, minH: 2 }, configFields: [],
  },
  {
    type: "portfolio", category: "finance", label: "Portfolio", desc: "Track your investment portfolio",
    icon: TrendingUp, iconColor: "text-success", available: false,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 }, constraints: { minW: 3, minH: 3 }, configFields: [],
  },
  {
    type: "weather_current", category: "weather", label: "Current Weather", desc: "Live weather for your city",
    icon: Cloud, iconColor: "text-accent", available: false,
    visual: { bg: "gradient", shadow: "md", layout: "default", animation: "fadeIn", decorative: true, hoverLift: true },
    defaultSize: { w: 3, h: 3 }, constraints: { minW: 2, minH: 2 }, configFields: [],
  },
  {
    type: "weather_forecast", category: "weather", label: "Forecast", desc: "5-day weather forecast",
    icon: Cloud, iconColor: "text-primary", available: false,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 6, h: 3 }, constraints: { minW: 4, minH: 2 }, configFields: [],
  },
  {
    type: "stock_price", category: "stocks", label: "Stock Price", desc: "Real-time stock quotes",
    icon: TrendingUp, iconColor: "text-success", available: false,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 }, constraints: { minW: 3, minH: 2 }, configFields: [],
  },
  {
    type: "stock_chart", category: "stocks", label: "Stock Chart", desc: "Interactive stock charts",
    icon: LineChart, iconColor: "text-primary", available: false,
    visual: { bg: "glass", shadow: "lg", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 6, h: 4 }, constraints: { minW: 4, minH: 3 }, configFields: [],
  },
  {
    type: "live_scores", category: "sports", label: "Live Scores", desc: "Live sports scores",
    icon: Gamepad2, iconColor: "text-warning", available: false,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 4, h: 3 }, constraints: { minW: 3, minH: 2 }, configFields: [],
  },
  {
    type: "clock_widget", category: "productivity", label: "World Clock", desc: "Multiple timezone clocks",
    icon: Clock, iconColor: "text-muted-foreground", available: false,
    visual: { bg: "subtle", shadow: "sm", layout: "compact", animation: "fadeIn", hoverLift: true },
    defaultSize: { w: 3, h: 2 }, constraints: { minW: 2, minH: 2 }, configFields: [],
  },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

/** Lookup a registry entry by widget type */
export function getWidgetDef(type: string): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY.find((e) => e.type === type);
}

/** Get all available (non-coming-soon) widget types */
export function getAvailableWidgets(): WidgetRegistryEntry[] {
  return WIDGET_REGISTRY.filter((e) => e.available);
}

/** Get grid constraints for a widget type (falls back to safe defaults) */
export function getWidgetConstraints(type: string): WidgetConstraints {
  const def = getWidgetDef(type);
  return def?.constraints ?? { minW: 2, minH: 2 };
}

/** Category list for filter UI */
export const WIDGET_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto" },
  { id: "news", label: "News" },
  { id: "finance", label: "Finance" },
  { id: "weather", label: "Weather" },
  { id: "stocks", label: "Stocks" },
  { id: "sports", label: "Sports" },
  { id: "productivity", label: "Productivity" },
];
