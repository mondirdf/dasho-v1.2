/**
 * MarketRecapWidget — AI-powered market recap with Pro gating.
 * Fetches from edge function only. Never calls AI directly.
 */
import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, Clock, Crown } from "lucide-react";
import { getMarketRecap, canRefreshRecap, type MarketRecap } from "@/engines/marketRecapEngine";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import ProGate from "@/components/ProGate";

type Timeframe = "24h" | "4h" | "weekly";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "24h": "24h",
  "4h": "4h",
  weekly: "7d",
};

const MarketRecapWidget = ({ config }: { config: any }) => {
  const [ref, size] = useWidgetSize();
  const [recap, setRecap] = useState<MarketRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [canRefresh, setCanRefresh] = useState(false);
  const { isPro, recapRefresh } = usePlanLimits();

  const timeframe: Timeframe = config?.timeframe ?? "24h";
  const isFreeTimeframe = timeframe === "24h";

  const fetchRecap = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMarketRecap("crypto", "24h");
      setRecap(data);
      setCanRefresh(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecap();
    const interval = setInterval(() => {
      setCanRefresh(canRefreshRecap("crypto", "24h"));
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchRecap]);

  const timeAgo = recap?.generatedAt ? formatTimeAgo(recap.generatedAt) : null;

  const recapContent = (
    <div ref={ref} className="h-full flex flex-col p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">AI Market Recap</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex gap-0.5">
            {(["24h", "4h", "weekly"] as Timeframe[]).map((tf) => {
              const isActive = timeframe === tf;
              const isProOnly = tf !== "24h";
              return (
                <span
                  key={tf}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    isActive
                      ? "bg-primary/20 text-primary font-medium"
                      : "bg-secondary/60 text-muted-foreground"
                  } ${isProOnly && !isPro ? "opacity-40" : ""}`}
                >
                  {TIMEFRAME_LABELS[tf]}
                  {isProOnly && !isPro && <Crown className="inline h-2 w-2 ml-0.5" />}
                </span>
              );
            })}
          </div>

          {/* Refresh button — Pro only */}
          {recapRefresh ? (
            <button
              onClick={fetchRecap}
              disabled={!canRefresh || loading}
              className="p-1 rounded hover:bg-secondary/60 disabled:opacity-30 transition-colors"
              aria-label="Refresh recap"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
          ) : (
            <div className="p-1 opacity-30 cursor-not-allowed" title="Pro feature">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        {loading && !recap ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-secondary/60 rounded w-full" />
            <div className="h-3 bg-secondary/60 rounded w-5/6" />
            <div className="h-3 bg-secondary/60 rounded w-4/6" />
            <div className="h-3 bg-secondary/60 rounded w-full" />
            <div className="h-3 bg-secondary/60 rounded w-3/4" />
          </div>
        ) : recap?.error && recap.text === "Market recap temporarily unavailable." ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Sparkles className="h-8 w-8 opacity-30" />
            <p className="text-xs text-center">{recap.text}</p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {recap?.text}
          </p>
        )}
      </ScrollArea>

      {/* Footer */}
      {timeAgo && !recap?.error && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
          {recap?.cached && <span>• cached</span>}
          {recap?.fallback && <span>• fallback</span>}
        </div>
      )}
    </div>
  );

  // Free users always see 24h recap — no gate on the whole widget
  return recapContent;
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default MarketRecapWidget;
