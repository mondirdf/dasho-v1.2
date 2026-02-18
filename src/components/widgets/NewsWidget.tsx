import { useEffect, useState, memo } from "react";
import { fetchNews, type NewsData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

const NewsWidget = memo(() => {
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews().then((data) => {
      setNews(data.slice(0, 8));
      setLoading(false);
    });
  }, []);

  if (loading) return <Skeleton className="h-full w-full" />;
  if (news.length === 0) {
    return <div className="p-4 text-muted-foreground text-sm">No news yet. Data loads via scheduled functions.</div>;
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground mb-1">Crypto News</h3>
      {news.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
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
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </a>
      ))}
    </div>
  );
});

NewsWidget.displayName = "NewsWidget";
export default NewsWidget;
