import { useEffect, useState } from "react";
import { Home, History, Inbox, FileText, Settings as SettingsIcon } from "lucide-react";
import { useClipperStore, applyBoothRentAutoLog } from "@/lib/clipper-store";
import { OnboardingFlow } from "@/components/clipper/Onboarding";
import { AuthModal } from "@/components/clipper/AuthModal";
import { SplashScreen } from "@/components/clipper/SplashScreen";
import { Walkthrough } from "@/components/clipper/Walkthrough";
import { HomeScreen } from "@/components/clipper/HomeScreen";
import { HistoryScreen } from "@/components/clipper/HistoryScreen";
import { ReviewScreen } from "@/components/clipper/ReviewScreen";
import { TaxesScreen } from "@/components/clipper/TaxesScreen";
import { SettingsScreen } from "@/components/clipper/SettingsScreen";
import { LogIncomeModal, LogExpenseModal, LogMilesModal } from "@/components/clipper/LogModals";
import { PremiumModal, usePremiumGate } from "@/components/clipper/PremiumModal";
import { ClipperMark, ClipperWordmark } from "@/components/clipper/Logo";

type Tab = "home" | "history" | "review" | "taxes" | "settings";

export function ClipperApp() {
  const [store, setStore] = useClipperStore();
  const [tab, setTab] = useState<Tab>("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [logIncome, setLogIncome] = useState(false);
  const [logExpense, setLogExpense] = useState(false);
  const [logMiles, setLogMiles] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const premium = usePremiumGate();

  // Open auth modal right after onboarding if no user
  useEffect(() => {
    if (store.hasCompletedOnboarding && !store.user) {
      const t = setTimeout(() => setAuthOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [store.hasCompletedOnboarding, store.user]);

  // Catch up any booth-rent cycles that have come due since last launch
  useEffect(() => {
    setStore((s) => applyBoothRentAutoLog(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reviewCount = store.incomeEntries.filter((e) => !e.confirmed).length;

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => setTab(next));
    } else {
      setTab(next);
    }
  };

  return (
    <div className="relative mx-auto min-h-[100dvh] w-full max-w-[480px]">
      {/* Top header bar — extends behind status bar */}
      <div
        className="sticky top-0 z-20 border-b border-white/[0.04] bg-background/80 backdrop-blur-2xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <ClipperMark size={26} className="text-brass" />
            <ClipperWordmark />
          </div>
          {store.user?.isPremium ? (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brass shadow-[0_0_8px_var(--color-brass)]" />
              <span className="font-eyebrow text-[9px]">Premium</span>
            </div>
          ) : (
            <button
              onClick={() => premium.gate("Upgrade to Premium")}
              className="flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-1 tap-highlight hover:border-brass/40 hover:bg-brass/5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              <span className="font-eyebrow text-[9px]">Free</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen */}
      <main className="px-5" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}>
        <div
          key={tab}
          className="rise-in"
          style={{ viewTransitionName: "tab-pane" } as React.CSSProperties}
        >
          {tab === "home" && (
            <HomeScreen
              onLogIncome={() => setLogIncome(true)}
              onLogExpense={() => setLogExpense(true)}
              onLogMiles={() => setLogMiles(true)}
              onPremium={premium.gate}
            />
          )}
          {tab === "history" && <HistoryScreen />}
          {tab === "review" && <ReviewScreen onPremium={premium.gate} />}
          {tab === "taxes" && <TaxesScreen onPremium={premium.gate} />}
          {tab === "settings" && (
            <SettingsScreen onAuth={() => setAuthOpen(true)} onPremium={premium.gate} />
          )}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-white/[0.06] bg-background/90 backdrop-blur-2xl">
        <div className="grid grid-cols-5">
          <TabBtn
            id="home"
            active={tab}
            onClick={switchTab}
            label="Home"
            icon={<Home className="h-5 w-5" />}
          />
          <TabBtn
            id="history"
            active={tab}
            onClick={switchTab}
            label="Activity"
            icon={<History className="h-5 w-5" />}
          />
          <TabBtn
            id="review"
            active={tab}
            onClick={switchTab}
            label="Review"
            icon={<Inbox className="h-5 w-5" />}
            badge={reviewCount > 0 ? reviewCount : undefined}
          />
          <TabBtn
            id="taxes"
            active={tab}
            onClick={switchTab}
            label="Taxes"
            icon={<FileText className="h-5 w-5" />}
          />
          <TabBtn
            id="settings"
            active={tab}
            onClick={switchTab}
            label="Settings"
            icon={<SettingsIcon className="h-5 w-5" />}
          />
        </div>
        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </nav>

      {/* Overlays */}
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <OnboardingFlow />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <Walkthrough />
      <LogIncomeModal open={logIncome} onClose={() => setLogIncome(false)} />
      <LogExpenseModal open={logExpense} onClose={() => setLogExpense(false)} />
      <LogMilesModal open={logMiles} onClose={() => setLogMiles(false)} />
      <PremiumModal
        open={premium.open}
        onClose={() => premium.setOpen(false)}
        feature={premium.feature}
      />
    </div>
  );
}

function TabBtn({
  id,
  active,
  onClick,
  label,
  icon,
  badge,
}: {
  id: Tab;
  active: Tab;
  onClick: (id: Tab) => void;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  const isActive = active === id;
  return (
    <button
      data-walkthrough={`tab-${id}`}
      onClick={() => onClick(id)}
      className={`group relative flex flex-col items-center justify-center gap-1.5 py-3 tap-highlight transition-colors duration-300 ${
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
      }`}
    >
      <span className="relative transition-transform duration-300 group-active:scale-90">
        {icon}
        {badge !== undefined && (
          <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brass px-1 font-mono text-[9px] font-medium text-brass-foreground">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
      <span
        className={`absolute -top-px h-px w-10 rounded-full bg-gradient-to-r from-transparent via-brass to-transparent transition-all duration-500 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
}
