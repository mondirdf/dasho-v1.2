/**
 * Forex Adapter
 * Reads from cache_forex_data and normalises to UnifiedMarketData.
 */
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedMarketData, MarketDataResult, MarketDataListResult } from "./types";

interface ForexRow {
  symbol: string;
  price: number | null;
  change_24h: number | null;
  last_updated: string;
}

function normaliseRow(row: ForexRow): UnifiedMarketData {
  return {
    symbol: row.symbol,
    assetType: "forex",
    price: row.price ?? 0,
    change24h: row.change_24h ?? 0,
    timestamp: new Date(row.last_updated).getTime(),
  };
}

export async function fetchForexMarketDataList(): Promise<MarketDataListResult> {
  try {
    const { data, error } = await supabase
      .from("cache_forex_data")
      .select("*")
      .order("symbol");
    if (error) throw error;
    return { success: true, data: (data ?? []).map(normaliseRow) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", assetType: "forex" };
  }
}

export async function fetchForexMarketData(symbol: string): Promise<MarketDataResult> {
  try {
    const { data, error } = await supabase
      .from("cache_forex_data")
      .select("*")
      .eq("symbol", symbol)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { success: false, error: "No forex data available", assetType: "forex", symbol };
    return { success: true, data: normaliseRow(data) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", assetType: "forex", symbol };
  }
}
