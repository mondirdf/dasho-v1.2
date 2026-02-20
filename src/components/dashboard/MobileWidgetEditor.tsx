/**
 * MobileWidgetEditor — touch-friendly widget editing for mobile.
 * 
 * Instead of drag-resize (which conflicts with scroll on touch),
 * this provides:
 *  - Reorder via up/down buttons
 *  - Size presets (small / medium / large)
 *  - Remove widget
 */
import { memo } from "react";
import { ChevronUp, ChevronDown, X, GripVertical, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Widget } from "@/services/dataService";

interface Props {
  widget: Widget;
  index: number;
  total: number;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  onSettings?: (id: string) => void;
}

const MobileWidgetEditor = memo(({ widget, index, total, onMoveUp, onMoveDown, onRemove, onSettings }: Props) => {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-secondary/80 rounded-t-[var(--radius)] border border-b-0 border-primary/20">
      <div className="flex items-center gap-2 min-w-0">
        <GripVertical className="h-4 w-4 text-primary/60 shrink-0" />
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
          className="h-8 w-8 border-border/60"
          disabled={index === 0}
          onClick={() => onMoveUp(widget.id)}
          aria-label="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 border-border/60"
          disabled={index === total - 1}
          onClick={() => onMoveDown(widget.id)}
          aria-label="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
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
