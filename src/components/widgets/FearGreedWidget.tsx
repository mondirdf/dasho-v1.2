import { useEffect, useState, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fear & Greed index — reads from the free alternative.me API.
 * This is a read-only public endpoint, no API key needed.
 * Data is fetched client-side since it's a simple public GET.
 */
const FearGreedWidget = memo(() => {
  const [value, setValue] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.alternative.me/fng/?limit=1")
      .then((r) => r.json())
      .then((d) => {
        const entry = d?.data?.[0];
        if (entry) {
          setValue(Number(entry.value));
          setLabel(entry.value_classification);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-full w-full" />;

  const v = value ?? 50;
  const color =
    v <= 25 ? "text-destructive" : v <= 45 ? "text-orange-400" : v <= 55 ? "text-yellow-400" : v <= 75 ? "text-emerald-400" : "text-success";

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xs text-muted-foreground mb-2">Fear & Greed Index</p>
      <div className={`text-5xl font-bold ${color}`}>{v}</div>
      <p className={`text-sm font-semibold mt-1 ${color}`}>{label}</p>
      {/* Simple gauge bar */}
      <div className="w-full mt-4 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-destructive via-yellow-400 to-success transition-all"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
});

FearGreedWidget.displayName = "FearGreedWidget";
export default FearGreedWidget;
