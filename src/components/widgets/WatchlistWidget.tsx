/**
 * WatchlistWidget — User's personal watchlist with notes.
 * Free: 5 items max | Pro: unlimited.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Eye, Plus, Trash2, StickyNote, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WatchlistItem {
  id: string;
  symbol: string;
  asset_type: string;
  notes: string | null;
  created_at: string;
}

const MAX_FREE_ITEMS = 5;

const WatchlistWidget = ({ config }: { config: any }) => {
  const { user } = useAuth();
  const { isPro } = usePlanLimits();
  const { toast } = useToast();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("watchlist_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as any) ?? []);
    setLoading(false);
  }, [user]);

  // Load prices from cache
  useEffect(() => {
    const loadPrices = async () => {
      const { data: crypto } = await supabase.from("cache_crypto_data").select("symbol, price, change_24h");
      const map: Record<string, { price: number; change: number }> = {};
      (crypto ?? []).forEach((c: any) => {
        map[c.symbol] = { price: c.price, change: c.change_24h };
      });
      setPrices(map);
    };
    loadPrices();
  }, []);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!user || !newSymbol.trim()) return;
    const sym = newSymbol.trim().toUpperCase();
    if (!isPro && items.length >= MAX_FREE_ITEMS) {
      toast({ title: "Free plan limit", description: `Upgrade to Pro for unlimited watchlist items.`, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("watchlist_items").insert({
      user_id: user.id,
      symbol: sym,
      asset_type: "crypto",
    } as any);
    if (error) {
      if (error.code === "23505") toast({ title: `${sym} already in watchlist` });
      else toast({ title: "Error adding item", variant: "destructive" });
      return;
    }
    setNewSymbol("");
    load();
  };

  const removeItem = async (id: string) => {
    await supabase.from("watchlist_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const saveNote = async (id: string) => {
    await supabase.from("watchlist_items").update({ notes: noteText } as any).eq("id", id);
    setEditingNote(null);
    load();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Watchlist</h3>
        {!isPro && (
          <span className="text-[10px] text-muted-foreground ml-auto">{items.length}/{MAX_FREE_ITEMS}</span>
        )}
      </div>

      {/* Add input */}
      <div className="flex gap-1.5">
        <input
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add symbol..."
          className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-secondary/60 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          maxLength={10}
        />
        <button onClick={addItem} className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Add symbols to your watchlist</p>
        ) : (
          items.map((item) => {
            const p = prices[item.symbol];
            return (
              <div key={item.id} className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-secondary/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{item.symbol}</span>
                    {p && (
                      <>
                        <span className="text-xs text-muted-foreground">${p.price?.toLocaleString()}</span>
                        <span className={`text-[10px] font-medium ${p.change >= 0 ? "text-success" : "text-destructive"}`}>
                          {p.change >= 0 ? "+" : ""}{p.change?.toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                  {item.notes && editingNote !== item.id && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{item.notes}</p>
                  )}
                  {editingNote === item.id && (
                    <div className="flex gap-1 mt-1">
                      <input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveNote(item.id)}
                        className="flex-1 px-2 py-1 rounded text-[10px] bg-secondary/60 border border-border/40 text-foreground focus:outline-none"
                        placeholder="Add a note..."
                        autoFocus
                      />
                      <button onClick={() => saveNote(item.id)} className="text-[10px] text-primary px-1.5">Save</button>
                      <button onClick={() => setEditingNote(null)} className="text-[10px] text-muted-foreground"><X className="h-3 w-3" /></button>
                    </div>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingNote(item.id); setNoteText(item.notes || ""); }}
                    className="p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                  >
                    <StickyNote className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WatchlistWidget;
