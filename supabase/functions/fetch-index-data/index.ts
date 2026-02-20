import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Alpha Vantage uses these symbols for major indices
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

async function fetchFromAlphaVantage(apiSymbol: string, displaySymbol: string, apiKey: string): Promise<IndexData | null> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${apiSymbol}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const q = json?.["Global Quote"];
  if (!q || !q["05. price"]) return null;
  return {
    symbol: displaySymbol,
    price: parseFloat(q["05. price"]) || 0,
    change_24h: parseFloat(q["10. change percent"]?.replace("%", "")) || 0,
    volume: parseInt(q["06. volume"]) || 0,
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
    console.warn("ALPHA_VANTAGE_API_KEY not set — skipping index fetch");
    return new Response(
      JSON.stringify({ ok: false, error: "ALPHA_VANTAGE_API_KEY not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const results: IndexData[] = [];

    for (const { apiSymbol, displaySymbol } of INDEX_SYMBOLS) {
      try {
        const data = await fetchFromAlphaVantage(apiSymbol, displaySymbol, apiKey);
        if (data) results.push(data);
        await new Promise((r) => setTimeout(r, 12500));
      } catch (e) {
        console.warn(`Failed to fetch ${displaySymbol}:`, e);
      }
    }

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
      JSON.stringify({ ok: true, count: results.length }),
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
