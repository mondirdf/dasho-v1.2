import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Newspaper, Gauge, Globe, LineChart } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";

const WIDGET_TYPES = [
  { type: "crypto_price", label: "Crypto Price", icon: LineChart, desc: "Single coin price tracker with sparkline", color: "text-primary" },
  { type: "multi_tracker", label: "Multi Tracker", icon: BarChart3, desc: "Track multiple coins at once", color: "text-accent" },
  { type: "news", label: "News Feed", icon: Newspaper, desc: "Latest crypto news articles", color: "text-warning" },
  { type: "fear_greed", label: "Fear & Greed", icon: Gauge, desc: "Market sentiment index gauge", color: "text-success" },
  { type: "market_context", label: "Market Context", icon: Globe, desc: "Overall market statistics", color: "text-primary" },
];

interface AddWidgetSheetProps {
  variant?: "default" | "mobile";
}

const AddWidgetSheet = ({ variant = "default" }: AddWidgetSheetProps) => {
  const { addWidget } = useDashboard();
  const [open, setOpen] = useState(false);

  const handleAdd = async (type: string) => {
    await addWidget(type);
    setOpen(false);
  };

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
      <SheetContent className="bg-card/95 backdrop-blur-xl border-border/60 w-[300px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle className="text-foreground text-base">Add Widget</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-1.5">
          {WIDGET_TYPES.map((w) => (
            <button
              key={w.type}
              onClick={() => handleAdd(w.type)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-all text-left group"
            >
              <div className="p-2.5 rounded-xl bg-secondary/80 group-hover:bg-primary/10 transition-colors">
                <w.icon className={`h-5 w-5 ${w.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{w.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{w.desc}</p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddWidgetSheet;
