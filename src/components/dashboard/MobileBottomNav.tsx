import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Bell, Settings, Layers, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "Board", to: "/dashboard" },
    { icon: Layers, label: "Templates", to: "/templates" },
    { icon: Bell, label: "Alerts", to: "/alerts" },
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  const activeIndex = navItems.findIndex((item) => location.pathname === item.to);

  return (
    <div className="mobile-bottom-nav">
      {/* SVG blob background with active indicator */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="navClip">
            {activeIndex >= 0 ? (
              <path
                d={generateBlobPath(activeIndex, navItems.length)}
                className="transition-all duration-500 ease-in-out"
              />
            ) : (
              <rect x="0" y="0" width="400" height="80" rx="24" />
            )}
          </clipPath>
        </defs>
        <rect
          x="8"
          y="4"
          width="384"
          height="64"
          rx="20"
          className="fill-secondary"
          clipPath="url(#navClip)"
        />
      </svg>

      {/* Nav items */}
      <div className="relative z-10 flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] px-3 py-2 rounded-2xl transition-all duration-300 ease-out",
                active
                  ? "text-primary-foreground scale-110"
                  : "text-muted-foreground active:scale-95"
              )}
              aria-label={item.label}
            >
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                active
                  ? "bg-primary shadow-[0_0_20px_4px_hsla(var(--primary)/0.4)]"
                  : "bg-transparent"
              )}>
                <item.icon
                  className={cn(
                    "transition-all duration-300",
                    active ? "h-5 w-5 text-primary-foreground" : "h-5 w-5 text-muted-foreground"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] leading-tight transition-all duration-300",
                  active
                    ? "font-bold text-foreground opacity-100 translate-y-0"
                    : "font-medium text-muted-foreground opacity-70"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

/** Generate a blob-shaped SVG path with a bump at the active item position */
function generateBlobPath(activeIndex: number, totalItems: number): string {
  // Simple rounded rect — the visual "blob" effect comes from the icon glow
  return `M 8 4 H 392 Q 400 4 400 24 V 48 Q 400 68 392 68 H 8 Q 0 68 0 48 V 24 Q 0 4 8 4 Z`;
}

export default MobileBottomNav;
