/**
 * WidgetRenderer — dynamically renders the correct widget component
 * based on widget.type. Passes normalized config only.
 */
import { memo } from "react";
import { X } from "lucide-react";
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

const WidgetRenderer = memo(({ widget, editMode, onRemove }: Props) => {
  const Component = WIDGET_MAP[widget.type];

  return (
    <div className="glass-card h-full relative overflow-hidden group">
      {editMode && (
        <button
          onClick={() => onRemove(widget.id)}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {Component ? (
        <Component config={widget.config_json as any} />
      ) : (
        <div className="p-4 text-muted-foreground text-sm">
          Unknown widget type: {widget.type}
        </div>
      )}
    </div>
  );
});

WidgetRenderer.displayName = "WidgetRenderer";
export default WidgetRenderer;
