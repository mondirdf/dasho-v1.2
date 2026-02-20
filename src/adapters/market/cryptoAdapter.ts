/**
 * Crypto Adapter
 * Wraps existing crypto data service and normalises output
 * into the UnifiedMarketData format.
 */
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import type { UnifiedMarketData, MarketDataResult, MarketDataListResult } from "./types";

/** Map a single CryptoData row to UnifiedMarketData */
export function normaliseCryptoRow(row: CryptoData): UnifiedMarketData {
  return {
    symbol: row.symbol,
    assetType: "crypto",
    price: row.price ?? 0,
    change24h: row.change_24h ?? 0,
    volume: row.volume ?? undefined,
    marketCap: row.market_cap ?? undefined,
    timestamp: new Date(row.last_updated).getTime(),
  };
}

/** Fetch all cached crypto data as UnifiedMarketData[] */
export async function fetchCryptoMarketDataList(): Promise<MarketDataListResult> {
  try {
    const rows = await fetchCryptoData();
    return { success: true, data: rows.map(normaliseCryptoRow) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error fetching crypto data",
      assetType: "crypto",
    };
  }
}

/** Fetch a single symbol's data as UnifiedMarketData */
export async function fetchCryptoMarketData(symbol: string): Promise<MarketDataResult> {
  try {
    const rows = await fetchCryptoData();
    const match = rows.find((r) => r.symbol === symbol) ?? rows[0];
    if (!match) {
      return { success: false, error: "No crypto data available", assetType: "crypto", symbol };
    }
    return { success: true, data: normaliseCryptoRow(match) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      assetType: "crypto",
      symbol,
    };
  }
}

/**
 * Legacy-compatible helper — returns raw CryptoData[] so existing widgets
 * can migrate incrementally without changing their rendering logic.
 * Widgets should eventually move to UnifiedMarketData.
 */
export async function fetchCryptoDataViaAdapter(): Promise<CryptoData[]> {
  return fetchCryptoData();
}
