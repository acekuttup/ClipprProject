import { useEffect, useState } from "react";
import { Home, History, Inbox, FileText, Settings as SettingsIcon, Scissors } from "lucide-react";
import { useClipperStore } from "@/lib/clipper-store";
import { OnboardingFlow } from "@/components/clipper/Onboarding";
import { AuthModal } from "@/components/clipper/AuthModal";
import { Walkthrough } from "@/components/clipper/Walkthrough";
import { HomeScreen } from "@/components/clipper/HomeScreen";
import { HistoryScreen } from "@/components/clipper/HistoryScreen";
import { ReviewScreen } from "@/components/clipper/ReviewScreen";
import { TaxesScreen } from "@/components/clipper/TaxesScreen";
import { SettingsScreen } from "@/components/clipper/SettingsScreen";
import { LogIncomeModal, LogExpenseModal, LogMilesModal } from "@/components/clipper/LogModals";
import { PremiumModal, usePremiumGate } from "@/components/clipper/PremiumModal";

type Tab = "home" | "history" | "review" | "taxes" | "settings";

export function ClipperApp() {
  const [store] = useClipperStore();
  const [tab, setTab] = useState<Tab>("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [logIncome, setLogIncome] = useState(false);
  const [logExpense, setLogExpense] = useState(false);
  const [logMiles, setLogMiles] = useState(false);
  const premium = usePremiumGate();

  // Open auth modal right after onboarding if no user
  useEffect(() => {
    if (store.hasCompletedOnboarding && !store.user) {
      const t = setTimeout(() => setAuthOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [store.hasCompletedOnboarding, store.user]);

  const reviewCount = store.incomeEntries.filter((e) => !e.confirmed).length;

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[480px]">
      {/* Top header bar */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brass to-oxblood">
              <Scissors className="h-3.5 w-3.5 text-brass-foreground" />
            </div>
            <div className="font-display text-lg tracking-wide brass-text">Clipper</div>
          </div>
          <div className="pinstripe h-0.5 flex-1 mx-3 opacity-50" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {store.user?.isPremium ? "Premium" : "Free"}
          </div>
        </div>
      </div>

      {/* Screen */}
      <main className="px-5">
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
        {tab === "settings" && <SettingsScreen onAuth={() => setAuthOpen(true)} onPremium={premium.gate} />}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="pinstripe h-0.5 w-full opacity-40" />
        <div className="grid grid-cols-5">
          <TabBtn id="home" active={tab} onClick={setTab} label="Home" icon={<Home className="h-5 w-5" />} />
          <TabBtn id="history" active={tab} onClick={setTab} label="History" icon={<History className="h-5 w-5" />} />
          <TabBtn
            id="review"
            active={tab}
            onClick={setTab}
            label="Review"
            icon={<Inbox className="h-5 w-5" />}
            badge={reviewCount > 0 ? reviewCount : undefined}
          />
          <TabBtn id="taxes" active={tab} onClick={setTab} label="Taxes" icon={<FileText className="h-5 w-5" />} />
          <TabBtn id="settings" active={tab} onClick={setTab} label="Settings" icon={<SettingsIcon className="h-5 w-5" />} />
        </div>
        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </nav>

      {/* Overlays */}
      <OnboardingFlow />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <Walkthrough />
      <LogIncomeModal open={logIncome} onClose={() => setLogIncome(false)} />
      <LogExpenseModal open={logExpense} onClose={() => setLogExpense(false)} />
      <LogMilesModal open={logMiles} onClose={() => setLogMiles(false)} />
      <PremiumModal open={premium.open} onClose={() => premium.setOpen(false)} feature={premium.feature} />
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
      className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 tap-highlight transition ${
        isActive ? "text-brass" : "text-muted-foreground"
      }`}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-warning px-1 text-[9px] font-bold text-warning-foreground">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      {isActive && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-brass" />}
    </button>
  );
}
