/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                    DASHO — CENTRAL CONFIG                        ║
 * ║                                                                   ║
 * ║  Edit this single file to control brand, colors, SEO, copy,      ║
 * ║  widget categories, pricing, FAQ, and more.                       ║
 * ║                                                                   ║
 * ║  All values here are consumed across the app — no hunting.        ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

/* ══════════════════════════════ BRAND ══════════════════════════════ */

export const BRAND = {
  name: "Dasho",
  /** Used in nav/footer: "Dash" + highlighted "o" */
  namePrefix: "Dash",
  nameHighlight: "o",
  tagline: "All Your Data. One View.",
  description:
    "Build fully customizable dashboards with real-time data widgets. Track crypto, finance, news, weather, and more — all in one place.",
  url: "https://dashooo.vercel.app",
  ogImage: "https://dashooo.vercel.app/og-image.png",
  /** Path to logo image (icon + name) for navbar/footer */
  logo: "/src/assets/logo-dasho.png",
  year: new Date().getFullYear(),
  author: "Dasho",
} as const;

/* ══════════════════════════════ SEO ═══════════════════════════════ */

export const SEO = {
  home: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
  login: {
    title: `Sign In — ${BRAND.name}`,
    description: `Sign in to your ${BRAND.name} account to access your dashboards.`,
  },
  signup: {
    title: `Create Account — ${BRAND.name}`,
    description: `Join ${BRAND.name} for free and start building custom dashboards.`,
  },
  dashboard: {
    title: `Dashboard — ${BRAND.name}`,
    description: `Your personal ${BRAND.name} dashboard.`,
  },
  templates: {
    title: `Templates — ${BRAND.name}`,
    description: `Browse and clone community dashboard templates.`,
  },
  alerts: {
    title: `Alerts — ${BRAND.name}`,
    description: `Manage your smart data alerts.`,
  },
  settings: {
    title: `Settings — ${BRAND.name}`,
    description: `Manage your account and preferences.`,
  },
  notFound: {
    title: `404 — ${BRAND.name}`,
    description: `Page not found.`,
  },
} as const;

/* ══════════════════════════════ JSON-LD ═══════════════════════════ */

export const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: BRAND.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: BRAND.description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
} as const;

/* ══════════════════════════ COLOR TOKENS ══════════════════════════ */
/**
 * These map to CSS custom properties in index.css.
 * To change the primary color, update BOTH here and in index.css :root.
 * Format: "H S% L%" (HSL without commas, for Tailwind compatibility).
 */
export const COLORS = {
  primary: "263 70% 60%",
  accent: "220 70% 55%",
  background: "228 40% 6%",
  foreground: "210 40% 98%",
  card: "228 30% 10%",
  success: "152 69% 45%",
  warning: "38 92% 50%",
  destructive: "0 72% 55%",
  muted: "228 20% 13%",
  mutedForeground: "215 20% 55%",
  border: "228 18% 16%",
  /** Glass effect tokens */
  glassBg: "228 28% 11%",
  glassBorder: "228 18% 20%",
  glassGlow: "263 70% 60%",
} as const;

/* ═══════════════════════ WIDGET CATEGORIES ════════════════════════ */
/**
 * Controls which categories appear in AddWidgetSheet,
 * the landing page chips, and the widget registry filter.
 *
 * `available`: show as active (true) or "coming soon" (false).
 */
export const WIDGET_CATEGORIES = [
  { id: "all", label: "All", available: true },
  { id: "crypto", label: "Crypto", available: true },
  { id: "news", label: "News", available: true },
  { id: "finance", label: "Finance", available: false },
  { id: "weather", label: "Weather", available: false },
  { id: "stocks", label: "Stocks", available: false },
  { id: "sports", label: "Sports", available: false },
  { id: "productivity", label: "Productivity", available: false },
] as const;

/* ═══════════════════════ SUPPORTED COINS ═════════════════════════ */

export const COIN_OPTIONS = [
  { label: "BTC", value: "BTC" },
  { label: "ETH", value: "ETH" },
  { label: "SOL", value: "SOL" },
  { label: "ADA", value: "ADA" },
  { label: "DOGE", value: "DOGE" },
  { label: "XRP", value: "XRP" },
  { label: "DOT", value: "DOT" },
  { label: "AVAX", value: "AVAX" },
  { label: "LINK", value: "LINK" },
  { label: "MATIC", value: "MATIC" },
] as const;

