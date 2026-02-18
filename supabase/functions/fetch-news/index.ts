import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewsItem {
  title: string;
  summary: string | null;
  source: string | null;
  url: string;
  published_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use CryptoPanic's free public API (no key needed for public posts)
    const res = await fetch(
      "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Blockchain&excludeCategories=Sponsored"
    );

    if (!res.ok) throw new Error(`News API ${res.status}`);
    const json = await res.json();
    const articles: NewsItem[] = (json.Data || []).slice(0, 50).map((a: any) => ({
      title: a.title || "Untitled",
      summary: a.body ? a.body.substring(0, 300) : null,
      source: a.source || null,
      url: a.url || a.guid || "",
      published_at: a.published_on
        ? new Date(a.published_on * 1000).toISOString()
        : null,
    }));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clear old entries and insert fresh ones
    await supabase.from("cache_news").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (articles.length > 0) {
      await supabase.from("cache_news").insert(articles);
    }

    return new Response(
      JSON.stringify({ ok: true, count: articles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-news error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
