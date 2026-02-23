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

async function sendAlertEmail(
  email: string,
  data: { displayName?: string; symbol: string; price: number; conditionType: string; targetPrice: number; alertType?: string }
) {
  try {
    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ to: email, template: "alert_triggered", data }),
      }
    );
  } catch (_) { /* email must never break alert pipeline */ }
}

/* ─── Lightweight structure analysis for smart alerts ─── */

interface Candle {
  open_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function detectSwings(candles: Candle[], lookback = 3) {
  const highs: { idx: number; price: number }[] = [];
  const lows: { idx: number; price: number }[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isH = true, isL = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) isH = false;
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) isL = false;
    }
    if (isH) highs.push({ idx: i, price: candles[i].high });
    if (isL) lows.push({ idx: i, price: candles[i].low });
  }
  return { highs, lows };
}

function analyzeStructure(candles: Candle[]) {
  if (candles.length < 15) return { bias: "neutral", lastEvent: null, lastEventIndex: -1 };
  const { highs, lows } = detectSwings(candles, 3);
  const all = [
    ...highs.map(h => ({ ...h, type: "high" as const })),
    ...lows.map(l => ({ ...l, type: "low" as const })),
  ].sort((a, b) => a.idx - b.idx);

  let lastHigh: number | null = null;
  let lastLow: number | null = null;
  let bias: "bullish" | "bearish" | "neutral" = "neutral";
  let lastEvent: string | null = null;
  let lastEventIndex = -1;

  for (const s of all) {
    if (s.type === "high") {
      const label = lastHigh === null ? "HH" : s.price > lastHigh ? "HH" : "LH";
      if (label === "HH" && lastHigh !== null && bias === "bullish") {
        lastEvent = "BOS_bullish"; lastEventIndex = s.idx;
      }
      if (label === "LH" && bias === "bullish") {
        lastEvent = "ChoCH_bearish"; lastEventIndex = s.idx; bias = "bearish";
      }
      if (label === "HH") bias = "bullish";
      lastHigh = s.price;
    } else {
      const label = lastLow === null ? "HL" : s.price > lastLow ? "HL" : "LL";
      if (label === "LL" && lastLow !== null && bias === "bearish") {
        lastEvent = "BOS_bearish"; lastEventIndex = s.idx;
      }
      if (label === "HL" && bias === "bearish") {
        lastEvent = "ChoCH_bullish"; lastEventIndex = s.idx; bias = "bullish";
      }
      if (label === "LL") bias = "bearish";
      lastLow = s.price;
    }
  }
  return { bias, lastEvent, lastEventIndex };
}

function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 0;
  let atr = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    atr += tr;
  }
  return atr / period;
}

function detectVolatilityRegime(candles: Candle[]): string {
  if (candles.length < 30) return "unknown";
  const shortATR = calcATR(candles, 7);
  const longATR = calcATR(candles, 21);
  const ratio = longATR > 0 ? shortATR / longATR : 1;
  if (ratio < 0.7) return "compression";
  if (ratio > 1.4) return "expansion";
  return "trending";
}

function calcEMA(values: number[], period: number): number[] {
  const result: number[] = [];
  const mult = 2 / (period + 1);
  let prev = values[0];
  result.push(prev);
  for (let i = 1; i < values.length; i++) {
    const c = (values[i] - prev) * mult + prev;
    result.push(c);
    prev = c;
  }
  return result;
}

