/**
 * SharedTemplate — public page to preview and clone a shared template.
 * Accessible via /template/:shareId
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createDashboard, createWidget, updateDashboardLayout } from "@/services/dataService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Layout, ArrowLeft, Copy, Check, Users } from "lucide-react";

const SharedTemplate = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("public_templates")
        .select("*")
        .eq("public_share_id", shareId)
        .eq("is_public", true)
        .maybeSingle();
      if (error || !data) {
        setTemplate(null);
      } else {
        setTemplate(data);
      }
      setLoading(false);
    };
    load();
  }, [shareId]);

  const handleClone = useCallback(async () => {
    if (!user || !template) {
      toast({ title: "Please sign in to clone this template.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setCloning(true);
    try {
      const dash = await createDashboard(user.id, template.name);
      const widgetDefs = Array.isArray(template.widgets_json) ? template.widgets_json : [];
      for (const w of widgetDefs) {
        await createWidget(dash.id, w.type, w.config_json || {});
      }
      if (Array.isArray(template.layout_json) && template.layout_json.length > 0) {
        await updateDashboardLayout(dash.id, template.layout_json);
      }
      // Increment clone_count
      await supabase
        .from("public_templates")
        .update({ clone_count: (template.clone_count || 0) + 1 })
        .eq("id", template.id);

      toast({ title: "Template cloned!", description: "Redirecting to your new dashboard." });
      navigate("/dashboard");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("Free plan")) {
        toast({ title: "Plan limit reached", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Error cloning template", variant: "destructive" });
      }
    } finally {
      setCloning(false);
    }
  }, [user, template, toast, navigate]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <Layout className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Template not found</h1>
        <p className="text-muted-foreground text-sm">This template may have been removed or made private.</p>
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Go Home
        </Button>
      </div>
    );
  }

  const widgetDefs = Array.isArray(template.widgets_json) ? template.widgets_json : [];
  const widgetTypes = [...new Set(widgetDefs.map((w: any) => w.type))];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="glass-card-glow p-6 sm:p-10 max-w-lg w-full space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Layout className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
              <p className="text-xs text-muted-foreground">
                Dashboard Template · {widgetDefs.length} widget{widgetDefs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {(template.clone_count || 0) + (template.use_count || 0)} clones
          </span>
          <span>{new Date(template.created_at).toLocaleDateString()}</span>
        </div>

        {/* Widget preview */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Included widgets</p>
          <div className="flex flex-wrap gap-1.5">
            {widgetTypes.map((type: string) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Detailed list */}
        <div className="space-y-1.5">
          {widgetDefs.map((w: any, i: number) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="text-sm text-foreground">{(w.type || "unknown").replace(/_/g, " ")}</span>
              {w.config_json?.symbol && (
                <Badge variant="outline" className="text-[10px]">{w.config_json.symbol}</Badge>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleClone} className="flex-1 gap-2" disabled={cloning}>
            <Download className="h-4 w-4" /> {cloning ? "Cloning…" : "Clone to My Account"}
          </Button>
          <Button variant="outline" onClick={handleCopyLink} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {!user && (
          <p className="text-xs text-center text-muted-foreground">
            You'll need to <button onClick={() => navigate("/login")} className="text-primary hover:underline">sign in</button> to clone this template.
          </p>
        )}
      </div>
    </div>
  );
};

export default SharedTemplate;