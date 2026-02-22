/**
 * OHLC Data Hook — fetches candle data from cache_ohlc_data
 * with optional Supabase Realtime subscription.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Candle } from "@/engines/marketStructureEngine";

export interface OHLCQueryParams {
  symbol: string;
  timeframe: string;
  limit?: number;
}

async function fetchOHLC({ symbol, timeframe, limit = 100 }: OHLCQueryParams): Promise<Candle[]> {
  const { data, error } = await supabase
    .from("cache_ohlc_data")
    .select("open_time, open, high, low, close, volume")
    .eq("symbol", symbol)
    .eq("timeframe", timeframe)
    .order("open_time", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    openTime: Number(row.open_time),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume),
  }));
}

export function useOHLCData(params: OHLCQueryParams, enabled = true) {
  return useQuery({
    queryKey: ["ohlc", params.symbol, params.timeframe, params.limit],
    queryFn: () => fetchOHLC(params),
    enabled,
    refetchInterval: 30_000, // 30s
    staleTime: 15_000,
  });
}

/** Fetch multiple timeframes for a symbol in parallel */
export function useMultiTFData(symbol: string, timeframes: string[], enabled = true) {
  return useQuery({
    queryKey: ["ohlc-mtf", symbol, timeframes.join(",")],
    queryFn: async () => {
      const map = new Map<string, Candle[]>();
      const results = await Promise.all(
        timeframes.map(async (tf) => {
          const candles = await fetchOHLC({ symbol, timeframe: tf });
          return { tf, candles };
        })
      );
      for (const { tf, candles } of results) {
        map.set(tf, candles);
      }
      return map;
    },
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
