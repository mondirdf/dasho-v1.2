/**
 * NewsWidget — CONTENT ONLY.
 * Supports compact / standard / expanded responsive modes.
 * Supports list & cards layout + inline summary toggle.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchNews, type NewsData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Newspaper, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWidgetSize } from "@/hooks/useWidgetSize";

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
  const layoutType = config?.layout ?? "list";

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

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-3">
        <Skeleton className="h-5 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Failed to load news</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center">
        <Newspaper className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-muted-foreground text-sm">No news yet.</p>
        <p className="text-muted-foreground/60 text-xs">Refreshes every 5 minutes</p>
      </div>
    );
  }

  const useCards = layoutType === "cards" && !isCompact;

  return (
    <>
      <div ref={sizeRef} className="h-full overflow-auto">
        <h3 className={`${isCompact ? "text-xs mb-2" : "text-sm mb-3"} font-semibold text-foreground flex items-center gap-2`}>
          <Newspaper className={`${isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} text-warning`} />
          Crypto News
        </h3>

        {useCards ? (
          /* ── Cards layout ── */
          <div className="grid grid-cols-2 gap-2">
            {news.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="text-left p-2.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors border border-border/20"
              >
                <p className="text-xs text-foreground line-clamp-2 leading-snug font-medium">
                  {item.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {item.source ?? "Unknown"} · {item.published_at ? new Date(item.published_at).toLocaleDateString() : ""}
                </p>
                {showSummary && item.summary && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                )}
              </button>
            ))}
          </div>
        ) : (
          /* ── List layout ── */
          <div className="space-y-0.5">
            {news.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left group block ${isCompact ? "py-1.5 px-1" : "py-2.5 px-2"} rounded-lg hover:bg-secondary/30 transition-colors`}
              >
                <p className={`${isCompact ? "text-xs line-clamp-1" : "text-sm line-clamp-2"} text-foreground group-hover:text-primary transition-colors leading-snug`}>
                  {item.title}
                </p>
                {!isCompact && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {item.source ?? "Unknown"} · {item.published_at ? new Date(item.published_at).toLocaleDateString() : ""}
                  </p>
                )}
                {showSummary && item.summary && !isCompact && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug">{selected?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {selected?.source} · {selected?.published_at ? new Date(selected.published_at).toLocaleString() : ""}
          </p>
          {selected?.summary && (
            <p className="text-sm text-foreground leading-relaxed mt-2">{selected.summary}</p>
          )}
          <a
            href={selected?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3 font-medium"
          >
            Read full article <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
});

NewsWidget.displayName = "NewsWidget";
export default NewsWidget;
