/**
 * MarketRecapWidget — AI-powered market recap with Pro gating.
 * Primary dashboard widget optimized for daily habit formation.
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
import ProGate from "@/components/ProGate";

type Timeframe = "24h" | "4h" | "weekly";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "24h": "24h",
  "4h": "4h",
  weekly: "7d",
};

/** Smooth skeleton that matches recap content layout */
const RecapSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-[92%]" />
    <Skeleton className="h-3 w-[78%]" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-[85%]" />
    <Skeleton className="h-3 w-[60%]" />
  </div>
);

const MarketRecapWidget = ({ config }: { config: any }) => {
  const [ref, size] = useWidgetSize();
  const [recap, setRecap] = useState<MarketRecap | null>(null);
  const [loading, setLoading] = useState(true);
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
    fetchRecap();
    const interval = setInterval(() => {
      setCanRefresh(canRefreshRecap("crypto", "24h"));
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchRecap]);

  const timeAgo = recap?.generatedAt ? formatTimeAgo(recap.generatedAt) : null;

  return (
    <div ref={ref} className="h-full flex flex-col p-4 gap-3">
      {/* Header with time context */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">
              Market Recap — Last 24h
            </span>
          </div>
          {/* Human-readable timestamp */}
          {timeAgo && !loading && !recap?.error && (
            <div className="flex items-center gap-1 ml-6">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Updated {timeAgo}
                {recap?.cached && " · cached"}
              </span>
            </div>
          )}
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

      {/* Content with smooth skeleton */}
      <ScrollArea className="flex-1 min-h-0">
        {loading && !recap ? (
          <RecapSkeleton />
        ) : recap?.error && recap.text === "Market recap temporarily unavailable." ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-6">
            <Sparkles className="h-8 w-8 opacity-30" />
            <div className="text-center space-y-1">
              <p className="text-xs font-medium">Market recap temporarily unavailable.</p>
              <p className="text-[10px] text-muted-foreground/70">Data will refresh automatically.</p>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {recap?.text}
          </p>
        )}
      </ScrollArea>

      {/* Habit reinforcement footer */}
      {!loading && !recap?.error && (
        <p className="text-[9px] text-muted-foreground/50 text-center shrink-0">
          Stay updated daily for smarter market awareness.
        </p>
      )}
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
