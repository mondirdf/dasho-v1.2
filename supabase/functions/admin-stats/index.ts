import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyticsEventRow {
  user_id: string | null;
  session_id: string | null;
  created_at: string;
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
  if (userError || !user) throw new Error("Unauthorized");

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) throw new Error("Forbidden");

  return { supabaseAdmin, userId: user.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabaseAdmin } = await verifyAdmin(req);

    const body = await req.json().catch(() => ({}));

    // ── Update user plan (action: update_plan) ──
    if (body.action === "update_plan") {
      const { email, plan, pro_days } = body;
      
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, trial_ends_at, email")
        .eq("email", email)
        .maybeSingle();

      if (profileError || !profile) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = {};

      if (plan === "pro") {
        updates.plan = "pro";
        const days = pro_days || 60;
        const expiresAt = new Date();
        
        // Extend if already pro
        if (profile.plan === "pro" && profile.trial_ends_at) {
          const currentExpiry = new Date(profile.trial_ends_at);
          if (currentExpiry > new Date()) {
            expiresAt.setTime(currentExpiry.getTime());
          }
        }
        expiresAt.setDate(expiresAt.getDate() + days);
        updates.trial_ends_at = expiresAt.toISOString();
      } else if (plan === "free") {
        updates.plan = "free";
        updates.trial_ends_at = null;
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, user_id: profile.id, plan: updates.plan, trial_ends_at: updates.trial_ends_at }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Search users (action: search_users) ──
    if (body.action === "search_users") {
      const { query } = body;
      if (query) {
        const { data: users } = await supabaseAdmin
          .from("profiles")
          .select("id, email, display_name, plan, trial_ends_at, created_at")
          .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(10)
          .order("created_at", { ascending: false });

        return new Response(
          JSON.stringify({ users: users ?? [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Stats (default — no action specified) ──

    const now = new Date();
    const todayStartDate = new Date(now);
    todayStartDate.setUTCHours(0, 0, 0, 0);
    const todayStart = todayStartDate.toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Total users
    const { count: totalUsers } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Active users today (users with events today)
    const { data: dailyActiveRaw } = await supabaseAdmin
      .from("events")
      .select("user_id")
      .gte("created_at", todayStart)
      .not("user_id", "is", null);

    const dailyActiveUsers = new Set(dailyActiveRaw?.map((e) => e.user_id)).size;

    // Active users this week
    const { data: weeklyActiveRaw } = await supabaseAdmin
      .from("events")
      .select("user_id")
      .gte("created_at", weekAgo)
      .not("user_id", "is", null);

    const weeklyActiveUsers = new Set(weeklyActiveRaw?.map((e) => e.user_id)).size;

    // Total revenue
    const { data: revenueData } = await supabaseAdmin
      .from("payments")
      .select("amount, created_at")
      .eq("status", "completed");

    const totalRevenue = revenueData?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

    // Daily revenue
    const dailyRevenue = revenueData
      ?.filter((p) => p.created_at >= todayStart)
      .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

    // Conversion rate: paid users / total users
    const { data: paidUsersRaw } = await supabaseAdmin
      .from("payments")
      .select("user_id")
      .eq("status", "completed");

    const paidUsers = new Set(paidUsersRaw?.map((p) => p.user_id)).size;
    const conversionRate = totalUsers && totalUsers > 0
      ? ((paidUsers / totalUsers) * 100).toFixed(2)
      : "0.00";

    // Churn rate
    const { count: churnedCount } = await supabaseAdmin
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "cancelled");

    const churnRate = paidUsers > 0
      ? (((churnedCount ?? 0) / paidUsers) * 100).toFixed(2)
      : "0.00";

    // Revenue over time (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const revenueOverTime: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayRevenue = revenueData
        ?.filter((p) => p.created_at.startsWith(dateStr))
        .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
      revenueOverTime.push({ date: dateStr, revenue: dayRevenue });
    }

    // User growth (last 30 days)
    const { data: profilesData } = await supabaseAdmin
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    const userGrowth: { date: string; users: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = profilesData?.filter((p) => p.created_at.startsWith(dateStr)).length ?? 0;
      userGrowth.push({ date: dateStr, users: count });
    }

    // ── BEHAVIOR ANALYTICS ──
    const { data: analyticsDauRaw } = await supabaseAdmin
      .from("analytics_events")
      .select("user_id")
      .gte("created_at", todayStart)
      .not("user_id", "is", null);
    const analyticsDau = new Set(analyticsDauRaw?.map((e) => e.user_id)).size;

    const { count: recapViewsToday } = await supabaseAdmin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "recap_view")
      .gte("created_at", todayStart);

    const { count: widgetsAddedToday } = await supabaseAdmin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "widget_add")
      .gte("created_at", todayStart);

    const { count: upgradeClicksWeek } = await supabaseAdmin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "upgrade_click")
      .gte("created_at", weekAgo);

    // 7-day retention
    const sevenDaysAgoStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoEnd = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const { data: activeSevenDaysAgoRaw } = await supabaseAdmin
      .from("analytics_events")
      .select("user_id")
      .gte("created_at", sevenDaysAgoStart.toISOString())
      .lt("created_at", sevenDaysAgoEnd.toISOString())
      .not("user_id", "is", null);
    const activeSevenDaysAgo = new Set(activeSevenDaysAgoRaw?.map((e) => e.user_id));

    const { data: activeTodayRaw } = await supabaseAdmin
      .from("analytics_events")
      .select("user_id")
      .gte("created_at", todayStart)
      .not("user_id", "is", null);
    const activeToday = new Set(activeTodayRaw?.map((e) => e.user_id));

    let retainedCount = 0;
    for (const uid of activeSevenDaysAgo) {
      if (activeToday.has(uid)) retainedCount++;
    }
    const retentionRate = activeSevenDaysAgo.size > 0
      ? ((retainedCount / activeSevenDaysAgo.size) * 100).toFixed(1)
      : "0.0";

    // 7-day trend
    const behaviorTrend: { date: string; dashboard_opens: number; recap_views: number }[] = [];
    const { data: trendRaw } = await supabaseAdmin
      .from("analytics_events")
      .select("event_name, created_at")
      .in("event_name", ["dashboard_open", "recap_view"])
      .gte("created_at", weekAgo);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayEvents = trendRaw?.filter((e) => e.created_at.startsWith(dateStr)) ?? [];
      behaviorTrend.push({
        date: dateStr,
        dashboard_opens: dayEvents.filter((e) => e.event_name === "dashboard_open").length,
        recap_views: dayEvents.filter((e) => e.event_name === "recap_view").length,
      });
    }

    // Top 5 widget types
    const { data: widgetAddEvents } = await supabaseAdmin
      .from("analytics_events")
      .select("metadata")
      .eq("event_name", "widget_add");

    const widgetCounts: Record<string, number> = {};
    for (const e of widgetAddEvents ?? []) {
      const meta = e.metadata as Record<string, unknown>;
      const type = typeof meta?.type === "string" ? meta.type : "unknown";
      widgetCounts[type] = (widgetCounts[type] || 0) + 1;
    }
    const topWidgets = Object.entries(widgetCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // ── USER INSIGHTS ──
    const { data: analyticsTodayRaw } = await supabaseAdmin
      .from("analytics_events")
      .select("user_id, session_id, created_at")
      .gte("created_at", todayStart)
      .order("created_at", { ascending: true });

    const analyticsToday = (analyticsTodayRaw ?? []) as AnalyticsEventRow[];
    const todayUserIds = analyticsToday
      .map((e) => e.user_id)
      .filter((id): id is string => Boolean(id));
    const visitorsToday = new Set(todayUserIds).size;

    const { data: usersCreatedTodayRaw } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .gte("created_at", todayStart);
    const usersCreatedTodayIds = new Set((usersCreatedTodayRaw ?? []).map((u) => u.id));
    const newUsersToday = usersCreatedTodayIds.size;

    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: priorActiveRaw } = await supabaseAdmin
      .from("analytics_events")
      .select("user_id")
      .lt("created_at", todayStart)
      .gte("created_at", monthAgo)
      .not("user_id", "is", null);
    const priorActiveUsers = new Set((priorActiveRaw ?? []).map((e) => e.user_id));
    const returningUsersToday = Array.from(new Set(todayUserIds)).filter((id) => priorActiveUsers.has(id)).length;

    const { data: analyticsWeekRaw } = await supabaseAdmin
      .from("analytics_events")
      .select("user_id, session_id, created_at")
      .gte("created_at", weekAgo)
      .not("user_id", "is", null);
    const analyticsWeek = (analyticsWeekRaw ?? []) as AnalyticsEventRow[];

    const userActiveDays = new Map<string, Set<string>>();
    for (const e of analyticsWeek) {
      if (!e.user_id) continue;
      const day = e.created_at.slice(0, 10);
      const days = userActiveDays.get(e.user_id) ?? new Set<string>();
      days.add(day);
      userActiveDays.set(e.user_id, days);
    }
    const recurringUsers7d = Array.from(userActiveDays.values()).filter((days) => days.size >= 3).length;

    const calcAvgSessionMinutes = (events: AnalyticsEventRow[]): number => {
      const sessionSpans = new Map<string, { min: number; max: number }>();
      for (const e of events) {
        if (!e.session_id) continue;
        const ts = new Date(e.created_at).getTime();
        const span = sessionSpans.get(e.session_id);
        if (!span) {
          sessionSpans.set(e.session_id, { min: ts, max: ts });
        } else {
          span.min = Math.min(span.min, ts);
          span.max = Math.max(span.max, ts);
        }
      }
      if (sessionSpans.size === 0) return 0;
      let totalMinutes = 0;
      for (const span of sessionSpans.values()) {
        totalMinutes += Math.max(0, (span.max - span.min) / 60000);
      }
      return Number((totalMinutes / sessionSpans.size).toFixed(1));
    };

    const sessionsToday = new Set(
      analyticsToday.map((e) => e.session_id).filter((id): id is string => Boolean(id))
    ).size;
    const avgSessionMinutesToday = calcAvgSessionMinutes(analyticsToday);
    const avgSessionMinutes7d = calcAvgSessionMinutes(analyticsWeek);

    const topVisitorCounters = new Map<string, { events: number; sessionIds: Set<string>; lastSeenAt: string }>();
    for (const e of analyticsToday) {
      if (!e.user_id) continue;
      const current = topVisitorCounters.get(e.user_id) ?? {
        events: 0,
        sessionIds: new Set<string>(),
        lastSeenAt: e.created_at,
      };
      current.events += 1;
      if (e.session_id) current.sessionIds.add(e.session_id);
      if (e.created_at > current.lastSeenAt) current.lastSeenAt = e.created_at;
      topVisitorCounters.set(e.user_id, current);
    }

    const topVisitorIds = Array.from(topVisitorCounters.entries())
      .sort((a, b) => b[1].events - a[1].events)
      .slice(0, 10)
      .map(([userId]) => userId);

    let profileById = new Map<string, { email: string | null; display_name: string | null }>();
    if (topVisitorIds.length > 0) {
      const { data: topVisitorProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email, display_name")
        .in("id", topVisitorIds);

      profileById = new Map(
        (topVisitorProfiles ?? []).map((p) => [p.id, { email: p.email, display_name: p.display_name }])
      );
    }

    const topVisitorsToday = topVisitorIds.map((userId) => {
      const counters = topVisitorCounters.get(userId)!;
      const profile = profileById.get(userId);
      return {
        userId,
        email: profile?.email ?? null,
        displayName: profile?.display_name ?? null,
        events: counters.events,
        sessions: counters.sessionIds.size,
        lastSeenAt: counters.lastSeenAt,
      };
    });

    return new Response(
      JSON.stringify({
        totalUsers: totalUsers ?? 0,
        dailyActiveUsers,
        weeklyActiveUsers,
        totalRevenue,
        dailyRevenue,
        conversionRate: parseFloat(conversionRate),
        churnRate: parseFloat(churnRate),
        revenueOverTime,
        userGrowth,
        analytics: {
          dau: analyticsDau,
          recapViewsToday: recapViewsToday ?? 0,
          widgetsAddedToday: widgetsAddedToday ?? 0,
          upgradeClicksWeek: upgradeClicksWeek ?? 0,
          retentionRate: parseFloat(retentionRate),
          behaviorTrend,
          topWidgets,
          userInsights: {
            visitorsToday,
            newUsersToday,
            returningUsersToday,
            recurringUsers7d,
            sessionsToday,
            avgSessionMinutesToday,
            avgSessionMinutes7d,
            topVisitorsToday,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = (err as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
