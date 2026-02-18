import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPublicTemplates,
  createDashboard,
  createWidget,
  fetchDashboards,
} from "@/services/dataService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Layout } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Templates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const handleUse = async (template: any) => {
    if (!user) return;
    try {
      const dash = await createDashboard(user.id, template.name);
      const widgetDefs = Array.isArray(template.widgets_json)
        ? template.widgets_json
        : [];
      for (const w of widgetDefs) {
        await createWidget(dash.id, w.type, w.config_json || {});
      }
      toast({ title: "Template applied!", description: "Redirecting to your new dashboard." });
      navigate("/dashboard");
    } catch {
      toast({ title: "Error", description: "Failed to apply template.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Layout className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Templates</h1>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {templates.length === 0 ? (
          <div className="glass-card p-10 text-center space-y-3">
            <h2 className="text-xl font-semibold text-foreground">No templates yet</h2>
            <p className="text-muted-foreground text-sm">
              Share your dashboard from the Dashboard page to create a template.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((t) => {
              const widgetCount = Array.isArray(t.widgets_json) ? t.widgets_json.length : 0;
              return (
                <div key={t.id} className="glass-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {widgetCount} widget{widgetCount !== 1 ? "s" : ""} · {new Date(t.created_at).toLocaleDateString()}
                  </p>
                  <Button size="sm" onClick={() => handleUse(t)} className="gap-1.5">
                    <Download className="h-4 w-4" /> Use Template
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
