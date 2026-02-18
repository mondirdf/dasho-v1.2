import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Coins to track
const COINS = ["bitcoin", "ethereum", "solana", "cardano", "dogecoin", "ripple", "polkadot", "avalanche-2", "chainlink", "polygon"];
const SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", cardano: "ADA",
  dogecoin: "DOGE", ripple: "XRP", polkadot: "DOT",
  "avalanche-2": "AVAX", chainlink: "LINK", polygon: "MATIC",
};

interface CryptoData {
  symbol: string;
  price: number;
  change_24h: number;
  market_cap: number;
  volume: number;
}

async function fetchFromCoinGecko(): Promise<CryptoData[]> {
  const ids = COINS.join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();
  return data.map((c: any) => ({
    symbol: (SYMBOL_MAP[c.id] || c.symbol).toUpperCase(),
    price: c.current_price ?? 0,
    change_24h: c.price_change_percentage_24h ?? 0,
    market_cap: c.market_cap ?? 0,
    volume: c.total_volume ?? 0,
  }));
}

async function fetchFromCoinCap(): Promise<CryptoData[]> {
  const res = await fetch("https://api.coincap.io/v2/assets?limit=20");
  if (!res.ok) throw new Error(`CoinCap ${res.status}`);
  const { data } = await res.json();
  const symbols = new Set(Object.values(SYMBOL_MAP));
  return data
    .filter((c: any) => symbols.has(c.symbol))
    .map((c: any) => ({
      symbol: c.symbol,
      price: parseFloat(c.priceUsd) || 0,
      change_24h: parseFloat(c.changePercent24Hr) || 0,
      market_cap: parseFloat(c.marketCapUsd) || 0,
      volume: parseFloat(c.volumeUsd24Hr) || 0,
    }));
}

async function fetchFearGreed(supabase: any): Promise<void> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!res.ok) return;
    const json = await res.json();
    const entry = json?.data?.[0];
    if (entry) {
      await supabase.from("cache_fear_greed").upsert({
        id: "current",
        value: Number(entry.value),
        value_classification: entry.value_classification,
        last_updated: new Date().toISOString(),
      }, { onConflict: "id" });
    }
  } catch (e) {
    console.warn("Fear & Greed fetch failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let coins: CryptoData[];
    let source = "coingecko";

    try {
      coins = await fetchFromCoinGecko();
    } catch (e) {
      console.warn("CoinGecko failed, falling back to CoinCap:", e);
      coins = await fetchFromCoinCap();
      source = "coincap";
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert crypto data
    for (const coin of coins) {
      await supabase.from("cache_crypto_data").upsert(
        {
          symbol: coin.symbol,
          price: coin.price,
          change_24h: coin.change_24h,
          market_cap: coin.market_cap,
          volume: coin.volume,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );
    }

    // Also fetch Fear & Greed index
    await fetchFearGreed(supabase);

    return new Response(
      JSON.stringify({ ok: true, source, count: coins.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-crypto-data error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
