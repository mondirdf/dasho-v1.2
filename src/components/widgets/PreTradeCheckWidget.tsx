/**
 * PreTradeCheckWidget — "The Brain of Dasho"
 * Mandatory pre-trade checkpoint combining regime, volatility, sentiment,
 * news, and distribution into an actionable summary.
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePersonalBias } from "@/hooks/usePersonalBias";
import { useDashboard } from "@/contexts/DashboardContext";
import { useOHLCData } from "@/hooks/useOHLCData";
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

/* ──────────────────────────── Posture Config ──────────────────────────── */

const POSTURE_CONFIG: Record<
  RiskPosture,
  { icon: typeof Shield; color: string; bg: string }
> = {
  Defensive: {
    icon: Shield,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
  Neutral: {
    icon: Eye,
    color: "text-muted-foreground",
    bg: "bg-secondary/40 border-border/40",
  },
  Opportunistic: {
    icon: Swords,
    color: "text-success",
    bg: "bg-success/10 border-success/20",
  },
  Aggressive: {
    icon: Flame,
    color: "text-warning",
    bg: "bg-warning/10 border-warning/20",
  },
};

/* ──────────────────────────── Component ──────────────────────────── */

const PreTradeCheckWidget = ({ config }: { config: any }) => {
  const bias = usePersonalBias();
  const { widgets } = useDashboard();
  const [fearGreed, setFearGreed] = useState<number | undefined>(undefined);
  const [hasRecentNews, setHasRecentNews] = useState<boolean | undefined>(undefined);
  const [checklistOpen, setChecklistOpen] = useState(true);

  // Fetch OHLC for volatility (BTC 1h baseline)
  const ohlcParams = useMemo(() => ({ symbol: "BTC", timeframe: "1h" }), []);
  const hasVolWidget = widgets.some((w) => w.type === "volatility_regime");
  const { data: candles = [] } = useOHLCData(ohlcParams, true);

  // Fetch Fear & Greed + recent news
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

      if (fgRes.data) setFearGreed(fgRes.data.value);

      if (newsRes.data?.published_at) {
        const newsAge = Date.now() - new Date(newsRes.data.published_at).getTime();
        setHasRecentNews(newsAge < 12 * 60 * 60 * 1000); // 12h
      }
    };
    fetchContext();
  }, []);

  // Compute volatility
  const volatility = useMemo(() => {
    if (candles.length < 50) return undefined;
    return analyzeVolatilityRegime(candles);
  }, [candles]);

  // Session
  const session = useMemo(() => analyzeSession(), []);

  // Pre-Trade Check
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
        <p className="text-[11px] text-muted-foreground/50">Loading pre-trade analysis…</p>
      </div>
    );
  }

  const postureConf = POSTURE_CONFIG[check.riskPosture];
  const PostureIcon = postureConf.icon;

  return (
    <div className="h-full flex flex-col gap-3">
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
        {/* Readiness badge */}
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

      {/* Context + Implication */}
      <div className="space-y-2 shrink-0">
        <p className="text-[11px] leading-relaxed text-foreground/80 font-medium">
          {check.contextSummary}
        </p>
        <p className="text-[10px] leading-relaxed text-muted-foreground/70 italic">
          {check.implicationSummary}
        </p>
      </div>

      {/* Risk Posture */}
      <div
        className={`flex items-center gap-3 p-2.5 rounded-lg border ${postureConf.bg} shrink-0`}
      >
        <PostureIcon className={`h-4 w-4 ${postureConf.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
            Risk Posture
          </p>
          <p className={`text-sm font-bold ${postureConf.color}`}>
            {check.riskPosture}
          </p>
        </div>
        {/* Readiness bar */}
        <div className="w-16">
          <Progress
            value={check.readiness}
            className="h-1.5"
          />
        </div>
      </div>

      {/* Before You Trade Checklist */}
      <div className="flex-1 min-h-0">
        <button
          onClick={() => setChecklistOpen(!checklistOpen)}
          className="flex items-center gap-1.5 w-full text-left mb-2"
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Before You Trade
          </span>
          {checklistOpen ? (
            <ChevronUp className="h-2.5 w-2.5 text-muted-foreground/30" />
          ) : (
            <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/30" />
          )}
        </button>

        {checklistOpen && (
          <div className="space-y-1.5">
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
                  className="flex items-start gap-2 p-2 rounded-md bg-secondary/20 border border-border/20"
                >
                  <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${iconColor}`} />
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PreTradeCheckWidget;
