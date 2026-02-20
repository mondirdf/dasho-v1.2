/**
 * MobileWidgetEditor — touch-friendly widget editing for mobile.
 */
import { memo } from "react";
import { X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Widget } from "@/services/dataService";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface Props {
  widget: Widget;
  onRemove: (id: string) => void;
  onSettings?: (id: string) => void;
  dragListeners?: SyntheticListenerMap;
}

const MobileWidgetEditor = memo(({ widget, onRemove, onSettings, dragListeners }: Props) => {
  return (
    <div className="relative bg-secondary/80 rounded-t-[var(--radius)] border border-b-0 border-primary/20">
      {/* Full-width drag handle — easy to grab from anywhere along the top */}
      <div
        className="touch-none flex items-center justify-center w-full h-12 cursor-grab active:cursor-grabbing active:bg-primary/10 transition-colors select-none"
        aria-label="Drag to reorder"
        {...dragListeners}
      >
        {/* Visual pill indicator */}
        <div className="w-12 h-1.5 rounded-full bg-primary/40" />
      </div>
      {/* Controls row */}
      <div className="flex items-center justify-between px-3 pb-2 -mt-1">
        <span className="text-sm text-foreground font-medium truncate capitalize">
          {widget.type.replace(/_/g, " ")}
        </span>
        <div className="flex items-center gap-1">
          {onSettings && (
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 border-border/60"
              onClick={() => onSettings(widget.id)}
              aria-label="Widget settings"
            >
              <Settings2 className="h-4 w-4 text-primary" />
            </Button>
          )}
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onRemove(widget.id)}
            aria-label="Remove widget"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

MobileWidgetEditor.displayName = "MobileWidgetEditor";
export default MobileWidgetEditor;
