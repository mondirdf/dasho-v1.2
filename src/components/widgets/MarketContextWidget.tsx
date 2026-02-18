import { useEffect, useState, memo } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Market context — total market cap, BTC dominance approximation,
 * derived from cache data.
 */
const MarketContextWidget = memo(() => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptoData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Skeleton className="h-full w-full" />;

  const totalMcap = data.reduce((s, c) => s + (c.market_cap ?? 0), 0);
  const totalVol = data.reduce((s, c) => s + (c.volume ?? 0), 0);
  const btc = data.find((c) => c.symbol === "BTC");
  const btcDom = btc && totalMcap > 0 ? ((btc.market_cap ?? 0) / totalMcap) * 100 : 0;

  const stats = [
    { label: "Total Market Cap", value: `$${(totalMcap / 1e12).toFixed(2)}T` },
    { label: "24h Volume", value: `$${(totalVol / 1e9).toFixed(1)}B` },
    { label: "BTC Dominance", value: `${btcDom.toFixed(1)}%` },
    { label: "Tracked Coins", value: `${data.length}` },
  ];

  return (
    <div className="h-full p-4 grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col justify-center">
          <span className="text-xs text-muted-foreground">{s.label}</span>
          <span className="text-lg font-bold text-foreground">{s.value}</span>
        </div>
      ))}
    </div>
  );
});

MarketContextWidget.displayName = "MarketContextWidget";
export default MarketContextWidget;
