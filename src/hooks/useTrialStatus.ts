/**
 * Trial status hook — computes days remaining and reminder state.
 * Reminder notifications trigger on days 4, 2, 0 remaining (i.e. day 10, 12, 14 of trial).
 */
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchProfile } from "@/services/dataService";

export interface TrialStatus {
  /** Whether user is currently in an active trial */
  isTrialActive: boolean;
  /** Whether trial has expired (was active, now past) */
  isTrialExpired: boolean;
  /** Days remaining in trial (0 if expired) */
  daysRemaining: number;
  /** Whether we should show a reminder banner right now */
  showReminder: boolean;
  /** Urgency level for the banner */
  urgency: "info" | "warning" | "critical";
  /** Whether user is a paid Pro (not trial) */
  isPaidPro: boolean;
  /** Loading state */
  loading: boolean;
}

export function useTrialStatus(): TrialStatus {
  const { user } = useAuth();
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
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

  const now = new Date();
  const endDate = trialEndsAt ? new Date(trialEndsAt) : null;

  // Some users have temporary Pro stored as plan='pro' + trial_ends_at.
  // Once that date passes, they must be treated as free.
  const isExpiredTimedPro =
    plan === "pro" &&
    endDate !== null &&
    endDate.getTime() <= now.getTime();

  const isPaidPro = plan === "pro" && !isExpiredTimedPro;

  if (loading || !endDate || isPaidPro) {
    return {
      isTrialActive: false,
      isTrialExpired: false,
      daysRemaining: 0,
      showReminder: false,
      urgency: "info",
      isPaidPro,
      loading,
    };
  }

  const diffMs = endDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const isTrialActive = diffMs > 0;
  const isTrialExpired = !isTrialActive && plan === "free";

  // Show reminders when 4, 2, or 0 days remaining (day 10, 12, 14)
  const showReminder = isTrialExpired || daysRemaining <= 4;

  let urgency: "info" | "warning" | "critical" = "info";
  if (daysRemaining <= 1 || isTrialExpired) urgency = "critical";
  else if (daysRemaining <= 2) urgency = "warning";

  return {
    isTrialActive,
    isTrialExpired,
    daysRemaining,
    showReminder,
    urgency,
    isPaidPro,
    loading,
  };
}
