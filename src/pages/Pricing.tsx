import { Link } from "react-router-dom";
import {
  Crown, Check, X, ArrowRight, Shield, Zap, BarChart3, Layout,
  Bell, FileDown, Sparkles, ChevronDown, TrendingUp, Cpu, Activity,
  BookOpen, Palette, RefreshCw, Layers, Target,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND, PRICING, FAQ } from "@/config/site";
import UpgradeDialog, { useUpgradeDialog } from "@/components/UpgradeDialog";
import logoDasho from "@/assets/logo-dasho.png";

/* ── Feature comparison matrix ───────────────────────────────── */
const COMPARISON = [
  { category: "Dashboards & Widgets", features: [
    { name: "Dashboards", free: "1", pro: "Unlimited" },
    { name: "Widgets per dashboard", free: "10", pro: "Unlimited" },
    { name: "Drag & drop layout", free: true, pro: true },
    { name: "Saved layout profiles", free: false, pro: true },
    { name: "Custom visual themes", free: false, pro: true },
  ]},
  { category: "Market Data", features: [
    { name: "Real-time crypto prices", free: true, pro: true },
    { name: "Fear & Greed Index", free: true, pro: true },
    { name: "Multi-asset tracker", free: true, pro: true },
    { name: "Stocks, Forex, Commodities", free: true, pro: true },
    { name: "Priority data refresh", free: false, pro: true },
  ]},
  { category: "AI & Analysis", features: [
    { name: "24h AI Market Recap", free: true, pro: true },
    { name: "4h & Weekly AI Recaps", free: false, pro: true },
    { name: "AI Daily Trading Brief", free: false, pro: true },
    { name: "Market Context widget", free: true, pro: true },
  ]},
  { category: "Pro Trading Tools", features: [
    { name: "Mini Backtester (5 strategies)", free: false, pro: true },
    { name: "Structure Scanner (BOS/ChoCH)", free: false, pro: true },
    { name: "MTF Confluence Engine", free: false, pro: true },
    { name: "Volatility Regime Detector", free: false, pro: true },
    { name: "Session Heatmap", free: false, pro: true },
    { name: "Correlation Matrix", free: false, pro: true },
  ]},
  { category: "Alerts & Export", features: [
    { name: "Price alerts", free: "Up to 10", pro: "Unlimited" },
    { name: "Smart alerts (multi-condition)", free: false, pro: true },
    { name: "CSV export", free: false, pro: true },
    { name: "Trading journal", free: false, pro: true },
  ]},
  { category: "Templates & Sharing", features: [
    { name: "Community templates", free: true, pro: true },
    { name: "Share dashboards", free: true, pro: true },
    { name: "Clone templates", free: true, pro: true },
  ]},
];

