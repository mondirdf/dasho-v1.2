import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "JPM", "V", "WMT"];

interface StockData {
  symbol: string;
  price: number;
  change_24h: number;
  volume: number;
  market_cap: number | null;
}

async function fetchFromAlphaVantage(symbol: string, apiKey: string): Promise<StockData | null> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const q = json?.["Global Quote"];
  if (!q || !q["05. price"]) return null;
  return {
    symbol,
    price: parseFloat(q["05. price"]) || 0,
    change_24h: parseFloat(q["10. change percent"]?.replace("%", "")) || 0,
    volume: parseInt(q["06. volume"]) || 0,
    market_cap: null,
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

  const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY");
  if (!apiKey) {
    console.warn("ALPHA_VANTAGE_API_KEY not set — skipping stock fetch");
    return new Response(
      JSON.stringify({ ok: false, error: "ALPHA_VANTAGE_API_KEY not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const results: StockData[] = [];

    // Alpha Vantage rate limit: 5 calls/min on free tier — fetch sequentially with delay
    for (const symbol of STOCK_SYMBOLS) {
      try {
        const data = await fetchFromAlphaVantage(symbol, apiKey);
        if (data) results.push(data);
        // Rate-limit: wait 12s between calls (5/min)
        if (STOCK_SYMBOLS.indexOf(symbol) < STOCK_SYMBOLS.length - 1) {
          await new Promise((r) => setTimeout(r, 12500));
        }
      } catch (e) {
        console.warn(`Failed to fetch ${symbol}:`, e);
      }
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
      JSON.stringify({ ok: true, count: results.length }),
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
