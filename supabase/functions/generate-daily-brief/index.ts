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
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
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

    // Gather market data
    const [cryptoRes, fgRes, newsRes] = await Promise.all([
      supabase.from("cache_crypto_data").select("*").order("market_cap", { ascending: false }).limit(10),
      supabase.from("cache_fear_greed").select("*").limit(1),
      supabase.from("cache_news").select("title, source").order("published_at", { ascending: false }).limit(5),
    ]);

    const cryptoData = cryptoRes.data ?? [];
    const fearGreed = fgRes.data?.[0];
    const news = newsRes.data ?? [];

    const cryptoSummary = cryptoData
      .map((c: any) => `${c.symbol}: $${Number(c.price).toLocaleString()} (${c.change_24h >= 0 ? "+" : ""}${Number(c.change_24h).toFixed(2)}%)`)
      .join("\n");

    const newsSummary = news.map((n: any) => `- ${n.title}`).join("\n");

    const prompt = `You are a professional crypto market analyst. Write a concise daily trading brief for ${today}.

Market Data:
${cryptoSummary}

Fear & Greed Index: ${fearGreed?.value ?? "N/A"} (${fearGreed?.value_classification ?? "N/A"})

Top Headlines:
${newsSummary}

Write:
1. A compelling title (max 10 words)
2. A 1-sentence summary
3. A detailed brief (3-4 paragraphs) covering:
   - Key price movements and trends
   - Market sentiment analysis
   - Notable news impact
   - Trading outlook

Format as JSON: {"title": "...", "summary": "...", "content": "..."}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`AI API error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from AI response
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

    // Store the brief
    const { error: insertError } = await supabase.from("daily_briefs").insert({
      brief_date: today,
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      metadata: {
        fear_greed: fearGreed?.value,
        top_movers: cryptoData.slice(0, 3).map((c: any) => ({ symbol: c.symbol, change: c.change_24h })),
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
