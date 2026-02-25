/**
 * TradePatternWidget — Win/Loss Pattern Detection
 * Analyzes trade history and reveals when the user wins/loses based on market conditions.
 */
import { useState, useEffect, useMemo } from "react";
import { Brain, TrendingUp, TrendingDown, BarChart3, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeTradePatterns, type PatternAnalysis, type PatternInsight } from "@/engines/tradePatternEngine";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const TradePatternWidget = ({ config }: { config: any }) => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stats" | "best" | "worst">("stats");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "closed")
        .order("entry_time", { ascending: false })
        .limit(200);

      if (data && data.length > 0) {
        const trades = data.map((t: any) => ({
          ...t,
          market_context: t.market_context || {},
          tags: t.tags || [],
        }));
        setAnalysis(analyzeTradePatterns(trades));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysis || analysis.stats.totalTrades < 3) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-4">
        <Brain className="h-8 w-8 text-muted-foreground/20" />
        <p className="text-[11px] text-muted-foreground/50">
          Need at least 3 closed trades to detect patterns.
        </p>
        <p className="text-[9px] text-muted-foreground/30">
          Log trades in the Trade Journal widget to unlock insights.
        </p>
      </div>
    );
  }

  const { stats } = analysis;

  return (
    <div className="h-full flex flex-col gap-2.5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Brain className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Pattern Detection
        </span>
        <Badge
          variant="outline"
          className={`ml-auto text-[9px] px-2 py-0.5 ${
            stats.winRate >= 55
              ? "border-success/30 text-success"
              : stats.winRate >= 45
              ? "border-warning/30 text-warning"
              : "border-destructive/30 text-destructive"
          }`}
        >
          {stats.winRate.toFixed(0)}% Win Rate
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <StatBox label="Trades" value={stats.totalTrades.toString()} />
        <StatBox label="W/L" value={`${stats.wins}/${stats.losses}`} />
        <StatBox label="PF" value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} />
        <StatBox
          label="PnL"
          value={`${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(1)}`}
          color={stats.totalPnl >= 0 ? "text-success" : "text-destructive"}
        />
      </div>

      {/* Win rate bar */}
      <div className="shrink-0">
        <div className="flex justify-between text-[8px] text-muted-foreground/40 mb-1">
          <span>Losses {stats.losses}</span>
          <span>Wins {stats.wins}</span>
        </div>
        <Progress value={stats.winRate} className="h-1.5" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 shrink-0">
        {(["stats", "best", "worst"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded-md text-[9px] font-medium transition-colors ${
              tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground/50 hover:text-foreground"
            }`}
          >
            {t === "stats" ? "Overview" : t === "best" ? "✅ Best" : "⚠️ Worst"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 scrollbar-none">
        {tab === "stats" && (
          <>
            <MetricRow label="Avg Win" value={`$${stats.avgWin.toFixed(2)}`} icon={TrendingUp} color="text-success" />
            <MetricRow label="Avg Loss" value={`$${stats.avgLoss.toFixed(2)}`} icon={TrendingDown} color="text-destructive" />
            <MetricRow label="Best Trade" value={`$${stats.bestTrade.toFixed(2)}`} icon={TrendingUp} color="text-success" />
            <MetricRow label="Worst Trade" value={`$${stats.worstTrade.toFixed(2)}`} icon={TrendingDown} color="text-destructive" />
            <MetricRow label="Avg Hold" value={`${stats.avgHoldTime.toFixed(1)}h`} icon={BarChart3} color="text-muted-foreground" />
          </>
        )}

        {tab === "best" && (
          analysis.bestConditions.length > 0 ? (
            analysis.bestConditions.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground/40 text-center py-4">
              Need more trades to identify winning patterns
            </p>
          )
        )}

        {tab === "worst" && (
          analysis.worstConditions.length > 0 ? (
            analysis.worstConditions.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground/40 text-center py-4">
              Need more trades to identify losing patterns
            </p>
          )
        )}
      </div>
    </div>
  );
};

/* ── Sub-components ── */

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2 rounded-lg bg-secondary/30 border border-border/20 text-center">
      <p className="text-[8px] text-muted-foreground/40">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

function MetricRow({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/20 border border-border/10">
      <Icon className={`h-3 w-3 ${color}`} />
      <span className="text-[10px] text-muted-foreground/60 flex-1">{label}</span>
      <span className={`text-[11px] font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function InsightCard({ insight }: { insight: PatternInsight }) {
  const icon = insight.type === "positive" ? TrendingUp : insight.type === "negative" ? AlertTriangle : BarChart3;
  const Icon = icon;
  const color = insight.type === "positive" ? "text-success" : insight.type === "negative" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="p-2.5 rounded-lg bg-secondary/20 border border-border/20 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`h-3 w-3 ${color}`} />
        <span className="text-[10px] font-semibold text-foreground/80">{insight.label}</span>
        <span className={`text-[9px] font-bold ml-auto tabular-nums ${color}`}>
          {insight.winRate.toFixed(0)}%
        </span>
      </div>
      <p className="text-[9px] text-muted-foreground/50">{insight.description}</p>
      <div className="flex items-center gap-2 text-[8px] text-muted-foreground/30">
        <span>{insight.tradeCount} trades</span>
        <span>•</span>
        <span>Avg PnL: {insight.avgPnl >= 0 ? "+" : ""}{insight.avgPnl.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default TradePatternWidget;
