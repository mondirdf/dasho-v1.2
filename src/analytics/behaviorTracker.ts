/**
 * Lightweight internal behavior analytics — fire-and-forget.
 * Never blocks UI. Privacy-safe: no IP, no PII beyond userId.
 */
import { supabase } from "@/integrations/supabase/client";
import { analyzeSession } from "@/engines/sessionEngine";

/** Generate a random session ID (persisted for browser session) */
function getSessionId(): string {
  const KEY = "dasho_sid";
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(KEY, sid);
  }
  return sid;
}

/**
 * Track a behavior event. Fire-and-forget — never awaited in UI code.
 * @param eventName - e.g. "dashboard_open", "recap_view"
 * @param metadata  - optional JSON-safe metadata (no PII)
 */
export function trackEvent(eventName: string, metadata?: Record<string, unknown>): void {
  // Run async without blocking
  queueMicrotask(async () => {
    try {
      const sessionId = getSessionId();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      await supabase.functions.invoke("track-analytics", {
        body: {
          event_name: eventName,
          user_id: userId,
          session_id: sessionId,
          metadata: metadata ?? {},
        },
      });
    } catch {
      // Silent fail — analytics must never crash the app
    }
  });
}

/**
 * Capture market context snapshot for behavior tracking.
 * Reads from Supabase cache tables + local session engine.
 */
async function captureMarketContext(): Promise<Record<string, unknown>> {
  const ctx: Record<string, unknown> = {};
  try {
    // Fear & Greed
    const { data: fg } = await supabase
      .from("cache_fear_greed")
      .select("value, value_classification")
      .eq("id", "current")
      .single();
    if (fg) {
      ctx.fear_greed = fg.value;
      ctx.fear_greed_label = fg.value_classification;
    }

    // Session analysis (pure local computation)
    const session = analyzeSession();
    const activeSessions = session.sessions.filter((s) => s.active).map((s) => s.name);
    ctx.session = activeSessions.length > 0 ? activeSessions[0] : "none";
  } catch {
    // Non-blocking — partial context is fine
  }
  return ctx;
}

/**
 * Track a user behavior event with market context snapshot.
 * Fire-and-forget pattern — never awaited in UI code.
 *
 * @param eventType - e.g. "widget_view", "engine_signal_view"
 * @param options   - optional symbol and timeframe
 */
export function trackBehavior(
  eventType: string,
  options?: { symbol?: string; timeframe?: string }
): void {
  queueMicrotask(async () => {
    try {
      const marketContext = await captureMarketContext();

      await supabase.functions.invoke("track-behavior", {
        body: {
          event_type: eventType,
          symbol: options?.symbol || null,
          timeframe: options?.timeframe || null,
          market_context_snapshot: marketContext,
        },
      });
    } catch {
      // Silent fail — behavior tracking must never crash the app
    }
  });
}
