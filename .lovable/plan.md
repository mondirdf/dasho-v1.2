- Improving Core Value: Fix Data Quality and Add Real Value
- Critical Issues Found
- After a deep audit of the database and codebase, here's the reality:

  | Data Source    | Status             | Problem                                                   |
  | -------------- | ------------------ | --------------------------------------------------------- |
  | Crypto prices  | Working (fresh)    | market_cap = 0 for ALL coins (Binance doesn't provide it) |
  | Fear and Greed | Working            | Value = 8 (Extreme Fear) - data is live                   |
  | OHLC candles   | Working            | Only BTC, ETH, SOL - limits Pro engines to 3 symbols      |
  | News           | Working            | 50 articles cached                                        |
  | Forex          | STALE (4 days old) | Only 3 pairs, not scheduled                               |
  | Commodities    | STALE (4 days old) | Only 3 items, not scheduled                               |
  | Indices        | STALE (4 days old) | Only 1 index (DJIA), not scheduled                        |
  | Stocks         | EMPTY (0 rows)     | No ALPHA_VANTAGE_API_KEY configured                       |
  | Daily Brief    | Working            | Last brief from Feb 23                                    |

- The scheduler only runs: `fetch-crypto-data`, `fetch-news`, `check-alerts`. All other data sources (stocks, forex, commodities, indices, OHLC) are NOT scheduled -- they go stale immediately.
  ---
- Plan: 6 Fixes to Transform Core Value
- Fix 1: Add Market Cap Data to Crypto (Critical UX Issue)
- **Problem**: All crypto shows `market_cap: 0` because Binance doesn't provide it. The Market Context widget shows "Total MCap: $0.00T" which looks broken.
- **Solution**: After fetching from Binance, enrich data with CoinGecko market cap in `fetch-crypto-data`. Call CoinGecko as a secondary enrichment step (not as fallback) to get market_cap values and merge them.
- **File**: `supabase/functions/fetch-crypto-data/index.ts`
  ---
- Fix 2: Schedule ALL Data Sources (Critical Data Freshness)
- **Problem**: Forex, commodities, indices, OHLC, and stock data are never refreshed automatically. Only crypto, news, and alerts are in the scheduler.
- **Solution**: Add all data-fetching functions to the scheduler:
- Current:  fetch-crypto-data, fetch-news, check-alerts
Updated:  + fetch-forex-data, fetch-commodity-data, fetch-index-data, 
          + fetch-stock-data, fetch-binance-klines
- **File**: `supabase/functions/scheduler/index.ts`
  ---
- Fix 3: Remove Alpha Vantage Dependency for Stocks/Indices
- **Problem**: Stock and index data depends on `ALPHA_VANTAGE_API_KEY` which is NOT configured (not in secrets). This means both widgets show nothing.
- **Solution**: Replace Alpha Vantage with free APIs that don't require keys:
- **Stocks**: Use Yahoo Finance unofficial API or similar free endpoint
- **Indices**: Same approach for S&P 500, NASDAQ, DJIA, Russell 2000
- **Files**: `supabase/functions/fetch-stock-data/index.ts`, `supabase/functions/fetch-index-data/index.ts`
  ---
- Fix 4: Add Watchlist Price Alerts Integration
- **Problem**: Watchlist and Alerts are completely separate features. Users add symbols to watchlist but can't set alerts from there. This is a missed "aha moment".
- **Solution**: Add a small bell icon button next to each watchlist item that opens a quick "set alert" dialog inline, pre-filled with the symbol and current price.
- **File**: `src/components/widgets/WatchlistWidget.tsx`
  ---
- Fix 5: Enhance Morning Summary with Actionable Data
- **Problem**: The Morning Summary dialog only shows top gainers/losers. It doesn't leverage the AI engines at all -- it's just a basic price list.
- **Solution**: Add to Morning Summary:
- Fear and Greed value with label
- Active trading sessions right now
- One-line AI recap if available (from latest cached recap)
- Quick action: "Add to Watchlist" for top mover
- **File**: `src/components/dashboard/MorningSummary.tsx`
  ---
- Fix 6: Auto-Refresh OHLC Data for More Symbols
- **Problem**: OHLC candles only exist for BTC, ETH, SOL. The Structure Scanner, Volatility Regime, and MTF Confluence widgets offer symbol selection (BTC/ETH/SOL) but the OHLC fetch function (`fetch-binance-klines`) needs to be scheduled to keep data fresh.
- **Solution**: Add `fetch-binance-klines` to the scheduler and ensure it fetches all 3 symbols across all 5 timeframes.
- **File**: `supabase/functions/scheduler/index.ts` (already covered in Fix 2)
  ---
- Implementation Order
- **Fix 2 + 6**: Update scheduler (immediate impact on data freshness)
- **Fix 1**: Enrich crypto with market cap (fixes broken MCap display)
- **Fix 3**: Replace Alpha Vantage for stocks/indices (enables 2 dead widgets)
- **Fix 4**: Watchlist-to-alerts integration (UX improvement)
- **Fix 5**: Enhanced Morning Summary (better first impression)
- Files Changed Summary


| File                                            | Change                                                  |
| ----------------------------------------------- | ------------------------------------------------------- |
| `supabase/functions/scheduler/index.ts`         | Add forex, commodity, index, stock, klines to schedule  |
| `supabase/functions/fetch-crypto-data/index.ts` | Add CoinGecko market cap enrichment after Binance fetch |
| `supabase/functions/fetch-stock-data/index.ts`  | Replace Alpha Vantage with free Yahoo Finance API       |
| `supabase/functions/fetch-index-data/index.ts`  | Replace Alpha Vantage with free Yahoo Finance API       |
| `src/components/widgets/WatchlistWidget.tsx`    | Add quick "set alert" button per item                   |
| `src/components/dashboard/MorningSummary.tsx`   | Add Fear/Greed, session info, AI recap snippet          |
