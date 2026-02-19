/**
 * WidgetCustomizer — per-widget style + size customization panel.
 * Stores customization in widget.config_json.style
 */
import { useState, useRef, useCallback } from "react";
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

export interface WidgetSize {
  w: number;
  h: number;
  preset?: string;
}

interface Props {
  style: WidgetStyle;
  size?: WidgetSize;
  onChange: (style: WidgetStyle) => void;
  onSizeChange?: (size: WidgetSize) => void;
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

const SIZE_PRESETS = [
  { label: "Small", w: 3, h: 2, id: "small" },
  { label: "Medium", w: 4, h: 3, id: "medium" },
  { label: "Large", w: 6, h: 4, id: "large" },
];

const WidgetCustomizer = ({ style, size, onChange, onSizeChange }: Props) => {
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedChange = useCallback((newStyle: WidgetStyle) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(newStyle);
    }, 300);
  }, [onChange]);

  const handleStyleChange = useCallback((newStyle: WidgetStyle) => {
    debouncedChange(newStyle);
  }, [debouncedChange]);

  const currentPreset = size ? SIZE_PRESETS.find((p) => p.w === size.w && p.h === size.h)?.id || "custom" : "medium";

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

      {/* Size presets */}
      {onSizeChange && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Size</Label>
          <div className="flex gap-1.5">
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => onSizeChange({ w: p.w, h: p.h, preset: p.id })}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentPreset === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom size sliders */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Columns: {size?.w ?? 4}</Label>
              <Slider
                value={[size?.w ?? 4]}
                min={2}
                max={12}
                step={1}
                onValueChange={([v]) => onSizeChange?.({ w: v, h: size?.h ?? 3 })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Rows: {size?.h ?? 3}</Label>
              <Slider
                value={[size?.h ?? 3]}
                min={2}
                max={8}
                step={1}
                onValueChange={([v]) => onSizeChange?.({ w: size?.w ?? 4, h: v })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Background</Label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.label}
              onClick={() => handleStyleChange({ ...style, bgColor: c.value })}
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
              onClick={() => handleStyleChange({ ...style, accentColor: c.value })}
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
          onValueChange={([v]) => handleStyleChange({ ...style, borderRadius: v })}
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
          onValueChange={([v]) => handleStyleChange({ ...style, shadowIntensity: v })}
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