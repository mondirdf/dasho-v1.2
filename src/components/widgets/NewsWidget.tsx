/**
 * NewsWidget — CONTENT ONLY.
 * Clean news list with max 2-line titles and subtle metadata.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchNews, type NewsData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader } from "./shared";

interface Props {
  config: {
    maxArticles?: number;
    keyword?: string;
    source?: string;
    showSummary?: boolean;
    layout?: "list" | "cards";
  };
}

const NewsWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<NewsData | null>(null);

  const maxArticles = config?.maxArticles || 20;
  const keyword = config?.keyword?.toLowerCase() || "";
  const sourceFilter = config?.source?.toLowerCase() || "";
  const showSummary = config?.showSummary ?? false;

  const loadData = useCallback(() => {
    fetchNews()
      .then((data) => {
        let filtered = data;
        if (keyword) filtered = filtered.filter((n) => n.title.toLowerCase().includes(keyword) || n.summary?.toLowerCase().includes(keyword));
        if (sourceFilter) filtered = filtered.filter((n) => n.source?.toLowerCase().includes(sourceFilter));
        setNews(filtered.slice(0, maxArticles));
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [maxArticles, keyword, sourceFilter]);

  useEffect(() => { loadData(); }, [loadData]);

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

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-2">
        <Skeleton className="h-4 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-muted-foreground text-xs">{error ? "Failed to load news" : "No news yet"}</p>
        <button onClick={loadData} className="text-[10px] text-primary hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <>
      <div ref={sizeRef} className="h-full overflow-auto">
        <WidgetHeader title="Crypto News" status="cached" compact={isCompact} />

        <div className="space-y-0">
          {news.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className={`w-full text-left group block ${isCompact ? "py-1.5" : "py-2"} border-b border-border/15 last:border-0`}
            >
              <p className={`${isCompact ? "text-[10px] line-clamp-1" : "text-xs line-clamp-2"} text-foreground group-hover:text-primary transition-colors leading-snug`}>
                {item.title}
              </p>
              {!isCompact && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-muted-foreground/50">{item.source ?? "Unknown"}</span>
                  {item.published_at && (
                    <span className="text-[9px] text-muted-foreground/30">{timeAgo(item.published_at)}</span>
                  )}
                </div>
              )}
              {showSummary && item.summary && !isCompact && (
                <p className="text-[10px] text-muted-foreground/40 mt-0.5 line-clamp-1 leading-relaxed">
                  {item.summary}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-sm leading-snug">{selected?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-[10px] text-muted-foreground">
            {selected?.source} · {selected?.published_at ? new Date(selected.published_at).toLocaleString() : ""}
          </p>
          {selected?.summary && (
            <p className="text-xs text-foreground/80 leading-relaxed mt-2">{selected.summary}</p>
          )}
          <a
            href={selected?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2 font-medium"
          >
            Read full article <ExternalLink className="h-3 w-3" />
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
});

NewsWidget.displayName = "NewsWidget";
export default NewsWidget;
