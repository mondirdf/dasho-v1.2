import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get active alerts
    const { data: alerts, error: alertsErr } = await supabase
      .from("alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsErr) throw alertsErr;
    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, triggered: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current prices
    const symbols = [...new Set(alerts.map((a) => a.coin_symbol))];
    const { data: prices, error: pricesErr } = await supabase
      .from("cache_crypto_data")
      .select("symbol, price")
      .in("symbol", symbols);

    if (pricesErr) throw pricesErr;

    const priceMap = new Map(
      (prices || []).map((p) => [p.symbol, p.price])
    );

    let triggered = 0;

    for (const alert of alerts) {
      const currentPrice = priceMap.get(alert.coin_symbol);
      if (currentPrice == null) continue;

      const met =
        (alert.condition_type === "above" && currentPrice >= alert.target_price) ||
        (alert.condition_type === "below" && currentPrice <= alert.target_price);

      if (met) {
        // Insert triggered alert
        await supabase.from("triggered_alerts").insert({
          user_id: alert.user_id,
          alert_id: alert.id,
          coin_symbol: alert.coin_symbol,
          triggered_price: currentPrice,
        });

        // Deactivate alert
        await supabase
          .from("alerts")
          .update({ is_active: false, triggered_at: new Date().toISOString() })
          .eq("id", alert.id);

        triggered++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, triggered }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-alerts error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
