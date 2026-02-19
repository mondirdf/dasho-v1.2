import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Plus, BarChart3, Newspaper, Gauge, Globe, LineChart,
  Cloud, TrendingUp, Gamepad2, Clock, Lock
} from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";

export interface WidgetDefinition {
  category: string;
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  color: string;
  available: boolean;
}

export const WIDGET_CATALOG: WidgetDefinition[] = [
  // Crypto
  { category: "crypto", type: "crypto_price", label: "Crypto Price", icon: LineChart, desc: "Single coin price tracker with sparkline", color: "text-primary", available: true },
  { category: "crypto", type: "multi_tracker", label: "Multi Tracker", icon: BarChart3, desc: "Track multiple coins at once", color: "text-accent", available: true },
  { category: "crypto", type: "fear_greed", label: "Fear & Greed", icon: Gauge, desc: "Market sentiment index gauge", color: "text-success", available: true },
  { category: "crypto", type: "market_context", label: "Market Context", icon: Globe, desc: "Overall market statistics", color: "text-primary", available: true },
  // News
  { category: "news", type: "news", label: "News Feed", icon: Newspaper, desc: "Latest news articles", color: "text-warning", available: true },
  // Finance (coming soon)
  { category: "finance", type: "forex_rates", label: "Forex Rates", icon: BarChart3, desc: "Live currency exchange rates", color: "text-accent", available: false },
  { category: "finance", type: "portfolio", label: "Portfolio", icon: TrendingUp, desc: "Track your investment portfolio", color: "text-success", available: false },
  // Weather (coming soon)
  { category: "weather", type: "weather_current", label: "Current Weather", icon: Cloud, desc: "Live weather for your city", color: "text-accent", available: false },
  { category: "weather", type: "weather_forecast", label: "Forecast", icon: Cloud, desc: "5-day weather forecast", color: "text-primary", available: false },
  // Stocks (coming soon)
  { category: "stocks", type: "stock_price", label: "Stock Price", icon: TrendingUp, desc: "Real-time stock quotes", color: "text-success", available: false },
  { category: "stocks", type: "stock_chart", label: "Stock Chart", icon: LineChart, desc: "Interactive stock charts", color: "text-primary", available: false },
  // Sports (coming soon)
  { category: "sports", type: "live_scores", label: "Live Scores", icon: Gamepad2, desc: "Live sports scores", color: "text-warning", available: false },
  // Productivity (coming soon)
  { category: "productivity", type: "clock_widget", label: "World Clock", icon: Clock, desc: "Multiple timezone clocks", color: "text-muted-foreground", available: false },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto" },
  { id: "news", label: "News" },
  { id: "finance", label: "Finance" },
  { id: "weather", label: "Weather" },
  { id: "stocks", label: "Stocks" },
  { id: "sports", label: "Sports" },
  { id: "productivity", label: "Productivity" },
];

interface AddWidgetSheetProps {
  variant?: "default" | "mobile";
}

const AddWidgetSheet = ({ variant = "default" }: AddWidgetSheetProps) => {
  const { addWidget } = useDashboard();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const handleAdd = async (type: string) => {
    await addWidget(type);
    setOpen(false);
  };

  const filtered = activeCategory === "all"
    ? WIDGET_CATALOG
    : WIDGET_CATALOG.filter((w) => w.category === activeCategory);

  const trigger = variant === "mobile" ? (
    <button className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-primary transition-colors" aria-label="Add widget">
      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
        <Plus className="h-4 w-4" />
      </div>
      <span className="text-[10px] font-medium">Add</span>
    </button>
  ) : (
    <Button size="sm" className="gap-1.5 h-8">
      <Plus className="h-3.5 w-3.5" /> <span className="text-xs">Widget</span>
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="bg-card/95 backdrop-blur-xl border-border/60 w-[320px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-foreground text-base">Add Widget</SheetTitle>
        </SheetHeader>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto py-3 -mx-1 px-1 scrollbar-none">
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

        {/* Widget list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filtered.map((w) => (
            <button
              key={w.type}
              onClick={() => w.available && handleAdd(w.type)}
              disabled={!w.available}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                w.available
                  ? "hover:bg-secondary/60 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className={`p-2.5 rounded-xl transition-colors ${
                w.available ? "bg-secondary/80 group-hover:bg-primary/10" : "bg-secondary/40"
              }`}>
                <w.icon className={`h-5 w-5 ${w.available ? w.color : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{w.label}</p>
                  {!w.available && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-full">
                      <Lock className="h-2.5 w-2.5" /> Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{w.desc}</p>
              </div>
              {w.available && (
                <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddWidgetSheet;
