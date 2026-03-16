import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Crown, Copy, Check, Loader2, Wallet, Zap, Shield, BarChart3,
  Layout, Bell, FileDown, Sparkles, ArrowLeft, ArrowRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDefaultTheme } from "@/hooks/useDefaultTheme";
import { trackEvent } from "@/analytics/behaviorTracker";
import { extractFunctionErrorMessage } from "@/lib/extractFunctionError";
import logoDasho from "@/assets/logo-dasho-dark-bg.png";

interface PaymentInfo {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
}

const PRO_FEATURES = [
  { icon: BarChart3, label: "4h & Weekly AI Recaps", desc: "Stay ahead of every move" },
  { icon: Layout, label: "Unlimited widgets & dashboards", desc: "Build your perfect setup" },
  { icon: Bell, label: "Smart Alerts (BOS, ChoCH, MTF)", desc: "Never miss a breakout" },
  { icon: Sparkles, label: "Custom themes & layout profiles", desc: "Make it truly yours" },
  { icon: FileDown, label: "CSV exports & priority refresh", desc: "Faster data, anywhere" },
];

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  useDefaultTheme();

  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const handleUpgrade = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    trackEvent("upgrade_click");
    try {
      const { data, error } = await supabase.functions.invoke("create-payment");
      if (error) throw error;
      if (data?.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }
      setPayment(data as PaymentInfo);
      trackEvent("payment_created");
    } catch (e: any) {
      const errorMessage = await extractFunctionErrorMessage(e, "Failed to create payment. Try again.");
      toast({
        title: "Payment error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const copyAddress = useCallback(() => {
    if (!payment) return;
    navigator.clipboard.writeText(payment.pay_address);
    setCopied(true);
    toast({ title: "Address copied!" });
    setTimeout(() => setCopied(false), 2000);
  }, [payment, toast]);

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-nav border-b border-border/40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoDasho} alt="Dasho" className="h-8 sm:h-9" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link to="/pricing">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                Compare Plans
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-16">
        <Link to="/pricing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Pricing
        </Link>

        {!authLoading && !user ? (
          /* Not logged in */
          <div className="glass-card-enhanced p-8 sm:p-12 text-center space-y-6 max-w-lg mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sign in to upgrade</h1>
            <p className="text-sm text-muted-foreground">You need to create an account first to upgrade to Pro.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="gap-2 glow-button px-8">
                  Create Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-border/60">Sign In</Button>
              </Link>
            </div>
          </div>
        ) : !payment ? (
          /* Step 1: Checkout summary */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left: Order summary */}
            <div className="glass-card-enhanced p-6 sm:p-8 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Upgrade to Pro</h1>
                <p className="text-sm text-muted-foreground mt-1">Unlock the full power of Dasho</p>
              </div>

              {/* Price breakdown */}
              <div className="rounded-xl bg-secondary/40 border border-border/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-medium text-foreground">Dasho Pro</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium text-foreground">2 months (60 days)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment method</span>
                  <span className="text-sm font-medium text-foreground">USDT (TRC20)</span>
                </div>
                <div className="border-t border-border/30 pt-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-foreground">$15 <span className="text-sm font-normal text-muted-foreground">USDT</span></span>
                </div>
              </div>

              {/* Renewal info */}
              <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex items-start gap-3">
                <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Renewable</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    After 60 days, you can renew for another 2 months. If you're already Pro, the days are added to your remaining time.
                  </p>
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold glow-button gap-2.5"
                onClick={handleUpgrade}
                disabled={loading || authLoading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
                {loading ? "Creating payment…" : "Pay $15 USDT"}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <Shield className="h-3 w-3" />
                Secure crypto payment · Instant activation
              </div>
            </div>

            {/* Right: What's included */}
            <div className="glass-card-enhanced p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">What's included</h2>
              </div>
              <div className="space-y-4">
                {PRO_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-start gap-3 group">
                    <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground">{f.label}</span>
                      <span className="text-xs text-muted-foreground">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border/20">
                <Link to="/pricing" className="text-xs text-primary hover:underline">
                  See full feature comparison →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Payment details */
          <div className="max-w-lg mx-auto glass-card-enhanced p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-success/15 border border-success/25 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-success" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Complete Payment</h1>
                <p className="text-xs text-muted-foreground">Send the exact amount below</p>
              </div>
            </div>

            {/* Amount */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6 text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Send exactly</p>
              <p className="text-4xl font-bold text-foreground tabular-nums">
                15 <span className="text-sm font-normal text-muted-foreground">USDT</span>
              </p>
              <p className="text-[11px] text-primary/80 font-medium">TRC20 Network</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white rounded-xl p-4">
                <QRCodeSVG
                  value={payment.pay_address}
                  size={160}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Wallet Address</p>
              <div
                className="flex items-center gap-2 bg-secondary/50 rounded-xl border border-border/50 p-3 cursor-pointer hover:bg-secondary/70 transition-colors group"
                onClick={copyAddress}
              >
                <code className="flex-1 text-xs text-foreground break-all font-mono leading-relaxed">
                  {payment.pay_address}
                </code>
                <div className="shrink-0 h-9 w-9 rounded-lg bg-background/80 border border-border/40 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Scan QR or tap to copy
              </p>
            </div>

            {/* Status note */}
            <div className="rounded-xl bg-success/5 border border-success/15 p-4 flex items-start gap-3">
              <Zap className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Auto-activation</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your Pro plan activates automatically within minutes after blockchain confirmation. Valid for 60 days.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              Reference: {payment.payment_id}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
