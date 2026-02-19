/**
 * Trial reminder banner — shows contextual upgrade prompts.
 * Appears on days 10, 12, 14 of trial (4, 2, 0 days remaining) and after expiry.
 */
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { Clock, Zap, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const TrialBanner = () => {
  const { showReminder, daysRemaining, urgency, isTrialExpired, isTrialActive, isPaidPro, loading } = useTrialStatus();
  const [dismissed, setDismissed] = useState(false);

  if (loading || isPaidPro || !showReminder || dismissed) return null;

  const config = isTrialExpired
    ? {
        icon: AlertTriangle,
        message: "انتهت فترتك التجريبية. ترقَّ الآن للحفاظ على جميع الميزات المتقدمة.",
        cta: "ترقية الآن",
        bg: "bg-destructive/10 border-destructive/30",
        iconColor: "text-destructive",
        ctaClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
      }
    : daysRemaining <= 1
    ? {
        icon: AlertTriangle,
        message: "آخر يوم في التجربة المجانية! لوحاتك ستبقى لكن بسرعة تحديث أقل.",
        cta: "ترقية الآن",
        bg: "bg-destructive/10 border-destructive/30",
        iconColor: "text-destructive",
        ctaClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
      }
    : daysRemaining <= 2
    ? {
        icon: Clock,
        message: `باقي ${daysRemaining} يوم على نهاية تجربتك المجانية.`,
        cta: "احتفظ بالميزات",
        bg: "bg-warning/10 border-warning/30",
        iconColor: "text-warning",
        ctaClass: "bg-warning hover:bg-warning/90 text-warning-foreground",
      }
    : {
        icon: Zap,
        message: `باقي ${daysRemaining} أيام على نهاية تجربتك المجانية. استمتع بجميع ميزات Pro!`,
        cta: "ترقية مبكرة",
        bg: "bg-primary/10 border-primary/30",
        iconColor: "text-primary",
        ctaClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
      };

  const Icon = config.icon;

  return (
    <div className={`relative flex items-center justify-center gap-3 px-4 py-2.5 border-b text-sm ${config.bg} animate-fade-in`}>
      <Icon className={`h-4 w-4 shrink-0 ${config.iconColor}`} />
      <span className="text-foreground/90">{config.message}</span>
      <Button size="sm" className={`h-7 px-3 text-xs font-medium ${config.ctaClass}`}>
        {config.cta}
      </Button>
      {!isTrialExpired && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default TrialBanner;
