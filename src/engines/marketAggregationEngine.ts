/**
 * Market Aggregation Engine
 *
 * Assembles a complete MarketSnapshot from multiple data sources
 * via the Asset-Aware Adapter Layer.  Pure data orchestration — no
 * UI, no summarisation, no subscription gating.
 */

import { fetchMarketDataList } from "@/adapters/market";
import type { AssetType, UnifiedMarketData } from "@/adapters/market";
import { supabase } from "@/integrations/supabase/client";
import { fetchNews } from "@/services/dataService";

// ─── Snapshot types ────────────────────────────────────────────

export interface MarketSnapshot {
  generatedAt: number;
  assetType: AssetType;

  globalStats?: {
    totalMarketCap?: number;
    marketCapChange24h?: number;
    totalVolume24h?: number;
  };

  topGainers?: UnifiedMarketData[];
  topLosers?: UnifiedMarketData[];

  selectedAssets?: UnifiedMarketData[];

  sentiment?: {
    fearGreedIndex?: number;
    classification?: string;
  };

  headlines?: {
    title: string;
    source?: string;
    publishedAt?: number;
  }[];
}

export interface SnapshotConfig {
  assetType: AssetType;
  selectedSymbols?: string[];
  includeGlobalStats?: boolean;
  includeMovers?: boolean;
  includeSentiment?: boolean;
  includeNews?: boolean;
  moversCount?: number;
  newsLimit?: number;
}

// ─── In-memory cache ───────────────────────────────────────────

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

interface CacheEntry {
  snapshot: MarketSnapshot;
  expiresAt: number;
}

const snapshotCache = new Map<string, CacheEntry>();

function cacheKey(cfg: SnapshotConfig): string {
  const symbols = (cfg.selectedSymbols ?? []).slice().sort().join(",");
  return `${cfg.assetType}|${symbols}|${cfg.includeGlobalStats}|${cfg.includeMovers}|${cfg.includeSentiment}|${cfg.includeNews}`;
}

// ─── Main builder ──────────────────────────────────────────────

export async function buildMarketSnapshot(
  config: SnapshotConfig,
): Promise<MarketSnapshot> {
  // Check cache
  const key = cacheKey(config);
  const cached = snapshotCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.snapshot;
  }

  const {
    assetType,
    selectedSymbols = [],
    includeGlobalStats = true,
    includeMovers = true,
    includeSentiment = true,
    includeNews = true,
    moversCount = 3,
    newsLimit = 5,
  } = config;

  const snapshot: MarketSnapshot = {
    generatedAt: Date.now(),
    assetType,
  };

  // Fetch full market list once — reused for global stats, movers, selected
  let allAssets: UnifiedMarketData[] = [];
  try {
    const result = await fetchMarketDataList(assetType);
    if (result.success) {
      allAssets = result.data;
    } else {
      const errResult = result as { success: false; error: string };
      console.warn("[MarketEngine] List fetch failed:", errResult.error);
    }
  } catch (err) {
    console.error("[MarketEngine] Unexpected list error:", err);
  }

  // ── Selected assets ──
  if (selectedSymbols.length > 0 && allAssets.length > 0) {
    snapshot.selectedAssets = selectedSymbols
      .map((s) => allAssets.find((a) => a.symbol === s))
      .filter((a): a is UnifiedMarketData => !!a);
  }

  // ── Global stats ──
  if (includeGlobalStats && allAssets.length > 0) {
    const totalMarketCap = allAssets.reduce((s, a) => s + (a.marketCap ?? 0), 0);
    const totalVolume24h = allAssets.reduce((s, a) => s + (a.volume ?? 0), 0);
    snapshot.globalStats = {
      totalMarketCap: totalMarketCap || undefined,
      totalVolume24h: totalVolume24h || undefined,
    };
  }

  // ── Top movers ──
  if (includeMovers && allAssets.length > 0) {
    const sorted = [...allAssets].sort((a, b) => b.change24h - a.change24h);
    snapshot.topGainers = sorted.slice(0, moversCount);
    snapshot.topLosers = sorted.slice(-moversCount).reverse();
  }

  // ── Sentiment (Fear & Greed) ──
  if (includeSentiment) {
    try {
      const { data } = await supabase
        .from("cache_fear_greed")
        .select("value, value_classification")
        .eq("id", "current")
        .maybeSingle();
      if (data) {
        snapshot.sentiment = {
          fearGreedIndex: data.value,
          classification: data.value_classification,
        };
      }
    } catch (err) {
      console.warn("[MarketEngine] Sentiment fetch failed:", err);
    }
  }

  // ── Headlines ──
  if (includeNews) {
    try {
      const news = await fetchNews();
      snapshot.headlines = news.slice(0, newsLimit).map((n) => ({
        title: n.title,
        source: n.source ?? undefined,
        publishedAt: n.published_at ? new Date(n.published_at).getTime() : undefined,
      }));
    } catch (err) {
      console.warn("[MarketEngine] News fetch failed:", err);
    }
  }

  // Store in cache
  snapshotCache.set(key, { snapshot, expiresAt: Date.now() + CACHE_TTL_MS });

  return snapshot;
}

/** Clear snapshot cache (useful for testing or forced refresh) */
export function clearSnapshotCache(): void {
  snapshotCache.clear();
}
