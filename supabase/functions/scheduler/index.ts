import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SCHEDULES = [
  { name: "fetch-crypto-data", intervalMs: 60_000 },
  { name: "fetch-news", intervalMs: 300_000 },
  { name: "check-alerts", intervalMs: 60_000 },
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

async function cleanupOldLogs(supabase: any): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("system_logs").delete().lt("created_at", cutoff);
  } catch (_) { /* non-blocking */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetFunction = (body as any)?.function;

    if (targetFunction) {
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

    // Cleanup old logs on every scheduler run (non-blocking)
    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    cleanupOldLogs(supabase);

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
