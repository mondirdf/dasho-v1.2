import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── In-memory cache (shared across warm invocations) ── */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CachedRecap {
  text: string;
  generatedAt: number;
  expiresAt: number;
}

const recapCache = new Map<string, CachedRecap>();

/* ── Rate limiter (basic per-IP, in-memory) ── */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitMap.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

/* ── Build snapshot from Supabase cache tables ── */
async function buildSnapshotFromDB(): Promise<Record<string, unknown>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [cryptoRes, fgRes, newsRes] = await Promise.all([
    supabase.from("cache_crypto_data").select("*").order("market_cap", { ascending: false }).limit(20),
    supabase.from("cache_fear_greed").select("*").eq("id", "current").maybeSingle(),
    supabase.from("cache_news").select("*").order("fetched_at", { ascending: false }).limit(5),
  ]);

  const assets = cryptoRes.data ?? [];
  const totalMarketCap = assets.reduce((s: number, a: any) => s + (a.market_cap ?? 0), 0);
  const totalVolume = assets.reduce((s: number, a: any) => s + (a.volume ?? 0), 0);

  const sorted = [...assets].sort((a: any, b: any) => (b.change_24h ?? 0) - (a.change_24h ?? 0));
  const topGainers = sorted.slice(0, 3).map((a: any) => ({
    symbol: a.symbol,
    change24h: a.change_24h,
    price: a.price,
  }));
  const topLosers = sorted.slice(-3).reverse().map((a: any) => ({
    symbol: a.symbol,
    change24h: a.change_24h,
    price: a.price,
  }));

  return {
    totalMarketCap,
    totalVolume,
    topGainers,
    topLosers,
    sentiment: fgRes.data
      ? { value: fgRes.data.value, classification: fgRes.data.value_classification }
      : null,
    headlines: (newsRes.data ?? []).map((n: any) => n.title),
  };
}

/* ── Build safe prompt ── */
function buildPrompt(snapshot: Record<string, unknown>, detailLevel: "short" | "medium" = "medium"): string {
  const wordLimit = detailLevel === "short" ? "60–90" : "120–180";
  return `Summarize the following crypto market snapshot.
Focus strictly on what changed in the last 24 hours.
Do not provide predictions or investment advice.
Do not use hype language or suggest buying or selling.
Keep it concise, neutral, and professional.
Limit your response to ${wordLimit} words.

Market Snapshot:
${JSON.stringify(snapshot, null, 2)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Basic rate limiting
  const clientIp = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    const detailLevel = body?.detailLevel === "short" ? "short" : "medium";
    const cacheKey = `crypto_24h_${detailLevel}`;
    const cached = recapCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return new Response(
        JSON.stringify({
          assetType: "crypto",
          timeframe: "24h",
          text: cached.text,
          generatedAt: cached.generatedAt,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build snapshot from DB
    const snapshot = await buildSnapshotFromDB();

    // ─── AI Provider: Google Gemini ─────────────────────────────
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const aiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    const aiHeaders: Record<string, string> = {
      Authorization: `Bearer ${GEMINI_API_KEY}`,
      "Content-Type": "application/json",
    };
    const aiModel = "gemini-2.5-flash";

    const aiResponse = await fetch(aiUrl, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: "system",
            content:
              "You are a professional market analyst. You summarize market data factually. Never give financial advice, predictions, or use hype language.",
          },
          { role: "user", content: buildPrompt(snapshot, detailLevel) },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error(`AI gateway error [${status}]:`, body);

      if (status === 429 || status === 402) {
        // Return fallback instead of failing
        const fallback = buildFallbackRecap(snapshot);
        return new Response(
          JSON.stringify({
            assetType: "crypto",
            timeframe: "24h",
            text: fallback,
            generatedAt: Date.now(),
            cached: false,
            fallback: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway returned ${status}`);
    }

    const aiData = await aiResponse.json();
    let recapText =
      aiData.choices?.[0]?.message?.content?.trim() ?? "Market recap temporarily unavailable.";

    // Token safety: truncate overly long responses
    if (recapText.length > 1200) {
      recapText = recapText.slice(0, 1200) + "…";
    }

    const now = Date.now();

    // Cache the result
    recapCache.set(cacheKey, {
      text: recapText,
      generatedAt: now,
      expiresAt: now + CACHE_TTL_MS,
    });

    return new Response(
      JSON.stringify({
        assetType: "crypto",
        timeframe: "24h",
        text: recapText,
        generatedAt: now,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("market-recap error:", error);
    return new Response(
      JSON.stringify({
        assetType: "crypto",
        timeframe: "24h",
        text: "Market recap temporarily unavailable. Please try again later.",
        generatedAt: Date.now(),
        error: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/** Build a simple fallback recap from raw data when AI is unavailable */
function buildFallbackRecap(snapshot: Record<string, unknown>): string {
  const gainers = (snapshot.topGainers as any[]) ?? [];
  const losers = (snapshot.topLosers as any[]) ?? [];
  const sentiment = snapshot.sentiment as any;

  let text = "24h Market Summary: ";
  if (gainers.length > 0) {
    text += `Top gainers: ${gainers.map((g) => `${g.symbol} (${g.change24h > 0 ? "+" : ""}${g.change24h?.toFixed(1)}%)`).join(", ")}. `;
  }
  if (losers.length > 0) {
    text += `Biggest declines: ${losers.map((l) => `${l.symbol} (${l.change24h?.toFixed(1)}%)`).join(", ")}. `;
  }
  if (sentiment) {
    text += `Fear & Greed Index: ${sentiment.value} (${sentiment.classification}).`;
  }
  return text;
}
