/**
 * BacktesterWidget — Mini Backtester for testing strategies on historical OHLC data.
 * PRO feature: Tests BOS Entry, ChoCH Reversal, RSI, EMA Cross, Breakout strategies.
 * Mobile-optimized: scrollable, touch-friendly controls.
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { runBacktest, type BacktestConfig, type BacktestResult, type StrategyType } from "@/engines/backtestEngine";
import type { Candle } from "@/engines/marketStructureEngine";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Play, TrendingUp, TrendingDown, Target, AlertTriangle, Trophy } from "lucide-react";

const STRATEGIES: { value: StrategyType; label: string; desc: string }[] = [
  { value: "bos_entry", label: "BOS Entry", desc: "Break of Structure" },
  { value: "choch_reversal", label: "ChoCH Rev", desc: "Change of Character" },
  { value: "rsi_oversold", label: "RSI Bounce", desc: "RSI reversal" },
  { value: "ema_cross", label: "EMA Cross", desc: "EMA crossover" },
  { value: "breakout", label: "Breakout", desc: "Range breakout" },
];

const SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP"];
const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d"];

interface Props {
  config?: any;
}

const BacktesterWidget = ({ config }: Props) => {
  const [strategy, setStrategy] = useState<StrategyType>(config?.strategy || "bos_entry");
  const [symbol, setSymbol] = useState(config?.symbol || "BTC");
  const [timeframe, setTimeframe] = useState(config?.timeframe || "1h");
  const [direction, setDirection] = useState<"long" | "short" | "both">("both");
  const [slPercent, setSlPercent] = useState(1.5);
  const [rrRatio, setRrRatio] = useState(2);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  // Fetch OHLC data
  const { data: candles } = useQuery({
    queryKey: ["ohlc-backtest", symbol, timeframe],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cache_ohlc_data")
        .select("*")
        .eq("symbol", symbol)
        .eq("timeframe", timeframe)
        .order("open_time", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        openTime: Number(r.open_time),
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volume),
      })) as Candle[];
    },
    staleTime: 60_000,
  });

  const handleRun = () => {
    if (!candles || candles.length < 30) return;
    setRunning(true);
    setTimeout(() => {
      const cfg: BacktestConfig = {
        strategy,
        direction,
        rrRatio,
        slPercent,
        rsiThreshold: 30,
        emaFast: 9,
        emaSlow: 21,
      };
      const res = runBacktest(candles, cfg);
      setResult(res);
      setRunning(false);
    }, 50);
  };

  // Equity curve data for chart
  const equityData = useMemo(() => {
    if (!result) return [];
    let equity = 0;
    return result.trades.map((t, i) => {
      equity += t.pnlPercent;
      return { trade: i + 1, equity: parseFloat(equity.toFixed(2)), pnl: parseFloat(t.pnlPercent.toFixed(2)), result: t.result };
    });
  }, [result]);

  return (
    <div className="h-full flex flex-col gap-2 p-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <Target className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-foreground tracking-wide uppercase">Mini Backtester</span>
      </div>

      {/* Symbol selector — horizontally scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none shrink-0 -mx-1 px-1">
        {SYMBOLS.map(s => (
          <button key={s} onClick={() => setSymbol(s)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all shrink-0 min-w-[44px] min-h-[36px] ${
              symbol === s ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary active:bg-secondary"
            }`}>{s}</button>
        ))}
      </div>

      {/* Timeframe selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none shrink-0 -mx-1 px-1">
        {TIMEFRAMES.map(tf => (
          <button key={tf} onClick={() => setTimeframe(tf)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-all shrink-0 min-w-[40px] min-h-[36px] ${
              timeframe === tf ? "bg-accent text-accent-foreground" : "bg-secondary/40 text-muted-foreground hover:bg-secondary active:bg-secondary"
            }`}>{tf}</button>
        ))}
      </div>

      {/* Strategy Selection — 1 col on very small, 2 cols otherwise */}
      <div className="space-y-1 shrink-0">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Strategy</span>
        <div className="grid grid-cols-2 gap-1.5">
          {STRATEGIES.map(s => (
            <button key={s.value} onClick={() => setStrategy(s.value)}
              className={`px-2 py-2 rounded text-left transition-all min-h-[44px] ${
                strategy === s.value 
                  ? "bg-primary/15 border border-primary/30 text-foreground" 
                  : "bg-secondary/30 border border-transparent text-muted-foreground hover:bg-secondary/50 active:bg-secondary/60"
              }`}>
              <div className="text-[11px] font-semibold leading-tight">{s.label}</div>
              <div className="text-[9px] opacity-70 leading-tight">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Direction + SL/RR — stacks better on mobile */}
      <div className="flex flex-wrap gap-2 items-end shrink-0">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">Direction</span>
          <div className="flex gap-1">
            {(["long", "short", "both"] as const).map(d => (
              <button key={d} onClick={() => setDirection(d)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-medium capitalize min-h-[36px] ${
                  direction === d ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-muted-foreground active:bg-secondary"
                }`}>{d}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">SL %</span>
          <input type="number" value={slPercent} onChange={e => setSlPercent(parseFloat(e.target.value) || 1)}
            className="w-16 h-9 px-2 rounded bg-secondary/40 border border-border/30 text-xs text-foreground" step="0.5" min="0.1" max="10" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">R:R</span>
          <input type="number" value={rrRatio} onChange={e => setRrRatio(parseFloat(e.target.value) || 1)}
            className="w-16 h-9 px-2 rounded bg-secondary/40 border border-border/30 text-xs text-foreground" step="0.5" min="0.5" max="10" />
        </div>
      </div>

      {/* Run Button — full width, bigger touch target */}
      <button onClick={handleRun} disabled={running || !candles || candles.length < 30}
        className="flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:bg-primary/80 transition-all disabled:opacity-50 shrink-0 min-h-[48px]">
        <Play className="h-4 w-4" />
        {running ? "Running..." : `Backtest ${candles?.length || 0} candles`}
      </button>

      {/* No data warning */}
      {candles && candles.length < 30 && (
        <div className="flex items-center gap-1.5 text-[11px] text-warning shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Not enough OHLC data. Fetch klines first.</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-2 mt-1">
          {/* Stats Grid — 2 cols on tiny screens, 3 cols on wider */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <StatBox label="Win Rate" value={`${result.winRate.toFixed(1)}%`} 
              color={result.winRate >= 50 ? "text-success" : "text-destructive"} />
            <StatBox label="Trades" value={result.totalTrades.toString()} color="text-foreground" />
            <StatBox label="P. Factor" value={result.profitFactor === Infinity ? "∞" : result.profitFactor.toFixed(2)} 
              color={result.profitFactor >= 1 ? "text-success" : "text-destructive"} />
            <StatBox label="Total PnL" value={`${result.totalPnl >= 0 ? "+" : ""}${result.totalPnl.toFixed(2)}%`} 
              color={result.totalPnl >= 0 ? "text-success" : "text-destructive"} />
            <StatBox label="Avg Win" value={`+${result.avgWin.toFixed(2)}%`} color="text-success" />
            <StatBox label="Max DD" value={`-${result.maxDrawdown.toFixed(2)}%`} color="text-warning" />
          </div>

          {/* Equity Curve */}
          {equityData.length > 0 && (
            <div className="h-32 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="trade" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                    formatter={(value: number, name: string) => [
                      `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
                      name === "pnl" ? "Trade PnL" : "Equity"
                    ]}
                  />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {equityData.map((entry, i) => (
                      <Cell key={i} fill={entry.result === "win" ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Trades */}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Recent Trades</span>
            {result.trades.slice(-6).reverse().map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-border/20 min-h-[36px]">
                {t.direction === "long" 
                  ? <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
                  : <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
                }
                <span className="text-muted-foreground flex-1 truncate">{t.reason}</span>
                <span className={`${t.result === "win" ? "text-success" : "text-destructive"} font-semibold shrink-0`}>
                  {t.pnlPercent >= 0 ? "+" : ""}{t.pnlPercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          {/* Strategy verdict */}
          <div className={`flex items-center gap-2 p-2.5 rounded-lg text-[12px] ${
            result.winRate >= 50 && result.profitFactor >= 1 
              ? "bg-success/10 text-success" 
              : "bg-destructive/10 text-destructive"
          }`}>
            <Trophy className="h-4 w-4 shrink-0" />
            <span className="font-medium leading-tight">
              {result.winRate >= 50 && result.profitFactor >= 1
                ? `${result.strategyLabel} shows edge on ${symbol} ${timeframe}`
                : `${result.strategyLabel} needs refinement on ${symbol} ${timeframe}`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-secondary/30 rounded-lg p-2 text-center min-h-[48px] flex flex-col items-center justify-center">
    <div className="text-[9px] text-muted-foreground uppercase tracking-wider leading-tight">{label}</div>
    <div className={`text-sm font-bold ${color} leading-tight`}>{value}</div>
  </div>
);

export default BacktesterWidget;
