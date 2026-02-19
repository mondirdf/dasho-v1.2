import { useMemo } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import AddWidgetSheet from "@/components/AddWidgetSheet";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import { LayoutGrid } from "lucide-react";
import { EMPTY_DASHBOARD } from "@/config/site";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { getWidgetConstraints } from "@/components/widgets/widgetRegistry";

const ResponsiveGrid = WidthProvider(Responsive);

const DashboardGrid = () => {
  const { widgets, layout, editMode, removeWidget, onLayoutChange } = useDashboard();
  const isMobile = useIsMobile();

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

  if (isMobile && !editMode) {
    return (
      <div className="p-3 space-y-3 animate-fade-in">
        {widgets.map((w) => (
          <div key={w.id} className="min-h-[200px]">
            <WidgetRenderer widget={w} editMode={editMode} onRemove={removeWidget} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`p-3 sm:p-4 animate-fade-in ${editMode ? "dashboard-edit-mode" : ""}`}>
      <ResponsiveGrid
        className="layout"
        layouts={{ lg: constrainedLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={isMobile ? 70 : 80}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={(l) => onLayoutChange([...l])}
        draggableHandle=".widget-drag-handle"
        margin={isMobile ? [8, 8] : [12, 12]}
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
