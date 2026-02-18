/**
 * WidgetRenderer — dynamically renders the correct widget component
 * based on widget.type. Passes normalized config only.
 */
import { memo } from "react";
import { X, GripVertical } from "lucide-react";
import type { Widget } from "@/services/dataService";
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

const WidgetRenderer = memo(({ widget, editMode, onRemove }: Props) => {
  const Component = WIDGET_MAP[widget.type];

  return (
    <div className="glass-card h-full relative overflow-hidden group" role="region" aria-label={WIDGET_LABELS[widget.type] || widget.type}>
      {/* Drag handle — only visible in edit mode */}
      {editMode && (
        <div className="widget-drag-handle absolute top-0 left-0 right-0 h-7 bg-secondary/40 flex items-center justify-center cursor-grab z-10">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
      {editMode && (
        <button
          onClick={() => onRemove(widget.id)}
          className="absolute top-1 right-1 z-20 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove widget"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <div className={editMode ? "pt-7 h-full" : "h-full"}>
        {Component ? (
          <Component config={widget.config_json as any} />
        ) : (
          <div className="p-4 text-muted-foreground text-sm">
            Unknown widget type: {widget.type}
          </div>
        )}
      </div>
    </div>
  );
});

WidgetRenderer.displayName = "WidgetRenderer";
export default WidgetRenderer;
