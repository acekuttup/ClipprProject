import { Plus, Minus, Navigation, Sparkles, Lock, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  useClipperStore,
  fmtMoney,
  isSameDay,
  PAYMENT_METHOD_LABELS,
  CATEGORY_LABELS,
} from "@/lib/clipper-store";
import { useCountUp } from "@/lib/use-count-up";

interface Props {
  onLogIncome: () => void;
  onLogExpense: () => void;
  onLogMiles: () => void;
  onPremium: (f?: string) => void;
}

export function HomeScreen({ onLogIncome, onLogExpense, onLogMiles, onPremium }: Props) {
  const [store] = useClipperStore();
  const today = new Date();
  const todaysIncome = store.incomeEntries.filter(
    (e) => e.confirmed && isSameDay(new Date(e.date), today),
  );
  const todaysExpenses = store.expenseEntries.filter(
    (e) => !e.voided && isSameDay(new Date(e.date), today),
  );
  const inToday = todaysIncome.reduce((s, e) => s + e.amount, 0);
  const outToday = todaysExpenses.reduce((s, e) => s + e.amount, 0);
  const net = inToday - outToday;
  const animatedNet = useCountUp(net, 800);
  const reviewCount = store.incomeEntries.filter((e) => !e.confirmed).length;

  const firstName =
    store.profile?.name?.split(" ")[0] ?? store.user?.name?.split(" ")[0] ?? "there";

  const monthIncome = store.incomeEntries
    .filter(
      (e) =>
        e.confirmed &&
        new Date(e.date).getFullYear() === today.getFullYear() &&
        new Date(e.date).getMonth() === today.getMonth(),
    )
    .reduce((s, e) => s + e.amount, 0);
  const goal = store.settings.monthlyIncomeGoal;
  const goalPct = goal ? Math.min(100, (monthIncome / goal) * 100) : 0;

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const income = store.incomeEntries
      .filter((e) => e.confirmed && isSameDay(new Date(e.date), d))
      .reduce((s, e) => s + e.amount, 0);
    const expense = store.expenseEntries
      .filter((e) => !e.voided && isSameDay(new Date(e.date), d))
      .reduce((s, e) => s + e.amount, 0);
    return { label: d.toLocaleDateString("en-US", { weekday: "narrow" }), income, expense };
  });
  const hasWeekActivity = weekData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="space-y-6 pb-28">
      {/* Soft greeting */}
      <header className="pt-6">
        <div className="font-serif text-3xl leading-tight text-foreground/95">
          Hello, <span className="text-brass">{firstName}</span>.
        </div>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </header>

      {reviewCount > 0 && (
        <button className="group flex w-full items-center gap-3 rounded-2xl border border-brass/20 bg-brass/[0.04] p-3 text-left transition hover:bg-brass/[0.08]">
          <span className="relative">
            <Sparkles className="h-4 w-4 text-brass" />
            <span className="absolute -inset-2 -z-10 rounded-full bg-brass/20 blur-md breathe" />
          </span>
          <span className="flex-1 text-sm">
            <strong className="font-medium">{reviewCount}</strong>
            <span className="text-muted-foreground">
              {" "}
              transaction{reviewCount > 1 ? "s" : ""} awaiting review
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-brass" />
        </button>
      )}

      {/* Hero net card with ambient orb */}
      <div
        data-walkthrough="home-net"
        className="relative overflow-hidden rounded-3xl border border-white/[0.05] bg-gradient-to-b from-card to-background p-7 shadow-card noise"
      >
        <div
          className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brass/15 blur-3xl breathe"
          aria-hidden
        />
        <div className="relative">
          <div className="font-eyebrow">In your pocket · today</div>
          <div className="mt-3 font-display text-[56px] font-light leading-none tracking-[-0.04em] tabular-nums">
            <span className="text-foreground">${Math.floor(animatedNet).toLocaleString()}</span>
            <span className="text-foreground/30">
              .{(Math.abs(animatedNet) % 1).toFixed(2).slice(2)}
            </span>
          </div>

          <div className="mt-7 grid grid-cols-2 divide-x divide-white/[0.06]">
            <MiniStat
              label="Earned"
              value={fmtMoney(inToday)}
              count={todaysIncome.length}
              unit="cut"
              tone="up"
            />
            <MiniStat
              label="Spent"
              value={fmtMoney(outToday)}
              count={todaysExpenses.length}
              unit="item"
              tone="down"
              className="pl-5"
            />
          </div>
        </div>
      </div>

      {/* Monthly goal progress */}
      {goal && (
        <div className="card-luxe p-4">
          <div className="flex items-center justify-between">
            <div className="font-eyebrow">Monthly goal</div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {fmtMoney(monthIncome)} <span className="text-foreground/40">/ {fmtMoney(goal)}</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brass to-[oklch(0.5_0.15_148)] transition-all duration-700"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div data-walkthrough="home-actions" className="grid grid-cols-3 gap-2">
        <ActionBtn
          label="Income"
          onClick={onLogIncome}
          variant="primary"
          icon={<Plus className="h-4 w-4" strokeWidth={2.5} />}
        />
        <ActionBtn
          label="Expense"
          onClick={onLogExpense}
          icon={<Minus className="h-4 w-4" strokeWidth={2.5} />}
        />
        <ActionBtn
          label="Mileage"
          onClick={onLogMiles}
          icon={<Navigation className="h-4 w-4" strokeWidth={2.5} />}
        />
      </div>

      {/* Weekly trend */}
      {hasWeekActivity && (
        <Section title="This week">
          <div className="card-luxe p-4">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weekData}
                  barGap={2}
                  margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklab, white 4%, transparent)" }}
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid color-mix(in oklab, white 8%, transparent)",
                      borderRadius: 12,
                      fontSize: 11,
                    }}
                    labelStyle={{ display: "none" }}
                    formatter={(value: number, name: string) => [
                      fmtMoney(value),
                      name === "income" ? "Earned" : "Spent",
                    ]}
                  />
                  <Bar
                    dataKey="income"
                    fill="var(--color-brass)"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={10}
                  />
                  <Bar
                    dataKey="expense"
                    fill="var(--color-destructive)"
                    fillOpacity={0.55}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={10}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>
      )}

      {/* Profile snapshot */}
      {store.profile && (
        <Section title="Your craft">
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/[0.04]">
            <Tile label="Cuts / day" value={String(store.profile.avgCutsPerDay)} />
            <Tile label="Avg rate" value={`$${store.profile.avgRate}`} />
            <Tile label="Years" value={String(store.profile.yearsExperience ?? 0)} />
          </div>
        </Section>
      )}

      {/* Premium teaser */}
      <button
        onClick={() => onPremium("Auto trip detection")}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/[0.05] bg-card p-4 text-left transition hover:border-brass/30"
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brass/[0.08] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brass/10">
            <Navigation className="h-4 w-4 text-brass" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium tracking-tight">Auto Trip Detection</div>
            <div className="font-mono text-[10px] text-muted-foreground">
              Never miss a deductible mile
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-brass/30 px-2 py-0.5 font-mono text-[9px] tracking-wider text-brass">
            <Lock className="h-2.5 w-2.5" /> PRO
          </span>
        </div>
      </button>

      {/* Today's log */}
      {(todaysIncome.length > 0 || todaysExpenses.length > 0) && (
        <Section title="Today">
          <div className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.04] bg-card/40">
            {[...todaysIncome, ...todaysExpenses]
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .slice(0, 6)
              .map((e) => {
                const isIncome = "paymentMethod" in e;
                return (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm tracking-tight">
                        {isIncome
                          ? PAYMENT_METHOD_LABELS[e.paymentMethod]
                          : CATEGORY_LABELS[e.category]}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {new Date(e.date).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {isIncome && e.isTip && " · tip"}
                      </div>
                    </div>
                    <div
                      className={`font-mono text-sm tabular-nums ${isIncome ? "text-success" : "text-destructive"}`}
                    >
                      {isIncome ? "+" : "−"}
                      {fmtMoney(e.amount)}
                    </div>
                  </div>
                );
              })}
          </div>
        </Section>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  count,
  unit,
  tone,
  className,
}: {
  label: string;
  value: string;
  count: number;
  unit: string;
  tone: "up" | "down";
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="font-eyebrow">{label}</div>
      <div
        className={`mt-1 font-display text-2xl font-light tabular-nums ${tone === "up" ? "text-success" : "text-destructive"}`}
      >
        {value}
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
        {count} {unit}
        {count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-eyebrow">{title}</div>
      {children}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-4 text-center">
      <div className="font-display text-2xl font-light tracking-tight">{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  variant,
  icon,
}: {
  label: string;
  onClick: () => void;
  variant?: "primary";
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-20 flex-col items-start justify-between overflow-hidden rounded-2xl p-3 text-left tap-highlight transition-all duration-300 active:scale-[0.97] ${
        variant === "primary"
          ? "bg-brass text-brass-foreground shadow-[0_8px_24px_-12px_var(--color-brass)]"
          : "border border-white/[0.06] bg-card text-foreground hover:border-white/[0.12] hover:bg-card/80"
      }`}
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
          variant === "primary" ? "bg-black/15" : "bg-brass/10 text-brass"
        }`}
      >
        {icon}
      </span>
      <span className="text-[13px] font-medium tracking-tight">{label}</span>
    </button>
  );
}
