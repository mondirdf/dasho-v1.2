/**
 * WidgetRenderer — resolves widget type → component, wraps in WidgetContainer.
 *
 * This component:
 *  1. Looks up the widget component from WIDGET_MAP
 *  2. Wraps it in WidgetContainer (which applies all visual styling from registry)
 *  3. Renders edit-mode controls (drag handle, remove, settings)
 *
 * Widget components receive ONLY { config } and render pure content.
 */
import { memo, useState } from "react";
import { X, GripVertical, Settings2 } from "lucide-react";
import type { Widget } from "@/services/dataService";
import { getWidgetDef } from "./widgetRegistry";
import WidgetContainer from "./WidgetContainer";
import ConfirmDialog from "@/components/ConfirmDialog";
import WidgetSettingsModal, { type WidgetStyle } from "./WidgetSettingsModal";
import CryptoPriceWidget from "./CryptoPriceWidget";
import MultiTrackerWidget from "./MultiTrackerWidget";
import NewsWidget from "./NewsWidget";
import FearGreedWidget from "./FearGreedWidget";
import MarketContextWidget from "./MarketContextWidget";
import MarketRecapWidget from "./MarketRecapWidget";
import StockTrackerWidget from "./StockTrackerWidget";
import ForexRatesWidget from "./ForexRatesWidget";
import CommodityWidget from "./CommodityWidget";
import GlobalIndicesWidget from "./GlobalIndicesWidget";
import MacroNewsWidget from "./MacroNewsWidget";

interface Props {
  widget: Widget;
  editMode: boolean;
  onRemove: (id: string) => void;
}

/**
 * Component map — register new widget components here.
 * The component must accept { config: any } and render content only.
 */
const WIDGET_MAP: Record<string, React.ComponentType<{ config: any }>> = {
  crypto_price: CryptoPriceWidget,
  multi_tracker: MultiTrackerWidget,
  news: NewsWidget,
  fear_greed: FearGreedWidget,
  market_context: MarketContextWidget,
  market_recap: MarketRecapWidget,
  stock_tracker: StockTrackerWidget,
  forex_rates: ForexRatesWidget,
  commodities_tracker: CommodityWidget,
  global_indices: GlobalIndicesWidget,
  macro_news: MacroNewsWidget,
};

const WidgetRenderer = memo(({ widget, editMode, onRemove }: Props) => {
  const Component = WIDGET_MAP[widget.type];
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const configJson = widget.config_json as any;
  const widgetStyle: WidgetStyle = configJson?.style || {};
  const def = getWidgetDef(widget.type);

  return (
    <>
      <WidgetContainer
        type={widget.type}
        editMode={editMode}
        userStyle={widgetStyle}
      >
        {/* Drag handle */}
        {editMode && (
          <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-secondary/60 to-transparent flex items-center justify-center cursor-grab z-10">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}

        {/* Edit controls — must stay above pointer-events-none content */}
        {editMode && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmRemove(true); }}
              className="absolute top-1.5 right-1.5 z-20 p-1.5 rounded-lg bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              aria-label="Remove widget"
            >
              <X className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}
              className="absolute top-1.5 left-1.5 z-20 p-1.5 rounded-lg bg-secondary/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:text-primary"
              aria-label="Widget settings"
            >
              <Settings2 className="h-3 w-3" />
            </button>
          </>
        )}

        {/* Content — widget renders pure content, no styling */}
        <div className={editMode ? "pt-8 h-full pointer-events-none" : "h-full"}>
          {Component ? (
            <Component config={configJson} />
          ) : (
            <div className="text-muted-foreground text-sm">
              Unknown widget type: {widget.type}
            </div>
          )}
        </div>
      </WidgetContainer>

      {/* Dialogs rendered outside WidgetContainer to avoid pointer-events issues */}
      {settingsOpen && (
        <WidgetSettingsModal
          widget={widget}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}

      {confirmRemove && (
        <ConfirmDialog
          open={confirmRemove}
          onOpenChange={setConfirmRemove}
          title="Remove widget?"
          description="This widget will be permanently removed from your dashboard."
          onConfirm={() => { onRemove(widget.id); setConfirmRemove(false); }}
          confirmLabel="Remove"
          destructive
        />
      )}
    </>
  );
});

WidgetRenderer.displayName = "WidgetRenderer";
export default WidgetRenderer;
