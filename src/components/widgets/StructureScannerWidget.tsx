/**
 * Market Structure Scanner Widget
 * Detects BOS, ChoCH, HH/HL/LH/LL in real-time.
 * Professional-grade — zero decoration.
 */
import { useMemo, useState } from "react";
import { useOHLCData } from "@/hooks/useOHLCData";
import { analyzeMarketStructure, type StructureSignal, type SwingPoint } from "@/engines/marketStructureEngine";
import { WidgetHeader } from "./shared";
import WidgetSkeleton from "./WidgetSkeleton";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d"];
const SYMBOLS = ["BTC", "ETH", "SOL"];

interface Props {
  config: any;
}

const BiasIcon = ({ bias }: { bias: string }) => {
  if (bias === "bullish") return <TrendingUp className="h-3.5 w-3.5 text-success" />;
  if (bias === "bearish") return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const SignalBadge = ({ signal }: { signal: StructureSignal }) => {
  const isBullish = signal.direction === "bullish";
  const isBOS = signal.event === "BOS";
  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
      isBullish
        ? isBOS ? "bg-success/15 text-success" : "bg-success/10 text-success/80"
        : isBOS ? "bg-destructive/15 text-destructive" : "bg-destructive/10 text-destructive/80"
    }`}>
      {signal.event}
      <span className="opacity-60">{isBullish ? "↑" : "↓"}</span>
    </div>
  );
};

const StructureScannerWidget = ({ config }: Props) => {
  const symbol = config?.symbol || "BTC";
  const [selectedTF, setSelectedTF] = useState(config?.timeframe || "1h");

  const { data: candles, isLoading, error } = useOHLCData({
    symbol,
    timeframe: selectedTF,
    limit: 100,
  });

  const analysis = useMemo(() => {
    if (!candles || candles.length < 10) return null;
    return analyzeMarketStructure(candles, 3);
  }, [candles]);

  if (isLoading) return <WidgetSkeleton />;

  if (error || !analysis) {
    return (
      <div className="h-full flex flex-col">
        <WidgetHeader title="Structure Scanner" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-muted-foreground">
            {error ? "Failed to load data" : "Awaiting OHLC data — run kline fetcher first"}
          </p>
        </div>
      </div>
    );
  }

  const recentSignals = analysis.signals.slice(-6).reverse();
  const recentSwings = analysis.swingPoints.slice(-8).reverse();

  return (
    <div className="h-full flex flex-col gap-2 p-3">
      {/* Header with bias */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">{symbol} Structure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BiasIcon bias={analysis.currentBias} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
            analysis.currentBias === "bullish" ? "text-success" :
            analysis.currentBias === "bearish" ? "text-destructive" : "text-muted-foreground"
          }`}>
            {analysis.currentBias}
          </span>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex gap-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setSelectedTF(tf)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
              selectedTF === tf
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Key levels */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-secondary/30 rounded-lg px-2.5 py-1.5">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Swing High</span>
          <p className="text-xs font-mono font-semibold text-foreground">
            {analysis.lastSwingHigh ? `$${analysis.lastSwingHigh.toLocaleString()}` : "—"}
          </p>
        </div>
        <div className="bg-secondary/30 rounded-lg px-2.5 py-1.5">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Swing Low</span>
          <p className="text-xs font-mono font-semibold text-foreground">
            {analysis.lastSwingLow ? `$${analysis.lastSwingLow.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {/* Recent structure events */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Recent Events</span>
        {recentSignals.length > 0 ? (
          recentSignals.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-border/10">
              <SignalBadge signal={s} />
              <span className="text-[10px] font-mono text-muted-foreground">
                ${s.brokenLevel.toLocaleString()}
              </span>
              <span className="text-[9px] text-muted-foreground/50">
                {new Date(s.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-muted-foreground/40 italic py-2">No structure breaks detected</p>
        )}
      </div>

      {/* Swing point trail */}
      <div className="flex gap-1 flex-wrap">
        {recentSwings.map((sp, i) => (
          <span
            key={i}
            className={`text-[9px] font-mono font-semibold px-1 py-0.5 rounded ${
              sp.label === "HH" || sp.label === "HL"
                ? "text-success/80 bg-success/8"
                : "text-destructive/80 bg-destructive/8"
            }`}
          >
            {sp.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default StructureScannerWidget;
