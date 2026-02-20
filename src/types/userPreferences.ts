/**
 * User Preferences — persisted in profiles.preferences_json.
 * Controls how engines aggregate data and how widgets render.
 */

export interface UserPreferences {
  defaultAssetType: "crypto";
  selectedCoins: string[];
  recapTimeframe: "24h";
  recapDetailLevel: "short" | "medium";
  volatilityThreshold: number;
  compactMode: boolean;
  highlightTopMovers: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultAssetType: "crypto",
  selectedCoins: ["BTC", "ETH", "SOL", "BNB", "XRP"],
  recapTimeframe: "24h",
  recapDetailLevel: "medium",
  volatilityThreshold: 5,
  compactMode: false,
  highlightTopMovers: true,
};

/** Available coins for selection */
export const AVAILABLE_COINS = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX",
  "DOT", "MATIC", "LINK", "UNI", "ATOM", "LTC", "NEAR",
] as const;

/** Max number of selected coins */
export const MAX_SELECTED_COINS = 10;

/** Validate and sanitize user preferences, returning safe defaults for invalid fields */
export function sanitizePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFERENCES };

  const p = raw as Record<string, unknown>;

  const selectedCoins = Array.isArray(p.selectedCoins)
    ? p.selectedCoins.filter((c): c is string => typeof c === "string").slice(0, MAX_SELECTED_COINS)
    : DEFAULT_PREFERENCES.selectedCoins;

  const recapDetailLevel =
    p.recapDetailLevel === "short" || p.recapDetailLevel === "medium"
      ? p.recapDetailLevel
      : DEFAULT_PREFERENCES.recapDetailLevel;

  const volatilityThreshold =
    typeof p.volatilityThreshold === "number" &&
    p.volatilityThreshold >= 1 &&
    p.volatilityThreshold <= 50
      ? p.volatilityThreshold
      : DEFAULT_PREFERENCES.volatilityThreshold;

  return {
    defaultAssetType: "crypto",
    selectedCoins,
    recapTimeframe: "24h",
    recapDetailLevel,
    volatilityThreshold,
    compactMode: typeof p.compactMode === "boolean" ? p.compactMode : DEFAULT_PREFERENCES.compactMode,
    highlightTopMovers:
      typeof p.highlightTopMovers === "boolean" ? p.highlightTopMovers : DEFAULT_PREFERENCES.highlightTopMovers,
  };
}
