import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { trackEvent } from "@/analytics/behaviorTracker";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import RenameDialog from "@/components/dashboard/RenameDialog";

import Onboarding from "@/pages/Onboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardContent = () => {
  const { loading, isNewUser } = useDashboard();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !isNewUser) {
      trackEvent("dashboard_open");
    }
  }, [loading, isNewUser]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <Skeleton className="h-14 w-full mb-4 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isNewUser) {
    return <Onboarding />;
  }

  return (
    <div className={`min-h-screen ${isMobile ? "pb-24" : ""}`}>
      
      <DashboardHeader />
      <DashboardGrid />
      {isMobile && <MobileBottomNav />}
      <RenameDialog />
    </div>
  );
};

const Dashboard = () => (
  <DashboardProvider>
    <DashboardContent />
  </DashboardProvider>
);

export default Dashboard;