function calcConfluenceScore(candlesByTF: Map<string, Candle[]>): { score: number; dominantBias: string } {
  const tfOrder = ["5m", "15m", "1h", "4h", "1d"];
  const weights = [1, 1.5, 2, 2.5, 3];
  let bullish = 0, bearish = 0;
  const biases: string[] = [];

  for (let i = 0; i < tfOrder.length; i++) {
    const candles = candlesByTF.get(tfOrder[i]);
    if (!candles || candles.length < 50) { biases.push("neutral"); continue; }
    const closes = candles.map(c => c.close);
    const ema20 = calcEMA(closes, 20);
    const ema50 = calcEMA(closes, 50);
    const last = closes.length - 1;
    const isBull = closes[last] > ema20[last] && ema20[last] > ema50[last];
    const isBear = closes[last] < ema20[last] && ema20[last] < ema50[last];
    if (isBull) { bullish += weights[i]; biases.push("bullish"); }
    else if (isBear) { bearish += weights[i]; biases.push("bearish"); }
    else biases.push("neutral");
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const dominant = bullish > bearish ? "bullish" : bearish > bullish ? "bearish" : "neutral";
  const aligned = dominant === "bullish" ? bullish : dominant === "bearish" ? bearish : 0;
  return { score: Math.round((aligned / totalWeight) * 100), dominantBias: dominant };
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

    /* ─── 1) Basic price alerts ─── */
    const { data: alerts, error: alertsErr } = await supabase
      .from("alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsErr) throw alertsErr;

    let triggered = 0;

    // Pre-fetch user profiles for email notifications
    const userProfileCache = new Map<string, { email: string; display_name: string | null }>();

    async function getUserProfile(userId: string) {
      if (userProfileCache.has(userId)) return userProfileCache.get(userId)!;
      const { data } = await supabase.from("profiles").select("email, display_name").eq("id", userId).single();
      if (data) userProfileCache.set(userId, data);
      return data;
    }

    if (alerts && alerts.length > 0) {
      const validAlerts = alerts.filter((a: any) => {
        if (!a.coin_symbol || typeof a.coin_symbol !== "string") return false;
        if (a.coin_symbol.length > 20) return false;
        if (typeof a.target_price !== "number" || a.target_price <= 0) return false;
        if (!["above", "below"].includes(a.condition_type)) return false;
        return true;
      });

      const symbols = [...new Set(validAlerts.map((a: any) => a.coin_symbol))];
      const { data: prices } = await supabase
        .from("cache_crypto_data")
        .select("symbol, price")
        .in("symbol", symbols);

      const priceMap = new Map((prices || []).map((p: any) => [p.symbol, p.price]));

      for (const alert of validAlerts) {
        const currentPrice = priceMap.get(alert.coin_symbol);
        if (currentPrice == null) continue;
        const met =
          (alert.condition_type === "above" && currentPrice >= alert.target_price) ||
          (alert.condition_type === "below" && currentPrice <= alert.target_price);
        if (met) {
          await supabase.from("triggered_alerts").insert({
            user_id: alert.user_id, alert_id: alert.id,
            coin_symbol: alert.coin_symbol, triggered_price: currentPrice,
          });
          await supabase.from("alerts").update({ is_active: false, triggered_at: new Date().toISOString() }).eq("id", alert.id);
          triggered++;

          // Send email notification
          const profile = await getUserProfile(alert.user_id);
          if (profile?.email) {
            sendAlertEmail(profile.email, {
              displayName: profile.display_name || undefined,
              symbol: alert.coin_symbol,
              price: currentPrice,
              conditionType: alert.condition_type,
              targetPrice: alert.target_price,
            });
          }
        }
      }
    }

    /* ─── 2) Smart alert rules (BOS, ChoCH, Regime, Confluence) ─── */
    const { data: smartRules } = await supabase
      .from("smart_alert_rules")
      .select("*")
      .eq("is_active", true);

    let smartTriggered = 0;

    if (smartRules && smartRules.length > 0) {
      // Get unique symbols from smart rules
      const smartSymbols = [...new Set(smartRules.map((r: any) => r.symbol))];
      const timeframes = ["5m", "15m", "1h", "4h", "1d"];

      // Fetch OHLC data for all symbols and timeframes
      const ohlcCache = new Map<string, Candle[]>();
      for (const sym of smartSymbols) {
        for (const tf of timeframes) {
          const { data: ohlc } = await supabase
            .from("cache_ohlc_data")
            .select("open_time, open, high, low, close, volume")
            .eq("symbol", sym)
            .eq("timeframe", tf)
            .order("open_time", { ascending: true })
            .limit(100);
          if (ohlc && ohlc.length > 0) {
            ohlcCache.set(`${sym}_${tf}`, ohlc.map((r: any) => ({
              open_time: Number(r.open_time), open: Number(r.open),
              high: Number(r.high), low: Number(r.low),
              close: Number(r.close), volume: Number(r.volume),
            })));
          }
        }
      }

      for (const rule of smartRules) {
        let shouldTrigger = false;
        const condition = rule.condition_json || {};
        const tf = condition.timeframe || "1h";
        const candles = ohlcCache.get(`${rule.symbol}_${tf}`);

        if (!candles || candles.length < 15) continue;

        // Cooldown: don't re-trigger within 1 hour
        if (rule.last_triggered_at) {
          const lastTrigger = new Date(rule.last_triggered_at).getTime();
          if (Date.now() - lastTrigger < 3600_000) continue;
        }

        switch (rule.event_type) {
          case "bos": {
            const result = analyzeStructure(candles);
            // Trigger if BOS detected in recent candles (last 10)
            if (result.lastEvent?.startsWith("BOS") && result.lastEventIndex > candles.length - 10) {
              const direction = condition.direction; // "bullish" | "bearish" | undefined (any)
              if (!direction || result.lastEvent === `BOS_${direction}`) {
                shouldTrigger = true;
              }
            }
            break;
          }
          case "choch": {
            const result = analyzeStructure(candles);
            if (result.lastEvent?.startsWith("ChoCH") && result.lastEventIndex > candles.length - 10) {
              const direction = condition.direction;
              if (!direction || result.lastEvent === `ChoCH_${direction}`) {
                shouldTrigger = true;
              }
            }
            break;
          }
          case "regime_change": {
            const regime = detectVolatilityRegime(candles);
            const targetRegime = condition.target_regime; // "compression" | "expansion" | "trending"
            if (targetRegime && regime === targetRegime) {
              shouldTrigger = true;
            } else if (!targetRegime && regime !== "trending") {
              // Default: trigger on any non-trending regime
              shouldTrigger = true;
            }
            break;
          }
          case "mtf_confluence": {
            const candlesByTF = new Map<string, Candle[]>();
            for (const t of timeframes) {
              const c = ohlcCache.get(`${rule.symbol}_${t}`);
              if (c) candlesByTF.set(t, c);
            }
            const { score, dominantBias } = calcConfluenceScore(candlesByTF);
            const threshold = condition.min_score ?? 80;
            const biasFilter = condition.bias; // "bullish" | "bearish" | undefined
            if (score >= threshold && (!biasFilter || dominantBias === biasFilter)) {
              shouldTrigger = true;
            }
            break;
          }
        }

        if (shouldTrigger) {
          // Insert triggered alert notification
          const currentPrice = candles[candles.length - 1]?.close ?? 0;
          await supabase.from("triggered_alerts").insert({
            user_id: rule.user_id,
            alert_id: rule.id,
            coin_symbol: rule.symbol,
            triggered_price: currentPrice,
          });
          // Update last_triggered_at
          await supabase.from("smart_alert_rules")
            .update({ last_triggered_at: new Date().toISOString() })
            .eq("id", rule.id);
          smartTriggered++;

          // Send email notification for smart alert
          const profile = await getUserProfile(rule.user_id);
          if (profile?.email) {
            sendAlertEmail(profile.email, {
              displayName: profile.display_name || undefined,
              symbol: rule.symbol,
              price: currentPrice,
              conditionType: rule.event_type,
              targetPrice: currentPrice,
              alertType: "smart",
            });
          }
        }
      }
    }

    const durationMs = Date.now() - startMs;
    await logEvent(supabase, "check-alerts", "success", `Completed in ${durationMs}ms`, {
      triggered, smartTriggered, durationMs,
    });

    return new Response(
      JSON.stringify({ ok: true, triggered, smartTriggered }),
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
