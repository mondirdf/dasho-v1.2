# Dasho — Platform Overview

> Complete reference guide for the Dasho market intelligence platform.

---

## 1. What is Dasho?

**Dasho** is a market intelligence dashboard designed for crypto traders, market analysts, and portfolio managers. It provides:

- Real-time market data across multiple asset classes
- AI-powered daily market summaries
- Professional trading analysis tools
- Fully customizable, drag-and-drop widget layout
- Smart price alert system

The platform runs as a web application optimized for both desktop and mobile.

---

## 2. Brand Identity

| Property | Value |
|----------|-------|
| **Name** | Dasho |
| **Tagline** | Market Intelligence Dashboard |
| **URL** | https://dashooo.vercel.app |
| **Logo** | `src/assets/logo-dasho.png` |
| **Author** | Dasho |

### Name Construction
The name is split as "**Dash**" + "**o**" where the "o" is highlighted in the brand's primary color (purple).

---

## 3. Design System

### Color Palette (HSL)

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--primary` | `263 70% 60%` | Purple — brand color, CTAs, active states |
| `--accent` | `220 70% 55%` | Blue — secondary actions, links |
| `--background` | `228 40% 6%` | Dark blue-black — main background |
| `--foreground` | `210 40% 98%` | Near-white — primary text |
| `--card` | `228 30% 10%` | Slightly lighter — card surfaces |
| `--success` | `152 69% 45%` | Green — positive changes, bullish |
| `--warning` | `38 92% 50%` | Orange — warnings, killzones |
| `--destructive` | `0 72% 55%` | Red — negative changes, bearish |
| `--muted` | `228 20% 13%` | Dark — muted backgrounds |
| `--muted-foreground` | `215 20% 55%` | Gray — secondary text |
| `--border` | `228 18% 16%` | Subtle borders |

### Glass Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-bg` | `228 28% 11%` | Glass card background |
| `--glass-border` | `228 18% 20%` | Glass card border |
| `--glass-glow` | `263 70% 60%` | Glow/accent effects |

### Visual Themes

| Theme | Key | Description |
|-------|-----|-------------|
| Default | *(root)* | Dark purple — professional market terminal |
| Midnight Blue | `midnight` | Blue-toned dark theme |
| Terminal Green | `terminal` | Classic green-on-black terminal |
| Light Mode | `light` | Clean light theme for daytime use |

### Typography
- **Font**: Inter (system-ui fallback)
- **Style**: Monospaced `tabular-nums` for all prices and numbers
- **Hierarchy**: Bold uppercase tracking-widest for widget headers

### Visual Effects
- **Glassmorphism**: `backdrop-filter: blur(20-40px)` on cards
- **Hover lift**: `translateY(-1px)` with glow shadow
- **Entry animations**: `fadeIn`, `slideUp`, `pulse` presets
- **Shimmer**: Animated light sweep on premium elements

---

## 4. Widget Catalog (19 Widgets)

### Market Data Widgets

| Widget | Type Key | Category | Description |
|--------|----------|----------|-------------|
| Crypto Price Tracker | `crypto_price` | Crypto | Single coin with sparkline, MCap, volume |
| Multi-Asset Tracker | `multi_tracker` | Crypto | Multiple coins sorted by performance |
| Stock Tracker | `stock_tracker` | Stocks | Stock price tracking |
| Forex Rates | `forex_rates` | Forex | Currency pair monitoring |
| Commodities Tracker | `commodities_tracker` | Commodities | Gold, Oil, Silver prices |
| Global Indices | `global_indices` | Indices | S&P 500, NASDAQ, etc. |
| Fear & Greed Index | `fear_greed` | Market | Market sentiment gauge |
| Market Context | `market_context` | Market | Market cap, dominance, top movers |
| Watchlist | `watchlist` | Market | Personal asset watchlist |

### News & AI Widgets

| Widget | Type Key | Category | Description |
|--------|----------|----------|-------------|
| Crypto News | `news` | News | Curated crypto news with filters |
| Macro News | `macro_news` | News | Business/economic news feed |
| AI Market Recap | `market_recap` | Market | AI-generated 24h market summary |
| AI Daily Brief | `daily_brief` | Market | Daily trading intelligence brief |

### Pro Trading Widgets (Pro Only)

