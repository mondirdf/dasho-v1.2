import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/site";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center gap-3">
      <Link to="/">
        <Button variant="ghost" size="icon" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
    </header>

    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
      <h2 className="text-xl font-bold text-foreground">Privacy Policy</h2>
      <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">1. Information We Collect</h3>
        <p>When you create an account on {BRAND.name}, we collect your email address and any display name you choose to provide. We also collect usage data such as dashboard configurations, widget preferences, and alert settings to provide and improve our service.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">2. How We Use Your Information</h3>
        <p>We use your information to provide, maintain, and improve {BRAND.name}'s services. This includes delivering real-time market data, managing your dashboards and alerts, and sending service-related communications.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">3. Data Security</h3>
        <p>We implement Row-Level Security (RLS) policies to ensure your data is only accessible to you. All authentication is handled through encrypted channels, and we never store passwords in plain text.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">4. Data Retention</h3>
        <p>We retain your account data for as long as your account is active. You can request deletion of your account and associated data at any time through the Settings page.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">5. Third-Party Services</h3>
        <p>We use third-party APIs to provide market data (CoinGecko, news APIs). These services may have their own privacy policies. We do not share your personal information with these providers.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">6. Contact</h3>
        <p>For any privacy-related questions, please contact us at support@dasho.app.</p>
      </section>
    </main>
  </div>
);

export default Privacy;
