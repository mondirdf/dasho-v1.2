import { useAuth } from "@/contexts/AuthContext";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import AddWidgetSheet from "@/components/AddWidgetSheet";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import {
  Pencil, Check, LogOut, Share2, Plus, Trash2, Copy,
  RotateCcw, LayoutGrid, ChevronDown
} from "lucide-react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useCallback, useState } from "react";
import { shareTemplate } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ResponsiveGrid = WidthProvider(Responsive);

const DashboardContent = () => {
  const { signOut, user } = useAuth();
  const {
    dashboards,
    dashboard,
    widgets,
    layout,
    loading,
    editMode,
    setEditMode,
    removeWidget,
    onLayoutChange,
    switchDashboard,
    createNewDashboard,
    deleteDashboard,
    renameDashboard,
    duplicateDashboard,
    resetLayout,
  } = useDashboard();
  const { toast } = useToast();
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");

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

  const handleRename = async () => {
    if (!newName.trim()) return;
    await renameDashboard(newName.trim());
    setRenameOpen(false);
    setNewName("");
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-12 w-full mb-4 rounded-lg" />
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
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="text-sm font-bold text-foreground hidden sm:block">
            Pulse<span className="text-primary">Board</span>
          </Link>

          {/* Dashboard selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 max-w-[200px] truncate">
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span className="truncate">{dashboard?.name ?? "Dashboard"}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {dashboards.map((d) => (
                <DropdownMenuItem
                  key={d.id}
                  onClick={() => switchDashboard(d.id)}
                  className={d.id === dashboard?.id ? "bg-secondary" : ""}
                >
                  {d.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={createNewDashboard}>
                <Plus className="h-4 w-4 mr-2" /> New Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setNewName(dashboard?.name || ""); setRenameOpen(true); }}>
                <Pencil className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={duplicateDashboard}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={resetLayout}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset Layout
              </DropdownMenuItem>
              {dashboards.length > 1 && (
                <DropdownMenuItem onClick={deleteDashboard} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <AddWidgetSheet />
          <Button
            size="sm"
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
            className="gap-1.5"
            aria-label={editMode ? "Finish editing" : "Edit layout"}
          >
            {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            <span className="hidden sm:inline">{editMode ? "Done" : "Edit"}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5" aria-label="Share as template">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Link to="/alerts">
            <Button size="sm" variant="ghost" aria-label="Alerts">🔔</Button>
          </Link>
          <Link to="/settings">
            <Button size="sm" variant="ghost" aria-label="Settings">⚙️</Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Grid */}
      <div className="p-4">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="glass-card p-10 text-center space-y-3 max-w-md">
              <LayoutGrid className="h-12 w-12 mx-auto text-primary/40" />
              <h2 className="text-xl font-semibold text-foreground">Your dashboard is empty</h2>
              <p className="text-muted-foreground text-sm">
                Add widgets to start tracking crypto prices, news, and market data.
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
            onLayoutChange={(l) => onLayoutChange([...l])}
            draggableHandle=".widget-drag-handle"
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

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Dashboard</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Dashboard name"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Dashboard = () => (
  <DashboardProvider>
    <DashboardContent />
  </DashboardProvider>
);

export default Dashboard;
