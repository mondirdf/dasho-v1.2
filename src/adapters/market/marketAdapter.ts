/**
 * Market Adapter — single entry point for all market data.
 *
 * Widgets import from here instead of calling API services directly.
 * To add a new asset class, create its adapter and register it in the switch.
 */
import type {
  AssetType,
  UnifiedMarketData,
  MarketDataResult,
  MarketDataListResult,
} from "./types";
import { fetchCryptoMarketData, fetchCryptoMarketDataList, fetchCryptoDataViaAdapter } from "./cryptoAdapter";
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
      return { success: false, error: "Stock adapter not implemented yet", assetType };
    case "forex":
      return { success: false, error: "Forex adapter not implemented yet", assetType };
    case "commodity":
      return { success: false, error: "Commodity adapter not implemented yet", assetType };
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
      return { success: false, error: "Stock adapter not implemented yet", assetType };
    case "forex":
      return { success: false, error: "Forex adapter not implemented yet", assetType };
    case "commodity":
      return { success: false, error: "Commodity adapter not implemented yet", assetType };
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
