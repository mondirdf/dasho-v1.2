/**
 * Stock Adapter
 * Reads from cache_stock_data and normalises to UnifiedMarketData.
 */
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedMarketData, MarketDataResult, MarketDataListResult } from "./types";

interface StockRow {
  symbol: string;
  price: number | null;
  change_24h: number | null;
  volume: number | null;
  market_cap: number | null;
  last_updated: string;
}

function normaliseRow(row: StockRow): UnifiedMarketData {
  return {
    symbol: row.symbol,
    assetType: "stock",
    price: row.price ?? 0,
    change24h: row.change_24h ?? 0,
    volume: row.volume ?? undefined,
    marketCap: row.market_cap ?? undefined,
    timestamp: new Date(row.last_updated).getTime(),
  };
}

export async function fetchStockMarketDataList(): Promise<MarketDataListResult> {
  try {
    const { data, error } = await supabase
      .from("cache_stock_data")
      .select("*")
      .order("symbol");
    if (error) throw error;
    return { success: true, data: (data ?? []).map(normaliseRow) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", assetType: "stock" };
  }
}

export async function fetchStockMarketData(symbol: string): Promise<MarketDataResult> {
  try {
    const { data, error } = await supabase
      .from("cache_stock_data")
      .select("*")
      .eq("symbol", symbol)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { success: false, error: "No stock data available", assetType: "stock", symbol };
    return { success: true, data: normaliseRow(data) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error", assetType: "stock", symbol };
  }
}
