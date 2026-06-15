import { Crown, Inbox } from "lucide-react";
import { useClipperStore, fmtMoney, uid, PAYMENT_METHOD_LABELS } from "@/lib/clipper-store";

export function ReviewScreen({ onPremium }: { onPremium: (f?: string) => void }) {
  const [store, setStore] = useClipperStore();
  const queue = store.incomeEntries.filter((e) => !e.confirmed);
  const isPremium = store.user?.isPremium;

  const seed = () => {
    const samples = [
      { amount: 45, paymentMethod: "cashApp" as const, note: "JaylenP" },
      { amount: 30, paymentMethod: "venmo" as const, note: "tony_dee" },
      { amount: 60, paymentMethod: "zelle" as const, note: "Mike R." },
    ];
    setStore((s) => ({
      ...s,
      incomeEntries: [
        ...s.incomeEntries,
        ...samples.map((x) => ({
          id: uid(),
          amount: x.amount,
          date: new Date().toISOString(),
          paymentMethod: x.paymentMethod,
          clientNote: x.note,
          source: "synced" as const,
          confirmed: false,
        })),
      ],
    }));
  };

  const classify = (id: string, asBusiness: boolean) => {
    setStore((s) => ({
      ...s,
      incomeEntries: asBusiness
        ? s.incomeEntries.map((e) => (e.id === id ? { ...e, confirmed: true } : e))
        : s.incomeEntries.filter((e) => e.id !== id),
    }));
  };

  return (
    <div className="space-y-4 pb-24">
      <header className="pt-2">
        <div className="flex items-center gap-2">
          <div className="text-xs uppercase tracking-[0.22em] text-brass">Review Queue</div>
          {!isPremium && (
            <span className="rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brass">
              <Crown className="mr-0.5 inline h-3 w-3" />
              Premium sync
            </span>
          )}
        </div>
        <h1 className="mt-1 font-display text-3xl">Triage</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Synced transactions never auto-save. Confirm Business or Personal first.
        </p>
      </header>

      {!isPremium && queue.length === 0 && (
        <div className="card-luxe space-y-3 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brass to-oxblood shadow-luxe">
            <Crown className="h-5 w-5 text-brass-foreground" />
          </div>
          <div className="font-display text-xl">Sync Cash App, Venmo & Zelle</div>
          <p className="text-sm text-muted-foreground">
            Premium connects to your bank securely so every digital tip and payment lands here automatically — no
            screenshots, no typing.
          </p>
          <button
            onClick={() => onPremium("Bank-sync Review Queue")}
            className="h-11 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.6_0.13_55)] font-semibold text-brass-foreground shadow-luxe"
          >
            Unlock auto-sync
          </button>
          <button onClick={seed} className="h-9 w-full text-xs text-muted-foreground hover:text-foreground">
            Try with sample data
          </button>
        </div>
      )}

      {queue.length === 0 && isPremium && (
        <div className="card-luxe flex flex-col items-center py-12 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
          <div className="font-display text-xl">All caught up</div>
          <div className="mt-1 text-xs text-muted-foreground">No transactions waiting</div>
        </div>
      )}

      {queue.map((e) => (
        <div key={e.id} className="card-luxe p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-2xl text-success">{fmtMoney(e.amount)}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {PAYMENT_METHOD_LABELS[e.paymentMethod]} · {e.clientNote}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {new Date(e.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => classify(e.id, false)}
              className="h-11 rounded-md border border-border bg-card/60 text-sm text-muted-foreground tap-highlight"
            >
              Personal
            </button>
            <button
              onClick={() => classify(e.id, true)}
              className="h-11 rounded-md bg-gradient-to-r from-brass to-[oklch(0.6_0.13_55)] text-sm font-semibold text-brass-foreground tap-highlight"
            >
              Business
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
