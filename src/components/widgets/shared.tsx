/**
 * Shared widget sub-components for consistent terminal-style layout.
 * Used by all widgets for header, change indicators, and status.
 */
import type { ReactNode } from "react";

/* ── Direction indicator ── */
export function ChangeIndicator({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const positive = value >= 0;
  const arrow = positive ? "▲" : "▼";
  const cls = positive ? "text-success" : "text-destructive";
  return (
    <span
      className={`${cls} font-semibold tabular-nums ${compact ? "text-[10px]" : "text-xs"}`}
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
    if (status === "cached" && updatedAt) {
      const ago = timeAgo(typeof updatedAt === "number" ? updatedAt : new Date(updatedAt).getTime());
      return `Updated ${ago}`;
    }
    if (updatedAt) {
      const ago = timeAgo(typeof updatedAt === "number" ? updatedAt : new Date(updatedAt).getTime());
      return `Updated ${ago}`;
    }
    return null;
  })();

  return (
    <div className="flex items-center justify-between mb-2">
      <span
        className={`${compact ? "text-[10px]" : "text-xs"} font-semibold uppercase tracking-wider text-muted-foreground`}
      >
        {title}
      </span>
      <div className="flex items-center gap-2">
        {children}
        {statusText && (
          <span
            className={`text-[9px] tabular-nums ${
              status === "live" ? "text-success/70" : "text-muted-foreground/50"
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
    <span className={`${compact ? "text-[9px]" : "text-[10px]"} text-muted-foreground/60 tabular-nums`}>
      {label} {value}
    </span>
  );
}
