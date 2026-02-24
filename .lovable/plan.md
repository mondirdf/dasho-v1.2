

# Personal Edge Intelligence -- Implementation Plan

## Overview

This adds a complete "Personal Edge Intelligence" system to Dasho: behavior tracking, server-side aggregation, a new widget, and a landing page section. The system tracks how users interact with the platform, captures market context at each interaction, computes weekly insights, and surfaces them in a new "Your Edge Insights" widget.

---

## Step 1: Database Migration

Create two new tables with RLS policies:

### `user_behavior_events`
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- event_type (text, NOT NULL) -- widget_view, symbol_click, alert_create, alert_trigger, morning_summary_open, engine_signal_view
- symbol (text, nullable)
- timeframe (text, nullable)
- market_context_snapshot (jsonb, DEFAULT '{}') -- { fear_greed, volatility_regime, market_trend, session }
- created_at (timestamptz, DEFAULT now())

RLS: Users can SELECT own rows only. No direct INSERT/UPDATE/DELETE (service role only via edge function).

### `edge_intelligence_summaries`
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- week_start (date, NOT NULL)
- summary_json (jsonb, DEFAULT '{}')
- created_at (timestamptz, DEFAULT now())

UNIQUE constraint on (user_id, week_start). RLS: Users can SELECT own rows only.

---

## Step 2: Edge Function -- `track-behavior`

**New file**: `supabase/functions/track-behavior/index.ts`

- Receives: event_type, symbol, timeframe, market_context_snapshot
- Validates event_type against allowed list
- Extracts user_id from auth token via getClaims()
- Inserts into user_behavior_events using service role
- Fire-and-forget from client side

---

## Step 3: Edge Function -- `edge-intelligence`

**New file**: `supabase/functions/edge-intelligence/index.ts`

Two actions via request body:

**Action: `aggregate`** (called by scheduler)
- For each user with recent behavior events, query last 7 days of user_behavior_events
- Compute:
  - Top 5 symbols by view count
  - Most used widget types / engines
  - Market condition correlation (which fear_greed buckets, volatility regimes, sessions user is most active in)
  - Alert effectiveness: alert_create count vs alert_trigger count
  - Peak activity sessions (Asia/London/NY)
- Upsert result into edge_intelligence_summaries

**Action: `get-summary`** (called by widget)
- Auth required -- extract user_id from token
- Return latest edge_intelligence_summaries row for that user

---

## Step 4: Config Updates

### `supabase/config.toml`
Add verify_jwt = false for new functions:
```
[functions.track-behavior]
verify_jwt = false

[functions.edge-intelligence]
verify_jwt = false
```

### `supabase/functions/scheduler/index.ts`
Add edge-intelligence to SCHEDULES array (daily aggregation).

---

## Step 5: Client-Side Behavior Tracking

### Edit: `src/analytics/behaviorTracker.ts`

Add new function `trackBehavior(eventType, options?)`:
- Captures market context snapshot from Supabase cache tables (fear_greed value, latest session via sessionEngine)
- Calls `track-behavior` edge function
- Fire-and-forget pattern (same as existing trackEvent)

### Instrument tracking in existing components:

| Component | Event | Trigger |
|---|---|---|
| WidgetRenderer.tsx | widget_view | On mount (useEffect in wrapper) |
| MorningSummary.tsx | morning_summary_open | When dialog opens |
| StructureScannerWidget.tsx | engine_signal_view | On mount |
| VolatilityRegimeWidget.tsx | engine_signal_view | On mount |
| MTFConfluenceWidget.tsx | engine_signal_view | On mount |

Note: WidgetRenderer already wraps all widgets, so we add a single trackBehavior call there for widget_view events. For engine widgets, we track with symbol/timeframe context.

---

## Step 6: "Your Edge Insights" Widget

### New file: `src/components/widgets/EdgeInsightsWidget.tsx`

Displays:
- **Data maturity indicator**: "Based on X interactions over Y days"
- **Top Symbols**: Bar-style list of most viewed symbols
- **Peak Session**: Which trading session user is most active in
- **Market Condition Affinity**: "Most active during [Fear/Greed level]"
- **Alert Hit Rate**: alerts created vs triggered ratio
- **Most Used Engines**: Which pro engines the user engages with most

Uses WidgetHeader, SecondaryValue from shared.tsx. Fetches data from edge-intelligence function (get-summary action).

### Edit: `src/components/widgets/widgetRegistry.ts`
Register new widget:
- type: "edge_insights"
- category: "pro"
- label: "Your Edge"
- icon: Brain (from lucide-react)
- visual: { bg: "gradient", shadow: "glow", layout: "default", animation: "fadeIn", decorative: true, hoverLift: true }
- defaultSize: { w: 4, h: 5 }

### Edit: `src/components/widgets/WidgetRenderer.tsx`
- Import EdgeInsightsWidget
- Add to WIDGET_MAP: edge_insights: EdgeInsightsWidget
- Add "edge_insights" to PRO_WIDGET_TYPES set

---

## Step 7: Landing Page Section

### Edit: `src/pages/Index.tsx`

Add new section after "Trading Engines Showcase" (line 326) and before "Pricing" (line 328):

**Title**: "Your Edge. Quantified."

**Subtitle**: "Dasho doesn't just analyze the market. It analyzes how YOU react to the market."

**3 benefit cards** with icons:
1. Eye icon -- "Discover Your Strongest Conditions" -- Find which market environments align with your best decisions
2. Target icon -- "Spot Behavioral Biases" -- See if you overtrade in fear or ignore opportunities in greed
3. Shield icon -- "Build Data-Backed Confidence" -- Replace gut feelings with statistical self-awareness

**Closing line**: "The longer you use Dasho, the smarter your Edge becomes."

**Visual mock**: A glass-card showing a stylized "Your Edge Insights" widget preview with placeholder labels (Top Symbol, Peak Session, Alert Hit Rate, Market Affinity) -- no fake numbers, just structural indicators like progress bars and label placeholders.

---

## File Summary

| File | Action | Description |
|---|---|---|
| SQL Migration | Create | user_behavior_events + edge_intelligence_summaries tables with RLS |
| `supabase/config.toml` | Edit | Add verify_jwt = false for track-behavior and edge-intelligence |
| `supabase/functions/track-behavior/index.ts` | Create | Receives and stores behavior events |
| `supabase/functions/edge-intelligence/index.ts` | Create | Aggregates weekly summaries + serves them |
| `supabase/functions/scheduler/index.ts` | Edit | Add edge-intelligence to schedule |
| `src/analytics/behaviorTracker.ts` | Edit | Add trackBehavior() with market context capture |
| `src/components/widgets/EdgeInsightsWidget.tsx` | Create | New "Your Edge" widget |
| `src/components/widgets/widgetRegistry.ts` | Edit | Register edge_insights widget |
| `src/components/widgets/WidgetRenderer.tsx` | Edit | Add to WIDGET_MAP + PRO_WIDGET_TYPES + trackBehavior on mount |
| `src/pages/Index.tsx` | Edit | Add "Your Edge. Quantified." section |
| `src/components/dashboard/MorningSummary.tsx` | Edit | Add trackBehavior("morning_summary_open") |

## Implementation Order

1. Database migration (tables + RLS)
2. supabase/config.toml update
3. track-behavior edge function
4. edge-intelligence edge function
5. Scheduler update
6. behaviorTracker.ts update
7. EdgeInsightsWidget.tsx creation
8. Widget registry + renderer registration
9. Instrument tracking in WidgetRenderer + MorningSummary
10. Landing page section
11. Deploy edge functions

