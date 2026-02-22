/**
 * Session & Killzone Monitor Widget
 * Tracks active trading sessions and killzone windows.
 * Updates every minute.
 */
import { useState, useEffect, useMemo } from "react";
import { analyzeSession, type SessionResult, type SessionName } from "@/engines/sessionEngine";
import { Clock } from "lucide-react";

interface Props {
  config: any;
}

const SESSION_COLORS: Record<SessionName, string> = {
  asia: "bg-accent/15 border-accent/25 text-accent",
  london: "bg-warning/15 border-warning/25 text-warning",
  new_york: "bg-success/15 border-success/25 text-success",
};

const SESSION_BAR_COLORS: Record<SessionName, string> = {
  asia: "bg-accent/50",
  london: "bg-warning/50",
  new_york: "bg-success/50",
};

const SessionMonitorWidget = ({ config }: Props) => {
  const [sessionResult, setSessionResult] = useState<SessionResult>(() => analyzeSession());

  // Update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionResult(analyzeSession());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const { sessions, killzones, activeKillzones, nextKillzone, utcTime } = sessionResult;

  return (
    <div className="h-full flex flex-col gap-2 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Sessions</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{utcTime}</span>
      </div>

      {/* Active killzone alert */}
      {activeKillzones.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg px-2.5 py-1.5 animate-pulse-glow">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            <span className="text-[10px] font-semibold text-warning">
              KILLZONE ACTIVE
            </span>
          </div>
          <p className="text-[9px] text-warning/70 mt-0.5">
            {killzones.filter((k) => k.active).map((k) => k.label).join(", ")}
          </p>
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-1.5">
        {sessions.map((session) => (
          <div
            key={session.name}
            className={`rounded-lg border px-2.5 py-2 ${
              session.active
                ? SESSION_COLORS[session.name]
                : "bg-secondary/15 border-border/15 text-muted-foreground/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {session.active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                )}
                <span className="text-[10px] font-semibold">{session.label}</span>
              </div>
              <span className="text-[9px] font-mono">
                {session.active
                  ? `${session.minutesUntilEnd}m left`
                  : `in ${session.minutesUntilStart}m`}
              </span>
            </div>
            {/* Progress bar */}
            {session.active && (
              <div className="mt-1 h-1 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${SESSION_BAR_COLORS[session.name]}`}
                  style={{ width: `${session.progress * 100}%` }}
                />
              </div>
            )}
            <div className="flex justify-between mt-0.5">
              <span className="text-[8px] opacity-50">
                {String(session.startHour).padStart(2, "0")}:00
              </span>
              <span className="text-[8px] opacity-50">
                {String(session.endHour).padStart(2, "0")}:00
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Next killzone */}
      {nextKillzone && !activeKillzones.length && (
        <div className="bg-secondary/20 rounded-lg px-2.5 py-1.5">
          <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">Next Killzone</span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] font-semibold text-foreground">{nextKillzone.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {nextKillzone.minutesUntilStart}m
            </span>
          </div>
        </div>
      )}

      {/* 24h session timeline */}
      <div className="mt-auto">
        <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">24H Timeline</span>
        <div className="relative h-4 bg-secondary/20 rounded-full mt-1 overflow-hidden">
          {/* Session bars */}
          {sessions.map((s) => (
            <div
              key={s.name}
              className={`absolute top-0 h-full ${SESSION_BAR_COLORS[s.name]} opacity-40`}
              style={{
                left: `${(s.startHour / 24) * 100}%`,
                width: `${((s.endHour - s.startHour) / 24) * 100}%`,
              }}
            />
          ))}
          {/* Current time marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground z-10"
            style={{ left: `${(sessionResult.currentHourUTC / 24) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[7px] text-muted-foreground/30">00:00</span>
          <span className="text-[7px] text-muted-foreground/30">06:00</span>
          <span className="text-[7px] text-muted-foreground/30">12:00</span>
          <span className="text-[7px] text-muted-foreground/30">18:00</span>
          <span className="text-[7px] text-muted-foreground/30">24:00</span>
        </div>
      </div>
    </div>
  );
};

export default SessionMonitorWidget;
