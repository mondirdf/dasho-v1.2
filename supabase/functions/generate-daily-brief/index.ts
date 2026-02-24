import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if brief already exists for today
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("daily_briefs")
      .select("id")
      .eq("brief_date", today)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "Brief already exists for today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather comprehensive market data in parallel
    const [cryptoRes, fgRes, newsRes, forexRes, indexRes, commodityRes, ohlcBtcRes, ohlcEthRes] = await Promise.all([
      supabase.from("cache_crypto_data").select("*").order("market_cap", { ascending: false }).limit(15),
      supabase.from("cache_fear_greed").select("*").limit(1),
      supabase.from("cache_news").select("title, source, summary").order("published_at", { ascending: false }).limit(8),
      supabase.from("cache_forex_data").select("symbol, price, change_24h").limit(6),
      supabase.from("cache_index_data").select("symbol, price, change_24h").limit(5),
      supabase.from("cache_commodity_data").select("symbol, price, change_24h").limit(5),
      supabase.from("cache_ohlc_data").select("open, high, low, close, volume").eq("symbol", "BTC").eq("timeframe", "1d").order("open_time", { ascending: false }).limit(7),
      supabase.from("cache_ohlc_data").select("open, high, low, close, volume").eq("symbol", "ETH").eq("timeframe", "1d").order("open_time", { ascending: false }).limit(7),
    ]);

    const cryptoData = cryptoRes.data ?? [];
    const fearGreed = fgRes.data?.[0];
    const news = newsRes.data ?? [];
    const forex = forexRes.data ?? [];
    const indices = indexRes.data ?? [];
    const commodities = commodityRes.data ?? [];
    const btcDaily = ohlcBtcRes.data ?? [];
    const ethDaily = ohlcEthRes.data ?? [];

    const cryptoSummary = cryptoData
      .map((c: any) => `${c.symbol}: $${Number(c.price).toLocaleString()} (${c.change_24h >= 0 ? "+" : ""}${Number(c.change_24h).toFixed(2)}%) Vol: $${(Number(c.volume) / 1e6).toFixed(0)}M MCap: $${(Number(c.market_cap) / 1e9).toFixed(1)}B`)
      .join("\n");

    const forexSummary = forex.length > 0
      ? forex.map((f: any) => `${f.symbol}: ${Number(f.price).toFixed(4)} (${f.change_24h >= 0 ? "+" : ""}${Number(f.change_24h).toFixed(2)}%)`).join("\n")
      : "No forex data available";

    const indexSummary = indices.length > 0
      ? indices.map((idx: any) => `${idx.symbol}: ${Number(idx.price).toLocaleString()} (${idx.change_24h >= 0 ? "+" : ""}${Number(idx.change_24h).toFixed(2)}%)`).join("\n")
      : "No index data available";

    const commoditySummary = commodities.length > 0
      ? commodities.map((c: any) => `${c.symbol}: $${Number(c.price).toLocaleString()} (${c.change_24h >= 0 ? "+" : ""}${Number(c.change_24h).toFixed(2)}%)`).join("\n")
      : "No commodity data available";

    const newsSummary = news.map((n: any) => `- ${n.title}${n.summary ? ` — ${n.summary.slice(0, 100)}` : ""}`).join("\n");

    // BTC structure analysis from daily candles
    let btcStructure = "";
    if (btcDaily.length >= 3) {
      const latest = btcDaily[0];
      const prev = btcDaily[1];
      const weekHigh = Math.max(...btcDaily.map((c: any) => Number(c.high)));
      const weekLow = Math.min(...btcDaily.map((c: any) => Number(c.low)));
      const dailyRange = ((Number(latest.high) - Number(latest.low)) / Number(latest.close) * 100).toFixed(2);
      btcStructure = `BTC 7-Day Structure: High $${weekHigh.toLocaleString()}, Low $${weekLow.toLocaleString()}, Daily Range: ${dailyRange}%, Current Close: $${Number(latest.close).toLocaleString()}, Prev Close: $${Number(prev.close).toLocaleString()}`;
    }

    let ethStructure = "";
    if (ethDaily.length >= 3) {
      const latest = ethDaily[0];
      const weekHigh = Math.max(...ethDaily.map((c: any) => Number(c.high)));
      const weekLow = Math.min(...ethDaily.map((c: any) => Number(c.low)));
      ethStructure = `ETH 7-Day: High $${weekHigh.toLocaleString()}, Low $${weekLow.toLocaleString()}, Close: $${Number(latest.close).toLocaleString()}`;
    }

    const prompt = `You are a senior institutional crypto market analyst providing a premium daily trading brief for ${today}.

=== CRYPTO MARKET ===
${cryptoSummary}

=== FEAR & GREED INDEX ===
Value: ${fearGreed?.value ?? "N/A"} (${fearGreed?.value_classification ?? "N/A"})

=== PRICE STRUCTURE ===
${btcStructure}
${ethStructure}

=== GLOBAL INDICES ===
${indexSummary}

=== FOREX ===
${forexSummary}

=== COMMODITIES ===
${commoditySummary}

=== TOP HEADLINES ===
${newsSummary}

Write a PROFESSIONAL trading brief covering:
1. Title: Punchy, max 10 words, captures the market theme
2. Summary: 1 sentence, the key takeaway
3. Content (4-5 paragraphs):
   - **Market Overview**: Key price movements, dominance shifts, volume analysis
   - **Technical Structure**: BTC/ETH support & resistance from weekly highs/lows, trend direction
   - **Macro Context**: How indices, forex (DXY), and commodities affect crypto
   - **Sentiment & Flow**: Fear/Greed interpretation, funding rates implications, volume patterns
   - **Trading Outlook**: Specific scenarios with levels (e.g., "If BTC holds $X, expect move to $Y"), timeframes, and risk zones

Be specific with numbers. No generic filler. This is for traders who pay $15/month.

Format as JSON: {"title": "...", "summary": "...", "content": "..."}`;

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${geminiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI API error: ${aiRes.status} — ${errText}`);
    }

    const aiData = await aiRes.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";
    
    let parsed: { title: string; summary: string; content: string };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || rawText);
    } catch {
      parsed = {
        title: "Daily Market Brief",
        summary: rawText.slice(0, 200),
        content: rawText,
      };
    }

    // Store with richer metadata
    const topMovers = cryptoData.slice(0, 5).map((c: any) => ({
      symbol: c.symbol, price: c.price, change: c.change_24h,
    }));

    const { error: insertError } = await supabase.from("daily_briefs").insert({
      brief_date: today,
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      metadata: {
        fear_greed: fearGreed?.value,
        fear_greed_label: fearGreed?.value_classification,
        top_movers: topMovers,
        indices: indices.map((i: any) => ({ symbol: i.symbol, change: i.change_24h })),
        btc_weekly_high: btcDaily.length > 0 ? Math.max(...btcDaily.map((c: any) => Number(c.high))) : null,
        btc_weekly_low: btcDaily.length > 0 ? Math.min(...btcDaily.map((c: any) => Number(c.low))) : null,
        model: "gemini-3-flash-preview",
      },
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ ok: true, brief_date: today }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-daily-brief error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
