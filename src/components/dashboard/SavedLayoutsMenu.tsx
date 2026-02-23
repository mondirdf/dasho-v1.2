/**
 * Saved Layouts menu — save, load, and delete layout profiles.
 * Pro-only feature.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Layers, Save, Trash2, Lock } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface SavedLayout {
  id: string;
  name: string;
  layout_json: any;
  created_at: string;
}

const SavedLayoutsMenu = () => {
  const { user } = useAuth();
  const { dashboard, layout, onLayoutChange } = useDashboard();
  const { isPro } = usePlanLimits();
  const { toast } = useToast();
  const [layouts, setLayouts] = useState<SavedLayout[]>([]);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadLayouts = useCallback(async () => {
    if (!user || !dashboard) return;
    const { data } = await supabase
      .from("saved_layouts")
      .select("*")
      .eq("dashboard_id", dashboard.id)
      .eq("user_id", user.id)
      .order("created_at");
    setLayouts((data as SavedLayout[]) ?? []);
  }, [user, dashboard]);

  useEffect(() => { loadLayouts(); }, [loadLayouts]);

  const handleSave = async () => {
    if (!user || !dashboard || !newName.trim()) return;
    setSaving(true);
    try {
      await supabase.from("saved_layouts").insert({
        dashboard_id: dashboard.id,
        user_id: user.id,
        name: newName.trim(),
        layout_json: layout,
      });
      setNewName("");
      setShowInput(false);
      toast({ title: "Layout saved" });
      loadLayouts();
    } catch {
      toast({ title: "Error saving layout", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (saved: SavedLayout) => {
    onLayoutChange(saved.layout_json as any);
    toast({ title: `Layout "${saved.name}" loaded` });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("saved_layouts").delete().eq("id", deleteId);
    setDeleteId(null);
    toast({ title: "Layout deleted" });
    loadLayouts();
  };

  if (!isPro) {
    return (
      <Button size="sm" variant="outline" className="gap-1.5 h-8 opacity-60 cursor-not-allowed" disabled title="Pro feature">
        <Lock className="h-3 w-3" />
        <span className="hidden lg:inline text-xs">Layouts</span>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5 h-8">
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden lg:inline text-xs">Layouts</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {layouts.length === 0 && !showInput && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No saved layouts yet</div>
          )}
          {layouts.map((l) => (
            <DropdownMenuItem key={l.id} className="flex justify-between">
              <span onClick={() => handleLoad(l)} className="flex-1 cursor-pointer">{l.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteId(l.id); }}
                className="text-destructive hover:text-destructive/80 ml-2"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {showInput ? (
            <div className="p-2 flex gap-2">
              <Input
                placeholder="Layout name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
              <Button size="sm" className="h-7 text-xs px-2" onClick={handleSave} disabled={saving || !newName.trim()}>
                Save
              </Button>
            </div>
          ) : (
            <DropdownMenuItem onClick={() => setShowInput(true)}>
              <Save className="h-4 w-4 mr-2" /> Save Current Layout
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete layout?"
        description="This saved layout will be permanently removed."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
};

export default SavedLayoutsMenu;
