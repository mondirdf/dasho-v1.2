import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth, useAdminStats, useAdminPromos } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users, DollarSign, TrendingUp, TrendingDown,
  Activity, ShieldCheck, Tag, Plus, Lock,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Admin Login Gate ──
const AdminLogin = ({ onLogin, loading, error }: {
  onLogin: (pw: string) => void;
  loading: boolean;
  error?: string;
}) => {
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="glass-card w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onLogin(password);
            }}
            className="space-y-4"
          >
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading ? "Verifying…" : "Enter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Stat Card ──
const StatCard = ({ label, value, icon: Icon, trend, sub }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  sub?: string;
}) => (
  <Card className="glass-card">
    <CardContent className="p-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold tabular-nums-animate">{value}</p>
        {sub && (
          <p className={`text-xs mt-0.5 ${
            trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
          }`}>
            {sub}
          </p>
        )}
      </div>
    </CardContent>
  </Card>
);

// ── Charts ──
const chartTooltipStyle = {
  contentStyle: {
    background: "hsl(228 30% 10%)",
    border: "1px solid hsl(228 18% 20%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(210 40% 98%)",
  },
};

const RevenueChart = ({ data }: { data: { date: string; revenue: number }[] }) => (
  <Card className="glass-card col-span-full lg:col-span-2">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (30 days)</CardTitle>
    </CardHeader>
    <CardContent className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(263 70% 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(263 70% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 18% 16%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
            tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} />
          <Tooltip {...chartTooltipStyle} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(263 70% 60%)"
            fill="url(#revGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const UserGrowthChart = ({ data }: { data: { date: string; users: number }[] }) => (
  <Card className="glass-card col-span-full lg:col-span-1">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">User Growth (30 days)</CardTitle>
    </CardHeader>
    <CardContent className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 18% 16%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
            tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} />
          <Tooltip {...chartTooltipStyle} />
          <Line type="monotone" dataKey="users" stroke="hsl(152 69% 45%)"
            strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// ── Promo Section ──
const PromoSection = () => {
  const { promos, createPromo, updatePromo } = useAdminPromos();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    max_uses: "",
    first_time_only: false,
    expires_at: "",
  });

  const handleCreate = async () => {
    try {
      await createPromo.mutateAsync({
        code: form.code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : undefined,
        first_time_only: form.first_time_only,
        expires_at: form.expires_at || undefined,
      });
      toast.success("Promo code created");
      setShowForm(false);
      setForm({ code: "", discount_type: "percentage", discount_value: "", max_uses: "", first_time_only: false, expires_at: "" });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updatePromo.mutateAsync({ id, is_active: !currentActive });
      toast.success(`Promo ${currentActive ? "deactivated" : "activated"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card className="glass-card col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Tag className="h-4 w-4" /> Promo Codes
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3 w-3 mr-1" /> New
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-lg border border-border bg-secondary/30">
            <div>
              <Label className="text-xs">Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SUMMER25" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage %</SelectItem>
                  <SelectItem value="fixed">Fixed $</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Value</Label>
              <Input type="number" value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                placeholder="25" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Max Uses</Label>
              <Input type="number" value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Unlimited" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Expires At</Label>
              <Input type="datetime-local" value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="mt-1" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.first_time_only}
                  onCheckedChange={(v) => setForm({ ...form, first_time_only: v })} />
                <Label className="text-xs">First-time only</Label>
              </div>
              <Button size="sm" onClick={handleCreate} disabled={createPromo.isPending || !form.code || !form.discount_value}>
                {createPromo.isPending ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        )}

        {promos.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : promos.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No promo codes yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left py-2 px-2">Code</th>
                  <th className="text-left py-2 px-2">Discount</th>
                  <th className="text-left py-2 px-2">Uses</th>
                  <th className="text-left py-2 px-2">Revenue</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {promos.data?.map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono font-bold">{p.code}</td>
                    <td className="py-2 px-2">
                      {p.discount_type === "percentage" ? `${p.discount_value}%` : `$${p.discount_value}`}
                      {p.first_time_only && <Badge variant="outline" className="ml-1 text-[10px]">1st</Badge>}
                    </td>
                    <td className="py-2 px-2 tabular-nums-animate">
                      {p.current_uses}{p.max_uses ? `/${p.max_uses}` : ""}
                    </td>
                    <td className="py-2 px-2 tabular-nums-animate">${p.revenue_generated}</td>
                    <td className="py-2 px-2">
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      <Button size="sm" variant="ghost"
                        onClick={() => toggleActive(p.id, p.is_active)}>
                        {p.is_active ? "Disable" : "Enable"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Main Admin Page ──
const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading, login, loginLoading, loginError } = useAdminAuth();
  const stats = useAdminStats(isAdmin);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <AdminLogin onLogin={login} loading={loginLoading} error={loginError} />;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Engine-based analytics & management</p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : stats.data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard label="Total Users" value={stats.data.totalUsers} icon={Users} />
            <StatCard label="Daily Active" value={stats.data.dailyActiveUsers} icon={Activity}
              sub={`${stats.data.weeklyActiveUsers} this week`} />
            <StatCard label="Total Revenue" value={`$${stats.data.totalRevenue.toLocaleString()}`}
              icon={DollarSign} sub={`$${stats.data.dailyRevenue} today`} trend="up" />
            <StatCard label="Daily Revenue" value={`$${stats.data.dailyRevenue}`} icon={DollarSign} />
            <StatCard label="Conversion Rate" value={`${stats.data.conversionRate}%`}
              icon={TrendingUp} trend={stats.data.conversionRate > 5 ? "up" : "neutral"} />
            <StatCard label="Churn Rate" value={`${stats.data.churnRate}%`}
              icon={TrendingDown} trend={stats.data.churnRate > 5 ? "down" : "neutral"} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <RevenueChart data={stats.data.revenueOverTime} />
            <UserGrowthChart data={stats.data.userGrowth} />
          </div>
        </>
      ) : (
        <p className="text-destructive text-sm">Failed to load stats</p>
      )}

      {/* Promo Engine */}
      <PromoSection />
    </div>
  );
};

export default AdminDashboard;
