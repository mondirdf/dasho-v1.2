/**
 * JournalWidget — Performance journal with daily market snapshots.
 * Auto-logs market conditions + allows manual notes.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface JournalEntry {
  date: string;
  sentiment: string;
  btcChange: number;
  notes: string;
}

const JournalWidget = ({ config }: { config: any }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketData();
  }, [currentMonth]);

  const loadMarketData = async () => {
    setLoading(true);
    // Load Fear & Greed for sentiment
    const { data: fg } = await supabase.from("cache_fear_greed").select("*").limit(1);
    const sentiment = fg?.[0]?.value_classification || "Neutral";

    // Load BTC price for change
    const { data: btc } = await supabase.from("cache_crypto_data").select("change_24h").eq("symbol", "BTC").limit(1);
    const btcChange = btc?.[0]?.change_24h || 0;

    // Create today's snapshot
    const today = new Date().toISOString().split("T")[0];
    const savedNotes = localStorage.getItem(`journal_${user?.id}_${today}`) || "";

    setEntries([{
      date: today,
      sentiment,
      btcChange: Number(btcChange),
      notes: savedNotes,
    }]);
    setLoading(false);
  };

  const saveNote = (date: string, note: string) => {
    localStorage.setItem(`journal_${user?.id}_${date}`, note);
    setEntries((prev) =>
      prev.map((e) => e.date === date ? { ...e, notes: note } : e)
    );
    setSelectedDate(null);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth();
  const today = new Date().toISOString().split("T")[0];
  const todayEntry = entries.find((e) => e.date === today);

  const monthStr = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Journal</h3>
      </div>

      {/* Today's snapshot */}
      {todayEntry && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/20">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground">Today</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-foreground">{todayEntry.sentiment}</span>
              <span className={`text-[10px] font-medium ${todayEntry.btcChange >= 0 ? "text-success" : "text-destructive"}`}>
                BTC {todayEntry.btcChange >= 0 ? "+" : ""}{todayEntry.btcChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <button
            onClick={() => { setSelectedDate(today); setNoteText(todayEntry.notes); }}
            className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Note editor */}
      {selectedDate && (
        <div className="space-y-1.5">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add your trading notes for today..."
            className="w-full px-2.5 py-2 rounded-lg text-xs bg-secondary/60 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
            rows={3}
          />
          <div className="flex gap-1.5">
            <button onClick={() => saveNote(selectedDate, noteText)} className="text-[10px] text-primary font-medium px-2 py-1 rounded bg-primary/10">Save</button>
            <button onClick={() => setSelectedDate(null)} className="text-[10px] text-muted-foreground px-2 py-1">Cancel</button>
          </div>
        </div>
      )}

      {/* Mini calendar */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-0.5 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-[10px] font-medium text-foreground">{monthStr}</span>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-0.5 text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-[8px] text-muted-foreground py-0.5">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === today;
            const hasNote = localStorage.getItem(`journal_${user?.id}_${dateStr}`);
            return (
              <div
                key={day}
                className={`text-[9px] py-0.5 rounded cursor-default ${
                  isToday ? "bg-primary/20 text-primary font-bold" :
                  hasNote ? "bg-success/10 text-success" :
                  "text-muted-foreground"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JournalWidget;
