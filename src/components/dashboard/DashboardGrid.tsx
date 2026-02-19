import { useMemo, useCallback } from "react";
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
import { useState } from "react";

const ResponsiveGrid = WidthProvider(Responsive);

const DashboardGrid = () => {
  const { widgets, layout, editMode, removeWidget, onLayoutChange } = useDashboard();
  const isMobile = useIsMobile();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /** Build layout items with per-widget constraints from registry */
  const constrainedLayout = useMemo(() => {
    return layout.map((item) => {
      const widget = widgets.find((w) => w.id === item.i);
      const c = getWidgetConstraints(widget?.type ?? "");
      return {
        ...item,
        minW: c.minW,
        minH: c.minH,
        ...(c.maxW ? { maxW: c.maxW } : {}),
        ...(c.maxH ? { maxH: c.maxH } : {}),
      };
    });
  }, [layout, widgets]);

  /** Mobile reorder: swap widget positions in layout */
  const mobileReorder = useCallback((id: string, direction: "up" | "down") => {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= widgets.length) return;

    // Swap y positions in layout
    const newLayout = layout.map((item) => {
      const itemA = layout.find((l) => l.i === widgets[idx].id);
      const itemB = layout.find((l) => l.i === widgets[swapIdx].id);
      if (!itemA || !itemB) return item;
      if (item.i === itemA.i) return { ...item, y: itemB.y };
      if (item.i === itemB.i) return { ...item, y: itemA.y };
      return item;
    });
    onLayoutChange(newLayout);
  }, [widgets, layout, onLayoutChange]);

  /** Sort widgets by layout y position for mobile display */
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      const la = layout.find((l) => l.i === a.id);
      const lb = layout.find((l) => l.i === b.id);
      return (la?.y ?? 0) - (lb?.y ?? 0);
    });
  }, [widgets, layout]);

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

  /* ── Mobile layout: stacked with optional edit controls ── */
  if (isMobile) {
    return (
      <div className="p-3 space-y-3 animate-fade-in">
        {sortedWidgets.map((w, i) => (
          <div key={w.id}>
            {editMode && (
              <MobileWidgetEditor
                widget={w}
                index={i}
                total={sortedWidgets.length}
                onMoveUp={(id) => mobileReorder(id, "up")}
                onMoveDown={(id) => mobileReorder(id, "down")}
                onRemove={(id) => setConfirmId(id)}
              />
            )}
            <div className={`min-h-[200px] ${editMode ? "rounded-b-[var(--radius)] overflow-hidden ring-1 ring-primary/20" : ""}`}>
              <WidgetRenderer widget={w} editMode={false} onRemove={removeWidget} />
            </div>
          </div>
        ))}
        <ConfirmDialog
          open={!!confirmId}
          onOpenChange={(open) => !open && setConfirmId(null)}
          title="Remove widget?"
          description="This widget will be permanently removed from your dashboard."
          onConfirm={() => { if (confirmId) { removeWidget(confirmId); setConfirmId(null); } }}
          confirmLabel="Remove"
          destructive
        />
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
        preventCollision={true}
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
