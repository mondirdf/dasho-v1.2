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

const MobileBottomNav = () => {
  const location = useLocation();
  const activeIndex = NAV_ITEMS.findIndex((item) => location.pathname === item.to);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Main navigation"
    >
      <div className="relative flex items-center justify-around h-full px-4">
        {/* Sliding active indicator */}
        <motion.div
          className="absolute top-0 h-[2px] bg-primary rounded-full"
          style={{ width: `${100 / NAV_ITEMS.length - 8}%` }}
          initial={false}
          animate={{
            left: `${(safeIndex / NAV_ITEMS.length) * 100 + 4}%`,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />

        {NAV_ITEMS.map((item, index) => {
          const active = index === safeIndex;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] py-2"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground/60"
                )}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight transition-colors duration-150",
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
