# PulseBoard — Developer Guide

> **Your Data. Your Layout. Your Control.**
> Universal customizable dashboard platform.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Design System](#design-system)
4. [Widget System](#widget-system)
5. [Adding a New Widget](#adding-a-new-widget)
6. [Adding a New Category](#adding-a-new-category)
7. [Plan Limits — How to Change](#plan-limits--how-to-change)
8. [Database Schema](#database-schema)
9. [Edge Functions](#edge-functions)
10. [Authentication & Authorization](#authentication--authorization)
11. [Real-Time Data](#real-time-data)
12. [AI Market Recap](#ai-market-recap)
13. [Pro Trading Widgets](#pro-trading-widgets)
14. [Customization System](#customization-system)
15. [Key Files Reference](#key-files-reference)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | React Context + TanStack Query |
| Grid | react-grid-layout |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Realtime | Supabase Realtime subscriptions |

---

## Project Structure

See `ARCHITECTURE.md` for the full file tree.

---

## Design System

All colors are defined as **HSL CSS variables** in `src/index.css`:

```css
--primary: 263 70% 60%;       /* Purple */
--success: 152 69% 45%;       /* Green */
--destructive: 0 72% 55%;     /* Red */
--warning: 38 92% 50%;        /* Orange */
--background: 228 40% 6%;     /* Dark blue-black */
```

### Rules:
- **Never** use raw colors in components (`text-white`, `bg-black`, etc.)
- Always use semantic tokens: `text-foreground`, `bg-secondary`, `text-primary`
- Glass effects use `.glass-card` and `.glass-card-glow` classes
- All custom colors must be added to both `index.css` (CSS vars) and `tailwind.config.ts`

---

## Widget System

Widgets are the core building blocks. The system is **category-agnostic**.

### Key Files:
- `src/components/widgets/widgetRegistry.ts` → Single source of truth for all widget definitions
- `src/components/widgets/WidgetRenderer.tsx` → Dynamic component loader with error boundaries
- `src/components/widgets/WidgetSettingsModal.tsx` → Per-widget settings panel
- `src/components/widgets/WidgetContainer.tsx` → Container styling (bg, shadow, animation)
- `src/components/AddWidgetSheet.tsx` → Widget catalog with category tabs
- `src/config/site.ts` → Widget categories, config fields, coin options

### Widget Registry Entry:
```typescript
{
  type: "crypto_price",        // Unique type ID (stored in DB)
  category: "crypto",          // Category group
  assetType: "crypto",         // Market vertical
  label: "Price Tracker",      // Display name
  desc: "Description text",    // Short description
  icon: LineChart,             // Lucide icon
  iconColor: "text-primary",   // Icon color class
  available: true,             // false = hidden
  visual: { bg, shadow, layout, animation, accentHsl, decorative, hoverLift },
  defaultSize: { w: 4, h: 3 },
  constraints: { minW, minH, maxW, maxH },
  configFields: [...],         // Per-widget settings
}
```

---

## Adding a New Widget

### Step 1: Create the component
```
src/components/widgets/MyNewWidget.tsx
```
```tsx
import { memo } from "react";

const MyNewWidget = memo(({ config }: { config: any }) => {
  return (
    <div className="h-full p-4">
      <h3 className="text-sm font-semibold text-foreground">My Widget</h3>
    </div>
  );
});

MyNewWidget.displayName = "MyNewWidget";
export default MyNewWidget;
```

### Step 2: Register in WidgetRenderer
In `src/components/widgets/WidgetRenderer.tsx`, add to `WIDGET_MAP`:
```typescript
import MyNewWidget from "./MyNewWidget";
const WIDGET_MAP = {
  // ... existing
  my_new_type: MyNewWidget,
};
```

### Step 3: Add to widget registry
In `src/components/widgets/widgetRegistry.ts`, add to `WIDGET_REGISTRY`:
```typescript
{
  type: "my_new_type",
  category: "crypto",
  assetType: "crypto",
  label: "My Widget",
  desc: "Description",
  icon: SomeIcon,
  iconColor: "text-primary",
  available: true,
  visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true },
  defaultSize: { w: 4, h: 3 },
  constraints: { minW: 3, minH: 2, maxW: 8, maxH: 6 },
  configFields: [],
}
```

That's it! The widget will appear in the Add Widget sheet and work with the grid, customization, and persistence systems automatically.

---

## Adding a New Category

Categories are defined in `src/config/site.ts` → `WIDGET_CATEGORIES`:
```typescript
{ id: "my_category", label: "My Category", available: true }
```
Then set `category: "my_category"` on your widgets in the registry. No database changes needed.

---

## Plan Limits — How to Change

Plan limits are enforced in **two places** that must stay in sync:

### 1. Client-side (UI enforcement)

Edit `src/config/site.ts` → `PLAN_LIMITS`:

```typescript
export const PLAN_LIMITS = {
  free: {
    maxDashboards: 1,   // ← Change free limits here
    maxWidgets: 10,
    maxAlerts: 10,
  },
  pro: {
    maxDashboards: Infinity,
    maxWidgets: Infinity,
    maxAlerts: Infinity,
  },
};
```

Pro feature flags are in `PRO_FEATURES` (same file):
```typescript
export const PRO_FEATURES = {
  recap4h: true,        // 4h recap timeframe
  recapWeekly: true,    // Weekly recap timeframe
  recapRefresh: true,   // Manual recap refresh
  unlimitedWidgets: true,
  advancedAlerts: true,
  priorityRefresh: true,
};
```

### 2. Server-side (database triggers)

The database has three PostgreSQL trigger functions that enforce limits at INSERT time. After changing `PLAN_LIMITS`, you **must** update the matching trigger:

| Trigger Function | Table | Limit to change |
|-----------------|-------|-----------------|
| `enforce_widget_limit()` | `widgets` | `widget_count >= 10` |
| `enforce_dashboard_limit()` | `dashboards` | `dashboard_count >= 1` |
| `enforce_alert_limit()` | `alerts` | `alert_count >= 10` |

To update, run a migration like:
```sql
CREATE OR REPLACE FUNCTION public.enforce_widget_limit()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  user_plan text; widget_count integer; dashboard_owner uuid;
BEGIN
  SELECT user_id INTO dashboard_owner FROM public.dashboards WHERE id = NEW.dashboard_id;
  user_plan := get_user_plan(dashboard_owner);
  IF user_plan = 'free' THEN
    widget_count := count_dashboard_widgets(NEW.dashboard_id);
    IF widget_count >= 10 THEN  -- ← Change this number
      RAISE EXCEPTION 'Free plan allows only 10 widgets per dashboard.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
```

### Landing page pricing display

The pricing card text is in `src/config/site.ts` → `PRICING`. Update the feature list strings to match your new limits.

---

## Database Schema

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User info + plan + preferences | Own data only |
| `dashboards` | Dashboard name + layout | Own data only |
| `widgets` | Widget type + config + position | Via `owns_dashboard()` |
| `alerts` | Price alert rules | Own data only |
| `triggered_alerts` | Alert trigger history | Own data only |
| `cache_crypto_data` | Cached crypto prices | Read-only for all |
| `cache_stock_data` | Cached stock prices | Read-only for all |
| `cache_forex_data` | Cached forex rates | Read-only for all |
| `cache_commodity_data` | Cached commodity prices | Read-only for all |
| `cache_index_data` | Cached index data | Read-only for all |
| `cache_ohlc_data` | Cached Binance OHLC candles | Read-only for all |
| `cache_news` | Cached crypto news | Read-only for all |
| `cache_macro_news` | Cached macro/business news | Read-only for all |
| `cache_fear_greed` | Cached sentiment index | Read-only for all |
| `public_templates` | Shared templates | Read all, write own |
| `analytics_events` | User behavior tracking | No client access |
| `payments` | Payment records | View own only |
| `promo_codes` | Promo code definitions | No client access |
| `promo_usage` | Promo usage tracking | No client access |
| `user_roles` | Admin/moderator roles | Admin only |
| `system_logs` | Server logs | No client access |

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `fetch-crypto-data` | Crypto prices → `cache_crypto_data` |
| `fetch-stock-data` | Stock prices → `cache_stock_data` |
| `fetch-forex-data` | Forex rates → `cache_forex_data` |
| `fetch-commodity-data` | Commodity prices → `cache_commodity_data` |
| `fetch-index-data` | Index data → `cache_index_data` |
| `fetch-binance-klines` | Binance OHLC candles → `cache_ohlc_data` |
| `fetch-news` | Crypto news → `cache_news` |
| `fetch-macro-news` | Business/macro news → `cache_macro_news` |
| `check-alerts` | Evaluates alerts → `triggered_alerts` |
| `market-recap` | AI-powered market summary (cached 6h) |
| `scheduler` | Cron orchestrator for all fetch functions |
| `track-analytics` | User behavior event ingestion |
| `admin-auth` | Admin authentication |
| `admin-stats` | Admin dashboard statistics |
| `admin-promo` | Promo code management |

---

## Authentication & Authorization

- **Auth**: Supabase Auth (email/password)
- **RLS**: All tables have Row Level Security enabled
- **Protected routes**: Wrapped in `<ProtectedRoute>` component
- **Profile creation**: Automatic via `handle_new_user()` trigger on `auth.users`
- **Admin system**: Role-based via `user_roles` table + `has_role()` function

---

## Real-Time Data

`src/hooks/useRealtimeData.ts` subscribes to:
- `cache_crypto_data` changes → triggers widget refresh
- `triggered_alerts` inserts → shows toast notification

---

## AI Market Recap

The `market-recap` edge function supports **two AI providers**:

| Provider | Config | Cost |
|----------|--------|------|
| **Lovable AI Gateway** (default) | No setup needed | Free tier included |
| **Google Gemini API** | Requires `GEMINI_API_KEY` | Pay-per-use |

Auto-detection: If `GEMINI_API_KEY` exists → uses Gemini directly, otherwise Lovable Gateway.

Cache: Server-side 6h TTL (shared), client-side 10min TTL (per user). ~4 AI calls/day max.

---

## Pro Trading Widgets

Four advanced widgets powered by **Binance OHLC data** (`cache_ohlc_data`):

| Widget | Type | Description |
|--------|------|-------------|
| Structure Scanner | `structure_scanner` | BOS/ChoCH, HH/HL/LH/LL detection |
| Volatility Regime | `volatility_regime` | Compression/Expansion/Trending classifier |
| MTF Confluence | `mtf_confluence` | Multi-timeframe bias alignment matrix |
| Session Monitor | `session_monitor` | Trading sessions & killzone tracker |

### Data flow:
1. `fetch-binance-klines` edge function → fetches OHLC from Binance API → `cache_ohlc_data`
2. `useOHLCData` hook reads from `cache_ohlc_data`
3. Engine files in `src/engines/` process raw candles into signals
4. Widget components display the processed data

### Engine files:
- `src/engines/marketStructureEngine.ts` — BOS/ChoCH logic
- `src/engines/volatilityRegimeEngine.ts` — ATR-based regime detection
- `src/engines/mtfConfluenceEngine.ts` — Multi-timeframe alignment
- `src/engines/sessionEngine.ts` — Session/killzone timing

---

## Customization System

Each widget can be customized via `WidgetSettingsModal`:

| Setting | Storage | Applied via |
|---------|---------|------------|
| Background color | `config_json.style.bgColor` | Inline `hsla()` |
| Accent color | `config_json.style.accentColor` | Inline border-color |
| Border radius | `config_json.style.borderRadius` | Inline px value |
| Shadow intensity | `config_json.style.shadowIntensity` | Computed box-shadow |
| Animations | `config_json.style.animationsEnabled` | CSS class toggle |

All customization persists in the `widgets.config_json` JSONB column.

---

## Key Files Reference

| What | File |
|------|------|
| Central config | `src/config/site.ts` |
| Plan limits & features | `src/config/site.ts` → `PLAN_LIMITS`, `PRO_FEATURES` |
| Plan limits hook | `src/hooks/usePlanLimits.ts` |
| Design tokens | `src/index.css` |
| Tailwind config | `tailwind.config.ts` |
| App router | `src/App.tsx` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Dashboard state | `src/contexts/DashboardContext.tsx` |
| All DB queries | `src/services/dataService.ts` |
| Widget registry | `src/components/widgets/widgetRegistry.ts` |
| Widget renderer | `src/components/widgets/WidgetRenderer.tsx` |
| Widget catalog | `src/components/AddWidgetSheet.tsx` |
| Widget container | `src/components/widgets/WidgetContainer.tsx` |
| Widget settings | `src/components/widgets/WidgetSettingsModal.tsx` |
| OHLC data hook | `src/hooks/useOHLCData.ts` |
| Realtime hooks | `src/hooks/useRealtimeData.ts` |
| Market adapters | `src/adapters/market/` |
| Trading engines | `src/engines/` |
| Behavior analytics | `src/analytics/behaviorTracker.ts` |

---

*Last updated: February 2026*
