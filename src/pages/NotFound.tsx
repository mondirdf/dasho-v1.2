import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card p-10 text-center space-y-4 max-w-md">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page <code className="text-xs bg-secondary/60 px-1.5 py-0.5 rounded">{location.pathname}</code> doesn't exist.
        </p>
        <Link to="/">
          <Button className="gap-1.5 mt-2">
            <Home className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
