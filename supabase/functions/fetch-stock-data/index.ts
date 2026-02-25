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

interface FinnhubQuote {
  c?: number;
  pc?: number;
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

/**
 * Optional fallback provider (Finnhub) used when Twelve Data is unavailable
 */
async function fetchFromFinnhub(symbols: string[], apiKey: string): Promise<StockData[]> {
  const results: StockData[] = [];

  for (const sym of symbols) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const quote = (await res.json()) as FinnhubQuote;
      const price = Number(quote.c) || 0;
      const prevClose = Number(quote.pc) || 0;

      if (price <= 0) {
        console.warn(`[fetch-stock-data] ${sym}: finnhub quote missing price`);
        continue;
      }

      const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
      results.push({
        symbol: sym,
        price,
        change_24h: parseFloat(change.toFixed(2)),
        volume: 0,
        market_cap: null,
      });
    } catch (e) {
      console.warn(`[fetch-stock-data] ${sym} finnhub fallback failed:`, e);
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

  const twelveDataApiKey = Deno.env.get("TWELVE_DATA_API_KEY");
  const finnhubApiKey = Deno.env.get("FINNHUB_API_KEY");

  if (!twelveDataApiKey && !finnhubApiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "No stock provider API keys configured (TWELVE_DATA_API_KEY or FINNHUB_API_KEY)" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let source = "twelvedata";
    let results: StockData[] = [];

    if (twelveDataApiKey) {
      results = await fetchFromTwelveData(STOCK_SYMBOLS, twelveDataApiKey);
    }

    if (results.length === 0 && finnhubApiKey) {
      source = "finnhub";
      results = await fetchFromFinnhub(STOCK_SYMBOLS, finnhubApiKey);
    }

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
      JSON.stringify({ ok: true, source, count: results.length }),
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
