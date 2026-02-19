/**
 * Plan limits hook — returns current plan and limit checks.
 */
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchProfile } from "@/services/dataService";
import type { Profile } from "@/services/dataService";

export interface PlanLimits {
  plan: string;
  maxDashboards: number;
  maxAlerts: number;
  maxWidgets: number;
  isPro: boolean;
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

export function usePlanLimits(): PlanLimits & { loading: boolean } {
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

  return { plan, isPro, ...limits, loading };
}
