import { Crown, FileDown, FileText, Lock } from "lucide-react";
import { useClipperStore, fmtMoney, PAYMENT_METHOD_LABELS, CATEGORY_LABELS, type PaymentMethod } from "@/lib/clipper-store";

export function TaxesScreen({ onPremium }: { onPremium: (f?: string) => void }) {
  const [store] = useClipperStore();
  const isPremium = store.user?.isPremium;
  const year = new Date().getFullYear();
  const incomes = store.incomeEntries.filter((e) => e.confirmed && new Date(e.date).getFullYear() === year);
  const expenses = store.expenseEntries.filter((e) => !e.voided && new Date(e.date).getFullYear() === year);
  const totalIn = incomes.reduce((s, e) => s + e.amount, 0);
  const totalOut = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIn - totalOut;
  const seTax = Math.max(0, net * 0.9235 * 0.153);
  const tipsTotal = incomes.filter((e) => e.isTip).reduce((s, e) => s + e.amount, 0);
  const tipsDeduction = Math.min(tipsTotal, 25000);

  // by method
  const byMethod = new Map<PaymentMethod, number>();
  incomes.forEach((e) => byMethod.set(e.paymentMethod, (byMethod.get(e.paymentMethod) ?? 0) + e.amount));

  // by category
  const byCat = new Map<string, number>();
  expenses.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));

  // Quarter dates
  const quarters = [
    { label: "Q1", date: new Date(year, 3, 15) },
    { label: "Q2", date: new Date(year, 5, 16) },
    { label: "Q3", date: new Date(year, 8, 15) },
    { label: "Q4", date: new Date(year + 1, 0, 15) },
  ];
  const now = new Date();
  const nextQ = quarters.find((q) => q.date >= now) ?? quarters[0];
  const daysToNextQ = Math.ceil((+nextQ.date - +now) / 86400000);

  const monthIsJan = now.getMonth() === 0;

  return (
    <div className="space-y-4 pb-24">
      <header className="pt-2">
        <div className="text-xs uppercase tracking-[0.22em] text-brass">Taxes · {year}</div>
        <h1 className="mt-1 font-display text-3xl">Year at a glance</h1>
      </header>

      {monthIsJan && (
        <button
          onClick={() => onPremium("Tax Season walkthrough")}
          className="card-luxe flex w-full items-center gap-3 border-brass/40 bg-gradient-to-r from-brass/10 to-transparent p-4 text-left"
        >
          <Crown className="h-5 w-5 text-brass" />
          <div className="flex-1">
            <div className="font-display text-lg">Tax season is here</div>
            <div className="text-xs text-muted-foreground">Reconcile 1099-Ks and prep your preparer packet</div>
          </div>
        </button>
      )}

      {/* Year summary */}
      <div className="card-luxe p-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">In Your Pocket · YTD</div>
        <div className="mt-1 font-display text-4xl brass-text">{fmtMoney(net)}</div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-center">
          <Stat label="Income" value={fmtMoney(totalIn)} tone="success" />
          <Stat label="Deductions" value={fmtMoney(totalOut)} tone="destructive" />
          <Stat label="SE tax est." value={fmtMoney(seTax)} />
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          SE tax = net × 0.9235 × 0.153. Half is deductible from AGI on Schedule 1.
        </p>
      </div>

      {tipsTotal > 0 && (
        <div className="card-luxe border-brass/30 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-brass">2025 Tips Deduction</div>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tips logged</div>
              <div className="font-display text-xl">{fmtMoney(tipsTotal)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Potential deduction</div>
              <div className="font-display text-xl brass-text">{fmtMoney(tipsDeduction)}</div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Goes on Schedule 1-A — tell your preparer.</p>
        </div>
      )}

      {/* By method */}
      <div className="card-luxe p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Income by payment method</div>
        <div className="mt-3 space-y-2.5">
          {[...byMethod.entries()].length === 0 && (
            <div className="text-sm text-muted-foreground">No income logged yet</div>
          )}
          {[...byMethod.entries()].map(([m, v]) => {
            const pct = totalIn > 0 ? (v / totalIn) * 100 : 0;
            const note = METHOD_NOTES[m];
            return (
              <div key={m}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{PAYMENT_METHOD_LABELS[m]}</span>
                  <span className="font-display">{fmtMoney(v)}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-brass to-[oklch(0.5_0.11_50)]" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">{note}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quarter */}
      <div className="card-luxe p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Next estimated payment</div>
        <div className="mt-1.5 flex items-end justify-between">
          <div>
            <div className="font-display text-2xl">{nextQ.label} · {nextQ.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            <div className="text-xs text-muted-foreground">{daysToNextQ} day{daysToNextQ !== 1 ? "s" : ""} away</div>
          </div>
          {daysToNextQ <= 14 && (
            <span className="rounded-full bg-warning/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning">
              Due soon
            </span>
          )}
        </div>
      </div>

      {/* Deductions by Schedule C line */}
      <div className="card-luxe p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Deductions · Schedule C</div>
        <div className="mt-2 divide-y divide-border/60">
          {[...byCat.entries()].map(([c, v]) => (
            <div key={c} className="flex items-center justify-between py-2 text-sm">
              <span>{CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]}</span>
              <span className="font-display">{fmtMoney(v)}</span>
            </div>
          ))}
          {[...byCat.entries()].length === 0 && <div className="py-3 text-sm text-muted-foreground">No expenses yet</div>}
        </div>
      </div>

      {/* Exports */}
      <div className="grid grid-cols-2 gap-2.5">
        <ExportBtn
          icon={<FileText className="h-4 w-4" />}
          label="Schedule C PDF"
          locked={!isPremium}
          onClick={() => (isPremium ? alert("PDF export demo") : onPremium("Schedule C PDF export"))}
        />
        <ExportBtn
          icon={<FileDown className="h-4 w-4" />}
          label="CSV records"
          onClick={() => alert("CSV download (demo)")}
        />
      </div>
    </div>
  );
}

const METHOD_NOTES: Record<PaymentMethod, string> = {
  cashApp: "1099-K issued if >$20K AND >200 txns",
  venmo: "1099-K issued if >$20K AND >200 txns",
  zelle: "No 1099-K — still fully taxable",
  applePay: "Confirm 1099-K status with your bank",
  appleCash: "Confirm 1099-K status with your bank",
  cash: "No 1099-K — self-reported",
  other: "Verify with payer",
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "destructive" }) {
  return (
    <div>
      <div className={`font-display text-lg ${tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : ""}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function ExportBtn({ icon, label, locked, onClick }: { icon: React.ReactNode; label: string; locked?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`card-luxe relative flex h-20 flex-col items-start justify-between p-3 text-left tap-highlight ${
        locked ? "opacity-95" : ""
      }`}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full bg-brass/10 text-brass">{icon}</div>
      <div className="text-sm font-semibold">{label}</div>
      {locked && (
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-brass/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brass">
          <Lock className="h-2.5 w-2.5" /> Premium
        </div>
      )}
    </button>
  );
}
