/**
 * Plan limits hook — returns current plan, limit checks, and feature flags.
 */
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchProfile } from "@/services/dataService";

export interface PlanLimits {
  plan: string;
  maxDashboards: number;
  maxAlerts: number;
  maxWidgets: number;
  isPro: boolean;
}

/** Feature flags derived from plan */
export interface ProFeatures {
  /** 4h recap timeframe */
  recap4h: boolean;
  /** Weekly recap timeframe */
  recapWeekly: boolean;
  /** Manual recap refresh */
  recapRefresh: boolean;
  /** Unlimited widgets */
  unlimitedWidgets: boolean;
  /** Advanced alert types */
  advancedAlerts: boolean;
  /** Priority data refresh */
  priorityRefresh: boolean;
}

const FREE_LIMITS: Omit<PlanLimits, "plan" | "isPro"> = {
  maxDashboards: 1,
  maxAlerts: 10,
  maxWidgets: 5,
};

const PRO_LIMITS: Omit<PlanLimits, "plan" | "isPro"> = {
  maxDashboards: Infinity,
  maxAlerts: Infinity,
  maxWidgets: Infinity,
};

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
  const limits = isPro ? PRO_LIMITS : FREE_LIMITS;

  const features: ProFeatures = {
    recap4h: isPro,
    recapWeekly: isPro,
    recapRefresh: isPro,
    unlimitedWidgets: isPro,
    advancedAlerts: isPro,
    priorityRefresh: isPro,
  };

  return { plan, isPro, ...limits, ...features, loading };
}
