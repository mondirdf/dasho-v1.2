/**
 * PreTradeCheckWidget — "Cockpit Warning System"
 * Full-focus modal decision interface with large risk posture,
 * color-coded regime, historical performance badge,
 * animated confidence bar, and binary recommendation.
 */
import { useMemo, useEffect, useState } from "react";
import {
  Brain,
  Shield,
  Swords,
  Eye,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePersonalBias } from "@/hooks/usePersonalBias";
import { useDashboard } from "@/contexts/DashboardContext";
import { useOHLCData } from "@/hooks/useOHLCData";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeVolatilityRegime } from "@/engines/volatilityRegimeEngine";
import { analyzeSession } from "@/engines/sessionEngine";
import {
  computePreTradeCheck,
  type RiskPosture,
  type PreTradeCheckResult,
} from "@/engines/preTradeCheckEngine";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ──────────────────────────── Posture Config ──────────────────────────── */

const POSTURE_CONFIG: Record<
  RiskPosture,
  { icon: typeof Shield; label: string; color: string; bg: string; glow: string }
> = {
  Defensive: {
    icon: Shield,
    label: "SAFE",
    color: "text-success",
    bg: "bg-success/10 border-success/25",
    glow: "shadow-[0_0_30px_hsl(152_69%_45%/0.15)]",
  },
  Neutral: {
    icon: Eye,
    label: "CAUTION",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/25",
    glow: "shadow-[0_0_30px_hsl(38_92%_50%/0.15)]",
  },
  Opportunistic: {
    icon: Swords,
    label: "CAUTION",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/25",
    glow: "shadow-[0_0_30px_hsl(38_92%_50%/0.15)]",
  },
  Aggressive: {
    icon: Flame,
    label: "HIGH RISK",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/25",
    glow: "shadow-[0_0_30px_hsl(0_72%_55%/0.15)]",
  },
};

/* ──────────────────────────── Regime Colors ──────────────────────────── */

const REGIME_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  compression: { bg: "bg-accent/15", text: "text-accent", label: "Compression" },
  expansion: { bg: "bg-destructive/15", text: "text-destructive", label: "Expansion" },
  trending: { bg: "bg-success/15", text: "text-success", label: "Trending" },
  distribution: { bg: "bg-warning/15", text: "text-warning", label: "Distribution" },
};

/* ──────────────────────────── Recommendation ──────────────────────────── */

function getRecommendation(check: PreTradeCheckResult): {
  text: string;
  color: string;
  icon: typeof Shield;
} {
  if (check.readiness >= 75 && check.riskPosture !== "Aggressive") {
    return { text: "Proceed with caution", color: "text-success", icon: CheckCircle2 };
  }
  if (check.readiness >= 50) {
    return { text: "Reduce size", color: "text-warning", icon: AlertTriangle };
  }
  return { text: "Avoid trade", color: "text-destructive", icon: XCircle };
}

/* ──────────────────────────── Component ──────────────────────────── */

