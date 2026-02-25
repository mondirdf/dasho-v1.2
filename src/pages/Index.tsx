import { Link, Navigate } from "react-router-dom";
import {
  BarChart3, Bell, Layout, Zap, Shield, Globe,
  ArrowRight, Check, ChevronDown, TrendingUp, TrendingDown,
  Newspaper, LineChart, Gauge, Target, PieChart, Users,
  Coffee, Clock, Eye, X, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDefaultTheme } from "@/hooks/useDefaultTheme";
import {
  BRAND, HERO, FEATURES, HOW_IT_WORKS, USE_CASES,
  PRICING, FAQ, CTA, FOOTER, MOCK_WIDGETS, SEO,
} from "@/config/site";
import { VALUE_PROPS, BEFORE_AFTER } from "@/config/site";
import logoDasho from "@/assets/logo-dasho-dark-bg.png";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import SEOHead from "@/components/SEOHead";
import { BUILD_INFO, BUILD_SHA_SHORT } from "@/config/buildInfo";

/* Icon map for features */
const ICON_MAP: Record<string, any> = {
  Layout, Bell, BarChart3, Zap, Globe, Shield, LineChart, Newspaper, Gauge,
};

/* Use case icons */
const USE_CASE_ICONS = [Coffee, Clock, Target];

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

