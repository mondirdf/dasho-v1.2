/**
 * usePreferences — loads and persists UserPreferences from profiles.preferences_json.
 * Caches client-side to avoid redundant reads.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  type UserPreferences,
  DEFAULT_PREFERENCES,
  sanitizePreferences,
} from "@/types/userPreferences";

let cachedPrefs: UserPreferences | null = null;

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(
    cachedPrefs ?? DEFAULT_PREFERENCES,
  );
  const [loading, setLoading] = useState(!cachedPrefs);
  const [saving, setSaving] = useState(false);
  const initialRef = useRef<string>("");

  useEffect(() => {
    if (!user) return;
    if (cachedPrefs) {
      setPreferences(cachedPrefs);
      initialRef.current = JSON.stringify(cachedPrefs);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("preferences_json")
          .eq("id", user.id)
          .maybeSingle();
        const prefs = sanitizePreferences(data?.preferences_json);
        setPreferences(prefs);
        cachedPrefs = prefs;
        initialRef.current = JSON.stringify(prefs);
      } catch (err) {
        console.error("[Preferences] Load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const savePreferences = useCallback(
    async (updated: UserPreferences) => {
      if (!user) return;
      setSaving(true);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ preferences_json: updated as any })
          .eq("id", user.id);
        if (error) throw error;
        setPreferences(updated);
        cachedPrefs = updated;
        initialRef.current = JSON.stringify(updated);
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const hasChanges = JSON.stringify(preferences) !== initialRef.current;

  return { preferences, setPreferences, savePreferences, loading, saving, hasChanges };
}
