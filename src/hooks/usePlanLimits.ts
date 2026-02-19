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
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id)
      .then((p) => {
        setPlan(p?.plan || "free");
        setTrialEndsAt((p as any)?.trial_ends_at || null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Check if trial is still active
  const isTrialActive = trialEndsAt ? new Date(trialEndsAt).getTime() > Date.now() : false;
  const isPro = plan === "pro" || (plan === "free" && isTrialActive);
  const limits = isPro ? PRO_LIMITS : FREE_LIMITS;

  return { plan, isPro, ...limits, loading };
}
