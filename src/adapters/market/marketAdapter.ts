/**
 * Market Adapter — single entry point for all market data.
 *
 * Widgets import from here instead of calling API services directly.
 * Each asset type has its own adapter that reads from cache tables.
 */
import type {
  AssetType,
  UnifiedMarketData,
  MarketDataResult,
  MarketDataListResult,
} from "./types";
import { fetchCryptoMarketData, fetchCryptoMarketDataList, fetchCryptoDataViaAdapter } from "./cryptoAdapter";
import { fetchStockMarketData, fetchStockMarketDataList } from "./stockAdapter";
import { fetchForexMarketData, fetchForexMarketDataList } from "./forexAdapter";
import { fetchCommodityMarketData, fetchCommodityMarketDataList } from "./commodityAdapter";
import { fetchIndexMarketData, fetchIndexMarketDataList } from "./indexAdapter";
import type { CryptoData } from "@/services/dataService";

// ── Single symbol ──

export async function fetchMarketData(
  assetType: AssetType,
  symbol: string,
): Promise<MarketDataResult> {
  switch (assetType) {
    case "crypto":
      return fetchCryptoMarketData(symbol);
    case "stock":
      return fetchStockMarketData(symbol);
    case "forex":
      return fetchForexMarketData(symbol);
    case "commodity":
      return fetchCommodityMarketData(symbol);
    case "index":
      return fetchIndexMarketData(symbol);
    default:
      return { success: false, error: "Unsupported asset type", assetType };
  }
}

// ── Full list ──

export async function fetchMarketDataList(
  assetType: AssetType,
): Promise<MarketDataListResult> {
  switch (assetType) {
    case "crypto":
      return fetchCryptoMarketDataList();
    case "stock":
      return fetchStockMarketDataList();
    case "forex":
      return fetchForexMarketDataList();
    case "commodity":
      return fetchCommodityMarketDataList();
    case "index":
      return fetchIndexMarketDataList();
    default:
      return { success: false, error: "Unsupported asset type", assetType };
  }
}

/**
 * Legacy-compatible: returns raw CryptoData[] for widgets that still
 * rely on the original shape. Prefer fetchMarketDataList("crypto") for new code.
 */
export async function fetchCryptoDataCompat(): Promise<CryptoData[]> {
  return fetchCryptoDataViaAdapter();
}

// Re-export types for convenience
export type { UnifiedMarketData, AssetType, MarketDataResult, MarketDataListResult } from "./types";
