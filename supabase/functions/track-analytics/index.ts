/**
 * track-analytics — receives behavior events from the client.
 * Inserts into analytics_events using service role (bypasses RLS).
 * No sensitive data is stored.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_EVENTS = new Set([
  "dashboard_open",
  "recap_view",
  "widget_add",
  "upgrade_click",
  "payment_created",
  "login",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_name, user_id, session_id, metadata } = await req.json();

    // Validate
    if (!event_name || !session_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_EVENTS.has(event_name)) {
      return new Response(JSON.stringify({ error: "Unknown event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize metadata — only keep simple key-value pairs
    const safeMeta: Record<string, string | number | boolean> = {};
    if (metadata && typeof metadata === "object") {
      for (const [k, v] of Object.entries(metadata)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          safeMeta[k] = v;
        }
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabaseAdmin.from("analytics_events").insert({
      event_name,
      user_id: user_id || null,
      session_id,
      metadata: safeMeta,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
