import { useDashboard } from "@/contexts/DashboardContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import AddWidgetSheet from "@/components/AddWidgetSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Pencil, Check, LogOut, Share2, Plus, Trash2, Copy,
  RotateCcw, LayoutGrid, ChevronDown, Bell
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useCallback, useState } from "react";
import logoDasho from "@/assets/logo-dasho.png";
import { shareTemplate } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

const DashboardHeader = () => {
  const { signOut, user } = useAuth();
  const {
    dashboards, dashboard, widgets, layout, editMode, setEditMode,
    switchDashboard, createNewDashboard, deleteDashboard, renameDashboard,
    duplicateDashboard, resetLayout,
  } = useDashboard();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!dashboard || !user) return;
    setSharing(true);
    try {
      const tmpl = await shareTemplate(
        user.id,
        dashboard.name + " Template",
        layout,
        widgets.map((w) => ({ type: w.type, config_json: w.config_json }))
      );
      // Get the public_share_id from the created template
      const shareUrl = `${window.location.origin}/template/${tmpl.public_share_id}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Template shared!", description: "Share link copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to share template.", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  }, [dashboard, user, layout, widgets, toast]);

  const setRenameOpen = useDashboard().setRenameOpen;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/60 glass-nav px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!isMobile && (
            <Link to="/" className="mr-1">
              <img src={logoDasho} alt="Dasho" className="h-20" />
            </Link>
          )}

          {/* Dashboard selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 max-w-[180px] sm:max-w-[220px] truncate text-foreground">
                <LayoutGrid className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate font-medium">{dashboard?.name ?? "Dashboard"}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {dashboards.map((d) => (
                <DropdownMenuItem
                  key={d.id}
                  onClick={() => switchDashboard(d.id)}
                  className={d.id === dashboard?.id ? "bg-primary/10 text-primary" : ""}
                >
                  {d.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={createNewDashboard}>
                <Plus className="h-4 w-4 mr-2" /> New Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenameOpen?.(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={duplicateDashboard}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setResetOpen(true)}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset Layout
              </DropdownMenuItem>
              {dashboards.length > 1 && (
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {!isMobile && <AddWidgetSheet />}
          <Button
            size="sm"
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
            className="gap-1.5 h-8"
            aria-label={editMode ? "Finish editing" : "Edit layout"}
          >
            {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline text-xs">{editMode ? "Done" : "Edit"}</span>
          </Button>
          {!isMobile && (
            <>
              <Link to="/templates">
                <Button size="sm" variant="outline" className="gap-1.5 h-8" aria-label="Templates">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline text-xs">Templates</span>
                </Button>
              </Link>
              <Button size="sm" variant="outline" onClick={handleShare} disabled={sharing} className="gap-1.5 h-8" aria-label="Share">
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-xs">{sharing ? "Sharing…" : "Share"}</span>
              </Button>
              <Link to="/alerts">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Alerts"><Bell className="h-4 w-4" /></Button>
              </Link>
              <Link to="/settings">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Settings">⚙️</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={signOut} className="h-8 w-8 p-0" aria-label="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete dashboard?"
        description="This will permanently delete this dashboard and all its widgets. This action cannot be undone."
        onConfirm={() => { deleteDashboard(); setDeleteOpen(false); }}
        confirmLabel="Delete"
        destructive
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset layout?"
        description="This will reset all widget positions to default. Your widgets won't be deleted."
        onConfirm={() => { resetLayout(); setResetOpen(false); }}
        confirmLabel="Reset"
      />
    </>
  );
};

export default DashboardHeader;
