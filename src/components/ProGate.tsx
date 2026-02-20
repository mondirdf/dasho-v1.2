/**
 * ProGate — Soft-lock overlay for Pro-only features.
 *
 * Wraps any content with a subtle blur + upgrade prompt.
 * Does NOT remove content — keeps it visible but gated.
 */
import { memo, useState } from "react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface ProGateProps {
  /** Feature name shown in upgrade prompt */
  feature?: string;
  /** If true, always show gate (for testing) */
  forceGate?: boolean;
  children: React.ReactNode;
}

const ProGate = memo(({ feature, forceGate, children }: ProGateProps) => {
  const { isPro } = usePlanLimits();
  const [modalOpen, setModalOpen] = useState(false);

  if (isPro && !forceGate) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative group">
        {/* Content — visible but blurred */}
        <div className="pointer-events-none select-none blur-[2px] opacity-60 transition-all">
          {children}
        </div>

        {/* Overlay */}
        <button
          onClick={() => setModalOpen(true)}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/30 backdrop-blur-[1px] rounded-[inherit] cursor-pointer transition-all hover:bg-background/40"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">PRO</span>
          </div>
          {feature && (
            <p className="text-[11px] text-muted-foreground text-center px-4 max-w-[200px]">
              Upgrade to unlock {feature}
            </p>
          )}
        </button>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Crown className="h-5 w-5 text-primary" />
              Unlock Pro Market Intelligence
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Get faster AI recaps, advanced alerts, and deeper market control.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {[
              "4h & Weekly AI Recaps",
              "Faster recap refresh",
              "Unlimited widgets",
              "Advanced alerts",
              "Priority data refresh",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button className="w-full glow-button gap-2" onClick={() => setModalOpen(false)}>
              <Crown className="h-4 w-4" />
              Upgrade Now — $5/mo
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground text-sm"
              onClick={() => setModalOpen(false)}
            >
              Continue with Free
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ProGate.displayName = "ProGate";
export default ProGate;

/**
 * ProBadge — Small badge for Pro features in catalogs/lists.
 */
export const ProBadge = memo(() => (
  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full">
    <Crown className="h-2.5 w-2.5" /> PRO
  </span>
));
ProBadge.displayName = "ProBadge";
