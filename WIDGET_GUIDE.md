# Widget Development Guide — PulseBoard

This guide explains how to add a new widget to PulseBoard's dashboard system.

## Architecture Overview

```
widgetRegistry.ts    → Single source of truth (meta + visual + config fields)
WidgetContainer.tsx  → Applies ALL visual styling from registry
WidgetRenderer.tsx   → Maps type → component, wraps in WidgetContainer
YourWidget.tsx       → Pure content component (NO styling)
```

**Key Principle:** Widget components render **content only** — no backgrounds, borders, shadows, or padding. The `WidgetContainer` reads visual definitions from the registry and applies everything automatically.

---

## Step-by-Step: Adding a New Widget

### 1. Create the Component

Create `src/components/widgets/MyWidget.tsx`:

```tsx
import { memo } from "react";

interface Props {
  config: {
    myOption?: string;
  };
}

const MyWidget = memo(({ config }: Props) => {
  // Fetch data, manage state...

  return (
    <div className="h-full">
      {/* Render content ONLY — no p-4, no bg, no border */}
      <h3 className="text-sm font-semibold text-foreground mb-3">My Widget</h3>
      <p className="text-muted-foreground text-sm">Content here</p>
    </div>
  );
});

MyWidget.displayName = "MyWidget";
export default MyWidget;
```

> ⚠️ **Do NOT add** `p-4`, `bg-*`, `border`, `rounded-*`, `shadow-*`, or `overflow-hidden` to your widget. The `WidgetContainer` handles all of this.

### 2. Register in the Widget Registry

Open `src/components/widgets/widgetRegistry.ts` and add an entry to `WIDGET_REGISTRY`:

```ts
{
  type: "my_widget",             // Unique key — used in DB
  category: "productivity",      // Category for filtering
  label: "My Widget",            // Display name
  desc: "Short description",     // Shown in add-widget sheet
  icon: Clock,                   // Lucide icon
  iconColor: "text-primary",     // Icon color class
  available: true,               // false = "Coming Soon"

  visual: {
    bg: "glass",                 // "glass" | "solid" | "gradient" | "subtle"
    shadow: "md",                // "none" | "sm" | "md" | "lg" | "glow"
    layout: "default",           // "default" (p-4) | "compact" (p-2) | "padded" (p-6) | "fullbleed" (p-0)
    animation: "fadeIn",         // "none" | "fadeIn" | "slideUp" | "pulse"
    accentHsl: "263 70% 60%",    // Optional accent color for decorative elements
    decorative: true,            // Show subtle background accent blob
    hoverLift: true,             // Lift on hover
  },

  defaultSize: { w: 4, h: 3 },  // Grid columns × rows

  configFields: [                // Settings modal fields
    {
      key: "myOption",
      label: "My Option",
      type: "text",              // "text" | "number" | "toggle" | "select"
      defaultValue: "hello",
      placeholder: "Enter value",
    },
  ],
},
```

### 3. Register the Component

Open `src/components/widgets/WidgetRenderer.tsx` and add to `WIDGET_MAP`:

```ts
import MyWidget from "./MyWidget";

const WIDGET_MAP: Record<string, React.ComponentType<{ config: any }>> = {
  // ...existing entries
  my_widget: MyWidget,
};
```

### 4. Done!

That's it. The widget will automatically:
- Appear in the **Add Widget** sheet with the correct icon and category
- Have **settings modal** fields generated from `configFields`
- Receive **visual styling** from `WidgetContainer` (background, shadow, animation, hover)
- Support **user customization** (colors, border radius, shadow intensity)
- Work with **drag & resize** in edit mode

---

## Visual Preset Reference

### Background (`bg`)
| Value      | Effect                                         |
|------------|-------------------------------------------------|
| `glass`    | Blurred glass with subtle border (default)      |
| `solid`    | Opaque card background                          |
| `gradient` | Surface gradient with blur                      |
| `subtle`   | Very light, minimal background                  |

### Shadow (`shadow`)
| Value  | Effect                                |
|--------|---------------------------------------|
| `none` | No shadow                             |
| `sm`   | Light shadow                          |
| `md`   | Standard depth (default)              |
| `lg`   | Deep shadow                           |
| `glow` | Primary-colored glow effect           |

### Layout (`layout`)
| Value       | Padding  |
|-------------|----------|
| `default`   | `p-4`    |
| `compact`   | `p-2`    |
| `padded`    | `p-6`    |
| `fullbleed` | `p-0`    |

### Animation (`animation`)
| Value     | Effect                        |
|-----------|-------------------------------|
| `none`    | No animation                  |
| `fadeIn`  | Fade in + slide up (default)  |
| `slideUp` | Larger slide up               |
| `pulse`   | Pulsing glow                  |

---

## Rules

1. **No styling in widget components** — only content markup
2. **Use semantic tokens** — `text-foreground`, `text-muted-foreground`, `bg-secondary/30`, etc.
3. **Always use `memo`** — widgets re-render on layout changes
4. **Handle loading/error states** — use `<Skeleton>` and error UI
5. **Config via `config` prop** — all settings come from `config_json` in the DB
6. **One registry entry = one widget** — everything about the widget lives in `widgetRegistry.ts`