| Widget | Type Key | Category | Description |
|--------|----------|----------|-------------|
| Structure Scanner | `structure_scanner` | Pro | BOS/ChoCH detection with RSI confirmation |
| Mini Backtester | `backtester` | Pro | 5-strategy historical simulation engine |
| MTF Confluence | `mtf_confluence` | Pro | Multi-timeframe bias alignment grid |
| Volatility Regime | `volatility_regime` | Pro | ATR-based compression/expansion detection |
| Session Monitor | `session_monitor` | Pro | Trading sessions, killzones, volume heatmap |
| Correlation Matrix | `correlation_matrix` | Pro | Asset correlation analysis |
| Trading Journal | `journal` | Pro | Trade logging and tracking |

---

## 5. Trading Engines

Dedicated analysis engines process raw OHLC candle data from Binance:

| Engine | File | Output |
|--------|------|--------|
| Market Structure | `marketStructureEngine.ts` | BOS/ChoCH events, swing HH/HL/LH/LL, S/R levels |
| Volatility Regime | `volatilityRegimeEngine.ts` | ATR-based regime (compression/expansion/trending) |
| MTF Confluence | `mtfConfluenceEngine.ts` | Multi-timeframe bias alignment score |
| Session | `sessionEngine.ts` | Active sessions, killzone windows, UTC timing |
| Backtesting | `backtestEngine.ts` | Strategy simulation with win rate, Sharpe, drawdown |
| Market Recap | `marketRecapEngine.ts` | AI prompt construction and caching |
| Market Aggregation | `marketAggregationEngine.ts` | Cross-asset data aggregation |

### Backtester Strategies
1. **BOS Entry** — Enter on Break of Structure
2. **ChoCH Reversal** — Enter on Change of Character
3. **RSI Bounce** — RSI oversold/overbought reversal
4. **EMA Cross** — Fast/slow EMA crossover
5. **Breakout** — 20-bar range breakout

---

## 6. Data Architecture

### Data Sources

| Source | Primary Use | Fallback |
|--------|------------|----------|
| **Binance API** | Crypto prices + OHLC candles | Primary |
| **CoinGecko API** | Crypto prices | Fallback #1 |
| **CoinCap API** | Crypto prices | Fallback #2 |

### Data Flow
```
Binance/CoinGecko API
    ↓
Edge Functions (fetch-crypto-data, fetch-binance-klines, etc.)
    ↓
Supabase Cache Tables (cache_crypto_data, cache_ohlc_data, etc.)
    ↓
Supabase Realtime subscriptions
    ↓
React hooks (useRealtimeData, useOHLCData)
    ↓
Market Adapters (src/adapters/market/)
    ↓
Widget Components
```

### Refresh Rates
- **Crypto prices**: Every 60 seconds
- **News feed**: Every 5 minutes
- **AI Recap**: 6-hour server cache, 10-min client cache
- **OHLC candles**: On-demand via scheduler

---

## 7. Pricing Model

### Free Plan ($0/forever)
- 1 dashboard
- Up to 10 widgets
- 24h AI Market Recap
- Price alerts (up to 10)
- Real-time market data
- Community templates

### Pro Plan ($15 / 2 months)
- Unlimited dashboards & widgets
- Mini Backtester (5 strategies)
- Auto Structure Scanner (BOS/ChoCH)
- MTF Confluence & Volatility Regime
- Smart Alerts (multi-condition)
- AI Daily Trading Brief
- Session Heatmap
- Correlation Matrix & Journal
- CSV export & visual themes
- Priority data refresh

### Payment Method
- **USDT (TRC20)** via NOWPayments
- $15 payment grants 60 days of Pro access
- Renewals extend the existing expiry date

### Pro Trial
- All new users receive an automatic **7-day Pro trial**

---

## 8. Authentication & Security

| Feature | Implementation |
|---------|---------------|
| Auth provider | Supabase Auth (email/password) |
| Session management | Supabase JWT tokens |
| Route protection | `<ProtectedRoute>` component |
| Data security | Row Level Security (RLS) on all user tables |
| Admin system | Role-based (`user_roles` table + `has_role()`) |
| Payment verification | HMAC-SHA512 IPN signature validation |

---

## 9. Mobile Experience

