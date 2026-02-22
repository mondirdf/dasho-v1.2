/**
 * FearGreedWidget — CONTENT ONLY.
 * Clean gauge with consistent header and status.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, WidgetEmptyState } from "./shared";

interface Props {
  config: {
    showAlert?: boolean;
    indicatorType?: string;
    showTimestamp?: boolean;
  };
}

const FearGreedWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [value, setValue] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("cache_fear_greed")
        .select("*")
        .eq("id", "current")
        .maybeSingle();
      if (data) {
        setValue(data.value);
        setLabel(data.value_classification);
        setLastUpdated(data.last_updated);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-20 w-28 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    );
  }

  if (error) {
    return <div ref={sizeRef}><WidgetEmptyState error onRetry={loadData} /></div>;
  }

  const v = value ?? 50;
  const isCompact = mode === "compact";

  const getColor = (val: number) => {
    if (val <= 25) return { cls: "text-destructive", hsl: "var(--destructive)", bg: "bg-destructive/10", lbl: "Extreme Fear" };
    if (val <= 45) return { cls: "text-warning", hsl: "var(--warning)", bg: "bg-warning/10", lbl: "Fear" };
    if (val <= 55) return { cls: "text-muted-foreground", hsl: "var(--muted-foreground)", bg: "bg-secondary/40", lbl: "Neutral" };
    if (val <= 75) return { cls: "text-success", hsl: "var(--success)", bg: "bg-success/10", lbl: "Greed" };
    return { cls: "text-success", hsl: "var(--success)", bg: "bg-success/10", lbl: "Extreme Greed" };
  };
  const color = getColor(v);

  // Gauge
  const angle = (v / 100) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const endX = 50 + 35 * Math.cos(rad);
  const endY = 50 + 35 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  const needleRad = ((v / 100) * 180 - 90) * (Math.PI / 180);
  const needleX = 50 + 28 * Math.cos(needleRad);
  const needleY = 50 + 28 * Math.sin(needleRad);

  return (
    <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center overflow-hidden gap-1">
      <WidgetHeader title="Fear & Greed" status="cached" updatedAt={lastUpdated} compact={isCompact} />

      <svg viewBox="0 0 100 58" className={`${isCompact ? "w-20 h-12" : "w-32 h-[72px]"} mx-auto shrink-0`}>
        <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" strokeLinecap="round" />
        <path d="M 15 50 A 35 35 0 0 1 26.7 26.7" fill="none" stroke="hsl(var(--destructive))" strokeWidth="6" strokeLinecap="round" opacity="0.15" />
        <path d="M 73.3 26.7 A 35 35 0 0 1 85 50" fill="none" stroke="hsl(var(--success))" strokeWidth="6" strokeLinecap="round" opacity="0.15" />
        <path d={`M 15 50 A 35 35 0 ${largeArc} 1 ${endX} ${endY}`} fill="none" stroke={`hsl(${color.hsl})`} strokeWidth="6" strokeLinecap="round" />
        <circle cx={needleX} cy={needleY} r="3" fill={`hsl(${color.hsl})`} />
        <circle cx={needleX} cy={needleY} r="1.2" fill="hsl(var(--background))" />
      </svg>

      <div className={`${isCompact ? "text-2xl" : "text-4xl"} font-bold ${color.cls} tabular-nums leading-none`}>{v}</div>
      <div className={`px-2.5 py-1 rounded-full ${isCompact ? "text-[9px]" : "text-[10px]"} font-semibold ${color.cls} ${color.bg}`}>
        {label || color.lbl}
      </div>
    </div>
  );
});

FearGreedWidget.displayName = "FearGreedWidget";
export default FearGreedWidget;