/* ═══════════════════════ WIDGET CONFIG FIELDS ════════════════════ */
/**
 * Controls which settings appear for each widget type.
 * Add/remove/reorder fields here — they show in AddWidgetSheet & WidgetSettingsModal.
 *
 * Supported types: "text" | "number" | "toggle" | "select"
 */
export const WIDGET_CONFIG_FIELDS: Record<string, Array<{
  key: string;
  label: string;
  type: "text" | "number" | "toggle" | "select";
  options?: { label: string; value: string }[];
  defaultValue?: any;
  placeholder?: string;
}>> = {
  crypto_price: [
    { key: "symbol", label: "Coin", type: "select", defaultValue: "BTC", options: [...COIN_OPTIONS] },
    { key: "showChart", label: "Show Sparkline Chart", type: "toggle", defaultValue: true },
    { key: "showMarketCap", label: "Show Market Cap", type: "toggle", defaultValue: true },
    { key: "showVolume", label: "Show Volume", type: "toggle", defaultValue: false },
    { key: "showLastUpdate", label: "Show Last Update", type: "toggle", defaultValue: false },
  ],
  multi_tracker: [
    { key: "symbolsText", label: "Symbols (comma-separated)", type: "text", defaultValue: "BTC,ETH,SOL,ADA,DOGE", placeholder: "BTC,ETH,SOL" },
    { key: "maxItems", label: "Max Items", type: "number", defaultValue: 10 },
    { key: "showVolume", label: "Show Volume", type: "toggle", defaultValue: false },
    { key: "showMarketCap", label: "Show Market Cap", type: "toggle", defaultValue: false },
    { key: "sortBy", label: "Sort By", type: "select", defaultValue: "market_cap", options: [
      { label: "Market Cap", value: "market_cap" },
      { label: "Price", value: "price" },
      { label: "24h Change", value: "change" },
      { label: "Volume", value: "volume" },
    ]},
  ],
  fear_greed: [
    { key: "indicatorType", label: "Indicator Style", type: "select", defaultValue: "gauge", options: [
      { label: "Gauge", value: "gauge" }, { label: "Simple", value: "simple" },
    ]},
    { key: "showAlert", label: "Alert on Extremes", type: "toggle", defaultValue: true },
    { key: "showTimestamp", label: "Show Last Update", type: "toggle", defaultValue: false },
  ],
  market_context: [
    { key: "showVolume", label: "Show Volume", type: "toggle", defaultValue: true },
    { key: "showDominance", label: "Show BTC Dominance", type: "toggle", defaultValue: true },
    { key: "showTopMover", label: "Show Top Mover", type: "toggle", defaultValue: false },
    { key: "showGainersLosers", label: "Show Gainers vs Losers", type: "toggle", defaultValue: false },
  ],
  news: [
    { key: "maxArticles", label: "Max Articles", type: "number", defaultValue: 20 },
    { key: "keyword", label: "Filter Keyword", type: "text", placeholder: "Optional keyword filter" },
    { key: "source", label: "Source Filter", type: "text", placeholder: "Optional source name" },
    { key: "showSummary", label: "Show Summary in List", type: "toggle", defaultValue: false },
    { key: "layout", label: "Layout", type: "select", defaultValue: "list", options: [
      { label: "List", value: "list" }, { label: "Cards", value: "cards" },
    ]},
  ],
};

/* ═══════════════════════ LANDING PAGE COPY ═══════════════════════ */

export const HERO = {
  heading: "All Your Data.",
  headingHighlight: "One View.",
  subheading:
    "Build fully customizable dashboards with real-time widgets — crypto, finance, news, weather, and more. All in one place.",
  ctaPrimary: "Start Free",
  ctaSecondary: "Learn More",
} as const;

export const FEATURES = [
  {
    title: "Custom Dashboards",
    desc: "Drag-and-drop widgets. Resize, rearrange, save — your layout, your way.",
    icon: "Layout" as const,
  },
  {
    title: "Smart Alerts",
    desc: "Set triggers on any data point. Get notified the instant your conditions are met.",
    icon: "Bell" as const,
  },
  {
    title: "Real-Time Data",
    desc: "Live data from multiple sources, refreshing automatically every minute.",
    icon: "BarChart3" as const,
  },
  {
    title: "Instant Templates",
    desc: "Clone community dashboards in one click. Share yours with the world.",
    icon: "Zap" as const,
  },
  {
    title: "Multi-Category Widgets",
    desc: "Crypto, finance, news, weather, stocks — and more coming soon.",
    icon: "Globe" as const,
  },
  {
    title: "Secure by Default",
    desc: "Row-level security, encrypted auth, zero data exposure. Your data stays yours.",
    icon: "Shield" as const,
  },
] as const;

