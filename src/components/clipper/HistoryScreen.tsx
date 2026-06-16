import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import {
  useClipperStore,
  fmtMoney,
  PAYMENT_METHOD_LABELS,
  CATEGORY_LABELS,
  type IncomeEntry,
  type ExpenseEntry,
} from "@/lib/clipper-store";
import { LogIncomeModal, LogExpenseModal } from "@/components/clipper/LogModals";

type TypeFilter = "all" | "income" | "expense";

export function HistoryScreen() {
  const [store] = useClipperStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);

  const inMonth = (d: string) => {
    const dt = new Date(d);
    return dt.getFullYear() === year && dt.getMonth() === month;
  };
  const monthIncomes = store.incomeEntries.filter((e) => e.confirmed && inMonth(e.date));
  const monthExpenses = store.expenseEntries.filter((e) => !e.voided && inMonth(e.date));
  const totalIn = monthIncomes.reduce((s, e) => s + e.amount, 0);
  const totalOut = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const q = query.trim().toLowerCase();
  const incomes = useMemo(
    () =>
      typeFilter === "expense"
        ? []
        : monthIncomes.filter((e) => {
            if (!q) return true;
            return (
              PAYMENT_METHOD_LABELS[e.paymentMethod].toLowerCase().includes(q) ||
              (e.clientNote ?? "").toLowerCase().includes(q)
            );
          }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthIncomes, typeFilter, q],
  );
  const expenses = useMemo(
    () =>
      typeFilter === "income"
        ? []
        : monthExpenses.filter((e) => {
            if (!q) return true;
            return (
              CATEGORY_LABELS[e.category].toLowerCase().includes(q) ||
              (e.description ?? "").toLowerCase().includes(q)
            );
          }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthExpenses, typeFilter, q],
  );

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
    setQuery("");
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    const target = new Date(year, month + 1, 1);
    if (target > new Date()) return;
    setQuery("");
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
        <button
          onClick={prev}
          className="rounded-full p-2 hover:bg-accent"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="font-display text-xl">
            {new Date(year, month, 1).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
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

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, categories, methods…"
          className="h-11 w-full rounded-md border border-border bg-input/70 pl-10 pr-9 text-sm outline-none focus:border-brass/60"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-1.5">
        {(["all", "income", "expense"] as TypeFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`h-8 rounded-full border px-3 text-xs font-medium capitalize tap-highlight ${
              typeFilter === t
                ? "border-brass/70 bg-brass/15 text-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {days.length === 0 && (
        <div className="card-luxe py-14 text-center text-sm text-muted-foreground">
          {q || typeFilter !== "all" ? "No entries match" : "No entries this month"}
        </div>
      )}

      {days.map(([day, { incomes, expenses }]) => {
        const di = incomes.reduce((s, e) => s + e.amount, 0);
        const de = expenses.reduce((s, e) => s + e.amount, 0);
        return (
          <div key={day} className="card-luxe overflow-hidden">
            <div className="flex items-center justify-between bg-card/40 px-4 py-2.5">
              <div className="text-sm font-medium">
                {new Date(day).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
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
                    <button
                      key={e.id}
                      onClick={() => (isIncome ? setEditingIncome(e) : setEditingExpense(e))}
                      className="flex w-full items-center justify-between px-4 py-3 text-left tap-highlight hover:bg-accent/30"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {isIncome
                            ? PAYMENT_METHOD_LABELS[e.paymentMethod]
                            : CATEGORY_LABELS[e.category]}
                          {isIncome && e.isTip && (
                            <span className="ml-2 rounded-full bg-brass/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-brass">
                              Tip
                            </span>
                          )}
                          {!isIncome && e.photoDataUrl && (
                            <span className="ml-2 rounded-full bg-brass/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-brass">
                              Receipt
                            </span>
                          )}
                        </div>
                        {(isIncome ? e.clientNote : e.description) && (
                          <div className="text-[11px] text-muted-foreground">
                            {isIncome ? e.clientNote : e.description}
                          </div>
                        )}
                      </div>
                      <div
                        className={`font-display text-lg ${isIncome ? "text-success" : "text-destructive"}`}
                      >
                        {isIncome ? "+" : "−"}
                        {fmtMoney(e.amount)}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}

      <LogIncomeModal
        open={!!editingIncome}
        onClose={() => setEditingIncome(null)}
        entry={editingIncome ?? undefined}
      />
      <LogExpenseModal
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        entry={editingExpense ?? undefined}
      />
    </div>
  );
}
