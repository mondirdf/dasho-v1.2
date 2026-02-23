/**
 * Session & Killzone Monitor Widget
 * Tracks active trading sessions, killzone windows, and volume heatmap.
 * Updates every minute.
 */
import { useState, useEffect, useMemo } from "react";
import { analyzeSession, type SessionResult, type SessionName } from "@/engines/sessionEngine";
import { useOHLCData } from "@/hooks/useOHLCData";
import { Clock, BarChart3 } from "lucide-react";

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

/** Build a 24-slot hourly volume heatmap from 1h OHLC data */
function buildVolumeHeatmap(candles: { openTime: number; volume: number }[]): number[] {
  const hourlyVol = new Array(24).fill(0);
  const hourlyCounts = new Array(24).fill(0);

  for (const c of candles) {
    const hour = new Date(c.openTime).getUTCHours();
    hourlyVol[hour] += c.volume;
    hourlyCounts[hour]++;
  }

  // Average volume per hour
  for (let i = 0; i < 24; i++) {
    if (hourlyCounts[i] > 0) hourlyVol[i] /= hourlyCounts[i];
  }
  return hourlyVol;
}

const VolumeHeatmap = ({ volumes, currentHour }: { volumes: number[]; currentHour: number }) => {
  const maxVol = Math.max(...volumes, 1);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <BarChart3 className="h-3 w-3 text-muted-foreground/50" />
        <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">Volume Heatmap (UTC)</span>
      </div>
      <div className="flex gap-px h-6">
        {volumes.map((vol, hour) => {
          const intensity = maxVol > 0 ? vol / maxVol : 0;
          const isCurrentHour = hour === currentHour;
          // Color based on intensity
          const bg = intensity > 0.8 ? "bg-primary/70"
            : intensity > 0.6 ? "bg-primary/50"
            : intensity > 0.4 ? "bg-primary/30"
            : intensity > 0.2 ? "bg-primary/15"
            : "bg-secondary/20";
          
          return (
            <div
              key={hour}
              className={`flex-1 rounded-sm transition-all relative ${bg} ${isCurrentHour ? "ring-1 ring-foreground/40" : ""}`}
              title={`${String(hour).padStart(2, "0")}:00 — Vol: ${vol > 1000 ? (vol / 1000).toFixed(0) + "K" : vol.toFixed(0)}`}
              style={{ minHeight: `${Math.max(15, intensity * 100)}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between">
        <span className="text-[7px] text-muted-foreground/30">00</span>
        <span className="text-[7px] text-muted-foreground/30">06</span>
        <span className="text-[7px] text-muted-foreground/30">12</span>
        <span className="text-[7px] text-muted-foreground/30">18</span>
        <span className="text-[7px] text-muted-foreground/30">23</span>
      </div>
    </div>
  );
};

const SessionMonitorWidget = ({ config }: Props) => {
  const [sessionResult, setSessionResult] = useState<SessionResult>(() => analyzeSession());
  const symbol = config?.symbol || "BTC";

  // Fetch 1h candles for volume heatmap
  const { data: candles } = useOHLCData({ symbol, timeframe: "1h", limit: 100 });

  const volumeHeatmap = useMemo(() => {
    if (!candles || candles.length < 10) return new Array(24).fill(0);
    return buildVolumeHeatmap(candles);
  }, [candles]);

  // Update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionResult(analyzeSession());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const { sessions, killzones, activeKillzones, nextKillzone, utcTime, currentHourUTC } = sessionResult;

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

      {/* Volume Heatmap */}
      <VolumeHeatmap volumes={volumeHeatmap} currentHour={currentHourUTC} />

      {/* 24h session timeline */}
      <div className="mt-auto">
        <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider">24H Timeline</span>
        <div className="relative h-4 bg-secondary/20 rounded-full mt-1 overflow-hidden">
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
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground z-10"
            style={{ left: `${(currentHourUTC / 24) * 100}%` }}
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
