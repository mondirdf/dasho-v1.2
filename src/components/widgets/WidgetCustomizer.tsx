/**
 * WidgetCustomizer — per-widget style customization panel.
 * Stores customization in widget.config_json.style
 */
import { useState } from "react";
import { Paintbrush, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface WidgetStyle {
  bgColor?: string;
  accentColor?: string;
  borderRadius?: number;
  shadowIntensity?: number;
  animationsEnabled?: boolean;
}

interface Props {
  style: WidgetStyle;
  onChange: (style: WidgetStyle) => void;
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

const WidgetCustomizer = ({ style, onChange }: Props) => {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-1.5 left-1.5 z-20 p-1.5 rounded-lg bg-secondary/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:text-primary"
        aria-label="Customize widget"
      >
        <Paintbrush className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="absolute inset-0 z-30 bg-card/95 backdrop-blur-md rounded-[var(--radius)] p-4 space-y-4 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Paintbrush className="h-4 w-4 text-primary" /> Customize
        </h3>
        <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-secondary">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Background</Label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.label}
              onClick={() => onChange({ ...style, bgColor: c.value })}
              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                (style.bgColor || "") === c.value
                  ? "border-primary scale-110"
                  : "border-border/50 hover:border-border"
              }`}
              style={{ background: c.value ? `hsl(${c.value})` : "hsl(var(--glass-bg))" }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Accent</Label>
        <div className="flex flex-wrap gap-1.5">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c.label}
              onClick={() => onChange({ ...style, accentColor: c.value })}
              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                (style.accentColor || "") === c.value
                  ? "border-primary scale-110"
                  : "border-border/50 hover:border-border"
              }`}
              style={{ background: c.value ? `hsl(${c.value})` : "hsl(var(--primary))" }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Border Radius: {style.borderRadius ?? 14}px</Label>
        <Slider
          value={[style.borderRadius ?? 14]}
          min={0}
          max={28}
          step={2}
          onValueChange={([v]) => onChange({ ...style, borderRadius: v })}
        />
      </div>

      {/* Shadow Intensity */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Shadow: {style.shadowIntensity ?? 50}%</Label>
        <Slider
          value={[style.shadowIntensity ?? 50]}
          min={0}
          max={100}
          step={10}
          onValueChange={([v]) => onChange({ ...style, shadowIntensity: v })}
        />
      </div>

      {/* Animations toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Animations</Label>
        <Switch
          checked={style.animationsEnabled ?? true}
          onCheckedChange={(v) => onChange({ ...style, animationsEnabled: v })}
        />
      </div>
    </div>
  );
};

export default WidgetCustomizer;
