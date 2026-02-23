import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Bell, Settings, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Board", to: "/dashboard" },
  { icon: Layers, label: "Templates", to: "/templates" },
  { icon: Bell, label: "Alerts", to: "/alerts" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const ITEM_COUNT = NAV_ITEMS.length;
const BAR_W = 400;
const BAR_H = 68;
const DIP_RADIUS = 34;
const DIP_DEPTH = 14;

/** Build SVG path with a concave dip centered at `cx` */
function buildBarPath(cx: number): string {
  const r = DIP_RADIUS;
  const d = DIP_DEPTH;
  const y0 = 14; // top edge y
  const left = cx - r;
  const right = cx + r;
  const rx = 20;

  return [
    `M 0 ${y0 + rx}`,
    `Q 0 ${y0} ${rx} ${y0}`,
    `L ${left} ${y0}`,
    `C ${left + 10} ${y0} ${left + 14} ${y0 + d} ${cx} ${y0 + d}`,
    `C ${right - 14} ${y0 + d} ${right - 10} ${y0} ${right} ${y0}`,
    `L ${BAR_W - rx} ${y0}`,
    `Q ${BAR_W} ${y0} ${BAR_W} ${y0 + rx}`,
    `L ${BAR_W} ${BAR_H}`,
    `L 0 ${BAR_H}`,
    `Z`,
  ].join(" ");
}

function getCenterX(index: number): number {
  const slotW = BAR_W / ITEM_COUNT;
  return slotW * index + slotW / 2;
}

const MobileBottomNav = () => {
  const location = useLocation();
  const activeIndex = NAV_ITEMS.findIndex((item) => location.pathname === item.to);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  const [currentPath, setCurrentPath] = useState(buildBarPath(getCenterX(safeIndex)));

  useEffect(() => {
    setCurrentPath(buildBarPath(getCenterX(safeIndex)));
  }, [safeIndex]);

  const activeCx = getCenterX(safeIndex);

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {/* SVG curved background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${BAR_W} ${BAR_H}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d={currentPath}
          fill="hsl(228 30% 10%)"
          initial={false}
          animate={{ d: currentPath }}
          transition={{ type: "spring", stiffness: 350, damping: 35, mass: 0.8 }}
        />
      </svg>

      {/* Floating active circle – positioned above the dip */}
      <motion.div
        className="absolute z-10 flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          top: 2,
        }}
        initial={false}
        animate={{
          left: `calc(${(safeIndex / ITEM_COUNT) * 100}% + ${100 / ITEM_COUNT / 2}% - 22px)`,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 35, mass: 0.8 }}
      >
        <div className="w-[42px] h-[42px] rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-[36px] h-[36px] rounded-full bg-primary/80 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {NAV_ITEMS.map(
                (item, i) =>
                  i === safeIndex && (
                    <motion.div
                      key={item.to}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon className="h-5 w-5 text-primary-foreground" />
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Nav items row */}
      <div className="relative z-20 flex items-end justify-around h-full px-2 pb-1">
        {NAV_ITEMS.map((item, index) => {
          const active = index === safeIndex;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-end gap-0.5 min-w-[56px] pt-2 pb-1 transition-all duration-200",
                active ? "pointer-events-none" : ""
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* Icon – hidden when active (shown in floating circle instead) */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 transition-all duration-200",
                  active ? "opacity-0" : "opacity-60"
                )}
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span
                className={cn(
                  "text-[10px] leading-tight transition-all duration-200",
                  active
                    ? "font-semibold text-primary opacity-100"
                    : "font-medium text-muted-foreground opacity-50"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
