/**
 * UpgradeDialog — Premium upgrade flow with crypto payment.
 */
import { useState, useCallback } from "react";
import {
  Crown, Copy, Check, Loader2, Wallet, Zap, Shield, BarChart3,
  Layout, Bell, FileDown, Sparkles
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/analytics/behaviorTracker";

interface PaymentInfo {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
}

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRO_FEATURES = [
  { icon: BarChart3, label: "4h & Weekly AI Recaps", desc: "Stay ahead of every move" },
  { icon: Layout, label: "Unlimited widgets & dashboards", desc: "Build your perfect setup" },
  { icon: Bell, label: "Smart Alerts (BOS, ChoCH, MTF)", desc: "Never miss a breakout" },
  { icon: Sparkles, label: "Custom themes & layout profiles", desc: "Make it truly yours" },
  { icon: FileDown, label: "CSV exports & priority refresh", desc: "Faster data, anywhere" },
];

const UpgradeDialog = ({ open, onOpenChange }: UpgradeDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const handleUpgrade = useCallback(async () => {
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
      toast({
        title: "Payment error",
        description: e.message || "Failed to create payment. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const copyAddress = useCallback(() => {
    if (!payment) return;
    navigator.clipboard.writeText(payment.pay_address);
    setCopied(true);
    toast({ title: "Address copied!" });
    setTimeout(() => setCopied(false), 2000);
  }, [payment, toast]);

  const handleClose = (open: boolean) => {
    if (!open) {
      setPayment(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border/60 p-0 overflow-hidden">
        {!payment ? (
          <div className="flex flex-col">
            {/* Hero Banner */}
            <div className="relative px-6 pt-7 pb-5 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.15),transparent_60%)]" />
              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <DialogTitle className="text-foreground text-lg">
                      Upgrade to Pro
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                      One-time payment · Lifetime access
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Price badge */}
              <div className="relative z-10 mt-3 inline-flex items-baseline gap-1.5 bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2">
                <span className="text-3xl font-bold text-foreground tabular-nums">$15</span>
                <span className="text-sm text-muted-foreground">USDT</span>
                <span className="ml-2 text-[10px] text-muted-foreground bg-secondary/80 rounded-md px-1.5 py-0.5">
                  one-time
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="px-6 py-5 space-y-3">
              {PRO_FEATURES.map((f) => (
                <div key={f.label} className="flex items-start gap-3 group">
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                    <span className="text-[11px] text-muted-foreground">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 space-y-2.5">
              <Button
                className="w-full h-12 text-base font-semibold glow-button gap-2.5"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
                {loading ? "Creating payment…" : "Unlock Pro Now"}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <Shield className="h-3 w-3" />
                Secure crypto payment · Instant activation
              </div>

              <button
                className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
                onClick={() => handleClose(false)}
              >
                Maybe later
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-success/15 border border-success/25 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-success" />
                </div>
                <div>
                  <DialogTitle className="text-foreground text-base">
                    Complete Payment
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs">
                    Send the exact amount below
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Amount Card */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Send exactly</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {payment.pay_amount} <span className="text-sm font-normal text-muted-foreground">USDT</span>
              </p>
              <p className="text-[11px] text-primary/80 font-medium">TRC20 Network</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white rounded-xl p-3">
                <QRCodeSVG
                  value={payment.pay_address}
                  size={140}
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
                  Your Pro plan activates automatically within minutes after blockchain confirmation.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              Reference: {payment.payment_id}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;

/**
 * useUpgradeDialog — simple hook to control the upgrade dialog from anywhere.
 */
export function useUpgradeDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, openUpgrade: () => setOpen(true) };
}
