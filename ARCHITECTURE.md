# PulseBoard — Architecture

> **Your Data. Your Layout. Your Control.**
> Universal customizable dashboard platform.

---

## Directory Structure

```
src/
├── pages/
│   ├── Index.tsx          Landing page
│   ├── Login.tsx          Auth — login
│   ├── Signup.tsx         Auth — signup
│   ├── Dashboard.tsx      Main dashboard (wraps DashboardProvider)
│   ├── Onboarding.tsx     New user widget selection
│   ├── Alerts.tsx         Category-agnostic alert management
│   ├── Templates.tsx      Public template gallery
│   ├── SharedTemplate.tsx Public template preview (/template/:shareId)
│   ├── Settings.tsx       User profile & preferences
│   └── NotFound.tsx       404
├── components/
│   ├── AddWidgetSheet.tsx    Multi-select widget picker with categories
│   ├── ConfirmDialog.tsx     Reusable destructive action confirmation
│   ├── ErrorBoundary.tsx     Global error boundary
│   ├── ProtectedRoute.tsx    Auth guard
│   ├── dashboard/
│   │   ├── DashboardGrid.tsx    react-grid-layout wrapper
│   │   ├── DashboardHeader.tsx  Navbar + dashboard selector + share
│   │   ├── MobileBottomNav.tsx  Mobile navigation
│   │   └── RenameDialog.tsx     Dashboard rename modal
│   └── widgets/
│       ├── WidgetRenderer.tsx     Dynamic widget registry
│       ├── WidgetCustomizer.tsx   Style + size customization panel
│       ├── WidgetSkeleton.tsx     Loading placeholder
│       ├── CryptoPriceWidget.tsx  Single coin tracker
│       ├── MultiTrackerWidget.tsx Multi-coin table
│       ├── NewsWidget.tsx         News feed
│       ├── FearGreedWidget.tsx    Sentiment gauge
│       └── MarketContextWidget.tsx Market stats
├── contexts/
│   ├── AuthContext.tsx       Supabase auth state
│   └── DashboardContext.tsx  Dashboard/widget/layout state + onboarding
├── hooks/
│   ├── use-mobile.tsx        Responsive breakpoint
│   ├── usePlanLimits.ts      Free/Pro plan enforcement
│   └── useRealtimeData.ts    Supabase realtime subscriptions
├── services/
│   └── dataService.ts        All Supabase queries
└── integrations/supabase/
    ├── client.ts             Supabase SDK client
    └── types.ts              Auto-generated DB types

supabase/functions/
├── fetch-crypto-data/     Fetches crypto prices → cache_crypto_data
├── fetch-news/            Fetches news → cache_news
├── check-alerts/          Evaluates alerts → triggered_alerts
└── scheduler/             Cron orchestrator
```

## Database Schema

| Table | Purpose |
|-------|---------|
| profiles | User data (plan, display_name, avatar) |
| dashboards | User dashboards with layout_json |
| widgets | Widgets with type, config_json, position |
| alerts | Category-agnostic alerts (source_type, condition_type, source_label) |
| triggered_alerts | Alert trigger history |
| public_templates | Shared templates (public_share_id, clone_count, is_public) |
| cache_crypto_data | Cached crypto prices |
| cache_news | Cached news articles |
| cache_fear_greed | Cached fear & greed index |
| system_logs | Edge function execution logs |

## Routes

| Path | Component | Auth |
|------|-----------|------|
| / | Landing | No |
| /login | Login | No |
| /signup | Signup | No |
| /dashboard | Dashboard/Onboarding | Yes |
| /alerts | Alerts | Yes |
| /templates | Templates | Yes |
| /settings | Settings | Yes |
| /template/:shareId | SharedTemplate | No |
