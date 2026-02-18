/**
 * Data Service — abstraction layer over Supabase cache tables.
 * Widgets consume this service only. No direct Supabase calls in UI.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CryptoData = Tables<"cache_crypto_data">;
export type NewsData = Tables<"cache_news">;
export type Alert = Tables<"alerts">;
export type Dashboard = Tables<"dashboards">;
export type Widget = Tables<"widgets">;
export type Profile = Tables<"profiles">;

// ── Crypto ──
export async function fetchCryptoData(): Promise<CryptoData[]> {
  const { data, error } = await supabase
    .from("cache_crypto_data")
    .select("*")
    .order("market_cap", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── News ──
export async function fetchNews(): Promise<NewsData[]> {
  const { data, error } = await supabase
    .from("cache_news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// ── Dashboards ──
export async function fetchDashboards(userId: string): Promise<Dashboard[]> {
  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function createDashboard(userId: string, name = "My Dashboard") {
  const { data, error } = await supabase
    .from("dashboards")
    .insert({ user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDashboardLayout(id: string, layoutJson: any) {
  const { error } = await supabase
    .from("dashboards")
    .update({ layout_json: layoutJson })
    .eq("id", id);
  if (error) throw error;
}

export async function renameDashboard(id: string, name: string) {
  const { error } = await supabase
    .from("dashboards")
    .update({ name })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDashboard(id: string) {
  const { error } = await supabase.from("dashboards").delete().eq("id", id);
  if (error) throw error;
}

// ── Widgets ──
export async function fetchWidgets(dashboardId: string): Promise<Widget[]> {
  const { data, error } = await supabase
    .from("widgets")
    .select("*")
    .eq("dashboard_id", dashboardId);
  if (error) throw error;
  return data ?? [];
}

export async function createWidget(
  dashboardId: string,
  type: string,
  configJson: any = {}
) {
  const { data, error } = await supabase
    .from("widgets")
    .insert({ dashboard_id: dashboardId, type, config_json: configJson })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWidget(id: string) {
  const { error } = await supabase.from("widgets").delete().eq("id", id);
  if (error) throw error;
}

// ── Alerts ──
export async function fetchAlerts(userId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAlert(
  userId: string,
  coinSymbol: string,
  targetPrice: number,
  conditionType: "above" | "below" = "above"
) {
  const { data, error } = await supabase
    .from("alerts")
    .insert({
      user_id: userId,
      coin_symbol: coinSymbol,
      target_price: targetPrice,
      condition_type: conditionType,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleAlert(id: string, isActive: boolean) {
  const { error } = await supabase
    .from("alerts")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAlert(id: string) {
  const { error } = await supabase.from("alerts").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchTriggeredAlerts(userId: string) {
  const { data, error } = await supabase
    .from("triggered_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// ── Templates ──
export async function fetchPublicTemplates() {
  const { data, error } = await supabase
    .from("public_templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function shareTemplate(
  userId: string,
  name: string,
  layoutJson: any,
  widgetsJson: any
) {
  const { data, error } = await supabase
    .from("public_templates")
    .insert({
      name,
      layout_json: layoutJson,
      widgets_json: widgetsJson,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Profile ──
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: { display_name?: string; avatar_url?: string }) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}
