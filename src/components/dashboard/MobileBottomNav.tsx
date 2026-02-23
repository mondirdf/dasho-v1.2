import { Link, useLocation } from "react-router-dom";
import AddWidgetSheet from "@/components/AddWidgetSheet";
import { LayoutGrid, Bell, Settings, Layers } from "lucide-react";

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "Board", to: "/dashboard" },
    { icon: Layers, label: "Templates", to: "/templates" },
    { icon: Bell, label: "Alerts", to: "/alerts" },
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  return (
    <div className="mobile-bottom-nav">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] px-2 py-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground active:text-foreground active:bg-secondary/50"
              }`}
              aria-label={item.label}
            >
              <item.icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
              <span className={`text-[10px] leading-tight ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
            </Link>
          );
        })}
        <div className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px]">
          <AddWidgetSheet variant="mobile" />
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
