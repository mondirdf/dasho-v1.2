/**
 * Onboarding — 4-step flow collecting minimal preferences
 * then generating a personalized dashboard via onboardingTemplateEngine.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ArrowLeft, SkipForward, Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createDashboard, createWidget } from "@/services/dataService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  generateTemplate,
  generateDefaultTemplate,
  type OnboardingInput,
} from "@/engines/onboardingTemplateEngine";

/* ── Question Definitions ── */

interface Option { id: string; label: string; icon: string; desc: string }

const Q_ASSETS: Option[] = [
  { id: "crypto", label: "Crypto", icon: "₿", desc: "Bitcoin, Ethereum, altcoins" },
  { id: "stocks", label: "Stocks", icon: "📈", desc: "Equities and indices" },
  { id: "forex", label: "Forex", icon: "💱", desc: "Currency pairs" },
  { id: "mixed", label: "Mixed", icon: "🔀", desc: "A bit of everything" },
];

const Q_STYLE: Option[] = [
  { id: "scalper", label: "Scalper", icon: "⚡", desc: "Seconds to minutes" },
  { id: "intraday", label: "Intraday", icon: "🕐", desc: "Within the day" },
  { id: "swing", label: "Swing", icon: "📊", desc: "Days to weeks" },
  { id: "long_term", label: "Long-term", icon: "🏦", desc: "Weeks to months" },
];

const Q_FOCUS: Option[] = [
  { id: "trend_direction", label: "Trend Direction", icon: "📐", desc: "Know where price is heading" },
  { id: "entry_signals", label: "Entry Signals", icon: "🎯", desc: "Precise timing for entries" },
  { id: "volatility", label: "Volatility", icon: "🌊", desc: "Measure market energy" },
  { id: "macro_context", label: "Macro Context", icon: "🌍", desc: "Big picture events & news" },
];

const Q_LEVEL: Option[] = [
  { id: "beginner", label: "Beginner", icon: "🌱", desc: "Just getting started" },
  { id: "intermediate", label: "Intermediate", icon: "📘", desc: "Some experience" },
  { id: "advanced", label: "Advanced", icon: "🧠", desc: "Experienced trader" },
];

const STEPS = [
  { key: "preferred_assets" as const, title: "What do you trade?", options: Q_ASSETS },
  { key: "trading_style" as const, title: "How do you trade?", options: Q_STYLE },
  { key: "priority_focus" as const, title: "What matters most?", options: Q_FOCUS },
  { key: "experience_level" as const, title: "Experience level?", options: Q_LEVEL },
];

/* ── Local storage key for partial progress ── */
const STORAGE_KEY = "dasho_onboarding_progress";

function loadProgress(): Partial<OnboardingInput> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(data: Partial<OnboardingInput>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Component ── */

const Onboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const saved = loadProgress();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingInput>>({
    preferred_assets: saved.preferred_assets ?? null,
    trading_style: saved.trading_style ?? null,
    priority_focus: saved.priority_focus ?? null,
    experience_level: saved.experience_level ?? null,
  });
  const [creating, setCreating] = useState(false);

  const currentStep = STEPS[step];
  const currentValue = answers[currentStep.key] ?? null;

  const selectOption = useCallback((id: string) => {
    const next = { ...answers, [currentStep.key]: id };
    setAnswers(next);
    saveProgress(next);
  }, [answers, currentStep.key]);

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const submitOnboarding = useCallback(async (input: OnboardingInput) => {
    if (!user) return;
    setCreating(true);
    try {
      const template = generateTemplate(input);
      const dash = await createDashboard(user.id, template.dashboardName);
      for (const w of template.widgets) {
        await createWidget(dash.id, w.type);
      }
      // Update profile
      await supabase.from("profiles").update({
        trading_style: input.trading_style,
        preferred_assets: input.preferred_assets ? [input.preferred_assets] : [],
        priority_focus: input.priority_focus,
        experience_level: input.experience_level,
        onboarding_completed: true,
      } as any).eq("id", user.id);

      clearProgress();
      toast({ title: "Dashboard created! 🎉" });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }, [user, toast, navigate]);

  const handleFinish = useCallback(() => {
    submitOnboarding({
      trading_style: answers.trading_style ?? null,
      preferred_assets: answers.preferred_assets ?? null,
      priority_focus: answers.priority_focus ?? null,
      experience_level: answers.experience_level ?? null,
    });
  }, [answers, submitOnboarding]);

  const handleSkip = useCallback(async () => {
    if (!user) return;
    setCreating(true);
    try {
      const template = generateDefaultTemplate();
      const dash = await createDashboard(user.id, template.dashboardName);
      for (const w of template.widgets) {
        await createWidget(dash.id, w.type);
      }
      await supabase.from("profiles").update({
        onboarding_completed: true,
      } as any).eq("id", user.id);
      clearProgress();
      toast({ title: "Dashboard created!" });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }, [user, toast, navigate]);

  const isLastStep = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="glass-card-glow p-6 sm:p-10 max-w-lg w-full space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Set Up Your Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {step + 1} of {STEPS.length} — {currentStep.title}
          </p>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentStep.options.map((opt) => {
            const selected = currentValue === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => selectOption(opt.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  selected
                    ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                    : "border-border/40 hover:bg-secondary/60"
                }`}
              >
                <span className="text-2xl shrink-0">{opt.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground leading-snug">{opt.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={creating}
            className="gap-1.5 text-muted-foreground"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </Button>
          {isLastStep ? (
            <Button
              onClick={handleFinish}
              disabled={creating || !currentValue}
              className="gap-1.5"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {creating ? "Creating…" : "Create Dashboard"}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!currentValue}
              className="gap-1.5"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
