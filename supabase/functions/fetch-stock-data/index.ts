import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];

interface StockData {
  symbol: string;
  price: number;
  change_24h: number;
  volume: number;
  market_cap: number | null;
}

/**
 * Fetch from Twelve Data — fetches one symbol at a time to stay within rate limits
 */
async function fetchFromTwelveData(symbols: string[], apiKey: string): Promise<StockData[]> {
  const results: StockData[] = [];
  for (const sym of symbols) {
    try {
      const url = `https://api.twelvedata.com/quote?symbol=${sym}&apikey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const q = await res.json();
      if (q.status === "error" || !q.close) {
        console.warn(`[fetch-stock-data] ${sym}: ${q.message || "no data"}`);
        continue;
      }
      const price = parseFloat(q.close) || 0;
      const prevClose = parseFloat(q.previous_close) || 0;
      const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
      results.push({
        symbol: sym,
        price,
        change_24h: parseFloat(change.toFixed(2)),
        volume: parseInt(q.volume) || 0,
        market_cap: null,
      });
      // Small delay between requests to respect rate limits
      await new Promise((r) => setTimeout(r, 1200));
    } catch (e) {
      console.warn(`[fetch-stock-data] ${sym} failed:`, e);
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
    const results = await fetchFromTwelveData(STOCK_SYMBOLS, apiKey);

    for (const stock of results) {
      await supabase.from("cache_stock_data").upsert(
        {
          symbol: stock.symbol,
          price: stock.price,
          change_24h: stock.change_24h,
          volume: stock.volume,
          market_cap: stock.market_cap,
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
    console.error("fetch-stock-data error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
