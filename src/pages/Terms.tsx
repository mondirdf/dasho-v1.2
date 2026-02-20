import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/site";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center gap-3">
      <Link to="/">
        <Button variant="ghost" size="icon" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <h1 className="text-lg font-bold text-foreground">Terms of Service</h1>
    </header>

    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
      <h2 className="text-xl font-bold text-foreground">Terms of Service</h2>
      <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h3>
        <p>By accessing or using {BRAND.name}, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">2. Service Description</h3>
        <p>{BRAND.name} provides a market intelligence dashboard with real-time data, customizable widgets, price alerts, and AI-powered market recaps. The service is provided "as is" without warranties of any kind.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">3. User Accounts</h3>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating an account and must not share your account with others.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">4. Acceptable Use</h3>
        <p>You agree not to misuse the service, including attempting to access data of other users, overloading the system with excessive requests, or using the service for any illegal purpose.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">5. Market Data Disclaimer</h3>
        <p>Market data provided by {BRAND.name} is for informational purposes only and should not be considered financial advice. Data may be delayed or inaccurate. Always do your own research before making investment decisions.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">6. Limitation of Liability</h3>
        <p>{BRAND.name} is not liable for any losses or damages arising from the use of our service, including but not limited to financial losses from trading decisions based on data displayed on the platform.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">7. Termination</h3>
        <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through the Settings page.</p>
      </section>
    </main>
  </div>
);

export default Terms;
