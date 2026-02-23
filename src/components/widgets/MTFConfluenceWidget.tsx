/**
 * MTF Confluence Grid Widget
 * Shows bias alignment across 5 timeframes at a glance.
 * Color-coded matrix — instant multi-timeframe read.
 * Mobile-optimized: flexible grid, touch-friendly selectors.
 */
import { useMemo, useState } from "react";
import { useMultiTFData } from "@/hooks/useOHLCData";
import { analyzeConfluence, type TimeframeBias } from "@/engines/mtfConfluenceEngine";
import WidgetSkeleton from "./WidgetSkeleton";
import { Grid3X3, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  config: any;
}

const SYMBOLS = ["BTC", "ETH", "SOL"];
const TF_ORDER = ["5m", "15m", "1h", "4h", "1d"];

const BiasCell = ({ tf }: { tf: TimeframeBias }) => {
  const bgColor = tf.bias === "bullish"
    ? "bg-success/15 border-success/20"
    : tf.bias === "bearish"
    ? "bg-destructive/15 border-destructive/20"
    : "bg-secondary/30 border-border/20";

  const textColor = tf.bias === "bullish"
    ? "text-success"
    : tf.bias === "bearish"
    ? "text-destructive"
    : "text-muted-foreground";

  const Icon = tf.bias === "bullish" ? TrendingUp : tf.bias === "bearish" ? TrendingDown : Minus;

  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-md border px-1.5 py-1.5 min-w-0 ${bgColor}`}>
      <span className="text-[9px] font-mono text-muted-foreground/60 uppercase leading-none">{tf.timeframe}</span>
      <Icon className={`h-3.5 w-3.5 ${textColor}`} />
      <span className={`text-[9px] font-semibold uppercase leading-none ${textColor}`}>
        {tf.strength === "strong" ? "STR" : tf.strength === "moderate" ? "MOD" : "WK"}
      </span>
    </div>
  );
};

const MTFConfluenceWidget = ({ config }: Props) => {
  const [symbol, setSymbol] = useState(config?.symbol || "BTC");

  const { data: candleMap, isLoading, error } = useMultiTFData(symbol, TF_ORDER);

  const confluence = useMemo(() => {
    if (!candleMap) return null;
    return analyzeConfluence(candleMap, TF_ORDER);
  }, [candleMap]);

  if (isLoading) return <WidgetSkeleton />;

  if (error || !confluence) {
    return (
      <div className="h-full flex flex-col p-3">
        <div className="flex items-center gap-2 mb-2">
          <Grid3X3 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">MTF Confluence</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-muted-foreground">
            {error ? "Failed to load" : "Awaiting OHLC data"}
          </p>
        </div>
      </div>
    );
  }

  const biasColor = confluence.dominantBias === "bullish"
    ? "text-success" : confluence.dominantBias === "bearish"
    ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="h-full flex flex-col gap-2 p-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">MTF Confluence</span>
        </div>
        {/* Symbol selector — touch-friendly */}
        <div className="flex gap-1">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors min-w-[36px] min-h-[32px] ${
                symbol === s
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground/50 hover:text-foreground active:bg-secondary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Confluence score */}
      <div className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2.5 shrink-0">
        <div>
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Confluence</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-mono font-bold text-foreground">{confluence.confluenceScore}%</span>
            <span className={`text-[10px] font-semibold uppercase ${biasColor}`}>
              {confluence.dominantBias}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-foreground/50">Aligned</span>
          <p className="text-xs font-mono font-semibold text-foreground">
            {confluence.alignedCount}/{confluence.totalCount} TFs
          </p>
        </div>
      </div>

      {/* Timeframe grid — responsive: wraps nicely on small screens */}
      <div className="grid grid-cols-5 gap-1.5 shrink-0">
        {confluence.timeframes.map((tf) => (
          <BiasCell key={tf.timeframe} tf={tf} />
        ))}
      </div>

      {/* EMA alignment details */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {confluence.timeframes.map((tf) => (
          <div key={tf.timeframe} className="flex items-center justify-between py-1 border-b border-border/5 min-h-[32px]">
            <span className="text-[10px] font-mono text-muted-foreground/60 w-8">{tf.timeframe}</span>
            <div className="flex gap-2">
              <span className={`text-[9px] ${tf.priceAboveEma20 ? "text-success/60" : "text-destructive/60"}`}>
                EMA20 {tf.priceAboveEma20 ? "▲" : "▼"}
              </span>
              <span className={`text-[9px] ${tf.priceAboveEma50 ? "text-success/60" : "text-destructive/60"}`}>
                EMA50 {tf.priceAboveEma50 ? "▲" : "▼"}
              </span>
            </div>
            {/* Alignment bar */}
            <div className="w-14 h-2 bg-secondary/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  tf.emaAlignment > 0.7 ? "bg-success/60" : tf.emaAlignment > 0.4 ? "bg-warning/60" : "bg-destructive/40"
                }`}
                style={{ width: `${tf.emaAlignment * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MTFConfluenceWidget;
