/**
 * EdgeInsightsWidget — "Your Edge Insights"
 * Displays behavioral pattern summary computed server-side.
 */
import { memo, useState, useEffect, useCallback } from "react";
import { Brain, Activity, Clock, Gauge, Bell, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WidgetHeader, WidgetEmptyState } from "./shared";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface EdgeSummary {
  total_events: number;
  day_span?: number;
  top_symbols?: { symbol: string; count: number }[];
  event_types?: Record<string, number>;
  fear_greed_affinity?: { bucket: string; count: number } | null;
  session_affinity?: { session: string; count: number } | null;
  alert_hit_rate?: number | null;
  alerts_created?: number;
  alerts_triggered?: number;
  volatility_regimes?: Record<string, number>;
}

interface Props {
  config: any;
}

const BUCKET_LABELS: Record<string, string> = {
  extreme_fear: "Extreme Fear",
  fear: "Fear",
  neutral: "Neutral",
  greed: "Greed",
  extreme_greed: "Extreme Greed",
};

const EdgeInsightsWidget = memo(({ config }: Props) => {
  const [summary, setSummary] = useState<EdgeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const { data, error: fnError } = await supabase.functions.invoke("edge-intelligence", {
        body: { action: "get-summary" },
      });
      if (fnError) throw fnError;
      if (data?.summary) {
        setSummary(data.summary);
      } else {
        setSummary(null);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return <WidgetEmptyState error message="Failed to load insights" onRetry={loadData} />;
  }

  if (!summary || summary.total_events === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
        <Brain className="h-8 w-8 text-primary/40" />
        <p className="text-sm font-medium text-foreground">Building Your Edge</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
          Keep using Dasho. Your behavioral insights will appear here as data accumulates.
        </p>
      </div>
    );
  }

  const maxSymbolCount = summary.top_symbols?.[0]?.count || 1;

  return (
    <div className="p-3 space-y-3 h-full overflow-auto">
      <WidgetHeader title="Your Edge" status="cached" />

      {/* Data maturity */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Activity className="h-3 w-3" />
        <span>Based on {summary.total_events} interactions over {summary.day_span || 1} days</span>
      </div>

      {/* Top Symbols */}
      {summary.top_symbols && summary.top_symbols.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" /> Top Symbols
          </p>
          {summary.top_symbols.map((s) => (
            <div key={s.symbol} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground w-10">{s.symbol}</span>
              <Progress value={(s.count / maxSymbolCount) * 100} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground w-6 text-right">{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Peak Session + Fear/Greed Affinity */}
      <div className="grid grid-cols-2 gap-2">
        {summary.session_affinity && (
          <div className="p-2 rounded-lg bg-secondary/40 border border-border/30 text-center">
            <Clock className="h-3 w-3 text-muted-foreground mx-auto mb-0.5" />
            <p className="text-[10px] text-muted-foreground">Peak Session</p>
            <p className="text-xs font-bold text-foreground capitalize">{summary.session_affinity.session}</p>
          </div>
        )}
        {summary.fear_greed_affinity && (
          <div className="p-2 rounded-lg bg-secondary/40 border border-border/30 text-center">
            <Gauge className="h-3 w-3 text-muted-foreground mx-auto mb-0.5" />
            <p className="text-[10px] text-muted-foreground">Most Active In</p>
            <p className="text-xs font-bold text-foreground">
              {BUCKET_LABELS[summary.fear_greed_affinity.bucket] || summary.fear_greed_affinity.bucket}
            </p>
          </div>
        )}
      </div>

      {/* Alert Hit Rate */}
      {summary.alert_hit_rate !== null && summary.alert_hit_rate !== undefined && (
        <div className="p-2 rounded-lg bg-secondary/40 border border-border/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Bell className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Alert Effectiveness</p>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={summary.alert_hit_rate} className="h-1.5 flex-1" />
            <span className="text-xs font-bold text-foreground">{summary.alert_hit_rate}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {summary.alerts_triggered || 0} triggered / {summary.alerts_created || 0} created
          </p>
        </div>
      )}
    </div>
  );
});

EdgeInsightsWidget.displayName = "EdgeInsightsWidget";
export default EdgeInsightsWidget;
