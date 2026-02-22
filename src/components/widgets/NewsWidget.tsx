/**
 * NewsWidget — CONTENT ONLY.
 * Clean news list with max 2-line titles and subtle metadata.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchNews, type NewsData } from "@/services/dataService";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, ListSkeleton, WidgetEmptyState } from "./shared";

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

  if (loading) return <div ref={sizeRef}><ListSkeleton rows={4} showHeader /></div>;
  if (error || news.length === 0) {
    return (
      <div ref={sizeRef}>
        <WidgetEmptyState
          error={error}
          message={error ? "Failed to load news" : "No news yet"}
          onRetry={loadData}
        />
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
              className={`w-full text-left group block ${isCompact ? "py-1.5" : "py-2.5"} border-b border-border/10 last:border-0 rounded-sm transition-colors hover:bg-secondary/10 -mx-1 px-1`}
            >
              <p className={`${isCompact ? "text-[10px] line-clamp-1" : "text-[11px] line-clamp-2"} text-foreground/90 group-hover:text-primary transition-colors leading-snug font-medium`}>
                {item.title}
              </p>
              {!isCompact && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[8px] text-muted-foreground/40 font-medium">{item.source ?? "Unknown"}</span>
                  {item.published_at && (
                    <>
                      <span className="text-[6px] text-muted-foreground/20">•</span>
                      <span className="text-[8px] text-muted-foreground/30 tabular-nums">{timeAgo(item.published_at)}</span>
                    </>
                  )}
                </div>
              )}
              {showSummary && item.summary && !isCompact && (
                <p className="text-[9px] text-muted-foreground/35 mt-0.5 line-clamp-1 leading-relaxed">
                  {item.summary}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto bg-card/95 backdrop-blur-xl border-border/40">
          <DialogHeader>
            <DialogTitle className="text-sm leading-snug text-foreground">{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground/60 font-medium">{selected?.source}</span>
            {selected?.published_at && (
              <>
                <span className="text-[6px] text-muted-foreground/20">•</span>
                <span className="text-[10px] text-muted-foreground/40 tabular-nums">{selected?.published_at ? new Date(selected.published_at).toLocaleString() : ""}</span>
              </>
            )}
          </div>
          {selected?.summary && (
            <p className="text-xs text-foreground/75 leading-relaxed mt-3">{selected.summary}</p>
          )}
          <a
            href={selected?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mt-3 font-medium transition-colors"
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
