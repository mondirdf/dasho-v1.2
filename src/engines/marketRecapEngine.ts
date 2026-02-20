/**
 * Market Recap Engine — Client-side cache + fetch layer.
 *
 * All AI calls happen server-side via the market-recap edge function.
 * This engine caches responses client-side to avoid redundant network calls.
 */

import { supabase } from "@/integrations/supabase/client";

export interface MarketRecap {
  assetType: "crypto";
  timeframe: "24h";
  text: string;
  generatedAt: number;
  cached?: boolean;
  fallback?: boolean;
  error?: boolean;
}

/* ── Client-side cache ── */
const CLIENT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes client-side

interface ClientCacheEntry {
  data: MarketRecap;
  expiresAt: number;
}

const clientCache = new Map<string, ClientCacheEntry>();

export async function getMarketRecap(
  assetType: "crypto" = "crypto",
  timeframe: "24h" = "24h",
  userPreferences?: { recapDetailLevel?: "short" | "medium"; selectedCoins?: string[] },
): Promise<MarketRecap> {
  const detailLevel = userPreferences?.recapDetailLevel ?? "medium";
  const key = `${assetType}_${timeframe}_${detailLevel}`;

  // Check client cache
  const cached = clientCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const { data, error } = await supabase.functions.invoke("market-recap", {
      body: {
        assetType,
        timeframe,
        detailLevel,
        selectedCoins: userPreferences?.selectedCoins,
      },
    });

    if (error) throw error;

    const recap: MarketRecap = data as MarketRecap;

    // Cache client-side
    clientCache.set(key, {
      data: recap,
      expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
    });

    return recap;
  } catch (err) {
    console.error("[RecapEngine] Failed to fetch recap:", err);
    return {
      assetType,
      timeframe,
      text: "Market recap temporarily unavailable.",
      generatedAt: Date.now(),
      error: true,
    };
  }
}

/** Check if a fresh recap can be requested (client cache expired) */
export function canRefreshRecap(
  assetType: "crypto" = "crypto",
  timeframe: "24h" = "24h",
): boolean {
  const key = `${assetType}_${timeframe}`;
  const cached = clientCache.get(key);
  return !cached || Date.now() >= cached.expiresAt;
}

/** Force clear client cache */
export function clearRecapCache(): void {
  clientCache.clear();
}
