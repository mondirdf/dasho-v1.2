import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FOREX_PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF"];

interface ForexData {
  symbol: string;
  price: number;
  change_24h: number;
}

async function fetchQuote(symbol: string, apiKey: string): Promise<ForexData | null> {
  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  if (json.status === "error" || !json.close) return null;
  return {
    symbol: symbol.replace("/", ""),
    price: parseFloat(json.close) || 0,
    change_24h: parseFloat(json.percent_change) || 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");
  if (!apiKey) {
    console.warn("TWELVE_DATA_API_KEY not set — skipping forex fetch");
    return new Response(
      JSON.stringify({ ok: false, error: "TWELVE_DATA_API_KEY not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const results: ForexData[] = [];

    for (const pair of FOREX_PAIRS) {
      try {
        const data = await fetchQuote(pair, apiKey);
        if (data) results.push(data);
        // Twelve Data rate limit: 8 calls/min free tier
        await new Promise((r) => setTimeout(r, 8000));
      } catch (e) {
        console.warn(`Failed to fetch ${pair}:`, e);
      }
    }

    for (const fx of results) {
      await supabase.from("cache_forex_data").upsert(
        {
          symbol: fx.symbol,
          price: fx.price,
          change_24h: fx.change_24h,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, count: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-forex-data error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
