/**
 * PersonalBiasPanel — sticky panel showing the user's personalized market bias.
 * Only renders when at least one engine-related widget is active.
 */
import { usePersonalBias } from "@/hooks/usePersonalBias";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { BiasLabel, RiskLevel } from "@/engines/personalBiasEngine";

const biasConfig: Record<BiasLabel, { color: string; icon: typeof TrendingUp }> = {
  "Strong Bullish": { color: "text-success", icon: TrendingUp },
  Bullish: { color: "text-success", icon: TrendingUp },
  Neutral: { color: "text-muted-foreground", icon: Minus },
  Bearish: { color: "text-destructive", icon: TrendingDown },
  "Strong Bearish": { color: "text-destructive", icon: TrendingDown },
};

const riskConfig: Record<RiskLevel, { color: string; icon: typeof ShieldCheck }> = {
  Low: { color: "text-success", icon: ShieldCheck },
  Moderate: { color: "text-warning", icon: ShieldAlert },
  High: { color: "text-destructive", icon: ShieldAlert },
  Elevated: { color: "text-warning", icon: ShieldAlert },
};

const PersonalBiasPanel = () => {
  const bias = usePersonalBias();

  if (!bias) return null;

  const { biasLabel, confidence, riskLevel, contributingEngines, missingEngines } = bias;
  const bCfg = biasConfig[biasLabel];
  const rCfg = riskConfig[riskLevel];
  const BiasIcon = bCfg.icon;
  const RiskIcon = rCfg.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="sticky top-[53px] z-10 mx-3 sm:mx-6 mt-2 mb-1">
        <div className="glass-card px-3 sm:px-4 py-2.5 flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* Bias label */}
          <div className="flex items-center gap-1.5 shrink-0">
            <BiasIcon className={`h-4 w-4 ${bCfg.color}`} />
            <span className={`text-sm font-semibold ${bCfg.color}`}>
              {biasLabel}
            </span>
          </div>

          {/* Confidence bar */}
          <div className="flex items-center gap-2 flex-1 min-w-[120px] max-w-[200px]">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              Confidence
            </span>
            <Progress value={confidence} className="h-1.5 flex-1" />
            <span className="text-[11px] font-medium text-foreground tabular-nums-animate">
              {confidence}%
            </span>
          </div>

          {/* Risk badge */}
          <Badge
            variant="outline"
            className={`gap-1 text-[11px] shrink-0 ${rCfg.color} border-current/30`}
          >
            <RiskIcon className="h-3 w-3" />
            {riskLevel}
          </Badge>

          {/* Info tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[260px] text-xs space-y-1.5">
              <p className="font-medium text-foreground">Contributing Engines</p>
              {contributingEngines.length > 0 ? (
                <ul className="list-disc pl-3 text-muted-foreground">
                  {contributingEngines.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">None active</p>
              )}
              {missingEngines.length > 0 && (
                <>
                  <p className="font-medium text-foreground pt-1">Missing</p>
                  <ul className="list-disc pl-3 text-muted-foreground">
                    {missingEngines.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PersonalBiasPanel;
