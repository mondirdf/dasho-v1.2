/**
 * Lightweight internal behavior analytics — fire-and-forget.
 * Never blocks UI. Privacy-safe: no IP, no PII beyond userId.
 */
import { supabase } from "@/integrations/supabase/client";

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
