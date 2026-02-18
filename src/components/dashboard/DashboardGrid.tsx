import { useDashboard } from "@/contexts/DashboardContext";
import AddWidgetSheet from "@/components/AddWidgetSheet";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import { LayoutGrid } from "lucide-react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useIsMobile } from "@/hooks/use-mobile";

const ResponsiveGrid = WidthProvider(Responsive);

const DashboardGrid = () => {
  const { widgets, layout, editMode, removeWidget, onLayoutChange } = useDashboard();
  const isMobile = useIsMobile();

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4">
        <div className="glass-card-glow p-8 sm:p-12 text-center space-y-4 max-w-md w-full animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Your dashboard is empty</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Add widgets to start tracking crypto prices, news, and market data.
          </p>
          <div className="pt-2">
            <AddWidgetSheet />
          </div>
        </div>
      </div>
    );
  }

  if (isMobile && !editMode) {
    // Mobile: stacked card layout
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
    <div className="p-3 sm:p-4 animate-fade-in">
      <ResponsiveGrid
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={isMobile ? 70 : 80}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={(l) => onLayoutChange([...l])}
        draggableHandle=".widget-drag-handle"
        margin={isMobile ? [8, 8] : [12, 12]}
      >
        {widgets.map((w) => (
          <div key={w.id}>
            <WidgetRenderer widget={w} editMode={editMode} onRemove={removeWidget} />
          </div>
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default DashboardGrid;
