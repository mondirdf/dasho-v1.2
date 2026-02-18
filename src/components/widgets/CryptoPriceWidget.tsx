import { useEffect, useState, memo } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  config: { symbol?: string };
}

const CryptoPriceWidget = memo(({ config }: Props) => {
  const [coin, setCoin] = useState<CryptoData | null>(null);
  const [allCoins, setAllCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const symbol = config.symbol || "BTC";
    fetchCryptoData().then((data) => {
      setAllCoins(data);
      setCoin(data.find((c) => c.symbol === symbol) || data[0] || null);
      setLoading(false);
    });
  }, [config.symbol]);

  if (loading) return <Skeleton className="h-full w-full" />;
  if (!coin) return <div className="p-4 text-muted-foreground text-sm">No data</div>;

  const positive = (coin.change_24h ?? 0) >= 0;

  // Generate simple sparkline path from price data
  const sparkline = allCoins.slice(0, 7).map((c, i) => ({
    x: (i / 6) * 100,
    y: 50 - ((c.change_24h ?? 0) * 2),
  }));
  const sparkPath = sparkline.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
  ).join(" ");

  return (
    <div className="h-full flex flex-col justify-between p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{coin.symbol}</span>
        <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-success" : "text-destructive"}`}>
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {(coin.change_24h ?? 0).toFixed(2)}%
        </span>
      </div>
      <div className="text-2xl font-bold text-foreground">
        ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
      {/* Mini sparkline */}
      <svg viewBox="0 0 100 60" className="w-full h-8 mt-1" preserveAspectRatio="none">
        <path
          d={sparkPath}
          fill="none"
          stroke={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="text-xs text-muted-foreground">
        MCap: ${((coin.market_cap ?? 0) / 1e9).toFixed(1)}B
      </div>
    </div>
  );
});

CryptoPriceWidget.displayName = "CryptoPriceWidget";
export default CryptoPriceWidget;