const Index = () => {
  const { user, loading } = useAuth();
  useDefaultTheme();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="landing-professional min-h-screen relative">
      <SEOHead title={SEO.home.title} description={SEO.home.description} path="/" />
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-nav border-b border-border/40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoDasho} alt={BRAND.name} className="h-8 sm:h-9" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <a href="#features" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                Features
              </Button>
            </a>
            <Link to="/pricing" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                Pricing
              </Button>
            </Link>
            {loading ? null : user ? (
              <Link to="/dashboard"><Button size="sm" className="gap-1.5 glow-button text-xs sm:text-sm">Dashboard <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm px-3 sm:px-4 border-border/60 hover:border-primary/40">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="gap-1 sm:gap-1.5 glow-button text-xs sm:text-sm px-3 sm:px-4">
                    <span className="sm:hidden">Get Started</span>
                    <span className="hidden sm:inline">{HERO.ctaPrimary}</span>
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero — Morning ritual narrative */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(252,100%,68%,0.08),transparent_58%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsla(252,100%,68%,0.05),transparent_52%)]" />
          <div className="relative max-w-6xl mx-auto px-4 pt-12 sm:pt-24 pb-10 sm:pb-16 text-center">
            {/* Tagline chip */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Coffee className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Your morning market ritual</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-4xl mx-auto">
              {HERO.heading}{" "}<span className="gradient-text">{HERO.headingHighlight}</span>
            </h1>
            <div className="mt-4 sm:mt-6 text-sm sm:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed space-y-2">
              <p>Most traders analyze for 30 minutes… and still enter blind.</p>
              <p>Dasho gives you bias, structure, and regime context in <span className="text-primary font-medium">30 seconds</span>.</p>
            </div>

            {/* Companion badge */}
            <p className="mt-3 text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
              <Eye className="h-3 w-3" /> Works alongside TradingView, not against it
            </p>

            <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 text-base px-8 glow-button w-full sm:w-auto">
                  {HERO.ctaPrimary} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="text-base px-8 w-full sm:w-auto border-border/60 hover:border-primary/40 hover:bg-primary/5">
                  {HERO.ctaSecondary}
                </Button>
              </a>
            </div>

            {/* Product metrics */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {[
                { value: "19", label: "Trading Widgets" },
                { value: "5", label: "Asset Classes" },
                { value: "5", label: "AI Engines" },
                { value: "< 2 min", label: "To Full Context" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Dashboard screenshot — credibility layer */}
            <div className="mt-10 sm:mt-14 max-w-[1150px] mx-auto w-[92%] sm:w-full">
              <p className="text-[11px] sm:text-xs text-muted-foreground/50 tracking-wide mb-3">
                See today's full market context in one glance.
              </p>
              <img
                src={dashboardPreview}
                alt="Dasho dashboard showing Strong Bearish bias, BTC Volatility, Global Indices, Watchlist, and AI Recap"
                className="w-full rounded-[var(--radius)] shadow-[0_8px_40px_-12px_hsl(var(--foreground)/0.12)] border border-border/30"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="max-w-4xl mx-auto px-4 pb-12 sm:pb-16">
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {VALUE_PROPS.map((v) => {
              const VIcon = ICON_MAP[v.icon] || BarChart3;
              return (
                <div key={v.title} className="glass-card-enhanced p-5 sm:p-6 space-y-3 text-center group hover:border-primary/30 transition-all duration-300">
                  <div className="relative z-10 mx-auto p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/15 transition-colors"><VIcon className="h-6 w-6 text-primary" /></div>
                  <h3 className="relative z-10 text-sm sm:text-base font-semibold text-foreground">{v.title}</h3>
                  <p className="relative z-10 text-xs sm:text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Before / After Comparison */}
        <section className="max-w-4xl mx-auto px-3 sm:px-4 pb-12 sm:pb-20">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center mb-2">{BEFORE_AFTER.title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-6 sm:mb-10">See how Dasho changes your morning routine</p>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Before */}
            <div className="glass-card p-5 sm:p-6 border-destructive/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-destructive/10"><X className="h-4 w-4 text-destructive" /></div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">{BEFORE_AFTER.before.label}</h3>
              </div>
              <ul className="space-y-2.5">
                {BEFORE_AFTER.before.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* After */}
            <div className="glass-card-enhanced p-5 sm:p-6 border-success/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-success/10"><Check className="h-4 w-4 text-success" /></div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">{BEFORE_AFTER.after.label}</h3>
              </div>
              <ul className="space-y-2.5">
                {BEFORE_AFTER.after.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/80">
                    <Check className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="max-w-5xl mx-auto px-3 sm:px-4 pb-12 sm:pb-20" aria-label="Dashboard preview">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center mb-2">One Screen. Full Context.</h2>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-5 sm:mb-8">Everything a trader needs — nothing they don't</p>
          <div className="glass-card-enhanced p-3 sm:p-6">
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {MOCK_WIDGETS.map((w) => (
                <div key={w.label} className="rounded-lg bg-secondary/40 p-2.5 sm:p-3 space-y-1 border border-border/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">{w.label}</span>
                    <span className={`flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold ${w.positive ? "text-success" : "text-destructive"}`}>
                      {w.positive ? <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}{w.change}
                    </span>
                  </div>
                  <p className="text-sm sm:text-lg font-bold text-foreground">{w.value}</p>
                </div>
              ))}
            </div>
            <div className="relative z-10 mt-2.5 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="rounded-lg bg-secondary/40 p-3 sm:p-4 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1">Market Sentiment</p>
                <p className="text-2xl sm:text-3xl font-bold text-success">72</p>
                <p className="text-xs text-success font-medium">Greed</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3 sm:p-4 space-y-1.5 sm:space-y-2 border border-border/20">
                <p className="text-xs text-muted-foreground">Top Headlines</p>
                <p className="text-xs sm:text-sm text-foreground line-clamp-1">Bitcoin breaks $97K as institutional buying surges</p>
                <p className="text-xs sm:text-sm text-foreground line-clamp-1">Ethereum staking hits record high ahead of upgrade</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3 sm:p-4 space-y-1.5 sm:space-y-2 border border-border/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3.5 w-3.5 text-warning" />
                  <p className="text-xs text-muted-foreground">AI Morning Brief</p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                  "Bullish momentum continues. BTC reclaimed $97K with strong volume. Watch for resistance at $98.5K..."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center">Intelligence You Can't Build Yourself</h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-muted-foreground text-center max-w-lg mx-auto">Automated analysis that would take you hours — delivered in seconds.</p>
          <div className="mt-6 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {FEATURES.map((f) => {
              const FIcon = ICON_MAP[f.icon] || Globe;
              return (
                <div key={f.title} className="glass-card-enhanced p-5 sm:p-6 space-y-3 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5">
                  <div className="relative z-10 p-2.5 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/15 transition-colors"><FIcon className="h-5 w-5 text-primary" /></div>
                  <h3 className="relative z-10 text-sm sm:text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="relative z-10 text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center">Up and Running in 60 Seconds</h2>
          <div className="mt-6 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="text-center space-y-3 relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="mx-auto w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <span className="text-primary font-bold text-lg">{s.step}</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">{s.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center">Who Is Dasho For?</h2>
          <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            {USE_CASES.map((u, i) => {
              const UIcon = USE_CASE_ICONS[i] || Target;
              return (
                <div key={u.title} className="glass-card-enhanced p-5 sm:p-6 space-y-3 group hover:border-primary/30 transition-all duration-300">
                  <div className="relative z-10 p-2 rounded-lg bg-primary/10 w-fit">
                    <UIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="relative z-10 text-sm sm:text-base font-semibold text-foreground">{u.title}</h3>
                  <p className="relative z-10 text-xs sm:text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trading Engines Showcase */}
        <section className="max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center">5 Built-in Trading Engines</h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground text-center max-w-lg mx-auto">Automated analysis that runs in the background — no free tool does this</p>
          <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {[
              { icon: LineChart, name: "Structure Scanner", desc: "Auto-detects BOS & ChoCH across multiple timeframes with RSI confirmation. Hours of manual analysis, done instantly.", tag: "PRO" },
              { icon: PieChart, name: "MTF Confluence", desc: "Aligns signals from 5 timeframes simultaneously. See where momentum, structure, and volume agree.", tag: "PRO" },
              { icon: Gauge, name: "Volatility Regime", desc: "Classifies the market as compression, expansion, trending, or distribution — and tells you what to expect next.", tag: "PRO" },
              { icon: Target, name: "Mini Backtester", desc: "Test 5 strategies (BOS Entry, ChoCH Reversal, RSI Bounce, EMA Cross, Breakout) on real historical data.", tag: "PRO" },
              { icon: Clock, name: "Session Monitor", desc: "Live killzone tracking with volume heatmaps. Know exactly when smart money is active.", tag: "PRO" },
              { icon: Zap, name: "AI Daily Brief", desc: "AI-generated morning summary: what happened overnight, key levels, and what to watch today.", tag: "PRO" },
            ].map((engine) => (
              <div key={engine.name} className="glass-card-enhanced p-5 sm:p-6 space-y-3 group hover:border-primary/30 transition-all duration-300 relative">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-[10px] font-semibold text-primary z-10">{engine.tag}</div>
                <div className="relative z-10 p-2.5 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/15 transition-colors">
                  <engine.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="relative z-10 text-sm sm:text-base font-semibold text-foreground">{engine.name}</h3>
                <p className="relative z-10 text-xs sm:text-sm text-muted-foreground leading-relaxed">{engine.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Your Edge. Quantified. */}
        <section className="max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Personal Edge Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-foreground">Your Edge. Quantified.</h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-base text-muted-foreground max-w-xl mx-auto">
              Dasho doesn't just analyze the market. It analyzes how <span className="text-foreground font-medium">YOU</span> react to the market.
            </p>
          </div>

          {/* Benefit cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
            {[
              { icon: Eye, title: "Discover Your Strongest Conditions", desc: "Find which market environments align with your best decisions." },
              { icon: Target, title: "Spot Behavioral Biases", desc: "See if you overtrade in fear or ignore opportunities in greed." },
              { icon: Shield, title: "Build Data-Backed Confidence", desc: "Replace gut feelings with statistical self-awareness." },
            ].map((card) => (
              <div key={card.title} className="glass-card-enhanced p-5 sm:p-6 space-y-3 group hover:border-primary/30 transition-all duration-300">
                <div className="relative z-10 p-2.5 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/15 transition-colors">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="relative z-10 text-sm sm:text-base font-semibold text-foreground">{card.title}</h3>
                <p className="relative z-10 text-xs sm:text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Visual mock of "Your Edge Insights" widget */}
          <div className="max-w-sm mx-auto">
            <div className="glass-card-enhanced p-5 sm:p-6 space-y-4 border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Your Edge Insights</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-[10px] font-semibold text-primary">PRO</span>
              </div>

              {/* Top Symbol placeholder */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground">Top Symbols</p>
                {["", "", ""].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-2 rounded bg-muted-foreground/20" />
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary/40" style={{ width: `${90 - i * 25}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Session + Affinity */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/30 text-center">
                  <Clock className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Peak Session</p>
                  <div className="w-12 h-2 rounded bg-muted-foreground/20 mx-auto mt-1" />
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/30 text-center">
                  <Gauge className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Market Affinity</p>
                  <div className="w-16 h-2 rounded bg-muted-foreground/20 mx-auto mt-1" />
                </div>
              </div>

              {/* Alert Hit Rate placeholder */}
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/30">
                <p className="text-[10px] text-muted-foreground mb-1.5">Alert Effectiveness</p>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary/40" style={{ width: "65%" }} />
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground/70 mt-6 italic">
            "The longer you use Dasho, the smarter your Edge becomes."
          </p>
        </section>

        <section id="pricing" className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center">Simple Pricing</h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-muted-foreground text-center">Start free, upgrade when you need more.</p>
          <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {Object.values(PRICING).map((plan) => (
              <div
                key={plan.name}
                className={`glass-card-enhanced p-5 sm:p-6 space-y-5 relative transition-all duration-300 ${
                  plan.highlighted
                    ? "!overflow-visible border-primary/50 shadow-[0_0_30px_-5px_hsla(263,70%,60%,0.15)] scale-[1.02] sm:scale-105"
                    : "hover:border-border/60"
                }`}
              >
                {plan.highlighted && "badge" in plan && (
                  <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium z-20">{plan.badge}</div>
                )}
                <div className="relative z-10">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{plan.price}<span className="text-xs sm:text-sm font-normal text-muted-foreground">{plan.period}</span></p>
                  {"yearlyNote" in plan && (
                    <p className="text-xs text-primary/80 mt-1">{plan.yearlyNote}</p>
                  )}
                </div>
                <ul className="relative z-10 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"><Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success shrink-0" /> {f}</li>
                  ))}
                </ul>
                <Link to={plan.highlighted ? "/checkout" : "/signup"} className="block relative z-10">
                  <Button className={`w-full ${plan.highlighted ? "glow-button" : ""}`} variant={plan.highlighted ? "default" : "outline"}>{plan.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <h2 className="text-xl sm:text-3xl font-bold text-foreground text-center mb-6 sm:mb-8">FAQ</h2>
          <div className="space-y-0">{FAQ.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}</div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-16 text-center">
          <div className="glass-card-enhanced p-6 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(263,70%,66%,0.12),transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-xl sm:text-3xl font-bold text-foreground">{CTA.heading}</h2>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">{CTA.subheading}</p>
              <Link to="/signup" className="inline-block mt-5 sm:mt-6">
                <Button size="lg" className="gap-2 text-sm sm:text-base px-8 sm:px-10 glow-button">{CTA.button} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:grid sm:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2">
              <img src={logoDasho} alt={BRAND.name} className="h-10 sm:h-14" />
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-xs">{FOOTER.tagline}</p>
              <p className="text-[11px] text-primary/60 font-medium mt-2">{FOOTER.roadmapNote}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">Product</p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                {FOOTER.productLinks.map((l) => (
                  <li key={l.label}>
                    {"to" in l ? <Link to={l.to!} className="hover:text-foreground transition-colors">{l.label}</Link>
                      : <a href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">Legal</p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                {FOOTER.legalLinks.map((l: { label: string; to: string }) => <li key={l.label}><Link to={l.to} className="hover:text-foreground transition-colors">{l.label}</Link></li>)}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 py-3 sm:py-4">
          <div className="flex flex-col items-center gap-1">
            <p className="text-center text-[11px] text-muted-foreground">&copy; {BRAND.year} {BRAND.name}. All rights reserved.</p>
            <p className="text-center text-[10px] text-muted-foreground/70">
              Build: <span className="font-mono">{BUILD_SHA_SHORT}</span> · Branch: {BUILD_INFO.branch}
            </p>
            <p className="text-center text-[10px] text-muted-foreground/70">Made by df</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