const PreTradeCheckWidget = ({ config }: { config: any }) => {
  const { user } = useAuth();
  const bias = usePersonalBias();
  const { widgets } = useDashboard();
  const [fearGreed, setFearGreed] = useState<number | undefined>(undefined);
  const [hasRecentNews, setHasRecentNews] = useState<boolean | undefined>(undefined);
  const [historicalWinRate, setHistoricalWinRate] = useState<number | null>(null);
  const [historicalCount, setHistoricalCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const ohlcParams = useMemo(() => ({ symbol: "BTC", timeframe: "1h" }), []);
  const { data: candles = [] } = useOHLCData(ohlcParams, true);

  // Fetch context data + historical win rate
  useEffect(() => {
    const fetchContext = async () => {
      const [fgRes, newsRes] = await Promise.all([
        supabase
          .from("cache_fear_greed")
          .select("value")
          .eq("id", "current")
          .single(),
        supabase
          .from("cache_news")
          .select("published_at")
          .order("published_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

      let tradesRes: any = null;
      if (user) {
        tradesRes = await supabase
          .from("trades")
          .select("outcome, market_context")
          .eq("user_id", user.id)
          .eq("status", "closed")
          .order("entry_time", { ascending: false })
          .limit(100);
      }

      if (fgRes.data) setFearGreed(fgRes.data.value);

      if (newsRes.data?.published_at) {
        const newsAge = Date.now() - new Date(newsRes.data.published_at).getTime();
        setHasRecentNews(newsAge < 12 * 60 * 60 * 1000);
      }

      // Calculate historical win rate for current regime
      if (tradesRes?.data && tradesRes.data.length > 0) {
        const trades = tradesRes.data;
        const wins = trades.filter((t: any) => t.outcome === "win").length;
        setHistoricalWinRate(Math.round((wins / trades.length) * 100));
        setHistoricalCount(trades.length);
      }
    };
    fetchContext();
  }, [user]);

  const volatility = useMemo(() => {
    if (candles.length < 50) return undefined;
    return analyzeVolatilityRegime(candles);
  }, [candles]);

  const session = useMemo(() => analyzeSession(), []);

  const check: PreTradeCheckResult | null = useMemo(() => {
    if (!bias && !volatility && fearGreed === undefined) return null;
    return computePreTradeCheck({
      bias: bias ?? undefined,
      volatility,
      session,
      fearGreed,
      hasRecentNews,
    });
  }, [bias, volatility, session, fearGreed, hasRecentNews]);

  if (!check) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const postureConf = POSTURE_CONFIG[check.riskPosture];
  const PostureIcon = postureConf.icon;
  const recommendation = getRecommendation(check);
  const RecIcon = recommendation.icon;
  const regime = volatility?.regime;
  const regimeConf = regime ? REGIME_COLORS[regime] : null;

  return (
    <>
      {/* Compact Card View */}
      <div
        className="h-full flex flex-col gap-3 cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Brain className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Pre-Trade Check
            </span>
          </div>
          <Badge
            variant="outline"
            className={`text-[9px] px-2 py-0.5 ${
              check.readiness >= 75
                ? "border-success/30 text-success"
                : check.readiness >= 50
                ? "border-warning/30 text-warning"
                : "border-destructive/30 text-destructive"
            }`}
          >
            {check.passedCount}/{check.totalCount} Passed
          </Badge>
        </div>

        {/* Large Risk Posture */}
        <div
          className={`flex items-center gap-4 p-4 rounded-xl border ${postureConf.bg} ${postureConf.glow} shrink-0`}
        >
          <PostureIcon className={`h-8 w-8 ${postureConf.color}`} />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
              Risk Posture
            </p>
            <p className={`text-xl font-black tracking-tight ${postureConf.color}`}>
              {postureConf.label}
            </p>
          </div>
          {/* Animated confidence bar */}
          <div className="w-20">
            <p className="text-[8px] text-muted-foreground/40 text-right mb-1">
              {check.readiness}%
            </p>
            <div className="relative h-2 rounded-full bg-secondary/60 overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  check.readiness >= 75
                    ? "bg-success"
                    : check.readiness >= 50
                    ? "bg-warning"
                    : "bg-destructive"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${check.readiness}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Regime + Historical Badge Row */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {regimeConf && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${regimeConf.bg}`}>
              <Activity className={`h-3 w-3 ${regimeConf.text}`} />
              <span className={`text-[10px] font-semibold ${regimeConf.text}`}>
                {regimeConf.label}
              </span>
            </div>
          )}
          {historicalWinRate !== null && historicalCount >= 3 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/40 border border-border/20">
              <TrendingUp className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-[10px] font-semibold text-foreground/70">
                You win {historicalWinRate}% in this setup
              </span>
            </div>
          )}
        </div>

        {/* Binary Recommendation */}
        <div className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20 shrink-0`}>
          <RecIcon className={`h-5 w-5 shrink-0 ${recommendation.color}`} />
          <span className={`text-sm font-bold ${recommendation.color}`}>
            {recommendation.text}
          </span>
        </div>

        {/* Tap to expand hint */}
        <p className="text-[8px] text-muted-foreground/30 text-center">
          Tap for full analysis
        </p>
      </div>

      {/* Full Focus Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/40 gap-0 p-0 overflow-hidden">
          {/* Modal Header */}
          <div className={`p-5 border-b border-border/20 ${postureConf.bg}`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/15">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-normal">
                    Pre-Trade Check
                  </p>
                  <p className="text-lg font-black">Decision Analysis</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Large Posture Display */}
            <div className="mt-4 flex items-center gap-4">
              <PostureIcon className={`h-12 w-12 ${postureConf.color}`} />
              <div>
                <p className={`text-3xl font-black tracking-tight ${postureConf.color}`}>
                  {postureConf.label}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  {check.riskPosture} posture based on {check.totalCount} signals
                </p>
              </div>
            </div>

            {/* Animated Confidence Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50">
                  Readiness
                </span>
                <span className={`text-sm font-bold tabular-nums ${
                  check.readiness >= 75 ? "text-success" 
                  : check.readiness >= 50 ? "text-warning" 
                  : "text-destructive"
                }`}>
                  {check.readiness}%
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-secondary/60 overflow-hidden">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    check.readiness >= 75
                      ? "bg-success"
                      : check.readiness >= 50
                      ? "bg-warning"
                      : "bg-destructive"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${check.readiness}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-none">
            {/* Regime + Historical Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {regimeConf && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${regimeConf.bg}`}>
                  <Activity className={`h-3.5 w-3.5 ${regimeConf.text}`} />
                  <span className={`text-[11px] font-bold ${regimeConf.text}`}>
                    {regimeConf.label}
                  </span>
                </div>
              )}
              {historicalWinRate !== null && historicalCount >= 3 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border/20">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-[11px] font-semibold text-foreground/70">
                    You win {historicalWinRate}% in this setup
                  </span>
                </div>
              )}
            </div>

            {/* Context */}
            <div className="space-y-1.5">
              <p className="text-[11px] leading-relaxed text-foreground/80 font-medium">
                {check.contextSummary}
              </p>
              <p className="text-[10px] leading-relaxed text-muted-foreground/60 italic">
                {check.implicationSummary}
              </p>
            </div>

            {/* Binary Recommendation — Large */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              check.readiness >= 75 ? "bg-success/5 border-success/20" 
              : check.readiness >= 50 ? "bg-warning/5 border-warning/20" 
              : "bg-destructive/5 border-destructive/20"
            }`}>
              <RecIcon className={`h-6 w-6 ${recommendation.color}`} />
              <div>
                <p className={`text-base font-black ${recommendation.color}`}>
                  {recommendation.text}
                </p>
                <p className="text-[9px] text-muted-foreground/50">
                  Based on {check.passedCount}/{check.totalCount} checks passed
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <button
                onClick={() => setChecklistOpen(!checklistOpen)}
                className="flex items-center gap-1.5 w-full text-left mb-2"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Signal Checklist
                </span>
                {checklistOpen ? (
                  <ChevronUp className="h-2.5 w-2.5 text-muted-foreground/30" />
                ) : (
                  <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/30" />
                )}
              </button>

              <AnimatePresence>
                {checklistOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    {check.checklist.map((item, i) => {
                      const Icon =
                        item.passed === true
                          ? CheckCircle2
                          : item.passed === false
                          ? XCircle
                          : HelpCircle;
                      const iconColor =
                        item.passed === true
                          ? "text-success"
                          : item.passed === false
                          ? "text-destructive"
                          : "text-muted-foreground/30";

                      return (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/20 border border-border/15"
                        >
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor}`} />
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-foreground/80">
                              {item.label}
                            </p>
                            <p className="text-[9px] text-muted-foreground/50 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreTradeCheckWidget;
