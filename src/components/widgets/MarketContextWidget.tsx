import { useEffect, useState, memo } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe } from "lucide-react";

const MarketContextWidget = memo(() => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptoData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Skeleton className="h-full w-full rounded-lg" />;

  const totalMcap = data.reduce((s, c) => s + (c.market_cap ?? 0), 0);
  const totalVol = data.reduce((s, c) => s + (c.volume ?? 0), 0);
  const btc = data.find((c) => c.symbol === "BTC");
  const btcDom = btc && totalMcap > 0 ? ((btc.market_cap ?? 0) / totalMcap) * 100 : 0;

  const stats = [
    { label: "Total Market Cap", value: `$${(totalMcap / 1e12).toFixed(2)}T`, accent: true },
    { label: "24h Volume", value: `$${(totalVol / 1e9).toFixed(1)}B`, accent: false },
    { label: "BTC Dominance", value: `${btcDom.toFixed(1)}%`, accent: false },
    { label: "Tracked Coins", value: `${data.length}`, accent: false },
  ];

  return (
    <div className="h-full p-4 relative overflow-hidden">
      {/* Header */}
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

      {/* Live indicator */}
      <div className="flex items-center justify-end mt-3">
        <span className="animate-pulse-glow text-[10px] text-muted-foreground">● Live</span>
      </div>
    </div>
  );
});

MarketContextWidget.displayName = "MarketContextWidget";
export default MarketContextWidget;
