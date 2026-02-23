# Dasho — Architecture

> **Your Market Command Center.**
> Real-time data, AI-powered recaps, and pro trading widgets.

---

## Directory Structure

```
src/
├── config/
│   └── site.ts               Central config (brand, SEO, pricing, colors, widgets)
├── pages/
│   ├── Index.tsx              Landing page (hero, features, pricing, FAQ)
│   ├── Login.tsx              Auth — login
│   ├── Signup.tsx             Auth — signup
│   ├── ForgotPassword.tsx     Password reset request
│   ├── ResetPassword.tsx      Password reset confirmation
│   ├── Dashboard.tsx          Main dashboard (wraps DashboardProvider)
│   ├── Onboarding.tsx         New user widget selection
│   ├── Alerts.tsx             Alert management
│   ├── Templates.tsx          Public template gallery
│   ├── SharedTemplate.tsx     Public template preview (/template/:shareId)
│   ├── Settings.tsx           User profile, preferences, theme
│   ├── AdminDashboard.tsx     Admin panel (stats, promo codes)
│   ├── Privacy.tsx            Privacy policy
│   ├── Terms.tsx              Terms of service
│   └── NotFound.tsx           404
├── components/
│   ├── AddWidgetSheet.tsx     Multi-select widget picker with category tabs
│   ├── ConfirmDialog.tsx      Reusable destructive action confirmation
│   ├── ErrorBoundary.tsx      Global error boundary
│   ├── NavLink.tsx            Navigation link component
│   ├── ProGate.tsx            Pro-only feature gate with upgrade prompt
│   ├── ProtectedRoute.tsx     Auth guard
│   ├── TrialBanner.tsx        Pro trial countdown banner
│   ├── UpgradeDialog.tsx      Pro upgrade modal with payment
│   ├── dashboard/
│   │   ├── DashboardGrid.tsx      react-grid-layout (desktop) + dnd-kit (mobile)
│   │   ├── DashboardHeader.tsx    Navbar + dashboard selector + share
│   │   ├── MobileBottomNav.tsx    Fixed bottom navigation (mobile)
│   │   ├── MobileWidgetEditor.tsx Touch-friendly widget edit controls
│   │   ├── RenameDialog.tsx       Dashboard rename modal
│   │   └── SavedLayoutsMenu.tsx   Layout save/restore menu
│   ├── widgets/
│   │   ├── widgetRegistry.ts      Single source of truth (19 widget definitions)
│   │   ├── WidgetRenderer.tsx     Dynamic component loader + error boundaries
│   │   ├── WidgetContainer.tsx    Visual styling from registry (bg, shadow, animation)
│   │   ├── WidgetSettingsModal.tsx Per-widget settings panel
│   │   ├── WidgetSkeleton.tsx     Loading placeholder
│   │   ├── CsvExportButton.tsx    CSV data export
│   │   ├── shared.tsx             Shared sub-components (header, change indicator, etc.)
│   │   ├── CryptoPriceWidget.tsx
│   │   ├── MultiTrackerWidget.tsx
│   │   ├── StockTrackerWidget.tsx
│   │   ├── ForexRatesWidget.tsx
│   │   ├── CommodityWidget.tsx
│   │   ├── GlobalIndicesWidget.tsx
│   │   ├── FearGreedWidget.tsx
│   │   ├── MarketContextWidget.tsx
│   │   ├── NewsWidget.tsx
│   │   ├── MacroNewsWidget.tsx
│   │   ├── MarketRecapWidget.tsx
│   │   ├── DailyBriefWidget.tsx
│   │   ├── StructureScannerWidget.tsx
│   │   ├── BacktesterWidget.tsx
│   │   ├── MTFConfluenceWidget.tsx
│   │   ├── VolatilityRegimeWidget.tsx
│   │   ├── SessionMonitorWidget.tsx
│   │   ├── CorrelationWidget.tsx
│   │   ├── JournalWidget.tsx
│   │   └── WatchlistWidget.tsx
│   └── ui/                    shadcn/ui primitives (40+ components)
├── contexts/
│   ├── AuthContext.tsx         Supabase auth state
│   └── DashboardContext.tsx    Dashboard/widget/layout + onboarding state
├── hooks/
│   ├── use-mobile.tsx          Responsive breakpoint detection
│   ├── use-toast.ts            Toast notification hook
│   ├── useAdmin.ts             Admin role detection
│   ├── useOHLCData.ts          OHLC candle data + multi-timeframe
│   ├── usePlanLimits.ts        Free/Pro plan enforcement
│   ├── usePreferences.ts       User preferences management
│   ├── useRealtimeData.ts      Supabase realtime subscriptions
│   ├── useTrialStatus.ts       Pro trial countdown
│   └── useWidgetSize.ts        Responsive widget size modes
├── engines/
│   ├── backtestEngine.ts       Strategy simulation (5 strategies)
│   ├── marketAggregationEngine.ts  Cross-asset data aggregation
│   ├── marketRecapEngine.ts    AI recap prompt + caching
│   ├── marketStructureEngine.ts BOS/ChoCH/swing detection
│   ├── mtfConfluenceEngine.ts  Multi-TF bias alignment
│   ├── sessionEngine.ts        Session/killzone timing
│   └── volatilityRegimeEngine.ts ATR-based regime classification
├── adapters/market/
│   ├── index.ts                Unified adapter exports
│   ├── types.ts                Shared market data types
│   ├── marketAdapter.ts        Base adapter interface
│   ├── cryptoAdapter.ts        Crypto data adapter
│   ├── stockAdapter.ts         Stock data adapter
│   ├── forexAdapter.ts         Forex data adapter
│   ├── commodityAdapter.ts     Commodity data adapter
│   └── indexAdapter.ts         Index data adapter
├── services/
│   └── dataService.ts          All Supabase queries
├── analytics/
│   └── behaviorTracker.ts      User behavior event tracking
└── integrations/supabase/
    ├── client.ts               Supabase SDK client
    └── types.ts                Auto-generated DB types

supabase/functions/
├── fetch-crypto-data/          Binance/CoinGecko → cache_crypto_data
├── fetch-stock-data/           Stocks → cache_stock_data
├── fetch-forex-data/           Forex → cache_forex_data
├── fetch-commodity-data/       Commodities → cache_commodity_data
├── fetch-index-data/           Indices → cache_index_data
├── fetch-binance-klines/       Binance OHLC → cache_ohlc_data
├── fetch-news/                 Crypto news → cache_news
├── fetch-macro-news/           Macro news → cache_macro_news
├── market-recap/               AI market summary
├── generate-daily-brief/       AI daily trading brief
├── check-alerts/               Alert evaluation → triggered_alerts
├── scheduler/                  Cron orchestrator
├── create-payment/             NOWPayments invoice creation
├── nowpayments-webhook/        Payment confirmation + Pro activation
├── track-analytics/            User behavior ingestion
├── admin-auth/                 Admin authentication
├── admin-stats/                Admin statistics
└── admin-promo/                Promo code management
```

