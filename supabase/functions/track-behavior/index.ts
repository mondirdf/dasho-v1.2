/**
 * track-behavior — receives user behavior events from the client.
 * Inserts into user_behavior_events using service role (bypasses RLS).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_EVENTS = new Set([
  "widget_view",
  "symbol_click",
  "alert_create",
  "alert_trigger",
  "morning_summary_open",
  "engine_signal_view",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract user from auth token
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabaseAuth.auth.getClaims(token);
      if (!error && data?.claims) {
        userId = data.claims.sub as string;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_type, symbol, timeframe, market_context_snapshot } = await req.json();

    if (!event_type || !ALLOWED_EVENTS.has(event_type)) {
      return new Response(JSON.stringify({ error: "Invalid event_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize market_context_snapshot
    const safeContext: Record<string, unknown> = {};
    if (market_context_snapshot && typeof market_context_snapshot === "object") {
      for (const [k, v] of Object.entries(market_context_snapshot)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
          safeContext[k] = v;
        }
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabaseAdmin.from("user_behavior_events").insert({
      user_id: userId,
      event_type,
      symbol: symbol || null,
      timeframe: timeframe || null,
      market_context_snapshot: safeContext,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("track-behavior error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
