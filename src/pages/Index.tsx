import { Link } from "react-router-dom";
import {
  BarChart3, Bell, Layout, Zap, Shield, Globe,
  ArrowRight, Check, ChevronDown, TrendingUp, TrendingDown,
  Cloud, Newspaper, LineChart, Gamepad2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/* ── Mock data for demo preview ── */
const MOCK_WIDGETS = [
  { label: "BTC", value: "$97,421", change: "+2.34%", positive: true },
  { label: "ETH", value: "$3,842", change: "-1.12%", positive: false },
  { label: "SOL", value: "$198", change: "+5.67%", positive: true },
  { label: "S&P 500", value: "5,421", change: "+0.45%", positive: true },
  { label: "Weather", value: "22°C", change: "Sunny", positive: true },
];

/* ── FAQ data ── */
const FAQ_DATA = [
  { q: "Is Dashooo free to use?", a: "Yes! The free plan includes 1 dashboard with up to 5 widgets, real-time data, and alerts. Upgrade to Pro for unlimited dashboards and advanced features." },
  { q: "What kind of data can I track?", a: "Currently we support crypto market data, news feeds, and sentiment indexes. Finance, weather, stocks, sports, and productivity widgets are coming soon." },
  { q: "Can I share my dashboard?", a: "Absolutely. Save any dashboard as a template and share it with a public link. Others can clone it into their own account with one click." },
  { q: "How fast is the data?", a: "Market data refreshes every 60 seconds and news every 5 minutes. All data is cached server-side for instant loading." },
  { q: "Is my data secure?", a: "Yes. All data is protected with Row Level Security. Your dashboards, alerts, and settings are completely private to your account." },
];

const CATEGORIES = [
  { icon: LineChart, label: "Crypto", active: true },
  { icon: BarChart3, label: "Finance", active: false },
  { icon: Newspaper, label: "News", active: true },
  { icon: Cloud, label: "Weather", active: false },
  { icon: TrendingUp, label: "Stocks", active: false },
  { icon: Gamepad2, label: "Sports", active: false },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
};

const Index = () => {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-foreground tracking-tight">
            Dash<span className="text-primary">ooo</span>
          </Link>
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <Link to="/dashboard">
                <Button size="sm" className="gap-1.5">Dashboard <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="gap-1.5">Start Free <ArrowRight className="h-3.5 w-3.5" /></Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(263,70%,66%,0.12),transparent_60%)]" />
          <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto">
              Your Data. Your Layout.{" "}
              <span className="text-primary">Your Control.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Build fully customizable dashboards with real-time widgets — crypto, finance, news, weather, and more. All in one place.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="gap-2 text-base px-8">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="text-base px-8">Learn More</Button>
              </a>
            </div>

            {/* Category chips */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((c) => (
                <div
                  key={c.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    c.active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/50 bg-secondary/30 text-muted-foreground"
                  }`}
                >
                  <c.icon className="h-3.5 w-3.5" />
                  {c.label}
                  {!c.active && <span className="text-[10px] opacity-60">Soon</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Demo Preview ── */}
        <section className="max-w-5xl mx-auto px-4 pb-20" aria-label="Dashboard preview">
          <div className="glass-card p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {MOCK_WIDGETS.map((w) => (
                <div key={w.label} className="rounded-lg bg-secondary/40 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{w.label}</span>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${w.positive ? "text-success" : "text-destructive"}`}>
                      {w.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {w.change}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{w.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground mb-1">Market Sentiment</p>
                <p className="text-3xl font-bold text-success">72</p>
                <p className="text-xs text-success font-medium">Greed</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-4 space-y-2">
                <p className="text-xs text-muted-foreground">Latest News</p>
                <p className="text-sm text-foreground line-clamp-1">Bitcoin breaks $97K as institutional buying surges</p>
                <p className="text-sm text-foreground line-clamp-1">Global markets rally on positive economic data</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Everything You Need</h2>
          <p className="mt-3 text-muted-foreground text-center max-w-lg mx-auto">
            Professional-grade tools, zero complexity.
          </p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Layout, title: "Custom Dashboards", desc: "Drag-and-drop widgets. Resize, rearrange, save — your layout, your way." },
              { icon: Bell, title: "Smart Alerts", desc: "Set triggers on any data point. Get notified the instant your conditions are met." },
              { icon: BarChart3, title: "Real-Time Data", desc: "Live data from multiple sources, refreshing automatically every minute." },
              { icon: Zap, title: "Instant Templates", desc: "Clone community dashboards in one click. Share yours with the world." },
              { icon: Globe, title: "Multi-Category Widgets", desc: "Crypto, finance, news, weather, stocks — and more coming soon." },
              { icon: Shield, title: "Secure by Default", desc: "Row-level security, encrypted auth, zero data exposure. Your data stays yours." },
            ].map((f) => (
              <div key={f.title} className="glass-card p-6 space-y-3 hover:border-primary/30 transition-colors">
                <div className="p-2.5 rounded-lg bg-primary/10 w-fit">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it Works ── */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">How It Works</h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign Up Free", desc: "Create your account in seconds. No credit card required." },
              { step: "2", title: "Build Your Board", desc: "Add widgets from any category, drag to arrange, resize to fit." },
              { step: "3", title: "Stay Informed", desc: "Set alerts, track data in real time, share with friends." },
            ].map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{s.step}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Use Cases ── */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Built For</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {[
              { title: "Traders & Investors", desc: "Quick price snapshots, alerts on breakout levels, multi-asset tracking for fast decisions." },
              { title: "Data Enthusiasts", desc: "Combine widgets from multiple categories into one unified view. Your data, your rules." },
              { title: "Teams & Creators", desc: "Share dashboard templates with your team or community. Collaborate visually." },
            ].map((u) => (
              <div key={u.title} className="glass-card p-6 space-y-2">
                <h3 className="text-base font-semibold text-foreground">{u.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Simple Pricing</h2>
          <p className="mt-3 text-muted-foreground text-center">Start free, upgrade when you need more.</p>
          <div className="mt-10 grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="glass-card p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Free</h3>
                <p className="text-3xl font-bold text-foreground mt-1">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <ul className="space-y-2">
                {["1 dashboard", "5 widgets", "Smart alerts", "Real-time data", "Community templates"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            <div className="glass-card p-6 space-y-5 border-primary/40 relative">
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Pro</h3>
                <p className="text-3xl font-bold text-foreground mt-1">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <ul className="space-y-2">
                {["Unlimited dashboards", "Unlimited widgets", "Advanced alerts", "Priority data refresh", "Share & export", "All widget categories"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block">
                <Button className="w-full">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-2xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">FAQ</h2>
          <div className="mt-10">
            {FAQ_DATA.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="glass-card p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(263,70%,66%,0.08),transparent_70%)]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Ready to take control?</h2>
              <p className="mt-3 text-muted-foreground">Build your perfect dashboard today — free forever.</p>
              <Link to="/signup" className="inline-block mt-6">
                <Button size="lg" className="gap-2 text-base px-10">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 bg-background">
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
          <div>
            <p className="text-lg font-bold text-foreground">Dash<span className="text-primary">ooo</span></p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Your data. Your layout. Your control. Build customizable dashboards for everything.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Product</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><Link to="/templates" className="hover:text-foreground transition-colors">Templates</Link></li>
              <li><Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Legal</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 py-4">
          <p className="text-center text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Dashooo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
