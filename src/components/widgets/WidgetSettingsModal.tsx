/**
 * WidgetSettingsModal — uses widgetRegistry for config fields.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Widget } from "@/services/dataService";
import { getWidgetDef } from "./widgetRegistry";

export interface WidgetStyle {
  bgColor?: string;
  accentColor?: string;
  borderRadius?: number;
  shadowIntensity?: number;
  animationsEnabled?: boolean;
}

const COLOR_PRESETS = [
  { label: "Default", value: "" },
  { label: "Deep Blue", value: "220 60% 12%" },
  { label: "Dark Purple", value: "263 40% 12%" },
  { label: "Forest", value: "152 40% 10%" },
  { label: "Warm", value: "25 40% 12%" },
  { label: "Slate", value: "215 25% 14%" },
];

const ACCENT_PRESETS = [
  { label: "Default", value: "" },
  { label: "Purple", value: "263 70% 60%" },
  { label: "Blue", value: "220 70% 55%" },
  { label: "Green", value: "152 69% 45%" },
  { label: "Orange", value: "38 92% 50%" },
  { label: "Pink", value: "330 70% 55%" },
];

interface Props {
  widget: Widget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WidgetSettingsModal = ({ widget, open, onOpenChange }: Props) => {
  const configJson = (widget.config_json as any) || {};
  const [style, setStyle] = useState<WidgetStyle>(configJson.style || {});
  const [config, setConfig] = useState<Record<string, any>>(() => {
    const { style: _, ...rest } = configJson;
    return rest;
  });
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((newStyle: WidgetStyle, newConfig: Record<string, any>) => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(async () => {
      const updated = { ...newConfig, style: newStyle } as Record<string, unknown>;
      await supabase.from("widgets").update({ config_json: updated as any }).eq("id", widget.id);
      (widget as any).config_json = updated;
    }, 400);
  }, [widget]);

  const updateStyle = useCallback((patch: Partial<WidgetStyle>) => {
    setStyle((prev) => {
      const next = { ...prev, ...patch };
      save(next, config);
      return next;
    });
  }, [config, save]);

  const updateConfig = useCallback((key: string, value: any) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      save(style, next);
      return next;
    });
  }, [style, save]);

  useEffect(() => {
    return () => { if (saveRef.current) clearTimeout(saveRef.current); };
  }, []);

  // Get config fields from registry
  const def = getWidgetDef(widget.type);
  const typeFields = def?.configFields || [];
  const widgetLabel = def?.label || widget.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-auto bg-card/95 backdrop-blur-xl border-border/60">
        <DialogHeader>
          <DialogTitle className="text-base text-foreground">{widgetLabel} Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={typeFields.length > 0 ? "config" : "style"} className="mt-2">
          <TabsList className="w-full bg-secondary/40">
            {typeFields.length > 0 && (
              <TabsTrigger value="config" className="flex-1 text-xs">Data & Display</TabsTrigger>
            )}
            <TabsTrigger value="style" className="flex-1 text-xs">Appearance</TabsTrigger>
          </TabsList>

          {typeFields.length > 0 && (
            <TabsContent value="config" className="space-y-4 mt-4">
              {typeFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  {field.type === "text" && (
                    <Input
                      value={config[field.key] ?? field.defaultValue ?? ""}
                      onChange={(e) => updateConfig(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="h-8 text-sm bg-secondary/40 border-border/40"
                    />
                  )}
                  {field.type === "number" && (
                    <Input
                      type="number"
                      value={config[field.key] ?? field.defaultValue ?? 0}
                      onChange={(e) => updateConfig(field.key, parseInt(e.target.value) || 0)}
                      className="h-8 text-sm bg-secondary/40 border-border/40"
                    />
                  )}
                  {field.type === "toggle" && (
                    <Switch
                      checked={config[field.key] ?? field.defaultValue ?? false}
                      onCheckedChange={(v) => updateConfig(field.key, v)}
                    />
                  )}
                  {field.type === "select" && field.options && (
                    <div className="flex gap-1.5 flex-wrap">
                      {field.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateConfig(field.key, opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            (config[field.key] ?? field.defaultValue) === opt.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          )}

          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Background</Label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => updateStyle({ bgColor: c.value })}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${
                      (style.bgColor || "") === c.value ? "border-primary scale-110" : "border-border/50 hover:border-border"
                    }`}
                    style={{ background: c.value ? `hsl(${c.value})` : "hsl(var(--glass-bg))" }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Accent</Label>
              <div className="flex flex-wrap gap-1.5">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => updateStyle({ accentColor: c.value })}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${
                      (style.accentColor || "") === c.value ? "border-primary scale-110" : "border-border/50 hover:border-border"
                    }`}
                    style={{ background: c.value ? `hsl(${c.value})` : "hsl(var(--primary))" }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Border Radius: {style.borderRadius ?? 14}px</Label>
              <Slider value={[style.borderRadius ?? 14]} min={0} max={28} step={2} onValueChange={([v]) => updateStyle({ borderRadius: v })} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Shadow: {style.shadowIntensity ?? 50}%</Label>
              <Slider value={[style.shadowIntensity ?? 50]} min={0} max={100} step={10} onValueChange={([v]) => updateStyle({ shadowIntensity: v })} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Animations</Label>
              <Switch checked={style.animationsEnabled ?? true} onCheckedChange={(v) => updateStyle({ animationsEnabled: v })} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetSettingsModal;
