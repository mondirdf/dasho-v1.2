import { useEffect, useState, memo } from "react";
import { fetchNews, type NewsData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NewsWidget = memo(() => {
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsData | null>(null);

  useEffect(() => {
    fetchNews().then((data) => {
      setNews(data.slice(0, 20));
      setLoading(false);
    });
  }, []);

  if (loading) return <Skeleton className="h-full w-full" />;
  if (news.length === 0) {
    return <div className="p-4 text-muted-foreground text-sm">No news yet. Data refreshes every 5 minutes.</div>;
  }

  return (
    <>
      <div className="h-full overflow-auto p-4 space-y-2.5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Crypto News</h3>
        {news.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className="w-full text-left group block"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.source ?? "Unknown"} · {item.published_at ? new Date(item.published_at).toLocaleDateString() : ""}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
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
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3"
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
