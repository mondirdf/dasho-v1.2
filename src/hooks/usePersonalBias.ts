/**
 * usePersonalBias — React hook that computes personalized market bias
 * based on the user's active dashboard widgets and their engine outputs.
 */
import { useMemo } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { useOHLCData } from "@/hooks/useOHLCData";
import { analyzeMarketStructure } from "@/engines/marketStructureEngine";
import { analyzeVolatilityRegime } from "@/engines/volatilityRegimeEngine";
import { analyzeConfluence } from "@/engines/mtfConfluenceEngine";
import { analyzeSession } from "@/engines/sessionEngine";
import {
  computePersonalBias,
  type EngineOutputs,
  type PersonalBiasResult,
} from "@/engines/personalBiasEngine";

const ENGINE_WIDGETS = [
  "structure_scanner",
  "volatility_regime",
  "mtf_confluence",
  "session_monitor",
  "correlation_matrix",
];

export function usePersonalBias(): PersonalBiasResult | null {
  const { widgets } = useDashboard();

  const activeTypes = useMemo(
    () => widgets.map((w) => w.type),
    [widgets],
  );

  const hasEngineWidget = useMemo(
    () => activeTypes.some((t) => ENGINE_WIDGETS.includes(t)),
    [activeTypes],
  );

  // Fetch OHLC data for structure/volatility (BTC 1h as default baseline)
  const ohlcParams = useMemo(
    () => ({ symbol: "BTC", timeframe: "1h" }),
    [],
  );
  const { data: candles = [] } = useOHLCData(ohlcParams, hasEngineWidget);

  const bias = useMemo(() => {
    if (!hasEngineWidget) return null;

    const outputs: EngineOutputs = {};

    // Only compute engines for active widgets
    if (activeTypes.includes("structure_scanner") && candles.length > 0) {
      outputs.structure = analyzeMarketStructure(candles, 3);
    }

    if (activeTypes.includes("volatility_regime") && candles.length > 0) {
      outputs.volatility = analyzeVolatilityRegime(candles);
    }

    if (activeTypes.includes("mtf_confluence") && candles.length > 0) {
      // Use same candles for single-TF approximation
      const tfMap = new Map([["1h", candles]]);
      outputs.confluence = analyzeConfluence(tfMap, ["1h"]);
    }

    if (activeTypes.includes("session_monitor")) {
      outputs.session = analyzeSession();
    }

    // Correlation risk: not computed here — would require multi-asset data.
    // Leave undefined so engine handles the missing case gracefully.

    return computePersonalBias(activeTypes, outputs);
  }, [activeTypes, candles, hasEngineWidget]);

  return bias;
}
