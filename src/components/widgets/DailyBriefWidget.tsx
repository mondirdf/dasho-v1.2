/**
 * DailyBriefWidget — Shows AI-generated daily trading brief.
 * Free: title only | Pro: full content.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Newspaper, RefreshCw, Lock } from "lucide-react";
import ProGate from "@/components/ProGate";

interface DailyBrief {
  id: string;
  brief_date: string;
  title: string;
  summary: string | null;
  content: string;
  metadata: any;
  created_at: string;
}

const DailyBriefWidget = ({ config }: { config: any }) => {
  const { isPro } = usePlanLimits();
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadBrief();
  }, []);

  const loadBrief = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_briefs")
      .select("*")
      .order("brief_date", { ascending: false })
      .limit(1);
    setBrief((data as any)?.[0] ?? null);
    setLoading(false);
  };

  const generateBrief = async () => {
    setGenerating(true);
    try {
      await supabase.functions.invoke("generate-daily-brief", { body: {} });
      await loadBrief();
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Newspaper className="h-8 w-8 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">No daily brief yet</p>
        <button
          onClick={generateBrief}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating..." : "Generate Brief"}
        </button>
      </div>
    );
  }

  const briefDate = new Date(brief.brief_date).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Daily Brief</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{briefDate}</span>
      </div>

      <h4 className="text-sm font-medium text-foreground leading-snug">{brief.title}</h4>

      {brief.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed">{brief.summary}</p>
      )}

      {isPro ? (
        <div className="flex-1 overflow-y-auto scrollbar-none">
          <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
            {brief.content}
          </div>
        </div>
      ) : (
        <ProGate feature="full daily brief">
          <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
            {brief.content}
          </div>
        </ProGate>
      )}

      <button
        onClick={generateBrief}
        disabled={generating}
        className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
      >
        <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
        {generating ? "Generating..." : "Refresh"}
      </button>
    </div>
  );
};

export default DailyBriefWidget;
