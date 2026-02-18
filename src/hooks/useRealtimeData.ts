/**
 * Real-time subscriptions for live data updates.
 */
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeCrypto(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("realtime-crypto")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cache_crypto_data" },
        () => onUpdate()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [onUpdate]);
}

export function useRealtimeTriggeredAlerts(
  userId: string | undefined,
  onInsert: (payload: any) => void
) {
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("realtime-triggered-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "triggered_alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onInsert(payload.new)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, onInsert]);
}
