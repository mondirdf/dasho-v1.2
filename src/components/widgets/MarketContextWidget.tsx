/**
 * MarketContextWidget — CONTENT ONLY.
 * All container styling is handled by WidgetContainer.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, AlertCircle } from "lucide-react";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";

interface Props {
  config: {
    showVolume?: boolean;
    showDominance?: boolean;
  };
}

const MarketContextWidget = memo(({ config }: Props) => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(() => {
    fetchCryptoData()
      .then((d) => { setData(d); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRealtimeCrypto(loadData);

  if (loading) {
    return (
      <div className="h-full space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Failed to load data</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const totalMcap = data.reduce((s, c) => s + (c.market_cap ?? 0), 0);
  const totalVol = data.reduce((s, c) => s + (c.volume ?? 0), 0);
  const btc = data.find((c) => c.symbol === "BTC");
  const btcDom = btc && totalMcap > 0 ? ((btc.market_cap ?? 0) / totalMcap) * 100 : 0;

  const showVolume = config?.showVolume ?? true;
  const showDominance = config?.showDominance ?? true;

  const stats = [
    { label: "Total Market Cap", value: `$${(totalMcap / 1e12).toFixed(2)}T`, accent: true },
    ...(showVolume ? [{ label: "24h Volume", value: `$${(totalVol / 1e9).toFixed(1)}B`, accent: false }] : []),
    ...(showDominance ? [{ label: "BTC Dominance", value: `${btcDom.toFixed(1)}%`, accent: false }] : []),
    { label: "Tracked Coins", value: `${data.length}`, accent: false },
  ];

  return (
    <div className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Market Context</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col justify-center p-2.5 rounded-lg bg-secondary/30">
            <span className="text-[11px] text-muted-foreground font-medium">{s.label}</span>
            <span className={`text-lg font-bold tabular-nums ${s.accent ? "gradient-text" : "text-foreground"}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end mt-3">
        <span className="animate-pulse-glow text-[10px] text-muted-foreground">● Live</span>
      </div>
    </div>
  );
});

MarketContextWidget.displayName = "MarketContextWidget";
export default MarketContextWidget;
