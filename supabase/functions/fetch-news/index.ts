import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function logEvent(supabase: any, type: string, status: string, message: string, metadata: any = {}) {
  try {
    await supabase.from("system_logs").insert({ type, status, message, metadata });
  } catch (_) { /* logging must never break pipeline */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startMs = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    await logEvent(supabase, "fetch-news", "started", "Execution started");

    const res = await fetch(
      "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Blockchain&excludeCategories=Sponsored"
    );
    if (!res.ok) throw new Error(`News API ${res.status}`);
    const json = await res.json();
    const articles = (json.Data || []).slice(0, 50).map((a: any) => ({
      title: a.title || "Untitled",
      summary: a.body ? a.body.substring(0, 300) : null,
      source: a.source || null,
      url: a.url || a.guid || "",
      published_at: a.published_on ? new Date(a.published_on * 1000).toISOString() : null,
    }));

    await supabase.from("cache_news").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (articles.length > 0) {
      await supabase.from("cache_news").insert(articles);
    }

    const durationMs = Date.now() - startMs;
    await logEvent(supabase, "fetch-news", "success", `Completed in ${durationMs}ms`, { count: articles.length, durationMs });

    return new Response(
      JSON.stringify({ ok: true, count: articles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startMs;
    await logEvent(supabase, "fetch-news", "error", (error as Error).message, { durationMs });
    console.error("fetch-news error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
