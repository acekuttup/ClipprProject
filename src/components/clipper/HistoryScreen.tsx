import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useClipperStore,
  fmtMoney,
  PAYMENT_METHOD_LABELS,
  CATEGORY_LABELS,
  type IncomeEntry,
  type ExpenseEntry,
} from "@/lib/clipper-store";

export function HistoryScreen() {
  const [store] = useClipperStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const inMonth = (d: string) => {
    const dt = new Date(d);
    return dt.getFullYear() === year && dt.getMonth() === month;
  };
  const incomes = store.incomeEntries.filter((e) => e.confirmed && inMonth(e.date));
  const expenses = store.expenseEntries.filter((e) => !e.voided && inMonth(e.date));
  const totalIn = incomes.reduce((s, e) => s + e.amount, 0);
  const totalOut = expenses.reduce((s, e) => s + e.amount, 0);

  // group by day
  const byDay = new Map<string, { incomes: IncomeEntry[]; expenses: ExpenseEntry[] }>();
  [...incomes, ...expenses].forEach((e) => {
    const k = new Date(e.date).toDateString();
    if (!byDay.has(k)) byDay.set(k, { incomes: [], expenses: [] });
    if ("paymentMethod" in e) byDay.get(k)!.incomes.push(e);
    else byDay.get(k)!.expenses.push(e);
  });
  const days = [...byDay.entries()].sort((a, b) => +new Date(b[0]) - +new Date(a[0]));

  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    const target = new Date(year, month + 1, 1);
    if (target > new Date()) return;
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const canNext = !(year === now.getFullYear() && month === now.getMonth());

  return (
    <div className="space-y-4 pb-24">
      <header className="pt-2">
        <div className="text-xs uppercase tracking-[0.22em] text-brass">History</div>
        <h1 className="mt-1 font-display text-3xl">Your record</h1>
      </header>

      <div className="card-luxe flex items-center justify-between p-3">
        <button onClick={prev} className="rounded-full p-2 hover:bg-accent" aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="font-display text-xl">
            {new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            In {fmtMoney(totalIn)} · Out {fmtMoney(totalOut)} ·{" "}
            <span className="text-brass">{fmtMoney(totalIn - totalOut)}</span>
          </div>
        </div>
        <button
          onClick={next}
          disabled={!canNext}
          className="rounded-full p-2 hover:bg-accent disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {days.length === 0 && (
        <div className="card-luxe py-14 text-center text-sm text-muted-foreground">No entries this month</div>
      )}

      {days.map(([day, { incomes, expenses }]) => {
        const di = incomes.reduce((s, e) => s + e.amount, 0);
        const de = expenses.reduce((s, e) => s + e.amount, 0);
        return (
          <div key={day} className="card-luxe overflow-hidden">
            <div className="flex items-center justify-between bg-card/40 px-4 py-2.5">
              <div className="text-sm font-medium">
                {new Date(day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="text-success">+{fmtMoney(di)}</span> ·{" "}
                <span className="text-destructive">−{fmtMoney(de)}</span>
              </div>
            </div>
            <div className="divide-y divide-border/60">
              {[...incomes, ...expenses]
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .map((e) => {
                  const isIncome = "paymentMethod" in e;
                  return (
                    <div key={e.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">
                          {isIncome ? PAYMENT_METHOD_LABELS[e.paymentMethod] : CATEGORY_LABELS[e.category]}
                          {isIncome && e.isTip && (
                            <span className="ml-2 rounded-full bg-brass/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-brass">
                              Tip
                            </span>
                          )}
                        </div>
                        {(isIncome ? e.clientNote : e.description) && (
                          <div className="text-[11px] text-muted-foreground">
                            {isIncome ? e.clientNote : e.description}
                          </div>
                        )}
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
        );
      })}
    </div>
  );
}
