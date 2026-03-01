import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Bell, Settings, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Board", to: "/dashboard" },
  { icon: Layers, label: "Templates", to: "/templates" },
  { icon: Bell, label: "Alerts", to: "/alerts" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const activeIndex = NAV_ITEMS.findIndex((item) => location.pathname === item.to);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      <div className="relative z-10 flex items-center justify-around h-full px-4">
        {NAV_ITEMS.map((item, index) => {
          const active = index === safeIndex;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 min-w-[56px] py-2"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <motion.div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                animate={{
                  backgroundColor: active ? "rgba(124, 92, 255, 0.12)" : "rgba(0,0,0,0)",
                }}
                transition={{ duration: 0.2 }}
              >
                <item.icon
                  className="h-[20px] w-[20px] transition-colors duration-200"
                  style={{
                    color: active ? "#7C5CFF" : "hsl(var(--muted-foreground))",
                    opacity: active ? 1 : 0.6,
                    filter: active ? "drop-shadow(0 0 6px rgba(124, 92, 255, 0.4))" : "none",
                  }}
                />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  active
                    ? "font-semibold"
                    : "font-medium opacity-50"
                )}
                style={{ color: active ? "#7C5CFF" : "hsl(var(--muted-foreground))" }}
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
