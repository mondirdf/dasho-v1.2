/**
 * CorrelationWidget — Shows correlation matrix between selected assets.
 * Computes Pearson correlation from cached OHLC close prices.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Grid3X3 } from "lucide-react";

interface OhlcRow {
  symbol: string;
  close: number;
  open_time: number;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 5) return 0;
  const xs = x.slice(0, n), ys = y.slice(0, n);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xd = xs[i] - mx, yd = ys[i] - my;
    num += xd * yd;
    dx += xd * xd;
    dy += yd * yd;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

const DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL", "XRP"];

const CorrelationWidget = ({ config }: { config: any }) => {
  const symbols: string[] = config?.symbols
    ? (typeof config.symbols === "string" ? config.symbols.split(",").map((s: string) => s.trim()) : config.symbols)
    : DEFAULT_SYMBOLS;

  const [data, setData] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: ohlc } = await supabase
        .from("cache_ohlc_data")
        .select("symbol, close, open_time")
        .in("symbol", symbols)
        .eq("timeframe", "1d")
        .order("open_time", { ascending: true })
        .limit(500);

      const grouped: Record<string, number[]> = {};
      (ohlc ?? []).forEach((row: any) => {
        if (!grouped[row.symbol]) grouped[row.symbol] = [];
        grouped[row.symbol].push(Number(row.close));
      });
      setData(grouped);
      setLoading(false);
    };
    load();
  }, [symbols.join(",")]);

  const matrix = useMemo(() => {
    return symbols.map((s1) =>
      symbols.map((s2) => {
        if (s1 === s2) return 1;
        const d1 = data[s1] || [], d2 = data[s2] || [];
        return pearsonCorrelation(d1, d2);
      })
    );
  }, [data, symbols]);

  const getColor = (v: number) => {
    if (v >= 0.7) return "text-success bg-success/10";
    if (v >= 0.3) return "text-success/70 bg-success/5";
    if (v >= -0.3) return "text-muted-foreground bg-secondary/40";
    if (v >= -0.7) return "text-destructive/70 bg-destructive/5";
    return "text-destructive bg-destructive/10";
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Correlation Matrix</h3>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-center">
          <thead>
            <tr>
              <th className="text-[10px] text-muted-foreground p-1"></th>
              {symbols.map((s) => (
                <th key={s} className="text-[10px] font-medium text-foreground p-1">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map((s1, i) => (
              <tr key={s1}>
                <td className="text-[10px] font-medium text-foreground p-1 text-right pr-2">{s1}</td>
                {symbols.map((s2, j) => (
                  <td key={s2} className="p-0.5">
                    <div className={`rounded px-1 py-1 text-[10px] font-mono font-medium ${getColor(matrix[i][j])}`}>
                      {matrix[i][j].toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[9px] text-muted-foreground text-center">
        Based on daily close prices • Green = positive • Red = negative
      </p>
    </div>
  );
};

export default CorrelationWidget;
