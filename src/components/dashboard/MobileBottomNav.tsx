import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Bell, Settings, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Board", to: "/dashboard" },
  { icon: Layers, label: "Templates", to: "/templates" },
  { icon: Bell, label: "Alerts", to: "/alerts" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const ITEM_COUNT = NAV_ITEMS.length;

const MobileBottomNav = () => {
  const location = useLocation();
  const activeIndex = NAV_ITEMS.findIndex((item) => location.pathname === item.to);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;


  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {/* Liquid glass background */}
      <div className="liquid-glass-bg" />

      {/* Animated active pill */}
      <motion.div
        className="absolute z-10"
        style={{ top: 8, height: 40, width: `${100 / ITEM_COUNT}%` }}
        initial={false}
        animate={{ left: `${(safeIndex / ITEM_COUNT) * 100}%` }}
        transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.7 }}
      >
        <div className="mx-auto w-12 h-full rounded-2xl bg-primary/15 backdrop-blur-sm border border-primary/20 shadow-[0_0_16px_-4px_hsla(var(--primary)/0.4)]" />
      </motion.div>

      {/* Nav items row */}
      <div className="relative z-20 flex items-center justify-around h-full px-2">
        {NAV_ITEMS.map((item, index) => {
          const active = index === safeIndex;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 transition-all duration-200",
                active ? "pointer-events-none" : ""
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <motion.div
                className="flex items-center justify-center w-8 h-8"
                initial={false}
                animate={{
                  scale: active ? 1.15 : 1,
                  y: active ? -2 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground/60"
                )} />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] leading-tight transition-all duration-200",
                  active
                    ? "font-semibold text-primary"
                    : "font-medium text-muted-foreground/50"
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
