/**
 * WeeklyReportWidget — Shows a weekly market summary report.
 * Aggregates data from cache tables to provide a 7-day overview.
 * Pro-only feature.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProGate from "@/components/ProGate";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface WeeklyData {
  topGainers: { symbol: string; change: number }[];
  topLosers: { symbol: string; change: number }[];
  avgSentiment: number;
  totalNewsCount: number;
  weekStart: string;
  weekEnd: string;
}

const WeeklyReportWidget = () => {
  const { isPro } = usePlanLimits();
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get crypto data for top movers
      const { data: cryptoData } = await supabase
        .from("cache_crypto_data")
        .select("symbol, change_24h, price");

      // Get fear greed for sentiment
      const { data: fgData } = await supabase
        .from("cache_fear_greed")
        .select("value")
        .eq("id", "current")
        .single();

      // Get news count
      const { count: newsCount } = await supabase
        .from("cache_news")
        .select("*", { count: "exact", head: true })
        .gte("fetched_at", weekStart.toISOString());

      const sorted = (cryptoData ?? [])
        .filter((c) => c.change_24h !== null)
        .sort((a, b) => (b.change_24h ?? 0) - (a.change_24h ?? 0));

      setData({
        topGainers: sorted.slice(0, 3).map((c) => ({ symbol: c.symbol, change: c.change_24h ?? 0 })),
        topLosers: sorted.slice(-3).reverse().map((c) => ({ symbol: c.symbol, change: c.change_24h ?? 0 })),
        avgSentiment: fgData?.value ?? 50,
        totalNewsCount: newsCount ?? 0,
        weekStart: weekStart.toLocaleDateString("en", { month: "short", day: "numeric" }),
        weekEnd: now.toLocaleDateString("en", { month: "short", day: "numeric" }),
      });
    } catch (err) {
      console.error("Weekly report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-3 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Weekly Report</h3>
        </div>
        {data && (
          <Badge variant="outline" className="text-[10px]">
            {data.weekStart} – {data.weekEnd}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 rounded" />)}
        </div>
      ) : data ? (
        <>
          {/* Sentiment */}
          <div className="glass-card p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Market Sentiment</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tabular-nums-animate">{data.avgSentiment}</span>
              <span className={`text-xs font-medium ${
                data.avgSentiment >= 60 ? "text-success" : data.avgSentiment <= 40 ? "text-destructive" : "text-muted-foreground"
              }`}>
                {data.avgSentiment >= 75 ? "Extreme Greed" : data.avgSentiment >= 60 ? "Greed" : data.avgSentiment >= 40 ? "Neutral" : data.avgSentiment >= 25 ? "Fear" : "Extreme Fear"}
              </span>
            </div>
          </div>

          {/* Top Gainers */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" /> Top Gainers
            </p>
            {data.topGainers.map((g) => (
              <div key={g.symbol} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-success/5">
                <span className="text-xs font-medium">{g.symbol}</span>
                <span className="text-xs font-bold text-success">+{g.change.toFixed(2)}%</span>
              </div>
            ))}
          </div>

          {/* Top Losers */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-destructive" /> Top Losers
            </p>
            {data.topLosers.map((l) => (
              <div key={l.symbol} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-destructive/5">
                <span className="text-xs font-medium">{l.symbol}</span>
                <span className="text-xs font-bold text-destructive">{l.change.toFixed(2)}%</span>
              </div>
            ))}
          </div>

          {/* News summary */}
          <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-secondary/30">
            <span className="text-[11px] text-muted-foreground">News articles this week</span>
            <span className="text-sm font-bold tabular-nums-animate">{data.totalNewsCount}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
      )}
    </div>
  );

  if (!isPro) {
    return <ProGate feature="Weekly Report">{content}</ProGate>;
  }

  return content;
};

export default WeeklyReportWidget;
