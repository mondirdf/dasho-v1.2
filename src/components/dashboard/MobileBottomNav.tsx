import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AddWidgetSheet from "@/components/AddWidgetSheet";
import { LayoutGrid, Bell, Settings, LogOut, Plus } from "lucide-react";

const MobileBottomNav = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "Board", to: "/dashboard" },
    { icon: Bell, label: "Alerts", to: "/alerts" },
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  return (
    <div className="mobile-bottom-nav">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {/* Add widget shortcut */}
        <div className="flex flex-col items-center gap-0.5">
          <AddWidgetSheet variant="mobile" />
        </div>
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-muted-foreground transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
