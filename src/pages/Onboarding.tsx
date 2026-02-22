/**
 * Onboarding page — 2-step flow:
 *   Step 1: Trading style + preferred assets
 *   Step 2: Widget selection (auto-suggested based on step 1)
 */
import { useState, useCallback, useMemo } from "react";
import { LayoutGrid, Sparkles, Check, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createDashboard, createWidget } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from "@/components/widgets/widgetRegistry";
import { Button } from "@/components/ui/button";

/* ── Trading Style Presets ── */
const TRADING_STYLES = [
  {
    id: "day",
    label: "Day Trader",
    desc: "Fast execution, short timeframes, high frequency",
    icon: "⚡",
    suggestedWidgets: ["crypto_price", "multi_tracker", "fear_greed", "news", "session_monitor", "structure_scanner"],
  },
  {
    id: "swing",
    label: "Swing Trader",
    desc: "Multi-day holds, trend following, technical analysis",
    icon: "📊",
    suggestedWidgets: ["crypto_price", "multi_tracker", "market_recap", "market_context", "volatility_regime", "mtf_confluence"],
  },
  {
    id: "longterm",
    label: "Long-term Investor",
    desc: "Portfolio building, fundamentals, macro trends",
    icon: "🏦",
    suggestedWidgets: ["multi_tracker", "market_context", "market_recap", "news", "macro_news", "global_indices"],
  },
] as const;

const ASSET_OPTIONS = [
  { id: "BTC", label: "Bitcoin", icon: "₿" },
  { id: "ETH", label: "Ethereum", icon: "Ξ" },
  { id: "SOL", label: "Solana", icon: "◎" },
  { id: "XRP", label: "XRP", icon: "✕" },
  { id: "ADA", label: "Cardano", icon: "₳" },
  { id: "DOGE", label: "Dogecoin", icon: "Ð" },
  { id: "STOCKS", label: "Stocks", icon: "📈" },
  { id: "FOREX", label: "Forex", icon: "💱" },
];

const Onboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [tradingStyle, setTradingStyle] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set(["BTC", "ETH"]));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const [creating, setCreating] = useState(false);

  // Auto-suggest widgets when moving to step 2
  const goToStep2 = useCallback(() => {
    const style = TRADING_STYLES.find((s) => s.id === tradingStyle);
    if (style) {
      setSelected(new Set(style.suggestedWidgets.filter((w) => WIDGET_REGISTRY.some((r) => r.type === w && r.available))));
    }
    // Add stock/forex widgets if those assets selected
    if (selectedAssets.has("STOCKS")) {
      setSelected((prev) => new Set([...prev, "stock_tracker"]));
    }
    if (selectedAssets.has("FOREX")) {
      setSelected((prev) => new Set([...prev, "forex_rates"]));
    }
    setStep(2);
  }, [tradingStyle, selectedAssets]);

  const toggleAsset = useCallback((id: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create dashboard.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }, [user, selected, toast]);

  const filtered = activeCategory === "all"
    ? WIDGET_REGISTRY
    : WIDGET_REGISTRY.filter((w) => w.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="glass-card-glow p-6 sm:p-10 max-w-2xl w-full space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 1 ? "Welcome to Dasho" : "Build Your Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {step === 1
              ? "Tell us about your trading style so we can set up the perfect dashboard for you."
              : "We've pre-selected widgets based on your style. Customize as you like."}
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 1 ? "bg-primary" : "bg-primary/30"}`} />
            <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-primary/30"}`} />
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Trading Style */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">How do you trade?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TRADING_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTradingStyle(s.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                      tradingStyle === s.id
                        ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                        : "border-border/40 hover:bg-secondary/60"
                    }`}
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-sm font-medium text-foreground">{s.label}</span>
                    <span className="text-[11px] text-muted-foreground leading-snug">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Assets */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">What do you trade?</p>
              <div className="flex flex-wrap gap-2">
                {ASSET_OPTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => toggleAsset(a.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border ${
                      selectedAssets.has(a.id)
                        ? "bg-primary/10 border-primary/30 text-foreground"
                        : "border-border/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <span>{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={goToStep2}
              disabled={!tradingStyle}
              className="w-full gap-2 h-11"
              size="lg"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            {/* Category Filter */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none justify-center">
              {WIDGET_CATEGORIES.map((cat) => (
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

            {/* Widget Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
              {filtered.map((w) => {
                const isSelected = selected.has(w.type);
                const Icon = w.icon;
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
                      <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : w.available ? w.iconColor : "text-muted-foreground"}`} />
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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={selected.size === 0 || creating}
                className="flex-1 gap-2 h-11"
                size="lg"
              >
                <LayoutGrid className="h-4 w-4" />
                {creating ? "Creating…" : selected.size > 0
                  ? `Create Dashboard with ${selected.size} widget${selected.size > 1 ? "s" : ""}`
                  : "Select widgets to get started"
                }
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
