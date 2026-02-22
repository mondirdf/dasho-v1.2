/**
 * Session & Killzone Engine
 * Identifies active trading sessions and killzone windows.
 * 
 * Sessions (UTC):
 * - Asia/Tokyo:  00:00 – 09:00
 * - London:      07:00 – 16:00
 * - New York:    12:00 – 21:00
 * 
 * Killzones (highest volatility windows):
 * - Asia KZ:     01:00 – 04:00
 * - London KZ:   07:00 – 10:00
 * - NY KZ:       12:00 – 15:00
 * - London Close: 15:00 – 16:00
 */

export type SessionName = "asia" | "london" | "new_york";
export type KillzoneName = "asia_kz" | "london_kz" | "ny_kz" | "london_close";

export interface Session {
  name: SessionName;
  label: string;
  startHour: number; // UTC
  endHour: number;   // UTC
  active: boolean;
  /** Minutes until session starts (0 if active) */
  minutesUntilStart: number;
  /** Minutes until session ends */
  minutesUntilEnd: number;
  /** Session progress 0-1 */
  progress: number;
}

export interface Killzone {
  name: KillzoneName;
  label: string;
  startHour: number;
  endHour: number;
  active: boolean;
  minutesUntilStart: number;
}

export interface SessionResult {
  sessions: Session[];
  killzones: Killzone[];
  activeSessions: SessionName[];
  activeKillzones: KillzoneName[];
  nextKillzone: Killzone | null;
  /** Current UTC hour */
  currentHourUTC: number;
  /** Formatted UTC time */
  utcTime: string;
}

const SESSION_DEFS: { name: SessionName; label: string; start: number; end: number }[] = [
  { name: "asia", label: "Asia/Tokyo", start: 0, end: 9 },
  { name: "london", label: "London", start: 7, end: 16 },
  { name: "new_york", label: "New York", start: 12, end: 21 },
];

const KILLZONE_DEFS: { name: KillzoneName; label: string; start: number; end: number }[] = [
  { name: "asia_kz", label: "Asia Killzone", start: 1, end: 4 },
  { name: "london_kz", label: "London Open KZ", start: 7, end: 10 },
  { name: "ny_kz", label: "NY Open KZ", start: 12, end: 15 },
  { name: "london_close", label: "London Close", start: 15, end: 16 },
];

function isInRange(currentMinutes: number, startHour: number, endHour: number): boolean {
  const start = startHour * 60;
  const end = endHour * 60;
  if (start < end) return currentMinutes >= start && currentMinutes < end;
  // Wraps midnight
  return currentMinutes >= start || currentMinutes < end;
}

function minutesUntil(currentMinutes: number, targetHour: number): number {
  const target = targetHour * 60;
  const diff = target - currentMinutes;
  return diff > 0 ? diff : diff + 1440; // wrap around 24h
}

export function analyzeSession(now?: Date): SessionResult {
  const d = now ?? new Date();
  const hours = d.getUTCHours();
  const mins = d.getUTCMinutes();
  const currentMinutes = hours * 60 + mins;

  const sessions: Session[] = SESSION_DEFS.map((s) => {
    const active = isInRange(currentMinutes, s.start, s.end);
    const totalDuration = (s.end - s.start) * 60;
    const elapsed = active ? currentMinutes - s.start * 60 : 0;
    const progress = active ? Math.min(1, elapsed / totalDuration) : 0;

    return {
      name: s.name,
      label: s.label,
      startHour: s.start,
      endHour: s.end,
      active,
      minutesUntilStart: active ? 0 : minutesUntil(currentMinutes, s.start),
      minutesUntilEnd: active ? minutesUntil(currentMinutes, s.end) : 0,
      progress,
    };
  });

  const killzones: Killzone[] = KILLZONE_DEFS.map((k) => {
    const active = isInRange(currentMinutes, k.start, k.end);
    return {
      name: k.name,
      label: k.label,
      startHour: k.start,
      endHour: k.end,
      active,
      minutesUntilStart: active ? 0 : minutesUntil(currentMinutes, k.start),
    };
  });

  const activeSessions = sessions.filter((s) => s.active).map((s) => s.name);
  const activeKillzones = killzones.filter((k) => k.active).map((k) => k.name);

  // Next killzone
  const inactiveKZs = killzones.filter((k) => !k.active);
  const nextKillzone = inactiveKZs.length > 0
    ? inactiveKZs.reduce((a, b) => a.minutesUntilStart < b.minutesUntilStart ? a : b)
    : null;

  const utcTime = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} UTC`;

  return {
    sessions,
    killzones,
    activeSessions,
    activeKillzones,
    nextKillzone,
    currentHourUTC: hours,
    utcTime,
  };
}