const PRO_HIGHLIGHTS = [
  { icon: Cpu, title: "Mini Backtester", desc: "Test 5 strategies against historical data instantly" },
  { icon: Activity, title: "Structure Scanner", desc: "Auto-detect BOS & ChoCH with real-time signals" },
  { icon: Layers, title: "MTF Confluence", desc: "Multi-timeframe trend alignment at a glance" },
  { icon: Target, title: "Volatility Regime", desc: "Know when to trade and when to sit out" },
  { icon: Sparkles, title: "AI Daily Brief", desc: "Personalized trading insights delivered daily" },
  { icon: RefreshCw, title: "Priority Refresh", desc: "Faster data updates for time-sensitive decisions" },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card px-5 py-0 mb-2 overflow-hidden transition-all">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left" aria-expanded={open}>
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-3 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-40 pb-4" : "max-h-0"}`}>
        <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

const CellValue = ({ value }: { value: boolean | string }) => {
  if (typeof value === "string") {
    return <span className="text-xs sm:text-sm font-medium text-foreground">{value}</span>;
  }
  return value
    ? <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success mx-auto" />
    : <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/30 mx-auto" />;
};

const Pricing = () => {
  const { open, setOpen, openUpgrade } = useUpgradeDialog();

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-nav border-b border-border/40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoDasho} alt={BRAND.name} className="h-20 sm:h-9" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-1.5 glow-button text-xs sm:text-sm">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_55%)]" />
          <div className="relative max-w-4xl mx-auto px-4 pt-12 sm:pt-20 pb-8 sm:pb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Simple, transparent pricing</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Start Free, <span className="text-primary">Go Pro</span> When Ready
            </h1>
            <p className="mt-4 sm:mt-5 text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              No subscriptions. One payment, full access. Pay with crypto — instant activation.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-3xl mx-auto px-3 sm:px-4 pb-12 sm:pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Free Plan */}
            <div className="glass-card-enhanced p-6 sm:p-8 space-y-6 relative">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground">{PRICING.free.name}</h3>
                <p className="text-4xl font-bold text-foreground mt-2">
                  {PRICING.free.price}
                  <span className="text-sm font-normal text-muted-foreground">{PRICING.free.period}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">No credit card required</p>
              </div>
              <ul className="relative z-10 space-y-3">
                {PRICING.free.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block relative z-10">
                <Button variant="outline" className="w-full h-12 text-sm border-border/60 hover:border-primary/40">
                  {PRICING.free.cta}
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="glass-card-enhanced p-6 sm:p-8 space-y-6 relative border-primary/50 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.2)]">
              <div className="absolute -top-3 left-6 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold z-20">
                {PRICING.pro.badge}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{PRICING.pro.name}</h3>
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <p className="text-4xl font-bold text-foreground mt-2">
                  {PRICING.pro.price}
                  <span className="text-sm font-normal text-muted-foreground">{PRICING.pro.period}</span>
                </p>
                <p className="text-xs text-primary/80 mt-1">{PRICING.pro.yearlyNote}</p>
              </div>
              <ul className="relative z-10 space-y-3">
                {PRICING.pro.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full h-12 text-sm font-semibold glow-button gap-2 relative z-10" onClick={openUpgrade}>
                <Zap className="h-4 w-4" />
                {PRICING.pro.cta}
              </Button>
              <div className="relative z-10 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <Shield className="h-3 w-3" /> Secure crypto payment · Instant activation
              </div>
            </div>
          </div>
        </section>

        {/* Pro Highlights */}
        <section className="max-w-5xl mx-auto px-3 sm:px-4 pb-12 sm:pb-20">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center">
            What You Unlock with <span className="text-primary">Pro</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground text-center">
            Professional trading tools that give you an edge
          </p>
          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {PRO_HIGHLIGHTS.map((h) => (
              <div key={h.title} className="glass-card-enhanced p-5 sm:p-6 space-y-3 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5">
                <div className="relative z-10 p-2.5 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/15 transition-colors">
                  <h.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="relative z-10 text-sm sm:text-base font-semibold text-foreground">{h.title}</h3>
                <p className="relative z-10 text-xs sm:text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="max-w-4xl mx-auto px-3 sm:px-4 pb-12 sm:pb-20">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center">
            Full Feature Comparison
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground text-center mb-8 sm:mb-12">
            See exactly what's included in each plan
          </p>

          <div className="glass-card-enhanced overflow-hidden relative">
            {/* Table header */}
            <div className="relative z-10 grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] bg-secondary/50 border-b border-border/30">
              <div className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-foreground">Feature</div>
              <div className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-foreground text-center">Free</div>
              <div className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-primary text-center flex items-center justify-center gap-1">
                <Crown className="h-3.5 w-3.5" /> Pro
              </div>
            </div>

            {/* Table body */}
            <div className="relative z-10">
              {COMPARISON.map((section) => (
                <div key={section.category}>
                  {/* Category header */}
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary/30 border-b border-border/20">
                    <span className="text-xs sm:text-sm font-semibold text-foreground/80">{section.category}</span>
                  </div>
                  {/* Features */}
                  {section.features.map((f, i) => (
                    <div
                      key={f.name}
                      className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] items-center ${
                        i < section.features.length - 1 ? "border-b border-border/10" : "border-b border-border/20"
                      } hover:bg-secondary/20 transition-colors`}
                    >
                      <div className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">{f.name}</div>
                      <div className="p-3 sm:p-4 text-center"><CellValue value={f.free} /></div>
                      <div className="p-3 sm:p-4 text-center"><CellValue value={f.pro} /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-3 sm:px-4 pb-12 sm:pb-20">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center mb-6 sm:mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-0">
            {FAQ.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-3xl mx-auto px-3 sm:px-4 pb-12 sm:pb-20">
          <div className="glass-card-enhanced p-6 sm:p-12 relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%)]" />
            <div className="relative z-10 space-y-4">
              <h2 className="text-xl sm:text-3xl font-bold text-foreground">Ready to trade smarter?</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Join thousands of traders using Dasho to stay ahead of the market.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 glow-button px-8">
                    Start Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:bg-primary/5" onClick={openUpgrade}>
                  <Crown className="h-4 w-4 text-primary" /> Upgrade to Pro
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {BRAND.year} {BRAND.name}. All rights reserved. ·{" "}
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link> ·{" "}
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </p>
        </footer>
      </main>

      <UpgradeDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default Pricing;
