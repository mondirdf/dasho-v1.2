import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProfile, updateProfile, type Profile } from "@/services/dataService";
import { supabase } from "@/integrations/supabase/client";
import { usePreferences } from "@/hooks/usePreferences";
import {
  type UserPreferences,
  AVAILABLE_COINS,
  MAX_SELECTED_COINS,
} from "@/types/userPreferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, User, Shield, Trash2, LogOut, Crown,
  BarChart3, Sparkles, SlidersHorizontal, Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── Sub-sections ── */

const MarketPreferencesSection = ({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: UserPreferences) => void;
}) => {
  const toggleCoin = (coin: string) => {
    const selected = prefs.selectedCoins.includes(coin)
      ? prefs.selectedCoins.filter((c) => c !== coin)
      : prefs.selectedCoins.length < MAX_SELECTED_COINS
        ? [...prefs.selectedCoins, coin]
        : prefs.selectedCoins;
    onChange({ ...prefs, selectedCoins: selected });
  };

  return (
    <section className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Market Preferences</h2>
      </div>

      {/* Asset type (disabled) */}
      <div className="space-y-1.5">
        <Label>Default Asset Type</Label>
        <Input value="Crypto" disabled className="opacity-60 max-w-[200px]" />
        <p className="text-[11px] text-muted-foreground">Only crypto is currently supported.</p>
      </div>

      {/* Selected coins */}
      <div className="space-y-2">
        <Label>
          Selected Coins{" "}
          <span className="text-muted-foreground font-normal">
            ({prefs.selectedCoins.length}/{MAX_SELECTED_COINS})
          </span>
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_COINS.map((coin) => {
            const active = prefs.selectedCoins.includes(coin);
            return (
              <button
                key={coin}
                type="button"
                onClick={() => toggleCoin(coin)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  active
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary/60"
                }`}
              >
                {active && <Check className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
                {coin}
              </button>
            );
          })}
        </div>
      </div>

      {/* Volatility threshold */}
      <div className="space-y-2">
        <Label>Volatility Threshold — {prefs.volatilityThreshold}%</Label>
        <Slider
          value={[prefs.volatilityThreshold]}
          onValueChange={([v]) => onChange({ ...prefs, volatilityThreshold: v })}
          min={1}
          max={25}
          step={1}
          className="max-w-[300px]"
        />
        <p className="text-[11px] text-muted-foreground">
          Highlight assets with 24h change above this threshold.
        </p>
      </div>
    </section>
  );
};

const RecapSettingsSection = ({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: UserPreferences) => void;
}) => (
  <section className="glass-card p-6 space-y-4">
    <div className="flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-primary" />
      <h2 className="text-base font-semibold text-foreground">Recap Settings</h2>
    </div>

    <div className="space-y-1.5">
      <Label>Recap Timeframe</Label>
      <Input value="24 hours" disabled className="opacity-60 max-w-[200px]" />
      <p className="text-[11px] text-muted-foreground">More timeframes coming soon.</p>
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="detailLevel">Recap Detail Level</Label>
      <Select
        value={prefs.recapDetailLevel}
        onValueChange={(v) =>
          onChange({ ...prefs, recapDetailLevel: v as "short" | "medium" })
        }
      >
        <SelectTrigger id="detailLevel" className="max-w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="short">Short — Quick summary</SelectItem>
          <SelectItem value="medium">Medium — Detailed overview</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </section>
);

const DisplaySettingsSection = ({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: UserPreferences) => void;
}) => (
  <section className="glass-card p-6 space-y-4">
    <div className="flex items-center gap-2">
      <SlidersHorizontal className="h-5 w-5 text-primary" />
      <h2 className="text-base font-semibold text-foreground">Display Settings</h2>
    </div>

    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Compact Mode</Label>
        <p className="text-[11px] text-muted-foreground">Reduce widget spacing and font sizes.</p>
      </div>
      <Switch
        checked={prefs.compactMode}
        onCheckedChange={(v) => onChange({ ...prefs, compactMode: v })}
      />
    </div>

    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Highlight Top Movers</Label>
        <p className="text-[11px] text-muted-foreground">
          Visually emphasize assets with largest price changes.
        </p>
      </div>
      <Switch
        checked={prefs.highlightTopMovers}
        onCheckedChange={(v) => onChange({ ...prefs, highlightTopMovers: v })}
      />
    </div>
  </section>
);

/* ── Main Settings Page ── */

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const {
    preferences,
    setPreferences,
    savePreferences,
    loading: prefsLoading,
    saving: prefsSaving,
    hasChanges,
  } = usePreferences();

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((p) => {
      setProfile(p);
      setDisplayName(p?.display_name || "");
      setProfileLoading(false);
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { display_name: displayName.trim().slice(0, 100) || null });
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Error saving profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await savePreferences(preferences);
      toast({ title: "Preferences saved" });
    } catch {
      toast({ title: "Error saving preferences", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      toast({ title: "Password changed" });
    } catch (e: any) {
      toast({ title: e.message || "Error changing password", variant: "destructive" });
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user data first, then sign out
      if (user) {
        // Delete user's dashboards (widgets cascade via FK)
        await supabase.from("dashboards").delete().eq("user_id", user.id);
        // Delete user's alerts
        await supabase.from("alerts").delete().eq("user_id", user.id);
        // Delete user's triggered alerts
        await supabase.from("triggered_alerts").delete().eq("user_id", user.id);
      }
      await signOut();
      toast({
        title: "Account data deleted",
        description: "Your dashboards, widgets, and alerts have been removed. Contact support to fully delete your auth account.",
      });
      navigate("/");
    } catch {
      toast({ title: "Error deleting account data", variant: "destructive" });
    }
  };

  const loading = profileLoading || prefsLoading;

  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  const isPro = profile?.plan === "pro";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
        {hasChanges && (
          <Button
            onClick={handleSavePreferences}
            disabled={prefsSaving}
            size="sm"
            className="ml-auto"
          >
            {prefsSaving ? "Saving…" : "Save Changes"}
          </Button>
        )}
      </header>

      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        {/* Market Preferences */}
        <MarketPreferencesSection prefs={preferences} onChange={setPreferences} />

        {/* Recap Settings */}
        <RecapSettingsSection prefs={preferences} onChange={setPreferences} />

        {/* Display Settings */}
        <DisplaySettingsSection prefs={preferences} onChange={setPreferences} />

        <Separator />

        {/* Plan */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            <h2 className="text-base font-semibold text-foreground">Plan</h2>
            <Badge variant={isPro ? "default" : "secondary"} className="ml-auto capitalize">
              {profile?.plan || "free"}
            </Badge>
          </div>
          {!isPro && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Free plan: 1 dashboard · 5 widgets · 10 alerts</p>
              <p className="text-xs">Upgrade to Pro for unlimited access.</p>
            </div>
          )}
          {isPro && (
            <p className="text-sm text-muted-foreground">Unlimited dashboards, widgets, and alerts.</p>
          )}
        </section>

        {/* Profile */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Profile</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} size="sm">
              {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </section>

        {/* Security */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Security</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPw} size="sm" variant="outline">
              {changingPw ? "Changing…" : "Change Password"}
            </Button>
          </div>
        </section>

        {/* Sign Out */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Session</h2>
          </div>
          <Button onClick={signOut} variant="outline" size="sm" className="gap-1.5">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </section>

        <Separator />

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your dashboards, widgets, and alerts will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </div>
  );
};

export default Settings;
