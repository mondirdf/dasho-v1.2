/**
 * WidgetRenderer — dynamically renders the correct widget component
 * based on widget.type. Premium glass styling with edit controls.
 */
import { memo, useState } from "react";
import { X, GripVertical } from "lucide-react";
import type { Widget } from "@/services/dataService";
import ConfirmDialog from "@/components/ConfirmDialog";
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
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <>
      <div
        className={`widget-container h-full group ${editMode ? "editing" : ""}`}
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
        <div className={editMode ? "pt-8 h-full" : "h-full"}>
          {Component ? (
            <Component config={widget.config_json as any} />
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
