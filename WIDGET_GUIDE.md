# Dasho — Widget Development Guide

> How to add, customize, and extend widgets in Dasho.

---

## Architecture Overview

```
widgetRegistry.ts    → Single source of truth (meta + visual + config fields)
WidgetContainer.tsx  → Applies ALL visual styling from registry
WidgetRenderer.tsx   → Maps type → component, wraps in WidgetContainer
YourWidget.tsx       → Pure content component (NO styling)
shared.tsx           → Shared sub-components (WidgetHeader, ChangeIndicator, DataRow)
```

**Key Principle:** Widget components render **content only** — no backgrounds, borders, shadows, or padding. The `WidgetContainer` reads visual definitions from the registry and applies everything automatically.

---

## Step-by-Step: Adding a New Widget

### 1. Create the Component

Create `src/components/widgets/MyWidget.tsx`:

```tsx
import { memo } from "react";
import { WidgetHeader, WidgetEmptyState } from "./shared";

interface Props {
  config: {
    myOption?: string;
  };
}

const MyWidget = memo(({ config }: Props) => {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <WidgetHeader title="My Widget" status="live" />
      <p className="text-muted-foreground text-sm">Content here</p>
    </div>
  );
});

MyWidget.displayName = "MyWidget";
export default MyWidget;
```

> ⚠️ **Do NOT add** `p-4`, `bg-*`, `border`, `rounded-*`, `shadow-*`, or `overflow-hidden` to your root element. The `WidgetContainer` handles all of this.

### 2. Register in the Widget Registry

Open `src/components/widgets/widgetRegistry.ts` and add:

```ts
{
  type: "my_widget",
  category: "crypto",
  label: "My Widget",
  desc: "Short description",
  icon: Clock,
  iconColor: "text-primary",
  available: true,
  visual: {
    bg: "glass",           // "glass" | "solid" | "gradient" | "subtle"
    shadow: "md",          // "none" | "sm" | "md" | "lg" | "glow"
    layout: "default",     // "default" (p-4) | "compact" (p-2) | "padded" (p-6)
    animation: "fadeIn",   // "none" | "fadeIn" | "slideUp" | "pulse"
    hoverLift: true,
  },
  defaultSize: { w: 4, h: 3 },
  constraints: { minW: 3, minH: 2, maxW: 8, maxH: 6 },
  configFields: [],
}
```

### 3. Register the Component

Open `src/components/widgets/WidgetRenderer.tsx` and add to `WIDGET_MAP`:

```ts
import MyWidget from "./MyWidget";
const WIDGET_MAP = {
  // ...existing
  my_widget: MyWidget,
};
```

### 4. Done!

The widget will automatically:
- Appear in the **Add Widget** sheet with the correct icon and category
- Have **settings modal** fields generated from `configFields`
- Receive **visual styling** from `WidgetContainer`
- Support **user customization** (colors, radius, shadow)
- Work with **drag & resize** (desktop) and **drag reorder** (mobile)

---

## Mobile Optimization Checklist

When building widgets, ensure they work on 360px screens:

- [ ] Root element has `overflow-y-auto` for scrollable content
- [ ] Button groups use `overflow-x-auto scrollbar-none` for horizontal scroll
- [ ] Interactive elements have `min-h-[36px] min-w-[36px]` touch targets
- [ ] Use `shrink-0` on fixed-height sections to prevent compression
- [ ] Use `flex-wrap` on rows that might overflow on narrow screens
- [ ] Text uses `truncate` or `leading-tight` to prevent overflow
- [ ] Use `text-[11px]` minimum for readable text (not `text-[7px]` or `text-[8px]`)
- [ ] Icons have `shrink-0` to prevent squishing

---

## Shared Components (`shared.tsx`)

| Component | Usage |
|-----------|-------|
| `WidgetHeader` | Title + status badge (Live/Cached) + optional children |
| `ChangeIndicator` | Colored pill with arrow (▲/▼) and percentage |
| `SecondaryValue` | Label + value pair (MCap, Volume, etc.) |
| `DataRow` | Full row with label, price, change — for list widgets |
| `WidgetEmptyState` | Error/empty state with retry button |
| `ListSkeleton` | Loading placeholder for list-style widgets |

---

## Visual Preset Reference

### Background (`bg`)
| Value | Effect |
|-------|--------|
| `glass` | Blurred glass with subtle border (default) |
| `solid` | Opaque card background |
| `gradient` | Surface gradient with blur |
| `subtle` | Very light, minimal |

### Shadow (`shadow`)
| Value | Effect |
|-------|--------|
| `none` | No shadow |
| `sm` | Light |
| `md` | Standard (default) |
| `lg` | Deep |
| `glow` | Primary-colored glow |

### Layout (`layout`)
| Value | Padding |
|-------|---------|
| `default` | `p-4` |
| `compact` | `p-2` |
| `padded` | `p-6` |
| `fullbleed` | `p-0` |

### Animation (`animation`)
| Value | Effect |
|-------|--------|
| `none` | No animation |
| `fadeIn` | Fade in + slide up (default) |
| `slideUp` | Larger slide up |
| `pulse` | Pulsing glow |

---

## Rules

1. **No styling in widget components** — only content markup
2. **Use semantic tokens** — `text-foreground`, `bg-secondary/30`, `text-success`, etc.
3. **Always use `memo`** — widgets re-render on layout changes
4. **Handle loading/error states** — use `WidgetSkeleton` and `WidgetEmptyState`
5. **Config via `config` prop** — settings come from `config_json` in the DB
6. **Mobile-first** — test on 360px viewport width
7. **Use design system colors** — never hardcode `text-green-400`, use `text-success`

---

*Last updated: February 2026*
