import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function logEvent(supabase: any, type: string, status: string, message: string, metadata: any = {}) {
  try {
    await supabase.from("system_logs").insert({ type, status, message, metadata });
  } catch (_) { /* logging must never break pipeline */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startMs = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    await logEvent(supabase, "check-alerts", "started", "Execution started");

    const { data: alerts, error: alertsErr } = await supabase
      .from("alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsErr) throw alertsErr;
    if (!alerts || alerts.length === 0) {
      const durationMs = Date.now() - startMs;
      await logEvent(supabase, "check-alerts", "success", "No active alerts", { triggered: 0, durationMs });
      return new Response(
        JSON.stringify({ ok: true, triggered: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate alert data
    const validAlerts = alerts.filter((a) => {
      if (!a.coin_symbol || typeof a.coin_symbol !== "string") return false;
      if (a.coin_symbol.length > 20) return false;
      if (typeof a.target_price !== "number" || a.target_price <= 0) return false;
      if (!["above", "below"].includes(a.condition_type)) return false;
      return true;
    });

    const symbols = [...new Set(validAlerts.map((a) => a.coin_symbol))];
    const { data: prices, error: pricesErr } = await supabase
      .from("cache_crypto_data")
      .select("symbol, price")
      .in("symbol", symbols);

    if (pricesErr) throw pricesErr;

    const priceMap = new Map((prices || []).map((p) => [p.symbol, p.price]));
    let triggered = 0;

    for (const alert of validAlerts) {
      const currentPrice = priceMap.get(alert.coin_symbol);
      if (currentPrice == null) continue;

      const met =
        (alert.condition_type === "above" && currentPrice >= alert.target_price) ||
        (alert.condition_type === "below" && currentPrice <= alert.target_price);

      if (met) {
        await supabase.from("triggered_alerts").insert({
          user_id: alert.user_id,
          alert_id: alert.id,
          coin_symbol: alert.coin_symbol,
          triggered_price: currentPrice,
        });
        await supabase
          .from("alerts")
          .update({ is_active: false, triggered_at: new Date().toISOString() })
          .eq("id", alert.id);
        triggered++;
      }
    }

    const durationMs = Date.now() - startMs;
    await logEvent(supabase, "check-alerts", "success", `Completed in ${durationMs}ms`, { triggered, checked: validAlerts.length, durationMs });

    return new Response(
      JSON.stringify({ ok: true, triggered }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startMs;
    await logEvent(supabase, "check-alerts", "error", (error as Error).message, { durationMs });
    console.error("check-alerts error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
