/**
 * WidgetRenderer — dynamically renders the correct widget component
 * based on widget.type. Supports per-widget style and size customization.
 */
import { memo, useState, useCallback, useMemo, CSSProperties } from "react";
import { X, GripVertical } from "lucide-react";
import type { Widget } from "@/services/dataService";
import ConfirmDialog from "@/components/ConfirmDialog";
import WidgetCustomizer, { type WidgetStyle, type WidgetSize } from "./WidgetCustomizer";
import CryptoPriceWidget from "./CryptoPriceWidget";
import MultiTrackerWidget from "./MultiTrackerWidget";
import NewsWidget from "./NewsWidget";
import FearGreedWidget from "./FearGreedWidget";
import MarketContextWidget from "./MarketContextWidget";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/contexts/DashboardContext";

interface Props {
  widget: Widget;
  editMode: boolean;
  onRemove: (id: string) => void;
}

/**
 * Widget registry — add new widget components here.
 * Category-agnostic: each type maps to a component.
 */
const WIDGET_MAP: Record<string, React.ComponentType<{ config: any }>> = {
  crypto_price: CryptoPriceWidget,
  multi_tracker: MultiTrackerWidget,
  news: NewsWidget,
  fear_greed: FearGreedWidget,
  market_context: MarketContextWidget,
};

const WIDGET_LABELS: Record<string, string> = {
  crypto_price: "Price",
  multi_tracker: "Tracker",
  news: "News",
  fear_greed: "Sentiment",
  market_context: "Market",
};

function getWidgetCustomStyle(style?: WidgetStyle): CSSProperties {
  if (!style) return {};
  const s: CSSProperties = {};
  if (style.bgColor) {
    s.background = `hsla(${style.bgColor} / 0.65)`;
  }
  if (style.borderRadius !== undefined) {
    s.borderRadius = `${style.borderRadius}px`;
  }
  if (style.shadowIntensity !== undefined) {
    const intensity = style.shadowIntensity / 100;
    s.boxShadow = `0 0 0 1px hsla(var(--glass-border) / 0.1), 0 4px ${Math.round(24 * intensity)}px -4px hsla(228, 40%, 4%, ${0.5 * intensity})`;
  }
  if (style.accentColor) {
    s.borderColor = `hsla(${style.accentColor} / 0.3)`;
  }
  return s;
}

const WidgetRenderer = memo(({ widget, editMode, onRemove }: Props) => {
  const Component = WIDGET_MAP[widget.type];
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { layout, onLayoutChange } = useDashboard();

  const configJson = widget.config_json as any;
  const widgetStyle: WidgetStyle = configJson?.style || {};
  const animationsOn = widgetStyle.animationsEnabled ?? true;

  const currentLayoutItem = layout.find((l) => l.i === widget.id);
  const currentSize: WidgetSize = {
    w: currentLayoutItem?.w ?? widget.width,
    h: currentLayoutItem?.h ?? widget.height,
  };

  const handleStyleChange = useCallback(async (newStyle: WidgetStyle) => {
    const updated = { ...(configJson || {}), style: newStyle };
    await supabase
      .from("widgets")
      .update({ config_json: updated })
      .eq("id", widget.id);
    (widget as any).config_json = updated;
  }, [widget, configJson]);

  const handleSizeChange = useCallback((newSize: WidgetSize) => {
    const newLayout = layout.map((l) =>
      l.i === widget.id ? { ...l, w: newSize.w, h: newSize.h } : l
    );
    onLayoutChange(newLayout);
  }, [widget.id, layout, onLayoutChange]);

  const customStyle = useMemo(() => getWidgetCustomStyle(widgetStyle), [widgetStyle]);

  return (
    <>
      <div
        className={`widget-container h-full group ${editMode ? "editing" : ""} ${animationsOn ? "widget-animate" : ""}`}
        style={customStyle}
        role="region"
        aria-label={WIDGET_LABELS[widget.type] || widget.type}
      >
        {editMode && (
          <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-secondary/60 to-transparent flex items-center justify-center cursor-grab z-10">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
        {editMode && (
          <button
            onClick={() => setConfirmRemove(true)}
            className="absolute top-1.5 right-1.5 z-20 p-1.5 rounded-lg bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
            aria-label="Remove widget"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {editMode && (
          <WidgetCustomizer
            style={widgetStyle}
            size={currentSize}
            onChange={handleStyleChange}
            onSizeChange={handleSizeChange}
          />
        )}
        <div className={editMode ? "pt-8 h-full" : "h-full"}>
          {Component ? (
            <Component config={configJson} />
          ) : (
            <div className="p-4 text-muted-foreground text-sm">
              Unknown widget type: {widget.type}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove widget?"
        description="This widget will be permanently removed from your dashboard."
        onConfirm={() => { onRemove(widget.id); setConfirmRemove(false); }}
        confirmLabel="Remove"
        destructive
      />
    </>
  );
});

WidgetRenderer.displayName = "WidgetRenderer";
export default WidgetRenderer;