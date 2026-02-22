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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id)
      .then((p) => {
        setPlan(p?.plan || "free");
      })
      .finally(() => setLoading(false));
  }, [user]);

  const isPro = plan === "pro";
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
