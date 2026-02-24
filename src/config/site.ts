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

/* ═══════════════════════ PLAN LIMITS ═════════════════════════════ */
/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  CHANGE PLAN LIMITS HERE — both client-side AND database.       │
 * │                                                                  │
 * │  After editing these values, you MUST also update the matching   │
 * │  PostgreSQL trigger functions to keep server-side enforcement    │
 * │  in sync. See DEVELOPER_GUIDE.md → "Plan Limits" for details.  │
 * └──────────────────────────────────────────────────────────────────┘
 */
export const PLAN_LIMITS = {
  free: {
    maxDashboards: 1,
    maxWidgets: 10,
    maxAlerts: 10,
  },
  pro: {
    maxDashboards: Infinity,
    maxWidgets: Infinity,
    maxAlerts: Infinity,
  },
} as const;

/** Pro-only feature flags — toggle individual features here */
export const PRO_FEATURES = {
  recap4h: true,
  recapWeekly: true,
  recapRefresh: true,
  unlimitedWidgets: true,
  advancedAlerts: true,
  priorityRefresh: true,
} as const;

/* ══════════════════════════════ BRAND ══════════════════════════════ */

export const BRAND = {
  name: "Dasho",
  namePrefix: "Dash",
  nameHighlight: "o",
  tagline: "Market Intelligence Dashboard",
  description:
    "A focused market dashboard with real-time crypto data, AI-powered recaps, and customizable trading widgets. Multi-asset support coming soon.",
  url: "https://dashooo.vercel.app",
  ogImage: "https://dashooo.vercel.app/og-image.png",
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
    description: `Manage your smart market alerts.`,
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
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: BRAND.description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
} as const;

/* ══════════════════════════ COLOR TOKENS ══════════════════════════ */

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
  glassBg: "228 28% 11%",
  glassBorder: "228 18% 20%",
  glassGlow: "263 70% 60%",
} as const;

/* ═══════════════════════ ASSET TYPES ═════════════════════════════ */
/**
 * Asset types define which market verticals the platform supports.
 */
export type AssetType = "crypto" | "stocks" | "forex" | "commodities" | "indices";

export const ASSET_TYPES: { id: AssetType; label: string; active: boolean }[] = [
  { id: "crypto", label: "Crypto", active: true },
  { id: "stocks", label: "Stocks", active: true },
  { id: "forex", label: "Forex", active: true },
  { id: "commodities", label: "Commodities", active: true },
  { id: "indices", label: "Indices", active: true },
] as const;

/* ═══════════════════════ WIDGET CATEGORIES ════════════════════════ */

export const WIDGET_CATEGORIES = [
  { id: "all", label: "All", available: true },
  { id: "pro", label: "Pro Trading", available: true },
  { id: "crypto", label: "Crypto", available: true },
  { id: "market", label: "Market", available: true },
  { id: "news", label: "News", available: true },
  { id: "stocks", label: "Stocks", available: true },
  { id: "forex", label: "Forex", available: true },
  { id: "commodities", label: "Commodities", available: true },
  { id: "indices", label: "Indices", available: true },
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
  market_recap: [
    { key: "timeframe", label: "Timeframe", type: "select", defaultValue: "24h", options: [
      { label: "24 Hours", value: "24h" },
    ]},
  ],
};

/* ═══════════════════════ LANDING PAGE COPY ═══════════════════════ */

export const HERO = {
  heading: "Open. Glance.",
  headingHighlight: "Decide.",
  subheading:
    "Dasho isn't a replacement for TradingView — it's what you open first. One screen, 30 seconds, full market clarity.",
  ctaPrimary: "Start Free",
  ctaSecondary: "See How It Works",
} as const;

export const VALUE_PROPS = [
  {
    title: "30 Seconds to Clarity",
    desc: "Everything you need to know about the market — sentiment, structure, key levels — in one glance.",
    icon: "Zap" as const,
  },
  {
    title: "Not Another Charting Tool",
    desc: "TradingView is for analysis. Dasho is for decisions. We filter the noise so you don't have to.",
    icon: "Layout" as const,
  },
  {
    title: "Your Morning Market Ritual",
    desc: "Open Dasho with your coffee. See what moved, what's trending, and what needs your attention.",
    icon: "BarChart3" as const,
  },
] as const;

export const BEFORE_AFTER = {
  title: "From Chaos to Clarity",
  before: {
    label: "Without Dasho",
    items: [
      "10+ browser tabs open",
      "30 min scanning charts",
      "Missed signals buried in noise",
      "Decision fatigue before your first trade",
    ],
  },
  after: {
    label: "With Dasho",
    items: [
      "1 screen, everything you need",
      "30 seconds to full market context",
      "AI highlights what actually matters",
      "Trade with clarity, not confusion",
    ],
  },
} as const;

