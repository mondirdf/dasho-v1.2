/**
 * UpgradeDialog — Shows Pro plan benefits + triggers crypto payment.
 * Displays USDT TRC20 payment address after calling create-payment edge function.
 */
import { useState, useCallback } from "react";
import { Crown, Copy, Check, Loader2, Wallet, ExternalLink } from "lucide-react";
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
  "4h & Weekly AI Recaps",
  "Unlimited widgets & dashboards",
  "Smart Alerts (BOS, ChoCH, MTF)",
  "Custom themes & layout profiles",
  "CSV exports & priority refresh",
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
      <DialogContent className="sm:max-w-md bg-card border-border/60">
        {!payment ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Crown className="h-5 w-5 text-primary" />
                Unlock Pro Market Intelligence
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                One-time payment — lifetime Pro access.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 py-2">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full glow-button gap-2"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                {loading ? "Creating payment…" : "Pay $15 with USDT (TRC20)"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground text-sm"
                onClick={() => handleClose(false)}
              >
                Continue with Free
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Wallet className="h-5 w-5 text-success" />
                Send USDT to activate Pro
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Send exactly the amount below to this TRC20 address.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Amount */}
              <div className="glass-card p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
                <p className="text-2xl font-bold text-foreground tabular-nums-animate">
                  {payment.pay_amount} <span className="text-sm text-muted-foreground">USDT</span>
                </p>
                <p className="text-[11px] text-muted-foreground">TRC20 Network</p>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Payment Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-secondary/60 rounded-lg px-3 py-2.5 text-foreground break-all font-mono border border-border/40">
                    {payment.pay_address}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0 h-10 w-10"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-1.5">
                <p className="text-xs text-foreground font-medium">⚡ After payment:</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your plan will upgrade to Pro automatically within a few minutes once the transaction is confirmed on the blockchain.
                </p>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                Payment ID: {payment.payment_id}
              </p>
            </div>
          </>
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
