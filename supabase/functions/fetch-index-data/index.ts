import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INDEX_SYMBOLS = [
  { apiSymbol: "SPY", displaySymbol: "SP500", label: "S&P 500" },
  { apiSymbol: "QQQ", displaySymbol: "NASDAQ", label: "NASDAQ" },
  { apiSymbol: "DIA", displaySymbol: "DJIA", label: "Dow Jones" },
  { apiSymbol: "IWM", displaySymbol: "RUSSELL", label: "Russell 2000" },
];

interface IndexData {
  symbol: string;
  price: number;
  change_24h: number;
  volume: number;
}

/**
 * Fetch index ETF data from Twelve Data — one at a time with delay for rate limits
 */
async function fetchFromTwelveData(apiKey: string): Promise<IndexData[]> {
  const results: IndexData[] = [];
  for (const idx of INDEX_SYMBOLS) {
    try {
      const url = `https://api.twelvedata.com/quote?symbol=${idx.apiSymbol}&apikey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const q = await res.json();
      if (q.status === "error" || !q.close) {
        console.warn(`[fetch-index-data] ${idx.apiSymbol}: ${q.message || "no data"}`);
        continue;
      }
      const price = parseFloat(q.close) || 0;
      const prevClose = parseFloat(q.previous_close) || 0;
      const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
      results.push({
        symbol: idx.displaySymbol,
        price,
        change_24h: parseFloat(change.toFixed(2)),
        volume: parseInt(q.volume) || 0,
      });
      await new Promise((r) => setTimeout(r, 1200));
    } catch (e) {
      console.warn(`[fetch-index-data] ${idx.apiSymbol} failed:`, e);
    }
  }
  return results;
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
    return new Response(
      JSON.stringify({ ok: false, error: "TWELVE_DATA_API_KEY not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const results = await fetchFromTwelveData(apiKey);

    for (const idx of results) {
      await supabase.from("cache_index_data").upsert(
        {
          symbol: idx.symbol,
          price: idx.price,
          change_24h: idx.change_24h,
          volume: idx.volume,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, source: "twelvedata", count: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-index-data error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
