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
7. [Database Schema](#database-schema)
8. [Edge Functions](#edge-functions)
9. [Authentication & Authorization](#authentication--authorization)
10. [Plan System](#plan-system)
11. [Real-Time Data](#real-time-data)
12. [Customization System](#customization-system)
13. [Key Files Reference](#key-files-reference)

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
- `src/components/AddWidgetSheet.tsx` → Widget catalog with category tabs
- `src/components/widgets/WidgetRenderer.tsx` → Dynamic component loader
- `src/components/widgets/WidgetCustomizer.tsx` → Per-widget style panel

### Widget Definition:
```typescript
{
  category: "crypto",          // Category group
  type: "crypto_price",        // Unique type ID (stored in DB)
  label: "Crypto Price",       // Display name
  icon: LineChart,             // Lucide icon
  desc: "Description text",   // Short description
  color: "text-primary",      // Icon color class
  available: true,             // false = "Coming Soon"
}
```

### Widget Component Interface:
```typescript
interface Props {
  config: {
    symbol?: string;
    style?: WidgetStyle;       // Customization from WidgetCustomizer
    [key: string]: any;        // Widget-specific config
  };
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

interface Props {
  config: { /* your config fields */ };
}

const MyNewWidget = memo(({ config }: Props) => {
  return (
    <div className="h-full p-4">
      <h3 className="text-sm font-semibold text-foreground">My Widget</h3>
      {/* Your widget UI */}
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

### Step 3: Add to catalog
In `src/components/AddWidgetSheet.tsx`, add to `WIDGET_CATALOG`:
```typescript
{
  category: "productivity",
  type: "my_new_type",
  label: "My Widget",
  icon: SomeIcon,
  desc: "Description",
  color: "text-primary",
  available: true,
}
```

That's it! The widget will appear in the Add Widget sheet and work with the grid, customization, and persistence systems automatically.

---

## Adding a New Category

Categories are defined in two places:

### 1. `AddWidgetSheet.tsx` → `CATEGORIES` array
```typescript
{ id: "my_category", label: "My Category" }
```

### 2. Add widgets with `category: "my_category"` in `WIDGET_CATALOG`

No database changes needed — categories are UI-only groupings.

---

## Database Schema

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User info + plan | Own data only |
| `dashboards` | Dashboard name + layout | Own data only |
| `widgets` | Widget type + config + position | Via `owns_dashboard()` |
| `alerts` | Price alert rules | Own data only |
| `triggered_alerts` | Alert trigger history | Own data only |
| `cache_crypto_data` | Cached prices (server-written) | Read-only for all |
| `cache_news` | Cached news (server-written) | Read-only for all |
| `cache_fear_greed` | Cached sentiment (server-written) | Read-only for all |
| `public_templates` | Shared templates | Read all, write own |
| `system_logs` | Server logs | No client access |

### Widget Config JSON Structure:
```json
{
  "symbol": "BTC",
  "style": {
    "bgColor": "220 60% 12%",
    "accentColor": "263 70% 60%",
    "borderRadius": 14,
    "shadowIntensity": 50,
    "animationsEnabled": true
  }
}
```

---

## Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `fetch-crypto-data` | Scheduled / manual | Fetches crypto prices from external APIs → `cache_crypto_data` |
| `fetch-news` | Scheduled / manual | Fetches news articles → `cache_news` |
| `check-alerts` | Scheduled / manual | Compares alerts against cache prices → triggers matching alerts |
| `scheduler` | Cron | Orchestrates periodic calls to the above functions |

### Adding a new data source:
1. Create edge function: `supabase/functions/fetch-weather/index.ts`
2. Create cache table: `cache_weather` (via migration)
3. Add to scheduler if needed
4. Create widget component that reads from the cache table

---

## Authentication & Authorization

- **Auth**: Supabase Auth (email/password)
- **RLS**: All tables have Row Level Security enabled
- **Protected routes**: Wrapped in `<ProtectedRoute>` component
- **Profile creation**: Automatic via `handle_new_user()` trigger on `auth.users`

---

## Plan System

| Feature | Free | Pro |
|---------|------|-----|
| Dashboards | 1 | Unlimited |
| Widgets per dashboard | 5 | Unlimited |
| Alerts | 10 | Unlimited |

Enforced **server-side** via PostgreSQL triggers:
- `enforce_dashboard_limit()` on `dashboards` INSERT
- `enforce_widget_limit()` on `widgets` INSERT
- `enforce_alert_limit()` on `alerts` INSERT

Plan is stored in `profiles.plan` column (`'free'` or `'pro'`).

---

## Real-Time Data

`src/hooks/useRealtimeData.ts` subscribes to:
- `cache_crypto_data` changes → triggers widget refresh
- `triggered_alerts` inserts → shows toast notification

Usage in widgets:
```typescript
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";
useRealtimeCrypto(refetchCallback);
```

---

## Customization System

Each widget can be customized in edit mode via `WidgetCustomizer`:

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
| Design tokens | `src/index.css` |
| Tailwind config | `tailwind.config.ts` |
| App router | `src/App.tsx` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Dashboard state | `src/contexts/DashboardContext.tsx` |
| All DB queries | `src/services/dataService.ts` |
| Widget registry | `src/components/widgets/WidgetRenderer.tsx` |
| Widget catalog | `src/components/AddWidgetSheet.tsx` |
| Widget styles | `src/components/widgets/WidgetCustomizer.tsx` |
| Plan limits | `src/hooks/usePlanLimits.ts` |
| Realtime hooks | `src/hooks/useRealtimeData.ts` |

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit
```

---

*Last updated: February 2026*
