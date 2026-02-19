/**
 * FearGreedWidget — CONTENT ONLY.
 * Supports compact / standard / expanded responsive modes.
 * Implements "gauge" and "simple" indicator types + visual alert on extremes.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useWidgetSize } from "@/hooks/useWidgetSize";

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
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-32 rounded-lg" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Failed to load data</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const v = value ?? 50;
  const isCompact = mode === "compact";
  const indicatorType = config?.indicatorType ?? "gauge";
  const showAlert = config?.showAlert ?? true;
  const showTimestamp = config?.showTimestamp ?? false;
  const isExtreme = v <= 20 || v >= 80;

  const getColor = (val: number) => {
    if (val <= 25) return { cls: "text-destructive", hsl: "var(--destructive)", bg: "bg-destructive/10", lbl: "Extreme Fear" };
    if (val <= 45) return { cls: "text-warning", hsl: "var(--warning)", bg: "bg-warning/10", lbl: "Fear" };
    if (val <= 55) return { cls: "text-muted-foreground", hsl: "var(--muted-foreground)", bg: "bg-secondary", lbl: "Neutral" };
    if (val <= 75) return { cls: "text-success", hsl: "var(--success)", bg: "bg-success/10", lbl: "Greed" };
    return { cls: "text-success", hsl: "var(--success)", bg: "bg-success/10", lbl: "Extreme Greed" };
  };
  const color = getColor(v);

  // Alert border class
  const alertBorderClass = showAlert && isExtreme
    ? v <= 20 ? "ring-2 ring-destructive/40 animate-pulse" : "ring-2 ring-success/40 animate-pulse"
    : "";

  // ── Simple indicator ──
  if (indicatorType === "simple") {
    return (
      <div ref={sizeRef} className={`h-full flex flex-col items-center justify-center text-center overflow-hidden rounded-lg ${alertBorderClass}`}>
        {!isCompact && <p className="text-xs font-medium text-muted-foreground mb-2">Fear & Greed Index</p>}
        <div className={`${isCompact ? "text-3xl" : "text-5xl"} font-bold ${color.cls} tabular-nums`}>{v}</div>
        <div className={`mt-2 px-3 py-1 rounded-full ${isCompact ? "text-[10px]" : "text-xs"} font-semibold ${color.cls} ${color.bg}`}>
          {label || color.lbl}
        </div>
        {/* Progress bar */}
        <div className={`w-full max-w-[140px] mt-3 ${isCompact ? "h-1.5" : "h-2"} bg-secondary rounded-full overflow-hidden`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${v}%`,
              background: `hsl(${color.hsl})`,
            }}
          />
        </div>
        {showAlert && isExtreme && (
          <div className="flex items-center gap-1 mt-2">
            <AlertTriangle className={`h-3 w-3 ${color.cls}`} />
            <span className={`text-[10px] font-medium ${color.cls}`}>
              {v <= 20 ? "Extreme Fear" : "Extreme Greed"}
            </span>
          </div>
        )}
        {showTimestamp && lastUpdated && !isCompact && (
          <span className="text-[10px] text-muted-foreground mt-2">
            {new Date(lastUpdated).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    );
  }

  // ── Gauge indicator (default) ──
  const angle = (v / 100) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const endX = 50 + 35 * Math.cos(rad);
  const endY = 50 + 35 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  const needleRad = ((v / 100) * 180 - 90) * (Math.PI / 180);
  const needleX = 50 + 28 * Math.cos(needleRad);
  const needleY = 50 + 28 * Math.sin(needleRad);

  return (
    <div ref={sizeRef} className={`h-full flex flex-col items-center justify-center text-center overflow-hidden rounded-lg ${alertBorderClass}`}>
      {!isCompact && <p className="text-xs font-medium text-muted-foreground mb-3">Fear & Greed Index</p>}
      <svg viewBox="0 0 100 58" className={`${isCompact ? "w-20 h-12" : "w-32 h-20"} mx-auto shrink-0`}>
        <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="hsl(var(--secondary))" strokeWidth="7" strokeLinecap="round" />
        <path d="M 15 50 A 35 35 0 0 1 26.7 26.7" fill="none" stroke="hsl(var(--destructive))" strokeWidth="7" strokeLinecap="round" opacity="0.3" />
        <path d="M 73.3 26.7 A 35 35 0 0 1 85 50" fill="none" stroke="hsl(var(--success))" strokeWidth="7" strokeLinecap="round" opacity="0.3" />
        <path d={`M 15 50 A 35 35 0 ${largeArc} 1 ${endX} ${endY}`} fill="none" stroke={`hsl(${color.hsl})`} strokeWidth="7" strokeLinecap="round" />
        <circle cx={needleX} cy={needleY} r="3" fill={`hsl(${color.hsl})`} />
        <circle cx={needleX} cy={needleY} r="1.5" fill="hsl(var(--background))" />
      </svg>
      <div className={`${isCompact ? "text-2xl" : "text-4xl"} font-bold ${color.cls} -mt-1 tabular-nums`}>{v}</div>
      <div className={`mt-1 px-3 py-1 rounded-full ${isCompact ? "text-[10px]" : "text-xs"} font-semibold ${color.cls} ${color.bg}`}>
        {label || color.lbl}
      </div>
      {showAlert && isExtreme && !isCompact && (
        <div className="flex items-center gap-1 mt-2">
          <AlertTriangle className={`h-3 w-3 ${color.cls}`} />
          <span className={`text-[10px] font-medium ${color.cls}`}>
            {v <= 20 ? "Extreme Fear Zone" : "Extreme Greed Zone"}
          </span>
        </div>
      )}
      {showTimestamp && lastUpdated && !isCompact && (
        <span className="text-[10px] text-muted-foreground mt-2">
          Updated {new Date(lastUpdated).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
});

FearGreedWidget.displayName = "FearGreedWidget";
export default FearGreedWidget;
