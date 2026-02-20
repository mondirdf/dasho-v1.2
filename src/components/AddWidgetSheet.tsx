/**
 * AddWidgetSheet — Two-step flow:
 * 1. Select widget(s) from the registry
 * 2. Configure each selected widget's settings before adding
 */
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Lock, Check, ArrowLeft, ArrowRight, Settings2 } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { useState, useCallback } from "react";
import { WIDGET_REGISTRY, WIDGET_CATEGORIES, getWidgetDef } from "@/components/widgets/widgetRegistry";
import type { ConfigField } from "@/components/widgets/widgetRegistry";

interface AddWidgetSheetProps {
  variant?: "default" | "mobile";
  inline?: boolean;
  onDone?: () => void;
}

type WidgetConfig = Record<string, Record<string, any>>;

/** Render a single config field */
const ConfigFieldInput = ({
  field, value, onChange,
}: {
  field: ConfigField;
  value: any;
  onChange: (v: any) => void;
}) => {
  switch (field.type) {
    case "text":
      return (
        <Input
          value={value ?? field.defaultValue ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-8 text-sm bg-secondary/40 border-border/40"
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={value ?? field.defaultValue ?? 0}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="h-8 text-sm bg-secondary/40 border-border/40"
        />
      );
    case "toggle":
      return (
        <Switch
          checked={value ?? field.defaultValue ?? false}
          onCheckedChange={onChange}
        />
      );
    case "select":
      return (
        <div className="flex gap-1.5 flex-wrap">
          {field.options?.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                (value ?? field.defaultValue) === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    default:
      return null;
  }
};

const AddWidgetSheet = ({ variant = "default", inline, onDone }: AddWidgetSheetProps) => {
  const { addWidget } = useDashboard();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  // Step: "select" = choose widgets, "configure" = set per-widget config
  const [step, setStep] = useState<"select" | "configure">("select");
  const [configs, setConfigs] = useState<WidgetConfig>({});

  const toggleSelect = useCallback((type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const resetState = useCallback(() => {
    setSelected(new Set());
    setStep("select");
    setConfigs({});
    setActiveCategory("all");
  }, []);

  /** Move to configure step — initialize defaults */
  const goToConfigure = useCallback(() => {
    const initial: WidgetConfig = {};
    for (const type of selected) {
      const def = getWidgetDef(type);
      const fieldDefaults: Record<string, any> = {};
      for (const f of def?.configFields ?? []) {
        fieldDefaults[f.key] = f.defaultValue;
      }
      initial[type] = fieldDefaults;
    }
    setConfigs(initial);
    setStep("configure");
  }, [selected]);

  const updateFieldConfig = useCallback((type: string, key: string, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [type]: { ...prev[type], [key]: value },
    }));
  }, []);

  const handleAddAll = useCallback(async () => {
    if (selected.size === 0) return;
    setAdding(true);
    try {
      for (const type of selected) {
        await addWidget(type, configs[type] || {});
      }
      resetState();
      setOpen(false);
      onDone?.();
    } finally {
      setAdding(false);
    }
  }, [selected, configs, addWidget, onDone, resetState]);

  const activeCats = WIDGET_CATEGORIES.filter((c) => c.available).map((c) => c.id);
  const filtered = activeCategory === "all"
    ? WIDGET_REGISTRY.filter((w) => activeCats.includes(w.category as any))
    : WIDGET_REGISTRY.filter((w) => w.category === activeCategory);

  /** Check if any selected widget has configFields */
  const hasConfigurableWidgets = [...selected].some((t) => {
    const def = getWidgetDef(t);
    return def && def.configFields.length > 0;
  });

  /* ── Step 1: Selection ── */
  const selectionContent = (
    <>
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto py-3 -mx-1 px-1 scrollbar-none">
        {WIDGET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => cat.available && setActiveCategory(cat.id)}
            disabled={!cat.available}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !cat.available
                ? "bg-secondary/30 text-muted-foreground/50 cursor-not-allowed"
                : activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {cat.label}{!cat.available ? " ⏳" : ""}
          </button>
        ))}
      </div>

      {/* Widget grid */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {filtered.map((w) => {
          const isSelected = selected.has(w.type);
          const Icon = w.icon;
          return (
            <button
              key={w.type}
              onClick={() => w.available && toggleSelect(w.type)}
              disabled={!w.available}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                w.available
                  ? isSelected
                    ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20"
                    : "hover:bg-secondary/60 cursor-pointer border border-transparent"
                  : "opacity-50 cursor-not-allowed border border-transparent"
              }`}
            >
              <div className={`p-2.5 rounded-xl transition-colors ${
                isSelected ? "bg-primary/20" : w.available ? "bg-secondary/80 group-hover:bg-primary/10" : "bg-secondary/40"
              }`}>
                <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : w.available ? w.iconColor : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{w.label}</p>
                  {!w.available && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-full">
                      <Lock className="h-2.5 w-2.5" /> Soon
                    </span>
                  )}
                  {w.available && w.configFields.length > 0 && (
                    <Settings2 className="h-3 w-3 text-muted-foreground/50" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{w.desc}</p>
              </div>
              {w.available && (
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "border-border/60 group-hover:border-muted-foreground"
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom action */}
      {selected.size > 0 && (
        <div className="pt-3 border-t border-border/40 flex gap-2">
          {hasConfigurableWidgets ? (
            <Button onClick={goToConfigure} className="flex-1 gap-2">
              <Settings2 className="h-4 w-4" />
              Configure ({selected.size})
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button onClick={handleAddAll} className="flex-1 gap-2" disabled={adding}>
              <Plus className="h-4 w-4" />
              {adding ? "Adding…" : `Add ${selected.size} widget${selected.size > 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      )}
    </>
  );

  /* ── Step 2: Configure ── */
  const configureContent = (
    <>
      {/* Back button */}
      <button
        onClick={() => setStep("select")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to selection
      </button>

      {/* Per-widget config sections */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {[...selected].map((type) => {
          const def = getWidgetDef(type);
          if (!def) return null;
          const fields = def.configFields;
          const Icon = def.icon;

          return (
            <div key={type} className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-3">
              {/* Widget header */}
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className={`h-4 w-4 ${def.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{def.label}</p>
                  <p className="text-[11px] text-muted-foreground">{def.desc}</p>
                </div>
              </div>

              {/* Config fields */}
              {fields.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
                      <ConfigFieldInput
                        field={field}
                        value={configs[type]?.[field.key]}
                        onChange={(v) => updateFieldConfig(type, field.key, v)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">No configurable settings</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <div className="pt-3 border-t border-border/40">
        <Button onClick={handleAddAll} className="w-full gap-2" disabled={adding}>
          <Plus className="h-4 w-4" />
          {adding ? "Adding…" : `Add ${selected.size} widget${selected.size > 1 ? "s" : ""}`}
        </Button>
      </div>
    </>
  );

  const content = step === "select" ? selectionContent : configureContent;

  if (inline) {
    return <div className="flex flex-col h-full">{content}</div>;
  }

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
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="bg-card/95 backdrop-blur-xl border-border/60 w-[320px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-foreground text-base">
            {step === "select" ? "Add Widgets" : "Configure Widgets"}
          </SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
};

export default AddWidgetSheet;
