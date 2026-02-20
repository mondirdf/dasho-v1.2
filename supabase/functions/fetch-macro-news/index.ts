import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const apiKey = Deno.env.get("NEWS_API_KEY");
  if (!apiKey) {
    console.warn("NEWS_API_KEY not set — skipping macro news fetch");
    return new Response(
      JSON.stringify({ ok: false, error: "NEWS_API_KEY not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=10&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
    const json = await res.json();

    const articles = (json.articles ?? [])
      .filter((a: any) => a.title && a.url)
      .slice(0, 10);

    // Clear old news and insert fresh
    await supabase.from("cache_macro_news").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    for (const article of articles) {
      await supabase.from("cache_macro_news").insert({
        title: article.title,
        source: article.source?.name ?? null,
        url: article.url,
        published_at: article.publishedAt ?? null,
        fetched_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ ok: true, count: articles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-macro-news error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
