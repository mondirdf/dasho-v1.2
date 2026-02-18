import { Link } from "react-router-dom";
import {
  BarChart3, Bell, Layout, Zap, Shield, Globe,
  ArrowRight, Check, ChevronDown, TrendingUp, TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/* ── Mock data for demo preview ── */
const MOCK_COINS = [
  { symbol: "BTC", price: 97421, change: 2.34 },
  { symbol: "ETH", price: 3842, change: -1.12 },
  { symbol: "SOL", price: 198, change: 5.67 },
  { symbol: "ADA", price: 0.72, change: 0.89 },
  { symbol: "DOGE", price: 0.187, change: -3.21 },
];

/* ── FAQ data ── */
const FAQ_DATA = [
  { q: "Is PulseBoard free to use?", a: "Yes! The free plan includes 1 dashboard with up to 5 widgets, real-time data, and price alerts. Upgrade to Pro for unlimited dashboards and advanced features." },
  { q: "Where does the data come from?", a: "We aggregate data from multiple trusted sources including CoinGecko and CoinCap, with automatic failover for 99.9% uptime." },
  { q: "Can I share my dashboard?", a: "Absolutely. Save any dashboard as a template and share it with a public link. Others can clone it into their own account with one click." },
  { q: "How fast is the data?", a: "Market data refreshes every 60 seconds and news every 5 minutes. All data is cached server-side for instant loading." },
  { q: "Is my data secure?", a: "Yes. All data is protected with Row Level Security. Your dashboards, alerts, and settings are completely private to your account." },
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
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-foreground tracking-tight">
            Pulse<span className="text-primary">Board</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-1.5">Start Free <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(263,70%,66%,0.12),transparent_60%)]" />
          <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto">
              Your Crypto Portfolio,{" "}
              <span className="text-primary">One Dashboard</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Real-time prices, custom alerts, market insights — all in a drag-and-drop dashboard built for serious crypto watchers.
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
          </div>
        </section>

        {/* ── Demo Preview ── */}
        <section className="max-w-5xl mx-auto px-4 pb-20" aria-label="Dashboard preview">
          <div className="glass-card p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {MOCK_COINS.map((c) => {
                const pos = c.change >= 0;
                return (
                  <div key={c.symbol} className="rounded-lg bg-secondary/40 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{c.symbol}</span>
                      <span className={`flex items-center gap-0.5 text-xs font-semibold ${pos ? "text-success" : "text-destructive"}`}>
                        {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {c.change.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-lg font-bold text-foreground">${c.price.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground mb-1">Fear & Greed Index</p>
                <p className="text-3xl font-bold text-success">72</p>
                <p className="text-xs text-success font-medium">Greed</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-4 space-y-2">
                <p className="text-xs text-muted-foreground">Latest News</p>
                <p className="text-sm text-foreground line-clamp-1">Bitcoin breaks $97K as institutional buying surges</p>
                <p className="text-sm text-foreground line-clamp-1">Ethereum L2 transaction volume hits all-time high</p>
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
              { icon: Bell, title: "Price Alerts", desc: "Set above/below triggers. Get notified the instant a price target is hit." },
              { icon: BarChart3, title: "Real-Time Data", desc: "Market data refreshes every minute from multiple trusted sources." },
              { icon: Zap, title: "Instant Templates", desc: "Clone community dashboards in one click. Share yours with the world." },
              { icon: Globe, title: "Market Context", desc: "BTC dominance, total market cap, volume — the big picture at a glance." },
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
              { step: "2", title: "Build Your Board", desc: "Add widgets, drag to arrange, resize to fit. Save automatically." },
              { step: "3", title: "Stay Informed", desc: "Set alerts, track markets, share with friends. All in real time." },
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
              { title: "Day Traders", desc: "Quick price snapshots, alerts on breakout levels, multi-coin tracking for fast decisions." },
              { title: "Long-Term Investors", desc: "Market context widgets, BTC dominance tracking, portfolio overview in one glance." },
              { title: "Crypto Enthusiasts", desc: "News feed, Fear & Greed index, shareable templates — stay plugged into the market." },
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
            {/* Free */}
            <div className="glass-card p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Free</h3>
                <p className="text-3xl font-bold text-foreground mt-1">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <ul className="space-y-2">
                {["1 dashboard", "5 widgets", "Price alerts", "Real-time data", "Community templates"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            {/* Pro */}
            <div className="glass-card p-6 space-y-5 border-primary/40 relative">
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Pro</h3>
                <p className="text-3xl font-bold text-foreground mt-1">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <ul className="space-y-2">
                {["Unlimited dashboards", "Unlimited widgets", "Advanced alerts", "Priority data refresh", "Share & export", "Email notifications"].map((f) => (
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
              <p className="mt-3 text-muted-foreground">Join thousands tracking crypto smarter with PulseBoard.</p>
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
            <p className="text-lg font-bold text-foreground">Pulse<span className="text-primary">Board</span></p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Real-time crypto dashboards for traders, investors, and enthusiasts.
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
          <p className="text-center text-xs text-muted-foreground">&copy; {new Date().getFullYear()} PulseBoard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
