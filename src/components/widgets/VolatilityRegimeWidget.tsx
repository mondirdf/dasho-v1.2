/**
 * Volatility Regime Widget
 * Classifies current regime: Compression, Expansion, Trending, Distribution
 * Zero visual noise — data-forward.
 */
import { useMemo, useState } from "react";
import { useOHLCData } from "@/hooks/useOHLCData";
import { analyzeVolatilityRegime, type VolatilityRegime } from "@/engines/volatilityRegimeEngine";
import WidgetSkeleton from "./WidgetSkeleton";
import { Zap } from "lucide-react";

interface Props {
  config: any;
}

const REGIME_COLORS: Record<VolatilityRegime, string> = {
  compression: "text-accent",
  expansion: "text-warning",
  trending: "text-success",
  distribution: "text-muted-foreground",
};

const REGIME_BG: Record<VolatilityRegime, string> = {
  compression: "bg-accent/10",
  expansion: "bg-warning/10",
  trending: "bg-success/10",
  distribution: "bg-secondary/40",
};

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d"];

const VolatilityRegimeWidget = ({ config }: Props) => {
  const symbol = config?.symbol || "BTC";
  const [selectedTF, setSelectedTF] = useState(config?.timeframe || "1h");

  const { data: candles, isLoading, error } = useOHLCData({
    symbol,
    timeframe: selectedTF,
    limit: 100,
  });

  const result = useMemo(() => {
    if (!candles || candles.length < 50) return null;
    return analyzeVolatilityRegime(candles);
  }, [candles]);

  if (isLoading) return <WidgetSkeleton />;

  if (error || !result) {
    return (
      <div className="h-full flex flex-col p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-semibold text-foreground">{symbol} Volatility</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-muted-foreground">
            {error ? "Failed to load" : "Awaiting OHLC data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2.5 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-semibold text-foreground">{symbol} Volatility</span>
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

      {/* Regime badge */}
      <div className={`rounded-lg px-3 py-2.5 ${REGIME_BG[result.regime]}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold uppercase tracking-wider ${REGIME_COLORS[result.regime]}`}>
            {result.regime}
          </span>
          <span className="text-lg font-mono font-bold text-foreground">{result.regimeScore.toFixed(0)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{result.description}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="ATR Ratio" value={result.atrRatio.toFixed(2)} note={`${result.atrShort.toFixed(2)} / ${result.atrLong.toFixed(2)}`} />
        <MetricCell label="BB Width %" value={`${result.bbWidthPercentile.toFixed(0)}th`} note={`Width: ${result.bbWidth.toFixed(2)}%`} />
        <MetricCell label="ADX" value={result.adx.toFixed(1)} note={result.adx > 25 ? "Trending" : "Ranging"} />
        <MetricCell
          label="Regime Score"
          value={result.regimeScore.toFixed(0)}
          note={result.regimeScore > 70 ? "High vol" : result.regimeScore < 30 ? "Low vol" : "Normal"}
        />
      </div>
    </div>
  );
};

const MetricCell = ({ label, value, note }: { label: string; value: string; note: string }) => (
  <div className="bg-secondary/20 rounded-lg px-2 py-1.5">
    <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">{label}</span>
    <p className="text-xs font-mono font-semibold text-foreground">{value}</p>
    <span className="text-[8px] text-muted-foreground/40">{note}</span>
  </div>
);

export default VolatilityRegimeWidget;
