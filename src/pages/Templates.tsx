import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPublicTemplates,
  createDashboard,
  createWidget,
  updateDashboardLayout,
} from "@/services/dataService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Layout, Users, Search, Copy, Check, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Templates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<any | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicTemplates()
      .then(setTemplates)
      .catch(() => toast({ title: "Error loading templates", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = templates.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUse = useCallback(async (template: any) => {
    if (!user) return;
    setCloning(template.id);
    try {
      const dash = await createDashboard(user.id, template.name);
      const widgetDefs = Array.isArray(template.widgets_json) ? template.widgets_json : [];
      for (const w of widgetDefs) {
        await createWidget(dash.id, w.type, w.config_json || {});
      }
      if (Array.isArray(template.layout_json) && template.layout_json.length > 0) {
        await updateDashboardLayout(dash.id, template.layout_json);
      }
      // Increment use_count
      await supabase
        .from("public_templates")
        .update({ use_count: (template.use_count || 0) + 1 })
        .eq("id", template.id);

      toast({ title: "Template applied!", description: "Redirecting to your new dashboard." });
      navigate("/dashboard");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("Free plan")) {
        toast({ title: "Plan limit reached", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to apply template.", variant: "destructive" });
      }
    } finally {
      setCloning(null);
    }
  }, [user, toast, navigate]);

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/templates?id=${id}`);
    setCopiedId(id);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Layout className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Templates</h1>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search templates"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center space-y-3">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              {search ? "No templates match your search" : "No templates yet"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {search ? "Try a different search term." : "Share your dashboard from the Dashboard page to create the first template."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((t) => {
              const widgetCount = Array.isArray(t.widgets_json) ? t.widgets_json.length : 0;
              const widgetTypes = Array.isArray(t.widgets_json)
                ? [...new Set(t.widgets_json.map((w: any) => w.type))]
                : [];
              return (
                <div key={t.id} className="glass-card p-5 space-y-3 hover:border-primary/30 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {widgetTypes.map((type: string) => (
                      <Badge key={type} variant="secondary" className="text-xs">{type.replace("_", " ")}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {widgetCount} widget{widgetCount !== 1 ? "s" : ""} · {t.use_count || 0} uses · {new Date(t.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPreview(t)} className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Button>
                    <Button size="sm" onClick={() => handleUse(t)} className="gap-1.5" disabled={cloning === t.id}>
                      <Download className="h-3.5 w-3.5" /> {cloning === t.id ? "Cloning…" : "Use"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyLink(t.id)}
                      className="ml-auto h-8 w-8 p-0"
                      aria-label="Copy link"
                    >
                      {copiedId === t.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {Array.isArray(preview?.widgets_json) ? preview.widgets_json.length : 0} widgets · {preview?.use_count || 0} uses
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Included widgets:</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(preview?.widgets_json) && preview.widgets_json.map((w: any, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {(w.type || "unknown").replace("_", " ")}
                    {w.config_json?.symbol ? ` (${w.config_json.symbol})` : ""}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={() => { handleUse(preview); setPreview(null); }} className="w-full gap-1.5" disabled={cloning === preview?.id}>
              <Download className="h-4 w-4" /> {cloning === preview?.id ? "Cloning…" : "Use this template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