export const FEATURES = [
  {
    title: "AI Market Recap",
    desc: "Instead of scanning 10 charts manually, get an AI-generated overnight summary with key levels and what to watch — ready when you wake up.",
    icon: "Zap" as const,
  },
  {
    title: "Sentiment at a Glance",
    desc: "Fear & Greed, market structure, and momentum — analyzed automatically so you don't have to interpret raw data yourself.",
    icon: "Gauge" as const,
  },
  {
    title: "Smart Alerts",
    desc: "Multi-condition alerts that trigger only when it matters. No more staring at screens waiting for a level to hit.",
    icon: "Bell" as const,
  },
  {
    title: "Auto Structure Scanner",
    desc: "Manually spotting BOS & ChoCH across timeframes takes hours. Dasho detects them automatically with RSI confirmation.",
    icon: "LineChart" as const,
  },
  {
    title: "Curated News Feed",
    desc: "No clickbait, no noise. Only market-moving news, auto-filtered and ranked by relevance so you read what matters.",
    icon: "Newspaper" as const,
  },
  {
    title: "Multi-Asset Overview",
    desc: "Crypto, stocks, forex, commodities, indices — 5 asset classes on one screen instead of 5 different apps.",
    icon: "BarChart3" as const,
  },
] as const;

export const HOW_IT_WORKS = [
  { step: "1", title: "Sign Up in 10 Seconds", desc: "No credit card. No setup wizard. Just your email and you're in." },
  { step: "2", title: "Pick Your Widgets", desc: "Choose what matters to you — prices, news, sentiment, alerts. Drag and done." },
  { step: "3", title: "Open Every Morning", desc: "Make Dasho your first tab. 30 seconds of clarity before every trading session." },
] as const;

export const USE_CASES = [
  {
    title: "The Morning Glancer",
    desc: "You don't need 10 charts. You need to know: what moved, what's hot, and should I act? Dasho tells you in seconds.",
  },
  {
    title: "The Busy Trader",
    desc: "You have a job, a life, and a portfolio. Dasho gives you market intelligence without the time commitment.",
  },
  {
    title: "The Signal Hunter",
    desc: "BOS/ChoCH detection, MTF confluence, volatility regime — the analysis TradingView can't automate.",
  },
] as const;

export const PRICING = {
  free: {
    name: "Free",
    price: "$0",
    period: "/forever",
    features: [
      "1 dashboard",
      "Up to 10 widgets",
      "24h AI Market Recap",
      "Price alerts (up to 10)",
      "Real-time market data",
      "Community templates",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  pro: {
    name: "Pro",
    price: "$15",
    period: "/3 months",
    yearlyNote: "7-day free trial included • Pay with USDT (TRC20)",
    badge: "~$0.16/day",
    features: [
      "Unlimited dashboards & widgets",
      "Mini Backtester (5 strategies)",
      "Auto Structure Scanner (BOS/ChoCH)",
      "MTF Confluence & Volatility Regime",
      "Smart Alerts (multi-condition)",
      "AI Daily Trading Brief",
      "Session Heatmap",
      "Correlation Matrix & Journal",
      "CSV export & visual themes",
      "Priority data refresh",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
} as const;

export const FAQ = [
  {
    q: "Is Dasho a replacement for TradingView?",
    a: "No — and that's the point. TradingView is for deep chart analysis. Dasho is the screen you check first: market sentiment, structure shifts, and AI recaps in 30 seconds flat.",
  },
  {
    q: "Is it free?",
    a: "Yes! The free plan includes a dashboard with up to 5 widgets, real-time data, and price alerts. Upgrade to Pro for unlimited dashboards and advanced analysis tools.",
  },
  {
    q: "What kind of data does Dasho show?",
    a: "Live prices, Fear & Greed index, AI market recaps, curated news, structure scans (BOS/ChoCH), MTF confluence, and more — across crypto, stocks, forex, and commodities.",
  },
  {
    q: "How fast is the data?",
    a: "Market data refreshes every 60 seconds and news every 5 minutes. All data is cached server-side for instant loading.",
  },
  {
    q: "Can I use it on mobile?",
    a: "Absolutely. Dasho is fully responsive and works beautifully on any device — perfect for a quick morning check on your phone.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is protected with Row Level Security. Your dashboards, alerts, and settings are completely private.",
  },
] as const;

export const CTA = {
  heading: "Your morning just got smarter.",
  subheading: "Stop scrolling 10 tabs. Start with one screen that tells you everything.",
  button: "Start Free",
} as const;

export const FOOTER = {
  tagline: "Dasho — the smart add-on for traders who value their time. Open, glance, decide.",
  productLinks: [
    { label: "Features", href: "#features" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Sign Up", to: "/signup" },
  ],
  legalLinks: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
  ],
  roadmapNote: "Multi-Asset Support Coming Soon",
} as const;

/* ═══════════════════════ MOCK DATA (LANDING) ═════════════════════ */

export const MOCK_WIDGETS = [
  { label: "BTC", value: "$97,421", change: "+2.34%", positive: true },
  { label: "ETH", value: "$3,842", change: "-1.12%", positive: false },
  { label: "SOL", value: "$198", change: "+5.67%", positive: true },
  { label: "XRP", value: "$2.41", change: "+1.89%", positive: true },
  { label: "DOGE", value: "$0.387", change: "-0.74%", positive: false },
] as const;

/* ═══════════════════ DASHBOARD EMPTY STATE ════════════════════════ */

export const EMPTY_DASHBOARD = {
  heading: "Your dashboard is empty",
  description: "Add market widgets to start tracking prices, sentiment, and news.",
} as const;

/* ═══════════════════ 404 PAGE ════════════════════════════════════ */

export const NOT_FOUND = {
  code: "404",
  heading: "Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
  backButton: "Go Back",
  dashboardButton: "Dashboard",
} as const;
