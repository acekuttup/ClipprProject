import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Crown,
  LogOut,
  MapPin,
  Bell,
  CreditCard,
  FileText,
  User,
  Trash2,
  Download,
  Upload,
  Target,
} from "lucide-react";
import {
  useClipperStore,
  PAYMENT_METHOD_LABELS,
  fmtMoney,
  type ClipperStore,
} from "@/lib/clipper-store";
import { BoothRentModal } from "@/components/clipper/BoothRentModal";
import { Sheet, Numpad, useAmount } from "@/components/clipper/LogModals";

export function SettingsScreen({
  onAuth,
  onPremium,
}: {
  onAuth: () => void;
  onPremium: (f?: string) => void;
}) {
  const [store, setStore] = useClipperStore();
  const isPremium = store.user?.isPremium;
  const [boothRentOpen, setBoothRentOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const signOut = () => setStore((s) => ({ ...s, user: undefined }));
  const resetAll = () => {
    if (confirm("Erase all data on this device? This can't be undone.")) {
      localStorage.removeItem("clipper_store_v1");
      location.reload();
    }
  };
  const toggle = (k: "boothRentNotificationsOn" | "reviewQueueBadgeOn" | "weeklyReceiptPromptOn") =>
    setStore((s) => ({ ...s, settings: { ...s.settings, [k]: !s.settings[k] } }));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clipper-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<ClipperStore>;
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.incomeEntries)) {
          alert("That file doesn't look like a Clipper backup.");
          return;
        }
        if (confirm("Restore from this backup? This replaces your current data on this device.")) {
          setStore(() => parsed as ClipperStore);
        }
      } catch {
        alert("Couldn't read that file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-24">
      <header className="pt-2">
        <div className="text-xs uppercase tracking-[0.22em] text-brass">Settings</div>
        <h1 className="mt-1 font-display text-3xl">Your shop</h1>
      </header>

      {/* Profile */}
      <div className="card-luxe p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brass to-oxblood font-display text-xl text-brass-foreground">
            {store.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <div className="font-display text-lg">{store.user?.name ?? "Guest"}</div>
            <div className="text-xs text-muted-foreground">
              {store.user?.email ?? "Not signed in"}
            </div>
          </div>
          {isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brass to-oxblood px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brass-foreground">
              <Crown className="h-3 w-3" /> Premium
            </span>
          )}
        </div>
        {store.profile && (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
            <Mini label="Cuts/day" value={String(store.profile.avgCutsPerDay)} />
            <Mini label="Rate" value={`$${store.profile.avgRate}`} />
            <Mini label="Years" value={String(store.profile.yearsExperience ?? 0)} />
          </div>
        )}
      </div>

      {!isPremium && (
        <button
          onClick={() => onPremium()}
          className="card-luxe flex w-full items-center gap-3 border-brass/40 bg-gradient-to-r from-brass/10 to-transparent p-4 text-left"
        >
          <Crown className="h-5 w-5 text-brass" />
          <div className="flex-1">
            <div className="font-display text-base">Upgrade to Premium</div>
            <div className="text-xs text-muted-foreground">Bank sync · PDF export · auto trips</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <Section label="Trip Detection" icon={<MapPin className="h-4 w-4" />}>
        <Row
          label="Work Location"
          value={store.settings.workLocationName ?? "Tap to set"}
          premium={!isPremium}
          onClick={() => onPremium("Auto trip detection")}
        />
      </Section>

      <Section label="Recurring" icon={<CreditCard className="h-4 w-4" />}>
        <Row
          label="Booth Rent"
          value={
            store.boothRentConfig
              ? `$${store.boothRentConfig.amount} ${store.boothRentConfig.frequency}${store.boothRentConfig.active ? "" : " · off"}`
              : "Not configured"
          }
          onClick={() => setBoothRentOpen(true)}
        />
      </Section>

      <Section label="Goals" icon={<Target className="h-4 w-4" />}>
        <Row
          label="Monthly income goal"
          value={
            store.settings.monthlyIncomeGoal
              ? fmtMoney(store.settings.monthlyIncomeGoal)
              : "Not set"
          }
          onClick={() => setGoalOpen(true)}
        />
      </Section>

      <Section label="Connected Accounts" icon={<CreditCard className="h-4 w-4" />}>
        <Row
          label="Cash App"
          value="Not connected"
          premium={!isPremium}
          onClick={() => onPremium("Bank-sync")}
        />
        <Row
          label="Venmo"
          value="Not connected"
          premium={!isPremium}
          onClick={() => onPremium("Bank-sync")}
        />
        <Row
          label="Zelle"
          value="Not connected"
          premium={!isPremium}
          onClick={() => onPremium("Bank-sync")}
        />
      </Section>

      <Section label="Tax Information" icon={<FileText className="h-4 w-4" />}>
        <Row label="Business Code" value={store.settings.businessCode} />
        <Row
          label="Mileage Rate"
          value={`$${store.settings.mileageRatePerMile.toFixed(2)}/mi (${store.settings.mileageRateYear})`}
        />
      </Section>

      <Section label="Payment Methods" icon={<CreditCard className="h-4 w-4" />}>
        <div className="px-4 pb-3 pt-1 text-xs text-muted-foreground">
          {store.settings.preferredPaymentMethods
            .map((m) => PAYMENT_METHOD_LABELS[m])
            .join(" · ") || "None selected"}
        </div>
      </Section>

      <Section label="Notifications" icon={<Bell className="h-4 w-4" />}>
        <Toggle
          label="Booth rent reminders"
          on={store.settings.boothRentNotificationsOn}
          onClick={() => toggle("boothRentNotificationsOn")}
        />
        <Toggle
          label="Review queue badge"
          on={store.settings.reviewQueueBadgeOn}
          onClick={() => toggle("reviewQueueBadgeOn")}
        />
        <Toggle
          label="Weekly receipt prompt"
          on={store.settings.weeklyReceiptPromptOn}
          onClick={() => toggle("weeklyReceiptPromptOn")}
        />
      </Section>

      <Section label="Records" icon={<User className="h-4 w-4" />}>
        <Row label="Storage" value="On this device" />
        <div className="border-t border-border/60 px-4 py-3 text-[11px] text-muted-foreground">
          Keep records for 7 years (IRS audit window).
        </div>
      </Section>

      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => importData(e.target.files?.[0])}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={exportData}
          className="flex h-11 items-center justify-center gap-1.5 rounded-md border border-border bg-card/60 text-xs font-medium tap-highlight hover:bg-accent/40"
        >
          <Download className="h-3.5 w-3.5" /> Back up data
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="flex h-11 items-center justify-center gap-1.5 rounded-md border border-border bg-card/60 text-xs font-medium tap-highlight hover:bg-accent/40"
        >
          <Upload className="h-3.5 w-3.5" /> Restore backup
        </button>
      </div>

      <div className="space-y-2">
        {store.user ? (
          <button
            onClick={signOut}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-card/60 text-sm text-muted-foreground tap-highlight"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        ) : (
          <button
            onClick={onAuth}
            className="h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] font-semibold text-brass-foreground shadow-luxe"
          >
            Sign in / Create account
          </button>
        )}
        <button
          onClick={resetAll}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md text-xs text-destructive/80 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" /> Erase all data
        </button>
      </div>

      <BoothRentModal open={boothRentOpen} onClose={() => setBoothRentOpen(false)} />
      <GoalModal open={goalOpen} onClose={() => setGoalOpen(false)} />
    </div>
  );
}

function GoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [store, setStore] = useClipperStore();
  const amt = useAmount();

  useEffect(() => {
    if (!open) return;
    amt.set(store.settings.monthlyIncomeGoal ? String(store.settings.monthlyIncomeGoal) : "0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    setStore((s) => ({
      ...s,
      settings: { ...s.settings, monthlyIncomeGoal: amt.num || undefined },
    }));
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Monthly income goal"
      footer={
        <div>
          <Numpad onKey={amt.press} />
          <button
            onClick={save}
            className="mt-4 h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] font-semibold text-brass-foreground shadow-luxe"
          >
            Save goal
          </button>
        </div>
      }
    >
      <div className="mb-4 text-center">
        <div className="font-display text-5xl text-success">${amt.v}</div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Shown as a progress bar on your Home tab each month.
      </p>
    </Sheet>
  );
}

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card-luxe overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-brass">
        {icon}
        {label}
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  premium,
  onClick,
}: {
  label: string;
  value: string;
  premium?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3 text-left tap-highlight hover:bg-accent/40"
      disabled={!onClick}
    >
      <div className="text-sm font-medium">
        {label}
        {premium && (
          <span className="ml-2 rounded-full bg-brass/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-brass">
            <Crown className="mr-0.5 inline h-2.5 w-2.5" />
            Premium
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {value}
        {onClick && <ChevronRight className="h-3.5 w-3.5" />}
      </div>
    </button>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3 text-left tap-highlight"
    >
      <span className="text-sm">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${on ? "bg-brass" : "bg-muted"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${on ? "left-5" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-base">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
