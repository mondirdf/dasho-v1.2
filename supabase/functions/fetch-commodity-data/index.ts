import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMMODITIES = [
  { apiSymbol: "XAU/USD", displaySymbol: "GOLD" },
  { apiSymbol: "XAG/USD", displaySymbol: "SILVER" },
  { apiSymbol: "CL", displaySymbol: "OIL" },
  { apiSymbol: "NG", displaySymbol: "NATGAS" },
  { apiSymbol: "HG", displaySymbol: "COPPER" },
];

interface CommodityData {
  symbol: string;
  price: number;
  change_24h: number;
}

async function fetchQuote(apiSymbol: string, displaySymbol: string, apiKey: string): Promise<CommodityData | null> {
  try {
    const url = `https://api.twelvedata.com/quote?symbol=${apiSymbol}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status === "error" || !json.close) return null;
    return {
      symbol: displaySymbol,
      price: parseFloat(json.close) || 0,
      change_24h: parseFloat(json.percent_change) || 0,
    };
  } catch {
    return null;
  }
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
    // Fetch all in parallel (5 commodities is within Twelve Data limits)
    const promises = COMMODITIES.map((c) => fetchQuote(c.apiSymbol, c.displaySymbol, apiKey));
    const settled = await Promise.all(promises);
    const results = settled.filter(Boolean) as CommodityData[];

    for (const commodity of results) {
      await supabase.from("cache_commodity_data").upsert(
        {
          symbol: commodity.symbol,
          price: commodity.price,
          change_24h: commodity.change_24h,
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
    console.error("fetch-commodity-data error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