## Database Schema (22 Tables)

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User info + plan + preferences + trial_ends_at | Own data only |
| `dashboards` | Dashboard name + layout_json | Own data only |
| `widgets` | Widget type + config_json + position + size | Via `owns_dashboard()` |
| `saved_layouts` | Saved layout snapshots | Own data only |
| `watchlist_items` | Personal asset watchlist | Own data only |
| `alerts` | Price alert rules | Own data only |
| `smart_alert_rules` | Multi-condition smart alerts | Own data only |
| `triggered_alerts` | Alert trigger history | Own data only |
| `cache_crypto_data` | Cached crypto prices (Binance) | Public read |
| `cache_stock_data` | Cached stock prices | Public read |
| `cache_forex_data` | Cached forex rates | Public read |
| `cache_commodity_data` | Cached commodity prices | Public read |
| `cache_index_data` | Cached index data | Public read |
| `cache_ohlc_data` | Cached Binance OHLC candles | Public read |
| `cache_news` | Cached crypto news | Public read |
| `cache_macro_news` | Cached macro news | Public read |
| `cache_fear_greed` | Cached sentiment index | Public read |
| `daily_briefs` | AI-generated daily briefs | Public read |
| `public_templates` | Shared templates | Read all, write own |
| `payments` | Payment records + metadata | View own only |
| `promo_codes` | Promo code definitions | Admin only |
| `promo_usage` | Promo usage tracking | Admin only |
| `user_roles` | Admin/moderator roles | Admin only |
| `analytics_events` | User behavior tracking | Insert only |
| `system_logs` | Server logs | No client access |

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | Index | No | Landing page |
| `/login` | Login | No | Sign in |
| `/signup` | Signup | No | Create account |
| `/forgot-password` | ForgotPassword | No | Password reset |
| `/reset-password` | ResetPassword | No | Password confirm |
| `/dashboard` | Dashboard | Yes | Main dashboard |
| `/alerts` | Alerts | Yes | Alert management |
| `/templates` | Templates | Yes | Template gallery |
| `/settings` | Settings | Yes | User settings |
| `/admin` | AdminDashboard | Yes (admin) | Admin panel |
| `/template/:shareId` | SharedTemplate | No | Public template |
| `/privacy` | Privacy | No | Privacy policy |
| `/terms` | Terms | No | Terms of service |

---

*Last updated: February 2026*
