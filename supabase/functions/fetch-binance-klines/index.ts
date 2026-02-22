/**
 * fetch-binance-klines — Fetches OHLC kline data from Binance REST API
 * and upserts into cache_ohlc_data table.
 * 
 * Supports multiple symbols and timeframes.
 * Called by scheduler or manually.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BINANCE_BASE = "https://api.binance.com/api/v3/klines";

const DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
const DEFAULT_TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d"];
const LIMIT = 100; // candles per request

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

function parseBinanceKlines(raw: any[][]): BinanceKline[] {
  return raw.map((k) => ({
    openTime: k[0] as number,
    open: k[1] as string,
    high: k[2] as string,
    low: k[3] as string,
    close: k[4] as string,
    volume: k[5] as string,
    closeTime: k[6] as number,
  }));
}

async function fetchKlines(symbol: string, interval: string, limit: number): Promise<BinanceKline[]> {
  const url = `${BINANCE_BASE}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Binance API error [${res.status}]: ${text}`);
  }
  const raw = await res.json();
  return parseBinanceKlines(raw);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse optional body for custom symbols/timeframes
    let symbols = DEFAULT_SYMBOLS;
    let timeframes = DEFAULT_TIMEFRAMES;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.symbols) symbols = body.symbols;
        if (body.timeframes) timeframes = body.timeframes;
      } catch { /* use defaults */ }
    }

    const results: { symbol: string; timeframe: string; count: number }[] = [];
    const errors: string[] = [];

    // Fetch in parallel batches (rate limit friendly)
    for (const symbol of symbols) {
      const promises = timeframes.map(async (tf) => {
        try {
          const klines = await fetchKlines(symbol, tf, LIMIT);
          
          // Map symbol from BTCUSDT → BTC for consistency
          const cleanSymbol = symbol.replace("USDT", "");
          
          const rows = klines.map((k) => ({
            symbol: cleanSymbol,
            timeframe: tf,
            open_time: k.openTime,
            open: parseFloat(k.open),
            high: parseFloat(k.high),
            low: parseFloat(k.low),
            close: parseFloat(k.close),
            volume: parseFloat(k.volume),
            close_time: k.closeTime,
          }));

          const { error } = await supabase
            .from("cache_ohlc_data")
            .upsert(rows, { onConflict: "symbol,timeframe,open_time" });

          if (error) {
            errors.push(`${cleanSymbol}/${tf}: ${error.message}`);
          } else {
            results.push({ symbol: cleanSymbol, timeframe: tf, count: rows.length });
          }
        } catch (err) {
          errors.push(`${symbol}/${tf}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      });

      await Promise.all(promises);
      // Small delay between symbols to respect rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    return new Response(
      JSON.stringify({ success: true, results, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fetch-binance-klines error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
