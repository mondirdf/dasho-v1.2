import { useMemo, useCallback, useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import AddWidgetSheet from "@/components/AddWidgetSheet";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import MobileWidgetEditor from "@/components/dashboard/MobileWidgetEditor";
import { LayoutGrid } from "lucide-react";
import { EMPTY_DASHBOARD } from "@/config/site";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { getWidgetConstraints } from "@/components/widgets/widgetRegistry";
import ConfirmDialog from "@/components/ConfirmDialog";
import WidgetSettingsModal from "@/components/widgets/WidgetSettingsModal";
import {
  DndContext,
  closestCenter,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Widget } from "@/services/dataService";

const ResponsiveGrid = WidthProvider(Responsive);

/** Sortable wrapper for mobile widgets */
const SortableWidget = ({ widget, editMode, onRemove, onSettings, onConfirmRemove }: {
  widget: Widget;
  editMode: boolean;
  onRemove: (id: string) => void;
  onSettings: (id: string) => void;
  onConfirmRemove: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : 1,
    scale: isDragging ? "1.02" : "1",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {editMode && (
        <MobileWidgetEditor
          widget={widget}
          onRemove={(id) => onConfirmRemove(id)}
          onSettings={(id) => onSettings(id)}
          dragListeners={listeners}
        />
      )}
      <div className={`min-h-[220px] ${editMode ? "rounded-b-[var(--radius)] overflow-hidden ring-1 ring-primary/20" : ""}`}>
        <WidgetRenderer widget={widget} editMode={false} onRemove={onRemove} />
      </div>
    </div>
  );
};

const DashboardGrid = () => {
  const { widgets, layout, editMode, removeWidget, onLayoutChange } = useDashboard();
  const isMobile = useIsMobile();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
  const settingsWidget = widgets.find((w) => w.id === settingsWidgetId) ?? null;

  /** Build layout items — ensure pre_trade_check & market_recap are at top */
  const constrainedLayout = useMemo(() => {
    return layout.map((item) => {
      const widget = widgets.find((w) => w.id === item.i);
      const c = getWidgetConstraints(widget?.type ?? "");
      const isPTC = widget?.type === "pre_trade_check";
      const isRecap = widget?.type === "market_recap";
      return {
        ...item,
        // Push pre-trade check to absolute top
        ...(isPTC && !editMode ? { y: 0, x: 0 } : {}),
        // Push recap just below PTC
        ...(isRecap && item.y > 0 && !editMode ? { y: 0, x: 0 } : {}),
        minW: c.minW,
        minH: c.minH,
        ...(c.maxW ? { maxW: c.maxW } : {}),
        ...(c.maxH ? { maxH: c.maxH } : {}),
      };
    });
  }, [layout, widgets, editMode]);

  /** Sort widgets: pre_trade_check first, then market_recap, then by layout y */
  const sortedWidgets = useMemo(() => {
    const priority = ["pre_trade_check", "market_recap"];
    return [...widgets].sort((a, b) => {
      const pa = priority.indexOf(a.type);
      const pb = priority.indexOf(b.type);
      if (pa !== -1 && pb === -1) return -1;
      if (pb !== -1 && pa === -1) return 1;
      if (pa !== -1 && pb !== -1) return pa - pb;
      const la = layout.find((l) => l.i === a.id);
      const lb = layout.find((l) => l.i === b.id);
      return (la?.y ?? 0) - (lb?.y ?? 0);
    });
  }, [widgets, layout]);

  const sortedIds = useMemo(() => sortedWidgets.map((w) => w.id), [sortedWidgets]);

  /** DnD sensors with activation delay to avoid conflicts with scroll */
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 10 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );


  /** Handle drag end — reorder by swapping y positions */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedWidgets.findIndex((w) => w.id === active.id);
    const newIndex = sortedWidgets.findIndex((w) => w.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // Build new y-order by reassigning y values
    const reordered = [...sortedWidgets];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const newLayout = layout.map((item) => {
      const newY = reordered.findIndex((w) => w.id === item.i);
      return newY >= 0 ? { ...item, y: newY } : item;
    });
    onLayoutChange(newLayout);
  }, [sortedWidgets, layout, onLayoutChange]);

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4">
        <div className="glass-card-glow p-8 sm:p-12 text-center space-y-4 max-w-md w-full animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{EMPTY_DASHBOARD.heading}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {EMPTY_DASHBOARD.description}
          </p>
          <div className="pt-2">
            <AddWidgetSheet />
          </div>
        </div>
      </div>
    );
  }

  /* ── Mobile layout: DnD sortable ── */
  if (isMobile) {
    return (
      <div className="px-3 py-2 space-y-3 pb-24 animate-fade-in">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
            {sortedWidgets.map((w) => (
              <SortableWidget
                key={w.id}
                widget={w}
                editMode={editMode}
                onRemove={removeWidget}
                onSettings={(id) => setSettingsWidgetId(id)}
                onConfirmRemove={(id) => setConfirmId(id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <ConfirmDialog
          open={!!confirmId}
          onOpenChange={(open) => !open && setConfirmId(null)}
          title="Remove widget?"
          description="This widget will be permanently removed from your dashboard."
          onConfirm={() => { if (confirmId) { removeWidget(confirmId); setConfirmId(null); } }}
          confirmLabel="Remove"
          destructive
        />
        {settingsWidget && (
          <WidgetSettingsModal
            widget={settingsWidget}
            open={!!settingsWidgetId}
            onOpenChange={(open) => !open && setSettingsWidgetId(null)}
          />
        )}
      </div>
    );
  }

  /* ── Desktop layout: react-grid-layout ── */
  return (
    <div className={`p-3 sm:p-4 animate-fade-in ${editMode ? "dashboard-edit-mode" : ""}`}>
      <ResponsiveGrid
        className="layout"
        layouts={{ lg: constrainedLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={(l) => onLayoutChange([...l])}
        draggableHandle=".widget-drag-handle"
        margin={[12, 12]}
        resizeHandles={["n", "s", "e", "w"]}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map((w) => {
          const c = getWidgetConstraints(w.type);
          return (
            <div
              key={w.id}
              data-grid={{
                minW: c.minW,
                minH: c.minH,
                ...(c.maxW ? { maxW: c.maxW } : {}),
                ...(c.maxH ? { maxH: c.maxH } : {}),
              }}
            >
              <WidgetRenderer widget={w} editMode={editMode} onRemove={removeWidget} />
            </div>
          );
        })}
      </ResponsiveGrid>
    </div>
  );
};

export default DashboardGrid;
