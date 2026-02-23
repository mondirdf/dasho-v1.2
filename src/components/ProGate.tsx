/**
 * ProGate — Soft-lock overlay for Pro-only features.
 *
 * Wraps any content with a subtle blur + upgrade prompt.
 * Does NOT remove content — keeps it visible but gated.
 */
import { memo, useState } from "react";
import { Crown } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeDialog from "@/components/UpgradeDialog";

interface ProGateProps {
  feature?: string;
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
        <div className="pointer-events-none select-none blur-[2px] opacity-60 transition-all">
          {children}
        </div>

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

      <UpgradeDialog open={modalOpen} onOpenChange={setModalOpen} />
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
