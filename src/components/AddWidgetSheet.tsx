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
  { type: "crypto_price", label: "Crypto Price", icon: LineChart, desc: "Single coin price tracker" },
  { type: "multi_tracker", label: "Multi Tracker", icon: BarChart3, desc: "Track multiple coins at once" },
  { type: "news", label: "News Feed", icon: Newspaper, desc: "Latest crypto news" },
  { type: "fear_greed", label: "Fear & Greed", icon: Gauge, desc: "Market sentiment index" },
  { type: "market_context", label: "Market Context", icon: Globe, desc: "Overall market stats" },
];

const AddWidgetSheet = () => {
  const { addWidget } = useDashboard();
  const [open, setOpen] = useState(false);

  const handleAdd = async (type: string) => {
    await addWidget(type);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Widget
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border">
        <SheetHeader>
          <SheetTitle className="text-foreground">Add Widget</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {WIDGET_TYPES.map((w) => (
            <button
              key={w.type}
              onClick={() => handleAdd(w.type)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors text-left"
            >
              <div className="p-2 rounded-md bg-primary/10">
                <w.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{w.label}</p>
                <p className="text-xs text-muted-foreground">{w.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddWidgetSheet;
