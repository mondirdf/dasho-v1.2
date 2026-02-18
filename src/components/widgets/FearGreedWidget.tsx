import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fear & Greed widget — reads from cache_fear_greed table.
 * Data is populated server-side by the fetch-crypto-data edge function.
 * NO direct external API calls from the frontend.
 */
const FearGreedWidget = memo(() => {
  const [value, setValue] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await supabase
          .from("cache_fear_greed")
          .select("*")
          .eq("id", "current")
          .maybeSingle();
        if (data) {
          setValue(data.value);
          setLabel(data.value_classification);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <Skeleton className="h-full w-full" />;

  const v = value ?? 50;
  const getColor = (val: number) => {
    if (val <= 25) return "text-destructive";
    if (val <= 45) return "text-destructive/70";
    if (val <= 55) return "text-muted-foreground";
    if (val <= 75) return "text-success/70";
    return "text-success";
  };
  const color = getColor(v);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xs text-muted-foreground mb-2">Fear & Greed Index</p>
      <div className={`text-5xl font-bold ${color}`}>{v}</div>
      <p className={`text-sm font-semibold mt-1 ${color}`}>{label}</p>
      <div className="w-full mt-4 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-destructive via-muted-foreground to-success transition-all"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
});

FearGreedWidget.displayName = "FearGreedWidget";
export default FearGreedWidget;
