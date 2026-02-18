import { useEffect, useState, memo } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  config: { symbols?: string[] };
}

const MultiTrackerWidget = memo(({ config }: Props) => {
  const [coins, setCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptoData().then((data) => {
      const symbols = config.symbols || ["BTC", "ETH", "SOL"];
      const filtered = data.filter((c) => symbols.includes(c.symbol));
      setCoins(filtered.length > 0 ? filtered : data.slice(0, 5));
      setLoading(false);
    });
  }, [config.symbols]);

  if (loading) return <Skeleton className="h-full w-full" />;

  return (
    <div className="h-full overflow-auto p-4 space-y-2">
      <h3 className="text-sm font-semibold text-foreground mb-2">Market Overview</h3>
      {coins.map((coin) => {
        const positive = (coin.change_24h ?? 0) >= 0;
        return (
          <div key={coin.symbol} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
            <span className="text-sm font-medium text-foreground">{coin.symbol}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground">
                ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-success" : "text-destructive"}`}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(coin.change_24h ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

MultiTrackerWidget.displayName = "MultiTrackerWidget";
export default MultiTrackerWidget;
