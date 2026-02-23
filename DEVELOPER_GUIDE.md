# Dasho — Developer Guide

> **Your Market Command Center.**
> Real-time data, AI-powered recaps, and pro trading widgets.

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
14. [Mini Backtester](#mini-backtester)
15. [Customization System](#customization-system)
16. [Payments (NOWPayments)](#payments-nowpayments)
17. [Mobile Optimization](#mobile-optimization)
18. [Key Files Reference](#key-files-reference)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui + Custom Glass Design System |
| State | React Context + TanStack Query |
| Grid | react-grid-layout (desktop) + dnd-kit (mobile) |
| Backend | Supabase (Postgres + Auth + Edge Functions + Realtime) |
| Data | Binance API (primary) + CoinGecko + CoinCap (fallbacks) |
| AI | Lovable AI Gateway / Google Gemini |
| Payments | NOWPayments (USDT TRC20) |
| Charts | Recharts |

---

## Project Structure

See `ARCHITECTURE.md` for the full file tree.

---

## Design System

All colors are defined as **HSL CSS variables** in `src/index.css`:

```css
--primary: 263 70% 60%;       /* Purple — brand color */
--accent: 220 70% 55%;        /* Blue — secondary actions */
--success: 152 69% 45%;       /* Green — bullish / positive */
--destructive: 0 72% 55%;     /* Red — bearish / negative */
--warning: 38 92% 50%;        /* Orange — warnings */
--background: 228 40% 6%;     /* Dark blue-black */
--foreground: 210 40% 98%;    /* Near-white text */
--card: 228 30% 10%;          /* Card surfaces */
--muted: 228 20% 13%;         /* Muted backgrounds */
--muted-foreground: 215 20% 55%;  /* Secondary text */
```

### 4 Visual Themes
- **Default**: Dark purple terminal
- **Midnight Blue**: Blue-toned (`[data-theme="midnight"]`)
- **Terminal Green**: Hacker-style (`[data-theme="terminal"]`)
- **Light Mode**: Clean daytime (`[data-theme="light"]`)

### Rules:
- **Never** use raw colors in components (`text-white`, `bg-black`, etc.)
- Always use semantic tokens: `text-foreground`, `bg-secondary`, `text-primary`
- Glass effects: `.glass-card`, `.glass-card-glow`, `.glass-card-enhanced`
- All custom colors must be added to both `index.css` and `tailwind.config.ts`

---

## Widget System

Widgets are the core building blocks. The system supports **19 widgets** across 8 categories.

### Key Files:
| File | Purpose |
|------|---------|
| `widgetRegistry.ts` | Single source of truth for all widget definitions |
| `WidgetRenderer.tsx` | Dynamic component loader + error boundaries |
| `WidgetContainer.tsx` | Visual styling (bg, shadow, animation, hover) |
| `WidgetSettingsModal.tsx` | Per-widget settings panel |
| `shared.tsx` | Shared sub-components (header, change indicator, data row) |
| `AddWidgetSheet.tsx` | Widget catalog with category tabs |
| `config/site.ts` | Widget categories, config fields, coin options |

---

## Adding a New Widget

### Step 1: Create the component
```tsx
// src/components/widgets/MyWidget.tsx
import { memo } from "react";

const MyWidget = memo(({ config }: { config: any }) => {
  return (
    <div className="h-full">
      {/* Content ONLY — no bg, border, shadow, padding */}
      <h3 className="text-sm font-semibold text-foreground">My Widget</h3>
    </div>
  );
});

MyWidget.displayName = "MyWidget";
export default MyWidget;
```

### Step 2: Register in WidgetRenderer
```typescript
import MyWidget from "./MyWidget";
const WIDGET_MAP = {
  // ...existing
  my_new_type: MyWidget,
};
```

### Step 3: Add to widgetRegistry.ts
```typescript
{
  type: "my_new_type",
  category: "crypto",
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

The widget will automatically appear in the Add Widget sheet and work with the full system.

---

## Adding a New Category

In `src/config/site.ts` → `WIDGET_CATEGORIES`:
```typescript
{ id: "my_category", label: "My Category", available: true }
```
Then set `category: "my_category"` on your widgets. No database changes needed.

---

## Plan Limits — How to Change

### 1. Client-side (UI enforcement)

Edit `src/config/site.ts` → `PLAN_LIMITS`:

```typescript
export const PLAN_LIMITS = {
  free: { maxDashboards: 1, maxWidgets: 10, maxAlerts: 10 },
  pro: { maxDashboards: Infinity, maxWidgets: Infinity, maxAlerts: Infinity },
};
```

### 2. Server-side (database triggers)

Update the matching PostgreSQL trigger functions:

| Trigger Function | Table | Limit |
|-----------------|-------|-------|
| `enforce_widget_limit()` | `widgets` | `>= 10` |
| `enforce_dashboard_limit()` | `dashboards` | `>= 1` |
| `enforce_alert_limit()` | `alerts` | `>= 10` |

### 3. Landing page pricing display

Update `src/config/site.ts` → `PRICING` → feature list strings.

---

## Database Schema

See `ARCHITECTURE.md` for the full 22-table schema.

---

## Edge Functions

15 edge functions handle data fetching, AI processing, payments, and admin tasks. See `ARCHITECTURE.md` for the complete list.

---

## Authentication & Authorization

- **Auth**: Supabase Auth (email/password)
- **RLS**: All tables have Row Level Security
- **Protected routes**: `<ProtectedRoute>` component
- **Profile creation**: Automatic via `handle_new_user()` trigger
- **Admin system**: Role-based via `user_roles` table + `has_role()`
- **Pro trial**: 7-day automatic trial for new users

---

## Real-Time Data

`src/hooks/useRealtimeData.ts` subscribes to:
- `cache_crypto_data` changes → triggers widget refresh
- `triggered_alerts` inserts → shows toast notification

---

## AI Market Recap

| Provider | Config | Cost |
|----------|--------|------|
| **Lovable AI Gateway** (default) | No setup needed | Free tier |
| **Google Gemini API** | Requires `GEMINI_API_KEY` | Pay-per-use |

Cache: Server-side 6h TTL (shared), client-side 10min TTL. ~4 AI calls/day max.

---

## Pro Trading Widgets

5 advanced widgets powered by **Binance OHLC data** (`cache_ohlc_data`):

| Widget | Engine File | Key Output |
|--------|------------|------------|
| Structure Scanner | `marketStructureEngine.ts` | BOS/ChoCH, swing HH/HL/LH/LL, S/R levels |
| Mini Backtester | `backtestEngine.ts` | Win rate, Sharpe, drawdown, equity curve |
| MTF Confluence | `mtfConfluenceEngine.ts` | 5-TF bias alignment score |
| Volatility Regime | `volatilityRegimeEngine.ts` | ATR compression/expansion/trending |
| Session Monitor | `sessionEngine.ts` | Active sessions, killzones, volume heatmap |

### Data flow:
```
Binance API → fetch-binance-klines → cache_ohlc_data → useOHLCData → Engine → Widget
```

---

## Mini Backtester

Tests 5 strategies on historical OHLC data:

| Strategy | Logic |
|----------|-------|
| `bos_entry` | Enter on Break of Structure |
| `choch_reversal` | Enter on Change of Character |
| `rsi_oversold` | RSI < 30 bounce (or > 70 short) |
| `ema_cross` | EMA 9/21 crossover |
| `breakout` | 20-bar high/low range breakout |

**Output metrics**: Win Rate, Profit Factor, Sharpe Ratio, Max Drawdown, Equity Curve, Trade Log.

---

## Payments (NOWPayments)

| Component | Function |
|-----------|----------|
| Invoice creation | `create-payment` edge function |
| Webhook verification | `nowpayments-webhook` (HMAC-SHA512) |
| Pro activation | Updates `profiles.plan` + `profiles.trial_ends_at` |
| Duration | $15 = 60 days Pro access |
| Renewal | Extends existing expiry (doesn't reset) |

### Secrets Required:
- `NOWPAYMENTS_API_KEY` — API key for invoice creation
- `NOWPAYMENTS_IPN_SECRET` — IPN webhook signature verification

---

## Mobile Optimization

- **Bottom nav**: Fixed 5-tab navigation with 44px+ touch targets
- **Widget sizing**: `useWidgetSize` hook (compact < 240px, standard, expanded > 480px)
- **Drag-and-drop**: dnd-kit with TouchSensor (200ms activation delay)
- **Horizontal scroll**: Button groups use `overflow-x-auto scrollbar-none`
- **Safe area**: `env(safe-area-inset-bottom)` padding
- **Touch targets**: Global 36px minimum on screens ≤480px

---

## Customization System

Per-widget visual customization via `WidgetSettingsModal`:

| Setting | Storage Key | Applied As |
|---------|------------|-----------|
| Background color | `config_json.style.bgColor` | Inline `hsla()` |
| Accent color | `config_json.style.accentColor` | Inline border-color |
| Border radius | `config_json.style.borderRadius` | Inline px |
| Shadow intensity | `config_json.style.shadowIntensity` | Computed box-shadow |
| Animations | `config_json.style.animationsEnabled` | CSS class toggle |

---

## Key Files Reference

| What | File |
|------|------|
| Central config | `src/config/site.ts` |
| Plan limits & features | `src/config/site.ts` → `PLAN_LIMITS`, `PRO_FEATURES` |
| Design tokens | `src/index.css` |
| App router | `src/App.tsx` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Dashboard state | `src/contexts/DashboardContext.tsx` |
| All DB queries | `src/services/dataService.ts` |
| Widget registry | `src/components/widgets/widgetRegistry.ts` |
| Widget renderer | `src/components/widgets/WidgetRenderer.tsx` |
| Widget container | `src/components/widgets/WidgetContainer.tsx` |
| OHLC data hook | `src/hooks/useOHLCData.ts` |
| Realtime hooks | `src/hooks/useRealtimeData.ts` |
| Market adapters | `src/adapters/market/` |
| Trading engines | `src/engines/` |
| Behavior analytics | `src/analytics/behaviorTracker.ts` |

---

*Last updated: February 2026*
