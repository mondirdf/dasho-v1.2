import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import logoDasho from "@/assets/logo-dasho.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 relative">
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="glass-card-enhanced w-full max-w-md p-5 sm:p-8 space-y-5 relative z-10">
        <div className="flex justify-center">
          <img src={logoDasho} alt="Dasho" className="h-12 sm:h-14 object-contain" />
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a password reset link to <strong className="text-foreground">{email}</strong>. Click the link to set a new password.
            </p>
            <Link to="/login">
              <Button variant="outline" className="gap-2 mt-4">
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Reset Password
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
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

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button type="submit" className="w-full glow-button h-10 sm:h-11" disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>

            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline gap-1 inline-flex items-center">
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
