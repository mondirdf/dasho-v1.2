/**
 * StreakCounter — Tracks consecutive daily logins.
 * Uses localStorage to persist streak data.
 */
import { memo, useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const STORAGE_KEY = "dasho_streak";

interface StreakData {
  count: number;
  lastDate: string;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, lastDate: "" };
}

function updateStreak(): number {
  const today = getToday();
  const yesterday = getYesterday();
  const streak = loadStreak();

  if (streak.lastDate === today) return streak.count;

  let newCount: number;
  if (streak.lastDate === yesterday) {
    newCount = streak.count + 1;
  } else {
    newCount = 1;
  }

  const updated: StreakData = { count: newCount, lastDate: today };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newCount;
}

const StreakCounter = memo(() => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(updateStreak());
  }, []);

  if (count < 1) return null;

  const color =
    count >= 7
      ? "text-warning"
      : count >= 3
      ? "text-primary"
      : "text-muted-foreground";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 border border-border/40 cursor-default ${color}`}>
            <Flame className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{count}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {count} day streak! Keep it up 🔥
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

StreakCounter.displayName = "StreakCounter";
export default StreakCounter;
