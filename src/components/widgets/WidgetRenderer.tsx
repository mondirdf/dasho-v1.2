/**
 * WidgetRenderer — plug-and-play widget component registry.
 * Each widget is an independent instance identified by its unique ID.
 * Renders based on widget.type, passes widget.config_json to component.
 */
import { memo, useState, useMemo, CSSProperties } from "react";
import { X, GripVertical, Settings2 } from "lucide-react";
import type { Widget } from "@/services/dataService";
import ConfirmDialog from "@/components/ConfirmDialog";
import WidgetSettingsModal, { type WidgetStyle } from "./WidgetSettingsModal";
import CryptoPriceWidget from "./CryptoPriceWidget";
import MultiTrackerWidget from "./MultiTrackerWidget";
import NewsWidget from "./NewsWidget";
import FearGreedWidget from "./FearGreedWidget";
import MarketContextWidget from "./MarketContextWidget";

interface Props {
  widget: Widget;
  editMode: boolean;
  onRemove: (id: string) => void;
}

/**
 * Widget registry — add new widget components here.
 * Each type maps to a component that receives { config }.
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const configJson = widget.config_json as any;
  const widgetStyle: WidgetStyle = configJson?.style || {};
  const animationsOn = widgetStyle.animationsEnabled ?? true;

  const customStyle = useMemo(() => getWidgetCustomStyle(widgetStyle), [widgetStyle]);

  return (
    <>
      <div
        className={`widget-container h-full group ${editMode ? "editing" : ""} ${animationsOn ? "widget-animate" : ""}`}
        style={customStyle}
        role="region"
        aria-label={WIDGET_LABELS[widget.type] || widget.type}
      >
        {/* Drag handle */}
        {editMode && (
          <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-secondary/60 to-transparent flex items-center justify-center cursor-grab z-10">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}

        {/* Edit mode controls */}
        {editMode && (
          <>
            <button
              onClick={() => setConfirmRemove(true)}
              className="absolute top-1.5 right-1.5 z-20 p-1.5 rounded-lg bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              aria-label="Remove widget"
            >
              <X className="h-3 w-3" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="absolute top-1.5 left-1.5 z-20 p-1.5 rounded-lg bg-secondary/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:text-primary"
              aria-label="Widget settings"
            >
              <Settings2 className="h-3 w-3" />
            </button>
          </>
        )}

        {/* Widget content */}
        <div className={editMode ? "pt-8 h-full pointer-events-none" : "h-full"}>
          {Component ? (
            <Component config={configJson} />
          ) : (
            <div className="p-4 text-muted-foreground text-sm">
              Unknown widget type: {widget.type}
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      <WidgetSettingsModal
        widget={widget}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

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
