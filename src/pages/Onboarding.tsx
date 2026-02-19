/**
 * Onboarding page — shown when user has no dashboards/widgets.
 * Lets user pick widgets and creates first dashboard automatically.
 */
import { useState, useCallback } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createDashboard, createWidget } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { WIDGET_CATALOG } from "@/components/AddWidgetSheet";
import { Button } from "@/components/ui/button";
import { Check, Plus, Lock } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto" },
  { id: "news", label: "News" },
  { id: "finance", label: "Finance" },
  { id: "weather", label: "Weather" },
  { id: "stocks", label: "Stocks" },
];

const Onboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const [creating, setCreating] = useState(false);

  const toggleSelect = useCallback((type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!user || selected.size === 0) return;
    setCreating(true);
    try {
      const dash = await createDashboard(user.id, "My Dashboard");
      for (const type of selected) {
        await createWidget(dash.id, type);
      }
      toast({ title: "Dashboard created!" });
      // Force reload to pick up the new dashboard
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create dashboard.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }, [user, selected, toast]);

  const filtered = activeCategory === "all"
    ? WIDGET_CATALOG
    : WIDGET_CATALOG.filter((w) => w.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="glass-card-glow p-6 sm:p-10 max-w-2xl w-full space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Build Your Dashboard</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Select the widgets you want to track. You can always add, remove, or customize later.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
          {filtered.map((w) => {
            const isSelected = selected.has(w.type);
            return (
              <button
                key={w.type}
                onClick={() => w.available && toggleSelect(w.type)}
                disabled={!w.available}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  w.available
                    ? isSelected
                      ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20"
                      : "hover:bg-secondary/60 cursor-pointer border border-transparent"
                    : "opacity-40 cursor-not-allowed border border-transparent"
                }`}
              >
                <div className={`p-2 rounded-xl ${isSelected ? "bg-primary/20" : "bg-secondary/80"}`}>
                  <w.icon className={`h-5 w-5 ${isSelected ? "text-primary" : w.available ? w.color : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{w.label}</p>
                    {!w.available && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" /> Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{w.desc}</p>
                </div>
                {w.available && (
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-primary border-primary" : "border-border/60"
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Create button */}
        <Button
          onClick={handleCreate}
          disabled={selected.size === 0 || creating}
          className="w-full gap-2 h-11"
          size="lg"
        >
          <LayoutGrid className="h-4 w-4" />
          {creating ? "Creating…" : selected.size > 0
            ? `Create Dashboard with ${selected.size} widget${selected.size > 1 ? "s" : ""}`
            : "Select widgets to get started"
          }
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;