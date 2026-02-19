/**
 * useWidgetSize — provides responsive size mode for widgets.
 *
 * Measures the widget container and returns:
 * - mode: "compact" | "standard" | "expanded"
 * - width / height in pixels
 *
 * Widgets use this to adapt their content rendering.
 */
import { useState, useEffect, useRef, useCallback } from "react";

export type WidgetSizeMode = "compact" | "standard" | "expanded";

interface WidgetSize {
  mode: WidgetSizeMode;
  width: number;
  height: number;
}

const WIDTH_COMPACT = 240;
const WIDTH_EXPANDED = 480;

export function useWidgetSize(): [React.RefObject<HTMLDivElement>, WidgetSize] {
  const ref = useRef<HTMLDivElement>(null!);
  const [size, setSize] = useState<WidgetSize>({ mode: "standard", width: 320, height: 240 });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const mode: WidgetSizeMode =
      w < WIDTH_COMPACT ? "compact" :
      w >= WIDTH_EXPANDED ? "expanded" : "standard";
    setSize((prev) => {
      if (prev.mode === mode && prev.width === w && prev.height === h) return prev;
      return { mode, width: w, height: h };
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  return [ref, size];
}
