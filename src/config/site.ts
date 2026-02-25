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
  tagline: "Clarity Before Every Trade",
  description:
    "The pre-trade decision layer for crypto traders. Know the regime, check your bias, and trade with context — not confusion.",
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
  heading: "Know Before",
  headingHighlight: "You Enter.",
  subheading:
    "Every minute you spend scanning charts without knowing the regime is a minute you're exposed. Structure shifts, sentiment flips, volatility traps — they don't wait for you to catch up. Dasho gives you regime awareness, structural clarity, and a defined bias in 30 seconds. Before the hesitation. Before the mistake.",
  ctaPrimary: "Get Clarity First",
  ctaSecondary: "See How It Works",
} as const;

export const VALUE_PROPS = [
  {
    title: "Know the Regime First",
    desc: "Bullish or bearish? Expanding or compressing? You should never enter a trade without knowing where you stand.",
    icon: "Zap" as const,
  },
  {
    title: "Decision Context, Not More Charts",
    desc: "TradingView is for drawing lines. Dasho tells you whether those lines even matter right now. Less noise, faster bias, lower cognitive load.",
    icon: "Layout" as const,
  },
  {
    title: "Your Pre-Trade Ritual",
    desc: "Open Dasho before every session. 30 seconds to form a bias, check the regime, and decide if today is even worth trading.",
    icon: "BarChart3" as const,
  },
] as const;

export const BEFORE_AFTER = {
  title: "Trading Without Context Is Gambling",
  before: {
    label: "Without Dasho",
    items: [
      "10+ tabs, conflicting signals everywhere",
      "No idea if you're in a bullish or bearish regime",
      "Hesitation before every entry",
      "Emotional overtrading because you 'feel' the market",
    ],
  },
  after: {
    label: "With Dasho",
    items: [
      "One screen. Clear regime. Defined bias.",
      "Know if volatility favors your strategy",
      "AI tells you what actually moved and why",
      "Confident execution — or a clear reason to sit out",
    ],
  },
} as const;

export const FEATURES = [
  {
    title: "Know What Actually Matters",
    desc: "Wake up to an AI-generated brief of what moved overnight, key levels to watch, and whether the regime shifted — so you skip the 30-minute chart scan.",
    icon: "Zap" as const,
  },
  {
    title: "Read Sentiment Instantly",
    desc: "Fear & Greed, market structure, momentum — synthesized into a single view. Stop guessing how the market 'feels' and start knowing.",
    icon: "Gauge" as const,
  },
  {
    title: "Get Alerted When It Matters",
    desc: "Multi-condition alerts that fire only when real setups form. No more screen-staring, no more false triggers draining your focus.",
    icon: "Bell" as const,
  },
  {
    title: "See Structure Shifts Before They Trap You",
    desc: "BOS and ChoCH detection across timeframes — automatically. The structure breaks you'd spend hours hunting are flagged in seconds.",
    icon: "LineChart" as const,
  },
  {
    title: "Only News That Moves Markets",
    desc: "Zero clickbait. Zero noise. Only headlines ranked by actual market impact — so you read 5 items instead of 50.",
    icon: "Newspaper" as const,
  },
  {
    title: "Every Asset Class, One Screen",
    desc: "Crypto, stocks, forex, commodities, indices — all in one place. No more switching between 5 apps to build a complete market picture.",
    icon: "BarChart3" as const,
  },
] as const;

export const HOW_IT_WORKS = [
  { step: "1", title: "Sign Up in 10 Seconds", desc: "No credit card. No setup wizard. Just your email and you're in." },
  { step: "2", title: "Build Your Decision Screen", desc: "Pick the signals that matter to your strategy — regime, sentiment, structure, news. Done in 60 seconds." },
  { step: "3", title: "Check Before Every Trade", desc: "Make Dasho your pre-trade ritual. 30 seconds of context before you commit capital." },
] as const;

export const USE_CASES = [
  {
    title: "The Overwhelmed Trader",
    desc: "You have 10 tabs open and still don't know if you should be long or short. Dasho gives you a regime, a bias, and a decision — in 30 seconds.",
  },
  {
    title: "The Part-Time Trader",
    desc: "You can't watch charts all day. Dasho compresses hours of analysis into a single pre-trade check so you trade smarter, not longer.",
  },
  {
    title: "The Edge Seeker",
    desc: "You want structure breaks, confluence, and volatility context — the analysis layer that separates guessing from decision-making.",
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
    a: "No. TradingView is where you draw lines and analyze charts. Dasho is the layer you check before you even open TradingView — regime, sentiment, structure, and a clear bias in 30 seconds.",
  },
  {
    q: "Is it free?",
    a: "Yes. The free plan includes a full dashboard with up to 10 widgets, real-time data, and price alerts. Pro unlocks unlimited dashboards, AI briefs, and advanced decision tools.",
  },
  {
    q: "What exactly does the Pre-Trade Check do?",
    a: "It combines regime detection, volatility state, sentiment, and news into a single actionable summary — plus a risk posture and a 4-point checklist so you never enter a trade without context.",
  },
  {
    q: "How fast is the data?",
    a: "Market data refreshes every 60 seconds, news every 5 minutes. Everything is cached server-side for instant loading — no waiting.",
  },
  {
    q: "Can I use it on mobile?",
    a: "Absolutely. Dasho is fully responsive — perfect for a 30-second pre-trade check on your phone before you commit capital.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is protected with Row Level Security. Your dashboards, watchlists, and settings are completely private.",
  },
] as const;

export const CTA = {
  heading: "Trade with context. Or don't trade at all.",
  subheading: "Every trade without regime awareness is a coin flip. Dasho makes sure you never enter blind again.",
  button: "See The Market Clearly",
} as const;

export const FOOTER = {
  tagline: "Dasho — the decision layer between you and the market. Check before you trade.",
  productLinks: [
    { label: "Features", href: "#features" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Sign Up", to: "/signup" },
  ],
  legalLinks: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
  ],
  roadmapNote: "Pre-Trade Decision Engine — Live Now",
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
