
-- Add preferences column to profiles table
ALTER TABLE public.profiles
ADD COLUMN preferences_json jsonb NOT NULL DEFAULT '{
  "defaultAssetType": "crypto",
  "selectedCoins": ["BTC", "ETH", "SOL", "BNB", "XRP"],
  "recapTimeframe": "24h",
  "recapDetailLevel": "medium",
  "volatilityThreshold": 5,
  "compactMode": false,
  "highlightTopMovers": true
}'::jsonb;
