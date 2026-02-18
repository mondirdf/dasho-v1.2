import { useEffect, useState, memo, useMemo } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";

interface Props {
  config: { symbols?: string[] };
}

const MultiTrackerWidget = memo(({ config }: Props) => {
  const [coins, setCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByChange, setSortByChange] = useState(false);

  useEffect(() => {
    fetchCryptoData().then((data) => {
      const symbols = config.symbols || ["BTC", "ETH", "SOL", "ADA", "DOGE"];
      const filtered = data.filter((c) => symbols.includes(c.symbol));
      setCoins(filtered.length > 0 ? filtered : data.slice(0, 5));
      setLoading(false);
    });
  }, [config.symbols]);

  const sorted = useMemo(() => {
    if (!sortByChange) return coins;
    return [...coins].sort((a, b) => Math.abs(b.change_24h ?? 0) - Math.abs(a.change_24h ?? 0));
  }, [coins, sortByChange]);

  if (loading) return <Skeleton className="h-full w-full rounded-lg" />;

  return (
    <div className="h-full overflow-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Market Overview</h3>
        <button
          onClick={() => setSortByChange(!sortByChange)}
          className={`p-1.5 rounded-lg transition-colors ${sortByChange ? "bg-primary/10 text-primary" : "hover:bg-secondary/60 text-muted-foreground"}`}
          aria-label="Sort by change"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-0.5">
        {sorted.map((coin) => {
          const positive = (coin.change_24h ?? 0) >= 0;
          return (
            <div
              key={coin.symbol}
              className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {coin.symbol.slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-foreground">{coin.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground tabular-nums font-medium">
                  ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold min-w-[56px] justify-end px-1.5 py-0.5 rounded-md ${
                  positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(coin.change_24h ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MultiTrackerWidget.displayName = "MultiTrackerWidget";
export default MultiTrackerWidget;
