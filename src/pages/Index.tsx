import { Link, Navigate } from "react-router-dom";
import {
  BarChart3, Bell, Layout, Zap, Shield, Globe,
  ArrowRight, Check, ChevronDown, TrendingUp, TrendingDown,
  Newspaper, LineChart, Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  BRAND, HERO, FEATURES, HOW_IT_WORKS, USE_CASES,
  PRICING, FAQ, CTA, FOOTER, MOCK_WIDGETS,
} from "@/config/site";
import { VALUE_PROPS } from "@/config/site";
import logoDasho from "@/assets/logo-dasho.png";

/* Icon map for features */
const ICON_MAP: Record<string, any> = {
  Layout, Bell, BarChart3, Zap, Globe, Shield, LineChart, Newspaper, Gauge,
};

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left" aria-expanded={open}>
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
};

const Index = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen relative">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoDasho} alt={BRAND.name} className="h-[90px]" />
          </Link>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                Widgets
              </Button>
            </a>
            <a href="#pricing" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                Pricing
              </Button>
            </a>
            {loading ? null : user ? (
              <Link to="/dashboard"><Button size="sm" className="gap-1.5 glow-button">Dashboard <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
                <Link to="/signup"><Button size="sm" className="gap-1.5 glow-button">{HERO.ctaPrimary} <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(263,70%,66%,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsla(220,70%,55%,0.08),transparent_50%)]" />
          <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-4xl mx-auto">
              {HERO.heading}{" "}<span className="text-primary">{HERO.headingHighlight}</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">{HERO.subheading}</p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/signup"><Button size="lg" className="gap-2 text-base px-8 glow-button">{HERO.ctaPrimary} <ArrowRight className="h-4 w-4" /></Button></Link>
              <a href="#features"><Button variant="outline" size="lg" className="text-base px-8">{HERO.ctaSecondary}</Button></a>
            </div>
          </div>
        </section>

        {/* Value Props — 3 bullets */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="grid sm:grid-cols-3 gap-6">
            {VALUE_PROPS.map((v) => {
              const VIcon = ICON_MAP[v.icon] || BarChart3;
              return (
                <div key={v.title} className="glass-card-enhanced p-6 space-y-3 text-center">
                  <div className="relative z-10 mx-auto p-3 rounded-xl bg-primary/10 w-fit"><VIcon className="h-6 w-6 text-primary" /></div>
                  <h3 className="relative z-10 text-base font-semibold text-foreground">{v.title}</h3>
                  <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Crypto Preview — Only crypto widgets */}
        <section className="max-w-5xl mx-auto px-4 pb-20" aria-label="Crypto dashboard preview">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">Your Crypto Overview</h2>
          <div className="glass-card-enhanced p-4 sm:p-6">
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {MOCK_WIDGETS.map((w) => (
                <div key={w.label} className="rounded-lg bg-secondary/40 p-3 space-y-1 border border-border/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{w.label}</span>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${w.positive ? "text-success" : "text-destructive"}`}>
                      {w.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{w.change}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{w.value}</p>
                </div>
              ))}
            </div>
            <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-secondary/40 p-4 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1">Market Sentiment</p>
                <p className="text-3xl font-bold text-success">72</p>
                <p className="text-xs text-success font-medium">Greed</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-4 space-y-2 border border-border/20">
                <p className="text-xs text-muted-foreground">Crypto News</p>
                <p className="text-sm text-foreground line-clamp-1">Bitcoin breaks $97K as institutional buying surges</p>
                <p className="text-sm text-foreground line-clamp-1">Ethereum staking hits record high ahead of upgrade</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-4 space-y-2 border border-border/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3.5 w-3.5 text-warning" />
                  <p className="text-xs text-muted-foreground">AI Market Recap</p>
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "Bullish momentum continues with BTC leading the rally. Market sentiment shifts to Greed territory..."
                </p>
                <span className="text-[10px] text-muted-foreground/60">Coming Soon</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features — Crypto Widgets */}
        <section id="features" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Crypto Trading Widgets</h2>
          <p className="mt-3 text-muted-foreground text-center max-w-lg mx-auto">Professional-grade crypto tools, zero complexity.</p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const FIcon = ICON_MAP[f.icon] || Globe;
              return (
                <div key={f.title} className="glass-card-enhanced p-6 space-y-3">
                  <div className="relative z-10 p-2.5 rounded-lg bg-primary/10 w-fit"><FIcon className="h-5 w-5 text-primary" /></div>
                  <h3 className="relative z-10 text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it Works */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">How It Works</h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <span className="text-primary font-bold text-lg">{s.step}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Built For Crypto</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {USE_CASES.map((u) => (
              <div key={u.title} className="glass-card-enhanced p-6 space-y-2">
                <h3 className="relative z-10 text-base font-semibold text-foreground">{u.title}</h3>
                <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Simple Pricing</h2>
          <p className="mt-3 text-muted-foreground text-center">Start free, upgrade when you need more.</p>
          <div className="mt-10 grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {Object.values(PRICING).map((plan) => (
              <div key={plan.name} className={`glass-card-enhanced p-6 space-y-5 relative ${plan.highlighted ? "border-primary/40" : ""}`}>
                {plan.highlighted && "badge" in plan && (
                  <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium z-10">{plan.badge}</div>
                )}
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-3xl font-bold text-foreground mt-1">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span></p>
                </div>
                <ul className="relative z-10 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-success shrink-0" /> {f}</li>
                  ))}
                </ul>
                <Link to="/signup" className="block relative z-10">
                  <Button className={`w-full ${plan.highlighted ? "glow-button" : ""}`} variant={plan.highlighted ? "default" : "outline"}>{plan.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">FAQ</h2>
          <div className="mt-10">{FAQ.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}</div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="glass-card-enhanced p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(263,70%,66%,0.12),transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{CTA.heading}</h2>
              <p className="mt-3 text-muted-foreground">{CTA.subheading}</p>
              <Link to="/signup" className="inline-block mt-6">
                <Button size="lg" className="gap-2 text-base px-10 glow-button">{CTA.button} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
          <div>
            <img src={logoDasho} alt={BRAND.name} className="h-[96px]" />
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{FOOTER.tagline}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Product</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {FOOTER.productLinks.map((l) => (
                <li key={l.label}>
                  {"to" in l ? <Link to={l.to!} className="hover:text-foreground transition-colors">{l.label}</Link>
                    : <a href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Legal</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {FOOTER.legalLinks.map((l) => <li key={l.label}><span className="cursor-default">{l.label}</span></li>)}
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 py-4">
          <p className="text-center text-xs text-muted-foreground">&copy; {BRAND.year} {BRAND.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;