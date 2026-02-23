import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/analytics/behaviorTracker";
import { useAuth } from "@/contexts/AuthContext";
import { useDefaultTheme } from "@/hooks/useDefaultTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoDasho from "@/assets/logo-dasho.png";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  useDefaultTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      trackEvent("login");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 sm:py-0 relative">
      {/* Animated background orbs */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="glass-card-enhanced w-full max-w-md p-5 sm:p-8 space-y-5 sm:space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logoDasho} alt="Dasho" className="h-12 sm:h-14 object-contain" />
        </div>

        <div className="text-center space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in to your Dasho account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input h-10 sm:h-11 text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="glass-input h-10 sm:h-11 text-sm"
            />
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full glow-button h-10 sm:h-11 text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <div className="text-center space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
          <Link to="/forgot-password" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
