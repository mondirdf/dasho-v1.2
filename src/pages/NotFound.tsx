import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { NOT_FOUND } from "@/config/site";

const NotFound = () => {
  const location = useLocation();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden bg-background">
      {/* Animated gradient orbs */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-[2000ms] ease-out"
        style={{
          background: `
            radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, hsla(263, 70%, 60%, 0.08), transparent 60%),
            radial-gradient(400px circle at 20% 80%, hsla(220, 70%, 55%, 0.06), transparent 50%),
            radial-gradient(500px circle at 80% 20%, hsla(263, 70%, 60%, 0.04), transparent 50%)
          `,
        }}
      />

      {/* Floating 404 background text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
        <span
          className="text-[20rem] sm:text-[28rem] font-black tracking-tighter leading-none"
          style={{
            color: "hsla(228, 28%, 14%, 0.5)",
            WebkitTextStroke: "1px hsla(228, 18%, 20%, 0.3)",
          }}
        >
          404
        </span>
      </div>

      {/* Main card */}
      <div className="glass-card relative z-10 p-8 sm:p-12 text-center space-y-6 max-w-lg w-full animate-slide-up">
        {/* Glowing icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Search className="h-9 w-9 text-primary animate-pulse-glow" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            {NOT_FOUND.heading}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {NOT_FOUND.description}
            <br />
            <code className="mt-1 inline-block text-xs bg-secondary/60 px-2 py-0.5 rounded-md text-foreground/70">
              {location.pathname}
            </code>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to="/dashboard">
            <Button className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" /> {NOT_FOUND.dashboardButton}
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" /> {NOT_FOUND.backButton}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
