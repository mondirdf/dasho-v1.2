/**
 * WidgetRenderer — resolves widget type → component, wraps in WidgetContainer.
 */
import { memo, useState, useEffect, useRef, Component, type ErrorInfo, type ReactNode } from "react";
import { X, GripVertical, Settings2, AlertTriangle } from "lucide-react";
import type { Widget } from "@/services/dataService";
import { getWidgetDef } from "./widgetRegistry";
import WidgetContainer from "./WidgetContainer";
import ConfirmDialog from "@/components/ConfirmDialog";
import WidgetSettingsModal, { type WidgetStyle } from "./WidgetSettingsModal";
import CsvExportButton from "./CsvExportButton";
import { trackBehavior } from "@/analytics/behaviorTracker";

/** Per-widget error boundary — prevents one broken widget from crashing the dashboard */
class WidgetErrorBoundary extends Component<
  { children: ReactNode; widgetType: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; widgetType: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Widget [${this.props.widgetType}] crashed:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-warning" />
          <p className="text-xs text-muted-foreground">This widget encountered an error.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import ProGate from "@/components/ProGate";
import { usePlanLimits } from "@/hooks/usePlanLimits";
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
import StructureScannerWidget from "./StructureScannerWidget";
import VolatilityRegimeWidget from "./VolatilityRegimeWidget";
import MTFConfluenceWidget from "./MTFConfluenceWidget";
import SessionMonitorWidget from "./SessionMonitorWidget";
import WatchlistWidget from "./WatchlistWidget";
import DailyBriefWidget from "./DailyBriefWidget";
import CorrelationWidget from "./CorrelationWidget";
import TradeJournalWidget from "./TradeJournalWidget";
import TradePatternWidget from "./TradePatternWidget";
import BacktesterWidget from "./BacktesterWidget";
import WeeklyReportWidget from "./WeeklyReportWidget";
import EdgeInsightsWidget from "./EdgeInsightsWidget";
import PreTradeCheckWidget from "./PreTradeCheckWidget";
/** Pro-only widget types that get gated for free users */
const PRO_WIDGET_TYPES = new Set([
  "structure_scanner", "volatility_regime", "mtf_confluence",
  "session_monitor", "correlation_matrix", "journal", "backtester",
  "weekly_report", "edge_insights", "trade_patterns",
  "daily_brief", "pre_trade_check",
]);
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
  structure_scanner: StructureScannerWidget,
  volatility_regime: VolatilityRegimeWidget,
  mtf_confluence: MTFConfluenceWidget,
  session_monitor: SessionMonitorWidget,
  watchlist: WatchlistWidget,
  daily_brief: DailyBriefWidget,
  correlation_matrix: CorrelationWidget,
  journal: TradeJournalWidget,
  trade_patterns: TradePatternWidget,
  backtester: BacktesterWidget,
  weekly_report: WeeklyReportWidget,
  edge_insights: EdgeInsightsWidget,
  pre_trade_check: PreTradeCheckWidget,
};

const WidgetRenderer = memo(({ widget, editMode, onRemove }: Props) => {
  const Component = WIDGET_MAP[widget.type];
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isPro } = usePlanLimits();
  const trackedRef = useRef(false);

  // Track widget_view on mount (fire-and-forget)
  useEffect(() => {
    if (!trackedRef.current) {
      trackedRef.current = true;
      trackBehavior("widget_view", { symbol: (widget.config_json as any)?.symbol });
    }
  }, [widget.type]);

  const configJson = widget.config_json as any;
  const widgetStyle: WidgetStyle = configJson?.style || {};
  const def = getWidgetDef(widget.type);
  const isProWidget = PRO_WIDGET_TYPES.has(widget.type);
  const shouldGate = isProWidget && !isPro;

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
            <div className="absolute top-1.5 left-10 z-20 opacity-0 group-hover:opacity-100 transition-all">
              <CsvExportButton widgetType={widget.type} />
            </div>
          </>
        )}

        {/* Content — widget renders pure content, no styling */}
        <div className={editMode ? "pt-8 h-full pointer-events-none" : "h-full"}>
          <WidgetErrorBoundary widgetType={widget.type}>
            {Component ? (
              shouldGate ? (
                <ProGate feature={def?.label ?? widget.type}>
                  <Component config={configJson} />
                </ProGate>
              ) : (
                <Component config={configJson} />
              )
            ) : (
              <div className="text-muted-foreground text-sm">
                Unknown widget type: {widget.type}
              </div>
            )}
          </WidgetErrorBoundary>
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