- **Bottom navigation bar** with 5 tabs (Board, Templates, Alerts, Settings, Add Widget)
- **Touch-friendly controls**: Minimum 36-44px touch targets
- **Drag-and-drop reordering** via dnd-kit with touch sensors
- **Responsive widgets**: `useWidgetSize` hook adapts content (compact/standard/expanded)
- **Safe area support**: `env(safe-area-inset-bottom)` for modern devices
- **Horizontal scroll** for button groups on narrow screens

---

## 10. Edge Functions (15 total)

| Function | Purpose | Trigger |
|----------|---------|---------|
| `fetch-crypto-data` | Binance/CoinGecko → cache_crypto_data | Scheduler |
| `fetch-stock-data` | Stock prices → cache_stock_data | Scheduler |
| `fetch-forex-data` | Forex rates → cache_forex_data | Scheduler |
| `fetch-commodity-data` | Commodity prices → cache_commodity_data | Scheduler |
| `fetch-index-data` | Index data → cache_index_data | Scheduler |
| `fetch-binance-klines` | OHLC candles → cache_ohlc_data | Scheduler |
| `fetch-news` | Crypto news → cache_news | Scheduler |
| `fetch-macro-news` | Macro news → cache_macro_news | Scheduler |
| `market-recap` | AI market summary | On-demand |
| `generate-daily-brief` | AI daily trading brief | Scheduler |
| `check-alerts` | Alert evaluation → triggered_alerts | Scheduler |
| `scheduler` | Cron orchestrator for all fetchers | Cron |
| `create-payment` | NOWPayments invoice creation | User action |
| `nowpayments-webhook` | Payment confirmation + Pro activation | Webhook |
| `track-analytics` | User behavior event ingestion | Client |
| `admin-auth` | Admin authentication | Admin |
| `admin-stats` | Admin dashboard statistics | Admin |
| `admin-promo` | Promo code CRUD | Admin |

---

## 11. Database Schema (22 tables)

### User Data
| Table | Purpose |
|-------|---------|
| `profiles` | User info, plan, preferences, trial_ends_at |
| `dashboards` | Dashboard name + layout_json |
| `widgets` | Widget type, config_json, position, size |
| `saved_layouts` | Saved layout snapshots per dashboard |
| `watchlist_items` | Personal asset watchlist |

### Alerts
| Table | Purpose |
|-------|---------|
| `alerts` | Simple price alerts |
| `smart_alert_rules` | Multi-condition smart alerts (Pro) |
| `triggered_alerts` | Alert trigger history |

### Cache (Market Data)
| Table | Source |
|-------|--------|
| `cache_crypto_data` | Binance/CoinGecko |
| `cache_stock_data` | Stock API |
| `cache_forex_data` | Forex API |
| `cache_commodity_data` | Commodity API |
| `cache_index_data` | Index API |
| `cache_ohlc_data` | Binance OHLC klines |
| `cache_news` | Crypto news feeds |
| `cache_macro_news` | Macro/business news |
| `cache_fear_greed` | Fear & Greed index |
| `daily_briefs` | AI-generated daily briefs |

### Payments & Admin
| Table | Purpose |
|-------|---------|
| `payments` | Payment records + metadata |
| `promo_codes` | Promo code definitions |
| `promo_usage` | Promo redemption tracking |
| `user_roles` | Admin/moderator roles |
| `analytics_events` | User behavior tracking |
| `public_templates` | Shared dashboard templates |
| `system_logs` | Server execution logs |

---

## 12. Central Configuration

All platform settings are managed in `src/config/site.ts`:

| Section | Controls |
|---------|----------|
| `PLAN_LIMITS` | Free/Pro widget, dashboard, alert limits |
| `PRO_FEATURES` | Feature flags for Pro-only functionality |
| `BRAND` | Name, tagline, description, URL, logo |
| `SEO` | Per-page title and meta description |
| `COLORS` | HSL color tokens |
| `WIDGET_CATEGORIES` | Category tabs in Add Widget sheet |
| `WIDGET_CONFIG_FIELDS` | Per-widget settings definitions |
| `PRICING` | Free/Pro pricing card content |
| `HERO` / `FEATURES` / `FAQ` | Landing page content |
| `COIN_OPTIONS` | Supported crypto symbols |

---

*Last updated: February 2026*
