/**
 * Shared widget sub-components for consistent terminal-style layout.
 * Used by all widgets for header, change indicators, status, and states.
 */
import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Direction indicator (pill style) ── */
export function ChangeIndicator({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const positive = value >= 0;
  const arrow = positive ? "▲" : "▼";
  const cls = positive
    ? "text-success bg-success/10"
    : "text-destructive bg-destructive/10";
  return (
    <span
      className={`${cls} font-semibold tabular-nums inline-flex items-center gap-0.5 rounded-md ${
        compact ? "text-[9px] px-1 py-0.5" : "text-[11px] px-1.5 py-0.5"
      }`}
    >
      {arrow} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

/* ── Widget header row ── */
export function WidgetHeader({
  title,
  status = "live",
  updatedAt,
  compact = false,
  children,
}: {
  title: string;
  status?: "live" | "cached" | "idle";
  updatedAt?: string | number | null;
  compact?: boolean;
  children?: ReactNode;
}) {
  const statusText = (() => {
    if (status === "live") return "● Live";
    if (updatedAt) {
      const ago = timeAgo(typeof updatedAt === "number" ? updatedAt : new Date(updatedAt).getTime());
      return `${ago}`;
    }
    return null;
  })();

  return (
    <div className="flex items-center justify-between mb-2.5">
      <span
        className={`${compact ? "text-[10px]" : "text-[11px]"} font-bold uppercase tracking-widest text-muted-foreground/70`}
      >
        {title}
      </span>
      <div className="flex items-center gap-2">
        {children}
        {statusText && (
          <span
            className={`tabular-nums rounded-full px-1.5 py-0.5 ${
              status === "live"
                ? "text-[8px] text-success/80 bg-success/8 font-medium"
                : "text-[8px] text-muted-foreground/45"
            }`}
          >
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Utility: time ago ── */
function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Muted secondary value ── */
export function SecondaryValue({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col ${compact ? "gap-0" : "gap-0.5"}`}>
      <span className={`${compact ? "text-[7px]" : "text-[8px]"} text-muted-foreground/40 uppercase tracking-wider font-medium`}>
        {label}
      </span>
      <span className={`${compact ? "text-[10px]" : "text-xs"} text-foreground/70 tabular-nums font-medium`}>
        {value}
      </span>
    </div>
  );
}

/* ── Reusable empty / error state ── */
export function WidgetEmptyState({
  error = false,
  message,
  hint,
  onRetry,
}: {
  error?: boolean;
  message?: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-2.5 py-4">
      <div className="p-2.5 rounded-xl bg-secondary/30">
        <AlertCircle className="h-5 w-5 text-muted-foreground/30" />
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-[11px] font-medium">
          {message || (error ? "Failed to load data" : "No data available")}
        </p>
        {hint && (
          <p className="text-muted-foreground/40 text-[9px]">{hint}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <RefreshCw className="h-2.5 w-2.5" />
          Retry
        </button>
      )}
    </div>
  );
}

/* ── Reusable list skeleton ── */
export function ListSkeleton({ rows = 3, showHeader = true }: { rows?: number; showHeader?: boolean }) {
  return (
    <div className="h-full space-y-2.5">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12 rounded-full" />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-3 w-14" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Data row for list-style widgets ── */
export function DataRow({
  label,
  sublabel,
  price,
  priceFormatted,
  change,
  compact = false,
  extra,
}: {
  label: string;
  sublabel?: string;
  price?: number;
  priceFormatted?: string;
  change: number;
  compact?: boolean;
  extra?: ReactNode;
}) {
  const displayPrice = priceFormatted ?? (price !== undefined
    ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "");

  return (
    <div className={`flex items-center justify-between ${compact ? "py-1" : "py-[7px]"} border-b border-border/10 last:border-0 transition-colors hover:bg-secondary/10 rounded-sm -mx-1 px-1`}>
      <div className="flex flex-col min-w-0">
        <span className={`${compact ? "text-[10px]" : "text-[11px]"} font-semibold text-foreground leading-tight truncate`}>
          {label}
        </span>
        {sublabel && (
          <span className="text-[8px] text-muted-foreground/35 leading-tight">{sublabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {extra}
        {displayPrice && (
          <span className={`${compact ? "text-[10px]" : "text-[11px]"} font-mono text-foreground tabular-nums`}>
            {displayPrice}
          </span>
        )}
        <ChangeIndicator value={change} compact={compact} />
      </div>
    </div>
  );
}
