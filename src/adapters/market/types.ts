/**
 * Unified Market Data Model
 * This is the canonical format all widgets should consume.
 * Asset-type agnostic — works for crypto, stocks, forex, commodities, indices.
 */

export type AssetType = "crypto" | "stock" | "forex" | "commodity" | "index";

export interface UnifiedMarketData {
  symbol: string;
  assetType: AssetType;
  price: number;
  change1h?: number;
  change24h: number;
  volume?: number;
  marketCap?: number;
  timestamp: number;
}

/** Structured error returned by adapters instead of throwing */
export interface MarketDataError {
  success: false;
  error: string;
  assetType: AssetType;
  symbol?: string;
}

export type MarketDataResult =
  | { success: true; data: UnifiedMarketData }
  | MarketDataError;

export type MarketDataListResult =
  | { success: true; data: UnifiedMarketData[] }
  | MarketDataError;
