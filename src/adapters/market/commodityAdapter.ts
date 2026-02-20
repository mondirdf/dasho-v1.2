/**
 * Commodity Adapter
 * Reads from cache_commodity_data and normalises to UnifiedMarketData.
 */
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedMarketData, MarketDataResult, MarketDataListResult } from "./types";

interface CommodityRow {
  symbol: string;
  price: number | null;
  change_24h: number | null;
  last_updated: string;
}

function normaliseRow(row: CommodityRow): UnifiedMarketData {
  return {
    symbol: row.symbol,
    assetType: "commodity",
    price: row.price ?? 0,
    change24h: row.change_24h ?? 0,
    timestamp: new Date(row.last_updated).getTime(),
  };
}

export async function fetchCommodityMarketDataList(): Promise<MarketDataListResult> {
  try {
    const { data, error } = await supabase
      .from("cache_commodity_data")
      .select("*")
      .order("symbol");
    if (error) throw error;
    return { success: true, data: (data ?? []).map(normaliseRow) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", assetType: "commodity" };
  }
}

export async function fetchCommodityMarketData(symbol: string): Promise<MarketDataResult> {
  try {
    const { data, error } = await supabase
      .from("cache_commodity_data")
      .select("*")
      .eq("symbol", symbol)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { success: false, error: "No commodity data available", assetType: "commodity", symbol };
    return { success: true, data: normaliseRow(data) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", assetType: "commodity", symbol };
  }
}
