import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    const { data: { user }, error: userError } =
      await supabaseUser.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
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

    // Churn rate: users with cancelled subscriptions / total paid
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

    // DAU from analytics_events (last 24h)
    const { data: analyticsDauRaw } = await supabaseAdmin
      .from("analytics_events")
      .select("user_id")
      .gte("created_at", todayStart)
      .not("user_id", "is", null);
    const analyticsDau = new Set(analyticsDauRaw?.map((e) => e.user_id)).size;

    // Recap views today
    const { count: recapViewsToday } = await supabaseAdmin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "recap_view")
      .gte("created_at", todayStart);

    // Widgets added today
    const { count: widgetsAddedToday } = await supabaseAdmin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "widget_add")
      .gte("created_at", todayStart);

    // Upgrade clicks this week
    const { count: upgradeClicksWeek } = await supabaseAdmin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "upgrade_click")
      .gte("created_at", weekAgo);

    // 7-day retention: users active today AND 7 days ago
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

    // 7-day trend: dashboard_open and recap_view per day
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

    // Top 5 widget types by widget_add events
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
        // Behavior analytics
        analytics: {
          dau: analyticsDau,
          recapViewsToday: recapViewsToday ?? 0,
          widgetsAddedToday: widgetsAddedToday ?? 0,
          upgradeClicksWeek: upgradeClicksWeek ?? 0,
          retentionRate: parseFloat(retentionRate),
          behaviorTrend,
          topWidgets,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
