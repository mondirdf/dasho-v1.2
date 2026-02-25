/**
 * TradeJournalWidget v2 — Context-Aware Trade Journal
 * Auto-captures market context, detects behavioral patterns,
 * shows pre-trade feedback, and tracks discipline.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen, Plus, TrendingUp, TrendingDown, X,
  ChevronDown, ChevronUp, Clock, AlertTriangle,
  Shield, ShieldAlert, Brain,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePersonalBias } from "@/hooks/usePersonalBias";
import { useOHLCData } from "@/hooks/useOHLCData";
import { analyzeVolatilityRegime } from "@/engines/volatilityRegimeEngine";
import { analyzeSession } from "@/engines/sessionEngine";
import { Badge } from "@/components/ui/badge";
import {
  detectBehavioralFlags,
  generatePreTradeFeedback,
  type BehavioralFlag,
  type PreTradeFeedback,
} from "@/engines/behavioralIntelligenceEngine";
import type { MarketContextSnapshot, Trade } from "@/engines/tradePatternEngine";

interface TradeRow {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  outcome: string | null;
  status: string;
  entry_time: string;
  exit_time: string | null;
  market_context: MarketContextSnapshot;
  notes: string | null;
  tags: string[];
  pre_trade_check_skipped: boolean;
  behavioral_flags: any[];
  news_intensity: string;
  entry_hour: number | null;
  rule_violations: string[];
}

const TradeJournalWidget = ({ config }: { config: any }) => {
  const { user } = useAuth();
  const bias = usePersonalBias();
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [symbol, setSymbol] = useState("BTC");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [preTradeChecked, setPreTradeChecked] = useState(true);

  // Pre-trade feedback
  const [feedback, setFeedback] = useState<PreTradeFeedback | null>(null);
  const [detectedFlags, setDetectedFlags] = useState<BehavioralFlag[]>([]);

  // Market context
  const ohlcParams = useMemo(() => ({ symbol: "BTC", timeframe: "1h" }), []);
  const { data: candles = [] } = useOHLCData(ohlcParams, true);
  const [fearGreed, setFearGreed] = useState<number | undefined>();
  const [newsIntensity, setNewsIntensity] = useState<string>("none");

  useEffect(() => {
    Promise.all([
      supabase.from("cache_fear_greed").select("value").eq("id", "current").single(),
      supabase.from("cache_news").select("published_at").order("published_at", { ascending: false }).limit(10),
    ]).then(([fgRes, newsRes]) => {
      if (fgRes.data) setFearGreed(fgRes.data.value);
      if (newsRes.data) {
        const recentCount = newsRes.data.filter((n) => {
          const age = Date.now() - new Date(n.published_at!).getTime();
          return age < 2 * 60 * 60 * 1000; // last 2h
        }).length;
        setNewsIntensity(recentCount >= 5 ? "high" : recentCount >= 2 ? "medium" : recentCount >= 1 ? "low" : "none");
      }
    });
  }, []);

  const currentContext = useMemo((): MarketContextSnapshot => {
    const session = analyzeSession();
    const volatility = candles.length >= 50 ? analyzeVolatilityRegime(candles) : undefined;
    return {
      regime: volatility?.regime,
      volatility_score: volatility?.regimeScore,
      bias_label: bias?.biasLabel,
      bias_score: bias?.biasScore,
      confidence: bias?.confidence,
      session: session.activeSessions?.[0] || "Off",
      fear_greed: fearGreed,
      news_intensity: newsIntensity,
    };
  }, [candles, bias, fearGreed, newsIntensity]);

  // Load trades
  useEffect(() => {
    if (!user) return;
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_time", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setTrades(data as unknown as TradeRow[]);
        setLoading(false);
      });
  }, [user]);

  // Generate pre-trade feedback when form is open
  useEffect(() => {
    if (!showForm || !entryPrice) { setFeedback(null); setDetectedFlags([]); return; }

    const closedTrades = trades
      .filter((t) => t.status === "closed")
      .map((t) => ({ ...t, market_context: t.market_context || {}, tags: t.tags || [] } as unknown as Trade));

    // Pre-trade feedback
    const fb = generatePreTradeFeedback(currentContext, direction, symbol, closedTrades);
    setFeedback(fb);

    // Behavioral flags
    const flags = detectBehavioralFlags(
      { direction, market_context: currentContext, pre_trade_check_skipped: !preTradeChecked, entry_time: new Date().toISOString() },
      closedTrades
    );
    setDetectedFlags(flags);
  }, [showForm, direction, symbol, entryPrice, preTradeChecked, currentContext, trades]);

  // Add trade
  const handleAddTrade = useCallback(async () => {
    if (!user || !entryPrice) return;
    const now = new Date();
    const flagsToStore = detectedFlags.map((f) => ({ type: f.type, label: f.label }));

    const { data, error } = await supabase
      .from("trades")
      .insert({
        user_id: user.id,
        symbol,
        direction,
        entry_price: parseFloat(entryPrice),
        market_context: currentContext as any,
        notes: notes || null,
        status: "open",
        pre_trade_check_skipped: !preTradeChecked,
        behavioral_flags: flagsToStore as any,
        news_intensity: newsIntensity,
        entry_hour: now.getUTCHours(),
        rule_violations: detectedFlags.filter((f) => f.severity === "danger").map((f) => f.type),
      })
      .select()
      .single();

    if (data && !error) {
      setTrades((prev) => [data as unknown as TradeRow, ...prev]);
      setShowForm(false);
      setEntryPrice("");
      setNotes("");
      setFeedback(null);
      setDetectedFlags([]);
    }
  }, [user, symbol, direction, entryPrice, notes, currentContext, preTradeChecked, detectedFlags, newsIntensity]);

  // Close trade
  const closeTrade = useCallback(
    async (tradeId: string, exitPrice: string) => {
      const trade = trades.find((t) => t.id === tradeId);
      if (!trade || !exitPrice) return;
      const exit = parseFloat(exitPrice);
      const pnl = trade.direction === "long" ? exit - trade.entry_price : trade.entry_price - exit;
      const pnlPercent = (pnl / trade.entry_price) * 100;
      const outcome = pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven";

      const { error } = await supabase
        .from("trades")
        .update({ exit_price: exit, exit_time: new Date().toISOString(), pnl, pnl_percent: pnlPercent, outcome, status: "closed" })
        .eq("id", tradeId);

      if (!error) {
        setTrades((prev) =>
          prev.map((t) =>
            t.id === tradeId ? { ...t, exit_price: exit, pnl, pnl_percent: pnlPercent, outcome, status: "closed", exit_time: new Date().toISOString() } : t
          )
        );
        setExpandedId(null);
      }
    },
    [trades]
  );

  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status === "closed");

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-warning" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Trade Journal
          </span>
          {closedTrades.length > 0 && (
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">
              {closedTrades.length} trades
            </Badge>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </button>
      </div>

      {/* New Trade Form */}
      {showForm && (
        <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/30 space-y-2 shrink-0">
          {/* Pre-trade feedback */}
          {feedback && feedback.expectancy !== "unknown" && (
            <div
              className={`p-2 rounded-md border text-[10px] leading-relaxed ${
                feedback.expectancy === "negative"
                  ? "bg-destructive/10 border-destructive/20 text-destructive"
                  : feedback.expectancy === "positive"
                  ? "bg-success/10 border-success/20 text-success"
                  : "bg-secondary/60 border-border/30 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="h-3 w-3" />
                <span className="font-semibold">Pre-Trade Intelligence</span>
              </div>
              <p>{feedback.message}</p>
              {feedback.warnings.map((w, i) => (
                <p key={i} className="mt-1 text-[9px] opacity-80">⚠ {w}</p>
              ))}
            </div>
          )}

          {/* Behavioral flags */}
          {detectedFlags.length > 0 && (
            <div className="space-y-1">
              {detectedFlags.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] ${
                    f.severity === "danger"
                      ? "bg-destructive/10 text-destructive"
                      : f.severity === "warning"
                      ? "bg-warning/10 text-warning"
                      : "bg-secondary/60 text-muted-foreground"
                  }`}
                >
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                  <span className="font-semibold">{f.label}:</span>
                  <span className="opacity-80">{f.description}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-md text-[11px] bg-secondary/60 border border-border/40 text-foreground"
            >
              {["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => setDirection("long")}
                className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold ${
                  direction === "long" ? "bg-success/20 text-success" : "bg-secondary/60 text-muted-foreground"
                }`}
              >
                LONG
              </button>
              <button
                onClick={() => setDirection("short")}
                className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold ${
                  direction === "short" ? "bg-destructive/20 text-destructive" : "bg-secondary/60 text-muted-foreground"
                }`}
              >
                SHORT
              </button>
            </div>
          </div>

          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="Entry price"
            className="w-full px-2.5 py-1.5 rounded-md text-[11px] bg-secondary/60 border border-border/40 text-foreground placeholder:text-muted-foreground/50"
          />

          {/* Pre-trade check toggle */}
          <button
            onClick={() => setPreTradeChecked(!preTradeChecked)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] border transition-colors ${
              preTradeChecked
                ? "bg-success/10 border-success/20 text-success"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {preTradeChecked ? <Shield className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            {preTradeChecked ? "Pre-Trade Check: Done ✓" : "Pre-Trade Check: Skipped ⚠"}
          </button>

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Trade thesis (optional)"
            className="w-full px-2.5 py-1.5 rounded-md text-[11px] bg-secondary/60 border border-border/40 text-foreground placeholder:text-muted-foreground/50"
          />

          {/* Context snapshot */}
          <div className="flex flex-wrap gap-1">
            {currentContext.regime && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">{currentContext.regime}</Badge>}
            {currentContext.bias_label && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">{currentContext.bias_label}</Badge>}
            {currentContext.session && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">{currentContext.session}</Badge>}
            {fearGreed != null && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">F&G: {fearGreed}</Badge>}
            {newsIntensity !== "none" && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-warning/30 text-warning">News: {newsIntensity}</Badge>}
          </div>

          <button
            onClick={handleAddTrade}
            disabled={!entryPrice}
            className="w-full py-1.5 rounded-md text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Log Trade
          </button>
        </div>
      )}

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 scrollbar-none">
        {openTrades.length > 0 && (
          <>
            <p className="text-[9px] font-bold uppercase tracking-widest text-warning/60 px-1">Open ({openTrades.length})</p>
            {openTrades.map((t) => (
              <TradeCard key={t.id} trade={t} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onClose={closeTrade} />
            ))}
          </>
        )}
        {closedTrades.length > 0 && (
          <>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 px-1 mt-2">Closed ({closedTrades.length})</p>
            {closedTrades.slice(0, 15).map((t) => (
              <TradeCard key={t.id} trade={t} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onClose={closeTrade} />
            ))}
          </>
        )}
        {trades.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <BookOpen className="h-6 w-6 text-muted-foreground/20" />
            <p className="text-[11px] text-muted-foreground/40">No trades yet</p>
            <button onClick={() => setShowForm(true)} className="text-[10px] text-primary hover:underline">Log your first trade</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────── Trade Card ──────────────────── */

function TradeCard({ trade, expanded, onToggle, onClose }: {
  trade: TradeRow;
  expanded: boolean;
  onToggle: () => void;
  onClose: (id: string, exitPrice: string) => void;
}) {
  const [exitPrice, setExitPrice] = useState("");
  const isOpen = trade.status === "open";
  const DirIcon = trade.direction === "long" ? TrendingUp : TrendingDown;
  const dirColor = trade.direction === "long" ? "text-success" : "text-destructive";
  const outcomeColor = trade.outcome === "win" ? "text-success" : trade.outcome === "loss" ? "text-destructive" : "text-muted-foreground";
  const ctx = trade.market_context;
  const hasFlags = Array.isArray(trade.behavioral_flags) && trade.behavioral_flags.length > 0;

  return (
    <div className="rounded-lg bg-secondary/20 border border-border/20 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-2 p-2 text-left">
        <DirIcon className={`h-3.5 w-3.5 shrink-0 ${dirColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">{trade.symbol}</span>
            <span className={`text-[9px] font-bold uppercase ${dirColor}`}>{trade.direction}</span>
            {hasFlags && <AlertTriangle className="h-2.5 w-2.5 text-warning" />}
            {trade.pre_trade_check_skipped && <ShieldAlert className="h-2.5 w-2.5 text-destructive/60" />}
          </div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50">
            <span>${trade.entry_price.toLocaleString()}</span>
            {trade.exit_price && <span>→ ${trade.exit_price.toLocaleString()}</span>}
          </div>
        </div>
        {trade.pnl != null && (
          <span className={`text-[11px] font-bold tabular-nums ${outcomeColor}`}>
            {trade.pnl >= 0 ? "+" : ""}{trade.pnl_percent?.toFixed(2)}%
          </span>
        )}
        {isOpen && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-warning/30 text-warning">OPEN</Badge>}
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/30" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/30" />}
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-2 border-t border-border/10">
          {/* Context badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {ctx.regime && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">{ctx.regime}</Badge>}
            {ctx.bias_label && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">{ctx.bias_label}</Badge>}
            {ctx.session && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">{ctx.session}</Badge>}
            {ctx.fear_greed != null && <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30">F&G: {ctx.fear_greed}</Badge>}
            {ctx.news_intensity && ctx.news_intensity !== "none" && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-warning/30 text-warning">News: {ctx.news_intensity}</Badge>
            )}
          </div>

          {/* Behavioral flags */}
          {hasFlags && (
            <div className="space-y-0.5">
              {trade.behavioral_flags.map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-1 text-[8px] text-warning/70">
                  <AlertTriangle className="h-2 w-2" />
                  <span>{typeof f === "string" ? f : f?.label || f?.type}</span>
                </div>
              ))}
            </div>
          )}

          {trade.notes && <p className="text-[9px] text-muted-foreground/60 italic">{trade.notes}</p>}

          <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/40">
            <Clock className="h-2.5 w-2.5" />
            {new Date(trade.entry_time).toLocaleDateString()} {new Date(trade.entry_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>

          {isOpen && (
            <div className="flex gap-1.5">
              <input
                type="number"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="Exit price"
                className="flex-1 px-2 py-1 rounded-md text-[10px] bg-secondary/60 border border-border/40 text-foreground placeholder:text-muted-foreground/50"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => { e.stopPropagation(); onClose(trade.id, exitPrice); }}
                disabled={!exitPrice}
                className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-primary text-primary-foreground disabled:opacity-40"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TradeJournalWidget;
