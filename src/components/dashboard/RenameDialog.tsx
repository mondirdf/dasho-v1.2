import { useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const RenameDialog = () => {
  const { dashboard, renameDashboard, renameOpen, setRenameOpen } = useDashboard();
  const [newName, setNewName] = useState("");

  const handleOpen = (open: boolean) => {
    setRenameOpen(open);
    if (open) setNewName(dashboard?.name || "");
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    await renameDashboard(newName.trim());
    setRenameOpen(false);
    setNewName("");
  };

  return (
    <Dialog open={renameOpen} onOpenChange={handleOpen}>
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
  );
};

export default RenameDialog;
