import { Skeleton } from "@/components/ui/skeleton";

const WidgetSkeleton = () => (
  <div className="glass-card h-full p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-16 rounded-md" />
    </div>
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-10 w-full" />
    <div className="flex justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-12" />
    </div>
  </div>
);

export default WidgetSkeleton;
