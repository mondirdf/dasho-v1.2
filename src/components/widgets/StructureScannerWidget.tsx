/**
 * Market Structure Scanner Widget
 * Detects BOS, ChoCH, HH/HL/LH/LL with RSI confirmation.
 * Professional-grade — zero decoration.
 * Mobile-optimized: scrollable, touch-friendly selectors.
 */
import { useMemo, useState } from "react";
import { useOHLCData } from "@/hooks/useOHLCData";
import { analyzeMarketStructure, type StructureSignal } from "@/engines/marketStructureEngine";
import { WidgetHeader } from "./shared";
import WidgetSkeleton from "./WidgetSkeleton";
import { TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Volume2 } from "lucide-react";

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d"];

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
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0 ${
      isBullish
        ? isBOS ? "bg-success/15 text-success" : "bg-success/10 text-success/80"
        : isBOS ? "bg-destructive/15 text-destructive" : "bg-destructive/10 text-destructive/80"
    }`}>
      {signal.event}
      <span className="opacity-60">{isBullish ? "↑" : "↓"}</span>
      {signal.rsiConfirmed && <ShieldCheck className="h-2.5 w-2.5 opacity-70" />}
      {signal.volumeSpike && <Volume2 className="h-2.5 w-2.5 opacity-70" />}
    </div>
  );
};

const RSIGauge = ({ value }: { value: number }) => {
  const color = value > 70 ? "text-destructive" : value < 30 ? "text-success" : "text-foreground";
  const label = value > 70 ? "OB" : value < 30 ? "OS" : "";
  const width = Math.min(100, Math.max(0, value));
  const barColor = value > 70 ? "bg-destructive/50" : value < 30 ? "bg-success/50" : "bg-primary/40";
  
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] font-mono font-bold ${color}`}>{value.toFixed(0)}</span>
      <div className="w-10 sm:w-12 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${width}%` }} />
      </div>
      {label && <span className={`text-[8px] font-semibold ${color}`}>{label}</span>}
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
    <div className="h-full flex flex-col gap-2 p-3 overflow-y-auto">
      {/* Header with bias + RSI — wraps on mobile */}
      <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">{symbol} Structure</span>
        </div>
        <div className="flex items-center gap-2">
          {analysis.currentRSI !== null && <RSIGauge value={analysis.currentRSI} />}
          <BiasIcon bias={analysis.currentBias} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
            analysis.currentBias === "bullish" ? "text-success" :
            analysis.currentBias === "bearish" ? "text-destructive" : "text-muted-foreground"
          }`}>
            {analysis.currentBias}
          </span>
        </div>
      </div>

      {/* Timeframe selector — touch-friendly */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none shrink-0 -mx-1 px-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setSelectedTF(tf)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-medium transition-colors shrink-0 min-w-[40px] min-h-[36px] ${
              selectedTF === tf
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:bg-secondary"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Key levels */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <div className="bg-secondary/30 rounded-lg px-2.5 py-2">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Swing High</span>
          <p className="text-xs font-mono font-semibold text-foreground">
            {analysis.lastSwingHigh ? `$${analysis.lastSwingHigh.toLocaleString()}` : "—"}
          </p>
        </div>
        <div className="bg-secondary/30 rounded-lg px-2.5 py-2">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Swing Low</span>
          <p className="text-xs font-mono font-semibold text-foreground">
            {analysis.lastSwingLow ? `$${analysis.lastSwingLow.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {/* Key S/R Levels */}
      {analysis.keyLevels.length > 0 && (
        <div className="space-y-1 shrink-0">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Key Levels</span>
          <div className="flex gap-1 flex-wrap">
            {analysis.keyLevels.slice(0, 4).map((lvl, i) => (
              <span key={i} className={`text-[9px] font-mono px-1.5 py-1 rounded ${
                lvl.type === "resistance" 
                  ? "bg-destructive/10 text-destructive/80" 
                  : "bg-success/10 text-success/80"
              }`}>
                {lvl.type === "resistance" ? "R" : "S"} ${lvl.price.toLocaleString()}
                {lvl.strength > 1 && <span className="opacity-50"> ×{lvl.strength}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent structure events */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Recent Events</span>
        {recentSignals.length > 0 ? (
          recentSignals.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/10 gap-2 min-h-[36px]">
              <SignalBadge signal={s} />
              <span className="text-[10px] font-mono text-muted-foreground truncate">
                ${s.brokenLevel.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {s.rsi !== undefined && (
                  <span className={`text-[9px] font-mono ${
                    s.rsi > 70 ? "text-destructive/60" : s.rsi < 30 ? "text-success/60" : "text-muted-foreground/40"
                  }`}>
                    RSI {s.rsi.toFixed(0)}
                  </span>
                )}
                <span className="text-[9px] text-muted-foreground/50">
                  {new Date(s.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-muted-foreground/40 italic py-2">No structure breaks detected</p>
        )}
      </div>

      {/* Swing point trail */}
      <div className="flex gap-1 flex-wrap shrink-0">
        {recentSwings.map((sp, i) => (
          <span
            key={i}
            className={`text-[10px] font-mono font-semibold px-1.5 py-1 rounded ${
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
