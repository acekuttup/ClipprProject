import { Plus, Minus, Navigation, Sparkles, Lock } from "lucide-react";
import { useClipperStore, fmtMoney, isSameDay, PAYMENT_METHOD_LABELS, CATEGORY_LABELS } from "@/lib/clipper-store";

interface Props {
  onLogIncome: () => void;
  onLogExpense: () => void;
  onLogMiles: () => void;
  onPremium: (f?: string) => void;
}

export function HomeScreen({ onLogIncome, onLogExpense, onLogMiles, onPremium }: Props) {
  const [store] = useClipperStore();
  const today = new Date();
  const todaysIncome = store.incomeEntries.filter((e) => e.confirmed && isSameDay(new Date(e.date), today));
  const todaysExpenses = store.expenseEntries.filter((e) => !e.voided && isSameDay(new Date(e.date), today));
  const inToday = todaysIncome.reduce((s, e) => s + e.amount, 0);
  const outToday = todaysExpenses.reduce((s, e) => s + e.amount, 0);
  const net = inToday - outToday;
  const reviewCount = store.incomeEntries.filter((e) => !e.confirmed).length;

  const greet = (() => {
    const h = today.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-5 pb-24">
      <header className="pt-2">
        <div className="text-xs uppercase tracking-[0.22em] text-brass">{greet}</div>
        <h1 className="mt-1 font-display text-3xl leading-tight">
          {store.profile?.name ? store.profile.name.split(" ")[0] : "Welcome"}
        </h1>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </header>

      {reviewCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
          <Sparkles className="h-4 w-4 text-warning" />
          <span className="flex-1">
            <strong>{reviewCount}</strong> transaction{reviewCount > 1 ? "s" : ""} waiting in Review Queue
          </span>
        </div>
      )}

      {/* Hero net card */}
      <div data-walkthrough="home-net" className="card-luxe relative overflow-hidden p-6">
        <div className="pinstripe absolute inset-x-0 top-0 h-1 opacity-70" />
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">In Your Pocket · today</div>
        <div className="mt-2 font-display text-5xl tracking-tight brass-text">{fmtMoney(net)}</div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">In</div>
            <div className="font-display text-2xl text-success">{fmtMoney(inToday)}</div>
            <div className="text-[10px] text-muted-foreground">{todaysIncome.length} cut{todaysIncome.length !== 1 ? "s" : ""}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Out</div>
            <div className="font-display text-2xl text-destructive">{fmtMoney(outToday)}</div>
            <div className="text-[10px] text-muted-foreground">{todaysExpenses.length} expense{todaysExpenses.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div data-walkthrough="home-actions" className="grid grid-cols-3 gap-2.5">
        <ActionBtn label="Income" sub="Log a cut" onClick={onLogIncome} variant="primary" icon={<Plus className="h-5 w-5" />} />
        <ActionBtn label="Expense" sub="Add cost" onClick={onLogExpense} icon={<Minus className="h-5 w-5" />} />
        <ActionBtn label="Miles" sub="Log trip" onClick={onLogMiles} icon={<Navigation className="h-5 w-5" />} />
      </div>

      {/* Profile snapshot */}
      {store.profile && (
        <div className="card-luxe p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-brass">Your craft</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Stat label="Cuts/day" value={String(store.profile.avgCutsPerDay)} />
            <Stat label="Avg rate" value={`$${store.profile.avgRate}`} />
            <Stat label="Years" value={String(store.profile.yearsExperience ?? 0)} />
          </div>
        </div>
      )}

      {/* Auto trip detection (Premium) */}
      <button
        onClick={() => onPremium("Auto trip detection")}
        className="card-luxe flex w-full items-center gap-3 p-4 text-left tap-highlight"
      >
        <div className="grid h-10 w-10 place-items-center rounded-full bg-brass/10">
          <Navigation className="h-4 w-4 text-brass" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">Auto Trip Detection</div>
          <div className="text-xs text-muted-foreground">Never miss a deductible mile</div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-brass/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-brass">
          <Lock className="h-3 w-3" /> Premium
        </div>
      </button>

      {/* Recent today list */}
      {(todaysIncome.length > 0 || todaysExpenses.length > 0) && (
        <div className="card-luxe p-4">
          <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Today's log</div>
          <div className="divide-y divide-border/60">
            {[...todaysIncome, ...todaysExpenses]
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .slice(0, 6)
              .map((e) => {
                const isIncome = "paymentMethod" in e;
                return (
                  <div key={e.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="text-sm font-medium">
                        {isIncome ? PAYMENT_METHOD_LABELS[e.paymentMethod] : CATEGORY_LABELS[e.category]}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(e.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {isIncome && e.isTip && " · tip"}
                      </div>
                    </div>
                    <div className={`font-display text-lg ${isIncome ? "text-success" : "text-destructive"}`}>
                      {isIncome ? "+" : "−"}
                      {fmtMoney(e.amount)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionBtn({
  label,
  sub,
  onClick,
  variant,
  icon,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  variant?: "primary";
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-24 flex-col items-start justify-between rounded-md p-3 text-left tap-highlight active:scale-[0.98] transition ${
        variant === "primary"
          ? "bg-gradient-to-br from-brass to-[oklch(0.55_0.16_148)] text-brass-foreground shadow-luxe"
          : "card-luxe text-foreground"
      }`}
    >
      <div className={`grid h-8 w-8 place-items-center rounded-full ${variant === "primary" ? "bg-black/15" : "bg-brass/10 text-brass"}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className={`text-[10px] uppercase tracking-wider ${variant === "primary" ? "opacity-70" : "text-muted-foreground"}`}>
          {sub}
        </div>
      </div>
    </button>
  );
}