export const HOW_IT_WORKS = [
  { step: "1", title: "Sign Up Free", desc: "Create your account in seconds. No credit card required." },
  { step: "2", title: "Build Your Board", desc: "Add widgets from any category, drag to arrange, resize to fit." },
  { step: "3", title: "Stay Informed", desc: "Set alerts, track data in real time, share with friends." },
] as const;

export const USE_CASES = [
  {
    title: "Traders & Investors",
    desc: "Quick price snapshots, alerts on breakout levels, multi-asset tracking for fast decisions.",
  },
  {
    title: "Data Enthusiasts",
    desc: "Combine widgets from multiple categories into one unified view. Your data, your rules.",
  },
  {
    title: "Teams & Creators",
    desc: "Share dashboard templates with your team or community. Collaborate visually.",
  },
] as const;

export const PRICING = {
  free: {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: ["1 dashboard", "5 widgets", "Smart alerts", "Real-time data", "Community templates"],
    cta: "Get Started",
    highlighted: false,
  },
  pro: {
    name: "Pro",
    price: "$9",
    period: "/mo",
    badge: "Popular",
    features: [
      "Unlimited dashboards",
      "Unlimited widgets",
      "Advanced alerts",
      "Priority data refresh",
      "Share & export",
      "All widget categories",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
} as const;

export const FAQ = [
  {
    q: "Is Dasho free to use?",
    a: "Yes! The free plan includes 1 dashboard with up to 5 widgets, real-time data, and alerts. Upgrade to Pro for unlimited dashboards and advanced features.",
  },
  {
    q: "What kind of data can I track?",
    a: "Currently we support crypto market data, news feeds, and sentiment indexes. Finance, weather, stocks, sports, and productivity widgets are coming soon.",
  },
  {
    q: "Can I share my dashboard?",
    a: "Absolutely. Save any dashboard as a template and share it with a public link. Others can clone it into their own account with one click.",
  },
  {
    q: "How fast is the data?",
    a: "Market data refreshes every 60 seconds and news every 5 minutes. All data is cached server-side for instant loading.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is protected with Row Level Security. Your dashboards, alerts, and settings are completely private to your account.",
  },
] as const;

export const CTA = {
  heading: "Ready to take control?",
  subheading: "Build your perfect dashboard today — free forever.",
  button: "Start Free",
} as const;

export const FOOTER = {
  tagline: "Your data. Your layout. Your control. Build customizable dashboards for everything.",
  productLinks: [
    { label: "Features", href: "#features" },
    { label: "Templates", to: "/templates" },
    { label: "Sign Up", to: "/signup" },
  ],
  legalLinks: [
    { label: "Privacy Policy" },
    { label: "Terms of Service" },
  ],
} as const;

/* ═══════════════════════ MOCK DATA (LANDING) ═════════════════════ */

export const MOCK_WIDGETS = [
  { label: "BTC", value: "$97,421", change: "+2.34%", positive: true },
  { label: "ETH", value: "$3,842", change: "-1.12%", positive: false },
  { label: "SOL", value: "$198", change: "+5.67%", positive: true },
  { label: "S&P 500", value: "5,421", change: "+0.45%", positive: true },
  { label: "Weather", value: "22°C", change: "Sunny", positive: true },
] as const;

/* ═══════════════════ DASHBOARD EMPTY STATE ════════════════════════ */

export const EMPTY_DASHBOARD = {
  heading: "Your dashboard is empty",
  description: "Add widgets to start tracking data — crypto, news, market sentiment, and more.",
} as const;

/* ═══════════════════ 404 PAGE ════════════════════════════════════ */

export const NOT_FOUND = {
  code: "404",
  heading: "الصفحة غير موجودة",
  description: "يبدو أن هذه الصفحة قد انتقلت أو لم تعد موجودة.",
  backButton: "العودة",
  dashboardButton: "لوحة التحكم",
} as const;
