# PulseBoard — Architecture Overview

```
src/
├── pages/                    # Route-level page components
│   ├── Index.tsx             # Landing page (public)
│   ├── Login.tsx             # Auth: sign in
│   ├── Signup.tsx            # Auth: sign up
│   ├── Dashboard.tsx         # Main dashboard (protected)
│   ├── Alerts.tsx            # Price alerts management (protected)
│   ├── Templates.tsx         # Public template gallery (protected)
│   ├── Settings.tsx          # User settings & profile (protected)
│   └── NotFound.tsx          # 404 page
│
├── components/
│   ├── ui/                   # shadcn/ui primitives (button, input, dialog, etc.)
│   ├── dashboard/            # Dashboard-specific UI
│   │   ├── DashboardHeader.tsx    # Top bar: logo, dashboard selector, edit/share
│   │   ├── DashboardGrid.tsx      # react-grid-layout wrapper
│   │   ├── MobileBottomNav.tsx    # Mobile navigation bar
│   │   └── RenameDialog.tsx       # Dashboard rename modal
│   ├── widgets/              # Widget components
│   │   ├── WidgetRenderer.tsx     # Dynamic widget loader + customizer
│   │   ├── WidgetCustomizer.tsx   # Per-widget style panel (colors, radius, shadow)
│   │   ├── WidgetSkeleton.tsx     # Loading skeleton for widgets
│   │   ├── CryptoPriceWidget.tsx  # Single coin price + sparkline
│   │   ├── MultiTrackerWidget.tsx # Multi-coin table
│   │   ├── NewsWidget.tsx         # News feed
│   │   ├── FearGreedWidget.tsx    # Sentiment gauge
│   │   └── MarketContextWidget.tsx# Market overview stats
│   ├── AddWidgetSheet.tsx    # Widget catalog with category tabs
│   ├── ConfirmDialog.tsx     # Reusable confirm/delete modal
│   ├── ErrorBoundary.tsx     # React error boundary
│   ├── NavLink.tsx           # Navigation link helper
│   └── ProtectedRoute.tsx    # Auth guard wrapper
│
├── contexts/
│   ├── AuthContext.tsx        # Auth state (user, signIn, signOut)
│   └── DashboardContext.tsx   # Dashboard state (widgets, layout, CRUD)
│
├── hooks/
│   ├── use-mobile.tsx         # Responsive breakpoint hook
│   ├── use-toast.ts           # Toast notification hook
│   ├── usePlanLimits.ts       # Free/Pro plan limit checks
│   └── useRealtimeData.ts     # Supabase realtime subscriptions
│
├── services/
│   └── dataService.ts         # All Supabase queries (crypto, news, dashboards, alerts, templates, profiles)
│
├── integrations/supabase/
│   ├── client.ts              # Supabase client instance
│   └── types.ts               # Auto-generated DB types (read-only)
│
├── lib/
│   └── utils.ts               # Utility functions (cn, etc.)
│
├── index.css                  # Design system tokens + glass card styles + animations
├── main.tsx                   # App entry point
└── App.tsx                    # Router + providers

supabase/
├── config.toml                # Supabase project config
└── functions/                 # Edge Functions (Deno)
    ├── fetch-crypto-data/     # Fetches crypto prices → cache_crypto_data
    ├── fetch-news/            # Fetches news → cache_news
    ├── check-alerts/          # Checks alerts against prices → triggered_alerts
    └── scheduler/             # Cron-like scheduler for periodic tasks

Database Tables:
├── profiles                   # User profiles (id, email, display_name, plan)
├── dashboards                 # User dashboards (name, layout_json)
├── widgets                    # Dashboard widgets (type, config_json, position)
├── alerts                     # Price alerts (coin, target, condition)
├── triggered_alerts           # Alert trigger history
├── cache_crypto_data          # Cached crypto prices
├── cache_news                 # Cached news articles
├── cache_fear_greed           # Cached sentiment index
├── public_templates           # Shared dashboard templates
└── system_logs                # Edge function logs
```
