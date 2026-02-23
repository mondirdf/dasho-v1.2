import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Symbols to track — Binance ticker format
 * Primary source: Binance (no API key, no rate limit for public endpoints)
 * Fallback: CoinGecko → CoinCap
 */
const BINANCE_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT",
  "ADAUSDT", "DOGEUSDT", "DOTUSDT", "AVAXUSDT", "LINKUSDT",
];

const SYMBOL_MAP: Record<string, string> = {
  BTCUSDT: "BTC", ETHUSDT: "ETH", SOLUSDT: "SOL", BNBUSDT: "BNB",
  XRPUSDT: "XRP", ADAUSDT: "ADA", DOGEUSDT: "DOGE", DOTUSDT: "DOT",
  AVAXUSDT: "AVAX", LINKUSDT: "LINK",
};

// CoinGecko fallback mapping
const COINGECKO_IDS = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "cardano", "dogecoin", "polkadot", "avalanche-2", "chainlink"];
const CG_SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", binancecoin: "BNB",
  ripple: "XRP", cardano: "ADA", dogecoin: "DOGE", polkadot: "DOT",
  "avalanche-2": "AVAX", chainlink: "LINK",
};

interface CryptoData {
  symbol: string;
  price: number;
  change_24h: number;
  market_cap: number;
  volume: number;
}

async function logEvent(supabase: any, type: string, status: string, message: string, metadata: any = {}) {
  try {
    await supabase.from("system_logs").insert({ type, status, message, metadata });
  } catch (_) { /* logging must never break pipeline */ }
}

/**
 * PRIMARY: Fetch from Binance — no API key needed, generous rate limits
 * Uses /api/v3/ticker/24hr for price + 24h change + volume
 */
async function fetchFromBinance(): Promise<CryptoData[]> {
  const symbolsParam = JSON.stringify(BINANCE_SYMBOLS);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance ${res.status}: ${await res.text()}`);
  
  const data = await res.json();
  
  return data.map((t: any) => ({
    symbol: SYMBOL_MAP[t.symbol] || t.symbol.replace("USDT", ""),
    price: parseFloat(t.lastPrice) || 0,
    change_24h: parseFloat(t.priceChangePercent) || 0,
    volume: parseFloat(t.quoteVolume) || 0, // Volume in USDT
    market_cap: 0, // Binance doesn't provide mcap, will be enriched if needed
  }));
}

/**
 * FALLBACK 1: CoinGecko (has mcap but rate limited)
 */
async function fetchFromCoinGecko(): Promise<CryptoData[]> {
  const ids = COINGECKO_IDS.join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();
  return data.map((c: any) => ({
    symbol: (CG_SYMBOL_MAP[c.id] || c.symbol).toUpperCase(),
    price: c.current_price ?? 0,
    change_24h: c.price_change_percentage_24h ?? 0,
    market_cap: c.market_cap ?? 0,
    volume: c.total_volume ?? 0,
  }));
}

/**
 * FALLBACK 2: CoinCap
 */
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

  const startMs = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    await logEvent(supabase, "fetch-crypto-data", "started", "Execution started");

    let coins: CryptoData[];
    let source = "binance";

    // Binance → CoinGecko → CoinCap fallback chain
    try {
      coins = await fetchFromBinance();
    } catch (binanceErr) {
      console.warn("Binance failed, trying CoinGecko:", binanceErr);
      source = "coingecko";
      try {
        coins = await fetchFromCoinGecko();
      } catch (cgErr) {
        console.warn("CoinGecko failed, falling back to CoinCap:", cgErr);
        coins = await fetchFromCoinCap();
        source = "coincap";
      }
    }

    for (const coin of coins) {
      await supabase.from("cache_crypto_data").upsert(
        { symbol: coin.symbol, price: coin.price, change_24h: coin.change_24h, market_cap: coin.market_cap, volume: coin.volume, last_updated: new Date().toISOString() },
        { onConflict: "symbol" }
      );
    }

    await fetchFearGreed(supabase);

    const durationMs = Date.now() - startMs;
    await logEvent(supabase, "fetch-crypto-data", "success", `Completed in ${durationMs}ms`, { source, count: coins.length, durationMs });

    return new Response(
      JSON.stringify({ ok: true, source, count: coins.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startMs;
    await logEvent(supabase, "fetch-crypto-data", "error", (error as Error).message, { durationMs });
    console.error("fetch-crypto-data error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
