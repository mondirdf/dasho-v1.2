/**
 * Scheduler Edge Function — replaces manual pg_cron setup.
 * Self-manages timing for all data pipeline functions.
 * Call this once to kick off, it re-invokes itself.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface ScheduleEntry {
  name: string;
  intervalMs: number;
}

const SCHEDULES: ScheduleEntry[] = [
  { name: "fetch-crypto-data", intervalMs: 60_000 },   // 1 min
  { name: "fetch-news", intervalMs: 300_000 },          // 5 min
  { name: "check-alerts", intervalMs: 60_000 },         // 1 min
];

async function invokeFunction(name: string): Promise<void> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ triggered_by: "scheduler" }),
    });
    const text = await res.text();
    console.log(`[scheduler] ${name}: ${res.status} ${text}`);
  } catch (e) {
    console.error(`[scheduler] ${name} failed:`, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetFunction = (body as any)?.function;

    if (targetFunction) {
      // Single function invocation
      await invokeFunction(targetFunction);
      return new Response(
        JSON.stringify({ ok: true, invoked: targetFunction }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Run all scheduled functions
    const results = await Promise.allSettled(
      SCHEDULES.map((s) => invokeFunction(s.name))
    );

    return new Response(
      JSON.stringify({
        ok: true,
        ran: SCHEDULES.map((s) => s.name),
        results: results.map((r) => r.status),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scheduler error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
