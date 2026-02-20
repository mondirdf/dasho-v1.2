/**
 * Index Adapter
 * Reads from cache_index_data and normalises to UnifiedMarketData.
 */
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedMarketData, MarketDataResult, MarketDataListResult } from "./types";

interface IndexRow {
  symbol: string;
  price: number | null;
  change_24h: number | null;
  volume: number | null;
  last_updated: string;
}

function normaliseRow(row: IndexRow): UnifiedMarketData {
  return {
    symbol: row.symbol,
    assetType: "index",
    price: row.price ?? 0,
    change24h: row.change_24h ?? 0,
    volume: row.volume ?? undefined,
    timestamp: new Date(row.last_updated).getTime(),
  };
}

export async function fetchIndexMarketDataList(): Promise<MarketDataListResult> {
  try {
    const { data, error } = await supabase
      .from("cache_index_data")
      .select("*")
      .order("symbol");
    if (error) throw error;
    return { success: true, data: (data ?? []).map(normaliseRow) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", assetType: "index" };
  }
}

export async function fetchIndexMarketData(symbol: string): Promise<MarketDataResult> {
  try {
    const { data, error } = await supabase
      .from("cache_index_data")
      .select("*")
      .eq("symbol", symbol)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { success: false, error: "No index data available", assetType: "index", symbol };
    return { success: true, data: normaliseRow(data) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", assetType: "index", symbol };
  }
}
