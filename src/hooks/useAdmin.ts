import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types ──
interface BehaviorAnalytics {
  dau: number;
  recapViewsToday: number;
  widgetsAddedToday: number;
  upgradeClicksWeek: number;
  retentionRate: number;
  behaviorTrend: { date: string; dashboard_opens: number; recap_views: number }[];
  topWidgets: { type: string; count: number }[];
  userInsights: {
    visitorsToday: number;
    newUsersToday: number;
    returningUsersToday: number;
    recurringUsers7d: number;
    sessionsToday: number;
    avgSessionMinutesToday: number;
    avgSessionMinutes7d: number;
    topVisitorsToday: {
      userId: string;
      email: string | null;
      displayName: string | null;
      events: number;
      sessions: number;
      lastSeenAt: string;
    }[];
  };
}

interface AdminStats {
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  totalRevenue: number;
  dailyRevenue: number;
  conversionRate: number;
  churnRate: number;
  revenueOverTime: { date: string; revenue: number }[];
  userGrowth: { date: string; users: number }[];
  analytics: BehaviorAnalytics;
}

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  first_time_only: boolean;
  is_active: boolean;
  expires_at: string | null;
  revenue_generated: number;
  created_at: string;
}

// ── Admin Auth Hook ──
export function useAdminAuth() {
  const { session } = useAuth();

  const checkAdmin = useQuery({
    queryKey: ["admin-check"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-auth", {
        method: "GET",
      });
      if (error) throw error;
      return data as { isAdmin: boolean };
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await supabase.functions.invoke("admin-auth", {
        method: "POST",
        body: { password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      checkAdmin.refetch();
    },
  });

  return {
    isAdmin: checkAdmin.data?.isAdmin ?? false,
    isLoading: checkAdmin.isLoading,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error?.message,
  };
}

// ── Stats Hook ──
export function useAdminStats(enabled = true) {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-stats", {
        body: {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    refetchInterval: 60_000,
  });
}

// ── Promo Hook ──
export function useAdminPromos() {
  const queryClient = useQueryClient();

  const promos = useQuery<PromoCode[]>({
    queryKey: ["admin-promos"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-promo", {
        method: "GET",
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.promos;
    },
  });

  const createPromo = useMutation({
    mutationFn: async (promo: {
      code: string;
      discount_type: string;
      discount_value: number;
      max_uses?: number;
      first_time_only?: boolean;
      expires_at?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("admin-promo", {
        method: "POST",
        body: promo,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.promo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-promos"] }),
  });

  const updatePromo = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("admin-promo", {
        method: "PATCH",
        body: { id, ...updates },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.promo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-promos"] }),
  });

  return { promos, createPromo, updatePromo };
}
