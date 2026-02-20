/**
 * MacroNewsWidget — displays business/market news from cache.
 * CONTENT ONLY — no container styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useWidgetSize } from "@/hooks/useWidgetSize";

interface MacroNewsItem {
  id: string;
  title: string;
  source: string | null;
  url: string;
  published_at: string | null;
}

interface Props {
  config: {
    maxArticles?: number;
  };
}

const MacroNewsWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [news, setNews] = useState<MacroNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from("cache_macro_news")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(config.maxArticles ?? 5);
      if (err) {
        setError(true);
      } else {
        setNews((data as MacroNewsItem[]) ?? []);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [config.maxArticles]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">{error ? "Failed to load news" : "No macro news available"}</p>
        <p className="text-muted-foreground text-xs">Add NEWS_API_KEY to enable</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const isCompact = mode === "compact";

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div ref={sizeRef} className="h-full flex flex-col gap-1 overflow-auto">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Macro News</div>
      {news.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0 hover:bg-secondary/30 rounded px-1 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <p className={`${isCompact ? "text-xs" : "text-sm"} font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors`}>
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {item.source && <span className="text-[10px] text-muted-foreground">{item.source}</span>}
              {item.published_at && <span className="text-[10px] text-muted-foreground">{timeAgo(item.published_at)}</span>}
            </div>
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  );
});

MacroNewsWidget.displayName = "MacroNewsWidget";
export default MacroNewsWidget;
