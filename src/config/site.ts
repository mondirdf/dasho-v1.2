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
  heading: "Your Market",
  headingHighlight: "Command Center.",
  subheading:
    "Real-time data, AI-powered recaps, and customizable widgets for modern traders.",
  ctaPrimary: "Open Crypto Dashboard",
  ctaSecondary: "Explore Widgets",
} as const;

export const VALUE_PROPS = [
  {
    title: "Real-Time Market Data",
    desc: "Live prices, volume, market cap — updated every minute across major digital assets.",
    icon: "BarChart3" as const,
  },
  {
    title: "AI-Powered Market Recap",
    desc: "Get instant sentiment analysis and market context powered by AI.",
    icon: "Zap" as const,
  },
  {
    title: "Customizable Trading Widgets",
    desc: "Build your ideal trading view with drag-and-drop widgets designed for financial markets.",
    icon: "Layout" as const,
  },
] as const;

export const FEATURES = [
  {
    title: "Price Tracking",
    desc: "Track any asset with real-time sparkline charts and instant price alerts.",
    icon: "LineChart" as const,
  },
  {
    title: "Smart Alerts",
    desc: "Set triggers on price levels. Get notified the instant your conditions are met.",
    icon: "Bell" as const,
  },
  {
    title: "Market Sentiment",
    desc: "Fear & Greed index and market context at a glance for smarter decisions.",
    icon: "Gauge" as const,
  },
  {
    title: "Market News Feed",
    desc: "Curated market news with keyword filtering and source control.",
    icon: "Newspaper" as const,
  },
  {
    title: "Multi-Asset Tracker",
    desc: "Monitor multiple assets side-by-side, sorted by performance or market cap.",
    icon: "BarChart3" as const,
  },
  {
    title: "Secure by Default",
    desc: "Row-level security, encrypted auth, zero data exposure. Your data stays yours.",
    icon: "Shield" as const,
  },
] as const;

export const HOW_IT_WORKS = [
  { step: "1", title: "Sign Up Free", desc: "Create your account in seconds. No credit card required." },
  { step: "2", title: "Build Your Board", desc: "Add market widgets, drag to arrange, resize to fit your trading style." },
  { step: "3", title: "Stay Sharp", desc: "Set price alerts, monitor sentiment, and never miss a market move." },
] as const;

export const USE_CASES = [
  {
    title: "Day Traders",
    desc: "Real-time price tracking, breakout alerts, and multi-asset monitoring for fast execution.",
  },
  {
    title: "Market Analysts",
    desc: "Market sentiment, Fear & Greed index, and curated news feeds for informed analysis.",
  },
  {
    title: "Portfolio Managers",
    desc: "Share market dashboards with your team. Clone templates and collaborate on market views.",
  },
] as const;

export const PRICING = {
  free: {
    name: "Free",
    price: "$0",
    period: "/forever",
    features: [
      "1 dashboard",
      "Up to 5 widgets",
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
    price: "$5",
    period: "/mo",
    yearlyNote: "$40/year (save 33%)",
    badge: "Best Value",
    features: [
      "Unlimited dashboards",
      "Unlimited widgets",
      "4h & Weekly AI Recaps",
      "Faster recap refresh",
      "Unlimited alerts",
      "Priority data refresh",
      "Advanced sorting & filtering",
      "Share & export",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
} as const;

export const FAQ = [
  {
    q: "Is Dasho free to use?",
    a: "Yes! The free plan includes 1 dashboard with up to 5 widgets, real-time data, and price alerts. Upgrade to Pro for unlimited dashboards and advanced features.",
  },
  {
    q: "What market data can I track?",
    a: "Currently you can track crypto prices, volume, market cap, 24h changes, Fear & Greed index, market sentiment, and curated news — all in real time. Stocks, forex, and commodities are on the roadmap.",
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
  {
    q: "Will you support stocks and forex?",
    a: "Yes — multi-asset support for stocks, forex, and commodities is on our roadmap. Crypto is the first fully supported vertical.",
  },
] as const;

export const CTA = {
  heading: "Ready to trade smarter?",
  subheading: "Build your market command center today — free forever.",
  button: "Open Dashboard",
} as const;

export const FOOTER = {
  tagline: "Dasho is a market intelligence dashboard designed for digital and financial assets. Start with crypto — expand to global markets.",
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
