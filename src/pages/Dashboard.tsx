import { useAuth } from "@/contexts/AuthContext";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AddWidgetSheet from "@/components/AddWidgetSheet";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import { Pencil, Check, LogOut, Share2 } from "lucide-react";
// @ts-ignore - react-grid-layout types issue
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useCallback } from "react";
import { shareTemplate } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

const ResponsiveGrid = WidthProvider(Responsive);

const DashboardContent = () => {
  const { signOut, user } = useAuth();
  const {
    dashboard,
    widgets,
    layout,
    loading,
    editMode,
    setEditMode,
    removeWidget,
    onLayoutChange,
  } = useDashboard();
  const { toast } = useToast();

  const handleShare = useCallback(async () => {
    if (!dashboard || !user) return;
    try {
      await shareTemplate(
        user.id,
        dashboard.name + " Template",
        layout,
        widgets.map((w) => ({ type: w.type, config_json: w.config_json }))
      );
      toast({ title: "Template shared!", description: "Others can now find and use your dashboard layout." });
    } catch {
      toast({ title: "Error", description: "Failed to share template.", variant: "destructive" });
    }
  }, [dashboard, user, layout, widgets, toast]);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">
          {dashboard?.name ?? "Dashboard"}
        </h1>
        <div className="flex items-center gap-2">
          <AddWidgetSheet />
          <Button
            size="sm"
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
            className="gap-1.5"
          >
            {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editMode ? "Done" : "Edit"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5">
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button size="sm" variant="ghost" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Grid */}
      <div className="p-4">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="glass-card p-10 text-center space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Your dashboard is empty</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Click "Add Widget" to start building your custom crypto dashboard.
              </p>
              <AddWidgetSheet />
            </div>
          </div>
        ) : (
          <ResponsiveGrid
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            isDraggable={editMode}
            isResizable={editMode}
            onLayoutChange={(l) => onLayoutChange(l)}
            draggableHandle=".glass-card"
          >
            {widgets.map((w) => (
              <div key={w.id}>
                <WidgetRenderer
                  widget={w}
                  editMode={editMode}
                  onRemove={removeWidget}
                />
              </div>
            ))}
          </ResponsiveGrid>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => (
  <DashboardProvider>
    <DashboardContent />
  </DashboardProvider>
);

export default Dashboard;
