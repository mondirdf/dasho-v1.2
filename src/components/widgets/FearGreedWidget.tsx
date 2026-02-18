import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
    if (val <= 25) return { text: "text-destructive", hsl: "var(--destructive)" };
    if (val <= 45) return { text: "text-destructive/80", hsl: "var(--destructive)" };
    if (val <= 55) return { text: "text-muted-foreground", hsl: "var(--muted-foreground)" };
    if (val <= 75) return { text: "text-success/80", hsl: "var(--success)" };
    return { text: "text-success", hsl: "var(--success)" };
  };
  const color = getColor(v);

  // Gauge arc
  const angle = (v / 100) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const endX = 50 + 35 * Math.cos(rad);
  const endY = 50 + 35 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xs text-muted-foreground mb-2">Fear & Greed Index</p>

      {/* Gauge */}
      <svg viewBox="0 0 100 60" className="w-28 h-16 mx-auto">
        {/* Background arc */}
        <path
          d="M 15 50 A 35 35 0 0 1 85 50"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 15 50 A 35 35 0 ${largeArc} 1 ${endX} ${endY}`}
          fill="none"
          stroke={`hsl(${color.hsl})`}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      <div className={`text-4xl font-bold ${color.text} -mt-1`}>{v}</div>
      <p className={`text-sm font-semibold mt-0.5 ${color.text}`}>{label}</p>
    </div>
  );
});

FearGreedWidget.displayName = "FearGreedWidget";
export default FearGreedWidget;
