/**
 * WidgetContainer — applies ALL visual styling from the widget registry.
 *
 * Widget components render ONLY content — no backgrounds, borders, shadows,
 * padding, or animations. This component reads the visual definition from
 * widgetRegistry and applies:
 *  - Background preset (glass / solid / gradient / subtle)
 *  - Shadow level
 *  - Layout padding
 *  - Entry animation
 *  - Hover lift effect
 *  - Decorative accent element
 *  - User-customized overrides from config_json.style
 *
 * This separation ensures 50+ widgets can be added without styling duplication.
 */

import { memo, useMemo, type CSSProperties, type ReactNode } from "react";
import { getWidgetDef, type WidgetVisual } from "./widgetRegistry";
import type { WidgetStyle } from "./WidgetSettingsModal";
import { cn } from "@/lib/utils";

/* ──────────────────── CSS Mappings ──────────────────── */

const BG_CLASSES: Record<string, string> = {
  glass: "widget-bg-glass",
  solid: "widget-bg-solid",
  gradient: "widget-bg-gradient",
  subtle: "widget-bg-subtle",
};

const SHADOW_CLASSES: Record<string, string> = {
  none: "",
  sm: "widget-shadow-sm",
  md: "widget-shadow-md",
  lg: "widget-shadow-lg",
  glow: "widget-shadow-glow",
};

const LAYOUT_PADDING: Record<string, string> = {
  default: "p-4",
  compact: "p-2",
  padded: "p-6",
  fullbleed: "p-0",
};

const ANIMATION_CLASSES: Record<string, string> = {
  none: "",
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  pulse: "animate-pulse-glow",
};

/* ──────────────────── User style overrides ──────────────────── */

function getUserStyleOverrides(style?: WidgetStyle): CSSProperties {
  if (!style) return {};
  const s: CSSProperties = {};
  if (style.bgColor) s.background = `hsla(${style.bgColor} / 0.65)`;
  if (style.borderRadius !== undefined) s.borderRadius = `${style.borderRadius}px`;
  if (style.shadowIntensity !== undefined) {
    const i = style.shadowIntensity / 100;
    s.boxShadow = `0 0 0 1px hsla(var(--glass-border) / 0.1), 0 4px ${Math.round(24 * i)}px -4px hsla(228, 40%, 4%, ${0.5 * i})`;
  }
  if (style.accentColor) s.borderColor = `hsla(${style.accentColor} / 0.3)`;
  return s;
}

/* ──────────────────── Component ──────────────────── */

interface Props {
  type: string;
  editMode: boolean;
  userStyle?: WidgetStyle;
  children: ReactNode;
  className?: string;
}

const WidgetContainer = memo(({ type, editMode, userStyle, children, className }: Props) => {
  const def = getWidgetDef(type);
  const visual: WidgetVisual = def?.visual ?? {
    bg: "glass", shadow: "md", layout: "default", animation: "fadeIn", hoverLift: true,
  };

  const animationsOn = userStyle?.animationsEnabled ?? true;

  const containerClasses = cn(
    "widget-container h-full relative group",
    BG_CLASSES[visual.bg] || BG_CLASSES.glass,
    SHADOW_CLASSES[visual.shadow] || "",
    animationsOn ? ANIMATION_CLASSES[visual.animation] || "" : "",
    visual.hoverLift && animationsOn ? "widget-hover-lift" : "",
    editMode ? "editing" : "",
    className,
  );

  const contentClasses = cn(
    "h-full relative z-[1]",
    LAYOUT_PADDING[visual.layout] || LAYOUT_PADDING.default,
  );

  const overrideStyle = useMemo(() => getUserStyleOverrides(userStyle), [userStyle]);

  return (
    <div className={containerClasses} style={overrideStyle} role="region">
      {/* Decorative accent blob */}
      {visual.decorative && visual.accentHsl && (
        <div
          className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-[0.07] pointer-events-none z-0"
          style={{ background: `hsl(${visual.accentHsl})` }}
        />
      )}
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
});

WidgetContainer.displayName = "WidgetContainer";
export default WidgetContainer;
