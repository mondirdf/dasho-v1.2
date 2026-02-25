/**
 * TradePatternWidget v2 — Behavioral Intelligence Dashboard
 * Shows Edge Score, NL insights, time clusters, and pattern analysis.
 */
import { useState, useEffect } from "react";
import {
  Brain, TrendingUp, TrendingDown, BarChart3,
  AlertTriangle, Zap, Clock, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeTradePatterns, type PatternAnalysis, type PatternInsight } from "@/engines/tradePatternEngine";
import {
  computeEdgeScore,
  generateNLInsights,
  clusterByTimeOfDay,
  type EdgeScoreBreakdown,
  type BehavioralInsight,
  type TimeCluster,
} from "@/engines/behavioralIntelligenceEngine";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const TradePatternWidget = ({ config }: { config: any }) => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [edgeScore, setEdgeScore] = useState<EdgeScoreBreakdown | null>(null);
  const [nlInsights, setNlInsights] = useState<BehavioralInsight[]>([]);
  const [timeClusters, setTimeClusters] = useState<TimeCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"edge" | "insights" | "patterns" | "time">("edge");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);

      const [tradesRes, scoreRes] = await Promise.all([
        supabase.from("trades").select("*").eq("user_id", user.id).eq("status", "closed").order("entry_time", { ascending: false }).limit(200),
        supabase.from("edge_scores").select("score").eq("user_id", user.id).order("week_start", { ascending: false }).limit(1),
      ]);

      if (tradesRes.data && tradesRes.data.length > 0) {
        const trades = tradesRes.data.map((t: any) => ({
          ...t,
          market_context: t.market_context || {},
          tags: t.tags || [],
          behavioral_flags: t.behavioral_flags || [],
          rule_violations: t.rule_violations || [],
        }));

        setAnalysis(analyzeTradePatterns(trades));

        const prevScore = scoreRes.data?.[0]?.score ?? 50;
        setEdgeScore(computeEdgeScore(trades, Number(prevScore)));
        setNlInsights(generateNLInsights(trades));
        setTimeClusters(clusterByTimeOfDay(trades));

        // Persist edge score
        const weekStart = getWeekStart();
        const edge = computeEdgeScore(trades, Number(prevScore));
        await supabase.from("edge_scores").upsert({
          user_id: user.id,
          week_start: weekStart,
          score: edge.overall,
          components: { discipline: edge.discipline, contextAwareness: edge.contextAwareness, patternAdherence: edge.patternAdherence } as any,
          trades_count: trades.length,
        }, { onConflict: "user_id,week_start" });
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
        <p className="text-[11px] text-muted-foreground/50">Need at least 3 closed trades to detect patterns.</p>
        <p className="text-[9px] text-muted-foreground/30">Log trades in the Trade Journal widget.</p>
      </div>
    );
  }

  const { stats } = analysis;

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Brain className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Decision Intelligence
        </span>
      </div>

      {/* Edge Score Hero */}
      {edgeScore && (
        <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/20 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${
                edgeScore.overall >= 70 ? "text-success" : edgeScore.overall >= 45 ? "text-warning" : "text-destructive"
              }`} />
              <div>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Edge Score</p>
                <p className={`text-lg font-black tabular-nums ${
                  edgeScore.overall >= 70 ? "text-success" : edgeScore.overall >= 45 ? "text-warning" : "text-destructive"
                }`}>
                  {edgeScore.overall}
                  <span className="text-[9px] font-normal text-muted-foreground/40">/100</span>
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[8px] px-1.5 py-0 ${
                edgeScore.trend === "improving" ? "border-success/30 text-success"
                : edgeScore.trend === "declining" ? "border-destructive/30 text-destructive"
                : "border-border/30 text-muted-foreground"
              }`}
            >
              {edgeScore.trend === "improving" ? "↑ Improving" : edgeScore.trend === "declining" ? "↓ Declining" : "→ Stable"}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <ScorePill label="Discipline" value={edgeScore.discipline} />
            <ScorePill label="Context" value={edgeScore.contextAwareness} />
            <ScorePill label="Patterns" value={edgeScore.patternAdherence} />
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-1 shrink-0">
        <MiniStat label="W/L" value={`${stats.wins}/${stats.losses}`} />
        <MiniStat label="WR" value={`${stats.winRate.toFixed(0)}%`} color={stats.winRate >= 55 ? "text-success" : "text-destructive"} />
        <MiniStat label="PF" value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(1)} />
        <MiniStat label="Streak" value={`${stats.longestWinStreak}W/${stats.longestLoseStreak}L`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 shrink-0 overflow-x-auto scrollbar-none">
        {([
          { key: "edge", label: "🧠 Insights" },
          { key: "patterns", label: "📊 Patterns" },
          { key: "time", label: "🕐 Time" },
          { key: "insights", label: "⚡ Best/Worst" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-2 py-1 rounded-md text-[9px] font-medium transition-colors ${
              tab === t.key ? "bg-primary/15 text-primary" : "text-muted-foreground/50 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 scrollbar-none">
        {tab === "edge" && (
          nlInsights.length > 0 ? (
            nlInsights.map((insight) => (
              <NLInsightCard key={insight.id} insight={insight} />
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground/40 text-center py-4">Need more trades for insights</p>
          )
        )}

        {tab === "patterns" && (
          analysis.insights.length > 0 ? (
            analysis.insights.map((insight, i) => (
              <PatternCard key={i} insight={insight} />
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground/40 text-center py-4">Need more trades for patterns</p>
          )
        )}

        {tab === "time" && (
          timeClusters.length > 0 ? (
            timeClusters.map((tc) => (
              <TimeCard key={tc.hour} cluster={tc} />
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground/40 text-center py-4">Need more trades for time analysis</p>
          )
        )}

        {tab === "insights" && (
          <>
            {analysis.bestConditions.length > 0 && (
              <>
                <p className="text-[9px] font-bold uppercase tracking-widest text-success/60 px-1">Best Conditions</p>
                {analysis.bestConditions.map((i, idx) => <PatternCard key={`b${idx}`} insight={i} />)}
              </>
            )}
            {analysis.worstConditions.length > 0 && (
              <>
                <p className="text-[9px] font-bold uppercase tracking-widest text-destructive/60 px-1 mt-2">Worst Conditions</p>
                {analysis.worstConditions.map((i, idx) => <PatternCard key={`w${idx}`} insight={i} />)}
              </>
            )}
            {analysis.bestConditions.length === 0 && analysis.worstConditions.length === 0 && (
              <p className="text-[10px] text-muted-foreground/40 text-center py-4">Need more trades</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ── Sub-components ── */

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "text-success" : value >= 45 ? "text-warning" : "text-destructive";
  return (
    <div className="text-center p-1.5 rounded-md bg-secondary/40">
      <p className="text-[7px] text-muted-foreground/40 uppercase">{label}</p>
      <p className={`text-xs font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center p-1.5 rounded-md bg-secondary/20 border border-border/10">
      <p className="text-[7px] text-muted-foreground/40">{label}</p>
      <p className={`text-[11px] font-bold tabular-nums ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

function NLInsightCard({ insight }: { insight: BehavioralInsight }) {
  const Icon = insight.type === "positive" ? TrendingUp : insight.type === "negative" ? AlertTriangle : Brain;
  const color = insight.type === "positive" ? "text-success" : insight.type === "negative" ? "text-destructive" : "text-muted-foreground";
  const bg = insight.type === "positive" ? "bg-success/5 border-success/15" : insight.type === "negative" ? "bg-destructive/5 border-destructive/15" : "bg-secondary/30 border-border/20";

  return (
    <div className={`p-2.5 rounded-lg border ${bg}`}>
      <div className="flex items-start gap-2">
        <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-foreground/80 leading-relaxed">{insight.message}</p>
          <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground/40">
            <span>{insight.tradeCount} trades</span>
            <span>•</span>
            <span>Confidence: {insight.confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatternCard({ insight }: { insight: PatternInsight }) {
  const color = insight.type === "positive" ? "text-success" : insight.type === "negative" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/20 border border-border/10">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-foreground/80">{insight.label}</p>
        <p className="text-[8px] text-muted-foreground/40">{insight.tradeCount} trades · Avg PnL: {insight.avgPnl >= 0 ? "+" : ""}{insight.avgPnl.toFixed(2)}</p>
      </div>
      <span className={`text-[11px] font-bold tabular-nums ${color}`}>{insight.winRate.toFixed(0)}%</span>
    </div>
  );
}

function TimeCard({ cluster }: { cluster: TimeCluster }) {
  const color = cluster.winRate >= 60 ? "text-success" : cluster.winRate <= 40 ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/20 border border-border/10">
      <Clock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-foreground/80">{cluster.label}</p>
        <p className="text-[8px] text-muted-foreground/40">{cluster.trades} trades</p>
      </div>
      <div className="text-right">
        <p className={`text-[11px] font-bold tabular-nums ${color}`}>{cluster.winRate.toFixed(0)}%</p>
        <p className="text-[8px] text-muted-foreground/40">{cluster.avgPnl >= 0 ? "+" : ""}{cluster.avgPnl.toFixed(1)}</p>
      </div>
    </div>
  );
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export default TradePatternWidget;
