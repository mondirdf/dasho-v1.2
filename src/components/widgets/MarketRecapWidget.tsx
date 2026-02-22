/**
 * MarketRecapWidget — AI-powered market recap with Pro gating.
 * Visually distinct: darker tone, clear title, subtle timestamp.
 */
import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, Clock, Crown } from "lucide-react";
import { getMarketRecap, canRefreshRecap, type MarketRecap } from "@/engines/marketRecapEngine";
import { trackEvent } from "@/analytics/behaviorTracker";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { usePreferences } from "@/hooks/usePreferences";

type Timeframe = "24h" | "4h" | "weekly";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "24h": "24h",
  "4h": "4h",
  weekly: "7d",
};

const RecapSkeleton = () => (
  <div className="space-y-2.5">
    <Skeleton className="h-2.5 w-full" />
    <Skeleton className="h-2.5 w-[92%]" />
    <Skeleton className="h-2.5 w-[78%]" />
    <Skeleton className="h-2.5 w-full" />
    <Skeleton className="h-2.5 w-[85%]" />
    <Skeleton className="h-2.5 w-[60%]" />
  </div>
);

// Module-level cache so data survives widget remounts (e.g. drag/resize)
let _cachedRecap: MarketRecap | null = null;

const MarketRecapWidget = ({ config }: { config: any }) => {
  const [ref, size] = useWidgetSize();
  const [recap, setRecap] = useState<MarketRecap | null>(_cachedRecap);
  const [loading, setLoading] = useState(!_cachedRecap);
  const [canRefresh, setCanRefresh] = useState(false);
  const { isPro, recapRefresh } = usePlanLimits();
  const { preferences } = usePreferences();

  const timeframe: Timeframe = config?.timeframe ?? "24h";

  const fetchRecap = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMarketRecap("crypto", "24h", {
        recapDetailLevel: preferences.recapDetailLevel,
        selectedCoins: preferences.selectedCoins,
      });
      _cachedRecap = data;
      setRecap(data);
      setCanRefresh(false);
      if (data && !data.error) {
        trackEvent("recap_view");
      }
    } finally {
      setLoading(false);
    }
  }, [preferences.recapDetailLevel, preferences.selectedCoins]);

  useEffect(() => {
    if (!_cachedRecap) {
      fetchRecap();
    }
    const interval = setInterval(() => {
      setCanRefresh(canRefreshRecap("crypto", "24h"));
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchRecap]);

  const timeAgo = recap?.generatedAt ? formatTimeAgo(recap.generatedAt) : null;

  return (
    <div ref={ref} className="h-full flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
            AI Recap
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Timeframe pills */}
          <div className="flex gap-0.5 bg-secondary/20 rounded-md p-0.5">
            {(["24h", "4h", "weekly"] as Timeframe[]).map((tf) => {
              const isActive = timeframe === tf;
              const isProOnly = tf !== "24h";
              return (
                <span
                  key={tf}
                  className={`text-[8px] px-1.5 py-0.5 rounded transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-muted-foreground/35 hover:text-muted-foreground/50"
                  } ${isProOnly && !isPro ? "opacity-25" : ""}`}
                >
                  {TIMEFRAME_LABELS[tf]}
                  {isProOnly && !isPro && <Crown className="inline h-2 w-2 ml-0.5" />}
                </span>
              );
            })}
          </div>

          {recapRefresh ? (
            <button
              onClick={fetchRecap}
              disabled={!canRefresh || loading}
              className="p-1 rounded-md hover:bg-secondary/30 disabled:opacity-15 transition-all"
              aria-label="Refresh recap"
            >
              <RefreshCw className={`h-3 w-3 text-muted-foreground/40 ${loading ? "animate-spin" : ""}`} />
            </button>
          ) : (
            <div className="p-1 opacity-15" title="Pro feature">
              <RefreshCw className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      {timeAgo && !loading && !recap?.error && (
        <div className="flex items-center gap-1">
          <Clock className="h-2 w-2 text-muted-foreground/25" />
          <span className="text-[7px] text-muted-foreground/25 tabular-nums font-medium">
            Updated {timeAgo}
            {recap?.cached && " · cached"}
          </span>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        {loading && !recap ? (
          <RecapSkeleton />
        ) : recap?.error && recap.text === "Market recap temporarily unavailable." ? (
          <div className="flex flex-col items-center justify-center h-full gap-2.5 text-muted-foreground py-6">
            <div className="p-3 rounded-xl bg-secondary/20">
              <Sparkles className="h-6 w-6 opacity-20" />
            </div>
            <p className="text-[10px] font-medium">Market recap temporarily unavailable.</p>
            <p className="text-[8px] text-muted-foreground/30">Data will refresh automatically.</p>
          </div>
        ) : (
          <p className="text-[11px] leading-[1.7] text-foreground/75 whitespace-pre-line">
            {recap?.text}
          </p>
        )}
      </ScrollArea>
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default MarketRecapWidget;
