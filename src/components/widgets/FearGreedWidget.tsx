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

  if (loading) return <Skeleton className="h-full w-full rounded-lg" />;

  const v = value ?? 50;

  const getColor = (val: number) => {
    if (val <= 25) return { cls: "text-destructive", hsl: "var(--destructive)", bg: "bg-destructive/10", lbl: "Extreme Fear" };
    if (val <= 45) return { cls: "text-warning", hsl: "var(--warning)", bg: "bg-warning/10", lbl: "Fear" };
    if (val <= 55) return { cls: "text-muted-foreground", hsl: "var(--muted-foreground)", bg: "bg-secondary", lbl: "Neutral" };
    if (val <= 75) return { cls: "text-success", hsl: "var(--success)", bg: "bg-success/10", lbl: "Greed" };
    return { cls: "text-success", hsl: "var(--success)", bg: "bg-success/10", lbl: "Extreme Greed" };
  };
  const color = getColor(v);

  // Gauge arc
  const angle = (v / 100) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const endX = 50 + 35 * Math.cos(rad);
  const endY = 50 + 35 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  // Needle
  const needleRad = ((v / 100) * 180 - 90) * (Math.PI / 180);
  const needleX = 50 + 28 * Math.cos(needleRad);
  const needleY = 50 + 28 * Math.sin(needleRad);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className={`absolute inset-0 opacity-5 ${color.bg}`} />

      <p className="text-xs font-medium text-muted-foreground mb-3 relative z-10">Fear & Greed Index</p>

      {/* Gauge */}
      <svg viewBox="0 0 100 58" className="w-32 h-20 mx-auto relative z-10">
        {/* Background arc */}
        <path
          d="M 15 50 A 35 35 0 0 1 85 50"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Colored segments */}
        <path d="M 15 50 A 35 35 0 0 1 26.7 26.7" fill="none" stroke="hsl(var(--destructive))" strokeWidth="7" strokeLinecap="round" opacity="0.3" />
        <path d="M 73.3 26.7 A 35 35 0 0 1 85 50" fill="none" stroke="hsl(var(--success))" strokeWidth="7" strokeLinecap="round" opacity="0.3" />
        {/* Value arc */}
        <path
          d={`M 15 50 A 35 35 0 ${largeArc} 1 ${endX} ${endY}`}
          fill="none"
          stroke={`hsl(${color.hsl})`}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Needle dot */}
        <circle cx={needleX} cy={needleY} r="3" fill={`hsl(${color.hsl})`} />
        <circle cx={needleX} cy={needleY} r="1.5" fill="hsl(var(--background))" />
      </svg>

      <div className={`text-4xl font-bold ${color.cls} -mt-1 relative z-10 tabular-nums`}>{v}</div>
      <div className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold ${color.cls} ${color.bg} relative z-10`}>
        {label || color.lbl}
      </div>
    </div>
  );
});

FearGreedWidget.displayName = "FearGreedWidget";
export default FearGreedWidget;
