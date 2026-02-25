/**
 * Plan limits hook — returns current plan, limit checks, and feature flags.
 *
 * All limits are defined in src/config/site.ts → PLAN_LIMITS & PRO_FEATURES.
 * Change them there — this hook reads from that single source of truth.
 */
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchProfile } from "@/services/dataService";
import { PLAN_LIMITS, PRO_FEATURES } from "@/config/site";

export interface PlanLimits {
  plan: string;
  maxDashboards: number;
  maxAlerts: number;
  maxWidgets: number;
  isPro: boolean;
}

/** Feature flags derived from plan */
export interface ProFeatures {
  recap4h: boolean;
  recapWeekly: boolean;
  recapRefresh: boolean;
  unlimitedWidgets: boolean;
  advancedAlerts: boolean;
  priorityRefresh: boolean;
}

export function usePlanLimits(): PlanLimits & ProFeatures & { loading: boolean } {
  const { user } = useAuth();
  const [plan, setPlan] = useState("free");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan("free");
      setTrialEndsAt(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchProfile(user.id)
      .then((p) => {
        setPlan(p?.plan || "free");
        setTrialEndsAt(p?.trial_ends_at || null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Trial counts as Pro if still active
  const isTrialActive = trialEndsAt ? new Date(trialEndsAt).getTime() > Date.now() : false;
  const isPro = plan === "pro" || (plan === "free" && isTrialActive);
  const limits = isPro ? PLAN_LIMITS.pro : PLAN_LIMITS.free;

  const features: ProFeatures = {
    recap4h: isPro && PRO_FEATURES.recap4h,
    recapWeekly: isPro && PRO_FEATURES.recapWeekly,
    recapRefresh: isPro && PRO_FEATURES.recapRefresh,
    unlimitedWidgets: isPro && PRO_FEATURES.unlimitedWidgets,
    advancedAlerts: isPro && PRO_FEATURES.advancedAlerts,
    priorityRefresh: isPro && PRO_FEATURES.priorityRefresh,
  };

  return { plan, isPro, ...limits, ...features, loading };
}
