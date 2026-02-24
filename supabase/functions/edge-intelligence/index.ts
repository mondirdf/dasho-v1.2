/**
 * edge-intelligence — aggregates user behavior into weekly summaries
 * and serves them to the widget.
 *
 * Actions:
 *   - aggregate: compute weekly summaries for all active users (scheduler)
 *   - get-summary: return latest summary for authenticated user (widget)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setUTCDate(diff);
  return d.toISOString().split("T")[0];
}

function bucketFearGreed(value: number | null): string {
  if (value === null || value === undefined) return "unknown";
  if (value <= 25) return "extreme_fear";
  if (value <= 45) return "fear";
  if (value <= 55) return "neutral";
  if (value <= 75) return "greed";
  return "extreme_greed";
}

interface BehaviorEvent {
  event_type: string;
  symbol: string | null;
  timeframe: string | null;
  market_context_snapshot: Record<string, unknown>;
  created_at: string;
}

function computeSummary(events: BehaviorEvent[]) {
  const totalEvents = events.length;
  if (totalEvents === 0) return { total_events: 0 };

  // Date range
  const dates = events.map((e) => new Date(e.created_at).getTime());
  const daySpan = Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000));

  // Top symbols
  const symbolCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.symbol) symbolCounts[e.symbol] = (symbolCounts[e.symbol] || 0) + 1;
  }
  const topSymbols = Object.entries(symbolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symbol, count]) => ({ symbol, count }));

  // Event type breakdown
  const typeCounts: Record<string, number> = {};
  for (const e of events) {
    typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
  }

  // Engine usage
  const engineEvents = events.filter((e) => e.event_type === "engine_signal_view");
  const engineCounts: Record<string, number> = {};
  for (const e of engineEvents) {
    const key = e.symbol || "unknown";
    engineCounts[key] = (engineCounts[key] || 0) + 1;
  }

  // Fear/Greed affinity
  const fgBuckets: Record<string, number> = {};
  for (const e of events) {
    const fg = e.market_context_snapshot?.fear_greed as number | null;
    const bucket = bucketFearGreed(fg);
    fgBuckets[bucket] = (fgBuckets[bucket] || 0) + 1;
  }
  // Remove unknown if others exist
  if (Object.keys(fgBuckets).length > 1) delete fgBuckets["unknown"];
  const topFgBucket = Object.entries(fgBuckets).sort((a, b) => b[1] - a[1])[0];

  // Session affinity
  const sessionCounts: Record<string, number> = {};
  for (const e of events) {
    const session = e.market_context_snapshot?.session as string | null;
    if (session) sessionCounts[session] = (sessionCounts[session] || 0) + 1;
  }
  const peakSession = Object.entries(sessionCounts).sort((a, b) => b[1] - a[1])[0];

  // Alert effectiveness
  const alertsCreated = typeCounts["alert_create"] || 0;
  const alertsTriggered = typeCounts["alert_trigger"] || 0;
  const alertHitRate = alertsCreated > 0 ? Math.round((alertsTriggered / alertsCreated) * 100) : null;

  // Volatility regime affinity
  const regimeCounts: Record<string, number> = {};
  for (const e of events) {
    const regime = e.market_context_snapshot?.volatility_regime as string | null;
    if (regime) regimeCounts[regime] = (regimeCounts[regime] || 0) + 1;
  }

  return {
    total_events: totalEvents,
    day_span: daySpan,
    top_symbols: topSymbols,
    event_types: typeCounts,
    engine_usage: engineCounts,
    fear_greed_affinity: topFgBucket ? { bucket: topFgBucket[0], count: topFgBucket[1] } : null,
    session_affinity: peakSession ? { session: peakSession[0], count: peakSession[1] } : null,
    alert_hit_rate: alertHitRate,
    alerts_created: alertsCreated,
    alerts_triggered: alertsTriggered,
    volatility_regimes: regimeCounts,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = (body as any)?.action;

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── AGGREGATE ──
    if (action === "aggregate") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const weekStart = getWeekStart(new Date());

      // Get distinct users with recent events
      const { data: userRows } = await supabaseAdmin
        .from("user_behavior_events")
        .select("user_id")
        .gte("created_at", sevenDaysAgo);

      const uniqueUsers = [...new Set((userRows || []).map((r: any) => r.user_id))];
      let processed = 0;

      for (const userId of uniqueUsers) {
        const { data: events } = await supabaseAdmin
          .from("user_behavior_events")
          .select("event_type, symbol, timeframe, market_context_snapshot, created_at")
          .eq("user_id", userId)
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(1000);

        if (!events || events.length === 0) continue;

        const summary = computeSummary(events as BehaviorEvent[]);

        await supabaseAdmin.from("edge_intelligence_summaries").upsert(
          { user_id: userId, week_start: weekStart, summary_json: summary },
          { onConflict: "user_id,week_start" }
        );
        processed++;
      }

      return new Response(
        JSON.stringify({ ok: true, users_processed: processed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── GET-SUMMARY ──
    if (action === "get-summary") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userId = claimsData.claims.sub as string;

      const { data: summary } = await supabaseAdmin
        .from("edge_intelligence_summaries")
        .select("*")
        .eq("user_id", userId)
        .order("week_start", { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({ ok: true, summary: summary?.summary_json || null, week_start: summary?.week_start || null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("edge-intelligence error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
