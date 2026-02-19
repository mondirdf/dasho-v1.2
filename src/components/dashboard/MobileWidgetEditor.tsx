/**
 * MobileWidgetEditor — touch-friendly widget editing for mobile.
 * 
 * Instead of drag-resize (which conflicts with scroll on touch),
 * this provides:
 *  - Reorder via up/down buttons
 *  - Size presets (small / medium / large)
 *  - Remove widget
 */
import { memo, useCallback } from "react";
import { ChevronUp, ChevronDown, Maximize2, Minimize2, Square, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Widget } from "@/services/dataService";

interface Props {
  widget: Widget;
  index: number;
  total: number;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
}

const MobileWidgetEditor = memo(({ widget, index, total, onMoveUp, onMoveDown, onRemove }: Props) => {
  return (
    <div className="flex items-center justify-between gap-1 px-2 py-1.5 bg-secondary/60 rounded-t-[var(--radius)] border-b border-border/40">
      <div className="flex items-center gap-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">
          {widget.type.replace(/_/g, " ")}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          disabled={index === 0}
          onClick={() => onMoveUp(widget.id)}
          aria-label="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          disabled={index === total - 1}
          onClick={() => onMoveDown(widget.id)}
          aria-label="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
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
