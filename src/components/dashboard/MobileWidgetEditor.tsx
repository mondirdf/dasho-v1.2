/**
 * MobileWidgetEditor — touch-friendly widget editing for mobile.
 * 
 * Provides:
 *  - Drag handle (via @dnd-kit listeners)
 *  - Settings button
 *  - Remove widget
 */
import { memo } from "react";
import { X, GripVertical, Settings2 } from "lucide-react";
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
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-secondary/80 rounded-t-[var(--radius)] border border-b-0 border-primary/20">
      <div className="flex items-center gap-2 min-w-0">
        <button
          className="touch-none p-1 -m-1 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragListeners}
        >
          <GripVertical className="h-5 w-5 text-primary/60" />
        </button>
        <span className="text-sm text-foreground font-medium truncate capitalize">
          {widget.type.replace(/_/g, " ")}
        </span>
      </div>
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
  );
});

MobileWidgetEditor.displayName = "MobileWidgetEditor";
export default MobileWidgetEditor;
