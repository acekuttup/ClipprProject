import { useState } from "react";
import { X, Delete } from "lucide-react";
import {
  useClipperStore,
  uid,
  PAYMENT_METHOD_LABELS,
  CATEGORY_LABELS,
  type PaymentMethod,
  type ExpenseCategory,
} from "@/lib/clipper-store";

function Numpad({ onKey }: { onKey: (k: string) => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onKey(k)}
          className="h-14 rounded-md bg-card/80 font-display text-2xl text-foreground tap-highlight active:bg-accent active:scale-[0.98]"
          aria-label={k === "back" ? "Backspace" : k}
        >
          {k === "back" ? <Delete className="mx-auto h-5 w-5" /> : k}
        </button>
      ))}
    </div>
  );
}

function useAmount() {
  const [v, setV] = useState("0");
  const press = (k: string) => {
    if (k === "back") {
      setV((s) => (s.length <= 1 ? "0" : s.slice(0, -1)));
    } else if (k === ".") {
      if (!v.includes(".")) setV(v + ".");
    } else {
      setV((s) => (s === "0" ? k : s + k));
    }
  };
  return { v, press, num: Number(v) || 0, reset: () => setV("0") };
}

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="w-full card-luxe rounded-b-none p-5 pb-8 animate-in slide-in-from-bottom duration-300">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-xl">{title}</div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LogIncomeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [store, setStore] = useClipperStore();
  const amt = useAmount();
  const [method, setMethod] = useState<PaymentMethod>(store.settings.preferredPaymentMethods[0] ?? "cash");
  const [note, setNote] = useState("");
  const [isTip, setIsTip] = useState(false);

  const save = () => {
    if (amt.num <= 0) return;
    setStore((s) => ({
      ...s,
      incomeEntries: [
        ...s.incomeEntries,
        {
          id: uid(),
          amount: amt.num,
          date: new Date().toISOString(),
          paymentMethod: method,
          clientNote: note || undefined,
          source: "manual",
          confirmed: true,
          isTip,
        },
      ],
    }));
    amt.reset();
    setNote("");
    setIsTip(false);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Log income">
      <div className="mb-4 text-center">
        <div className="font-display text-5xl text-success">${amt.v}</div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {store.settings.preferredPaymentMethods.map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`h-9 rounded-full border px-3 text-xs font-medium ${
              method === m ? "border-brass/70 bg-brass/15 text-foreground" : "border-border text-muted-foreground"
            }`}
          >
            {PAYMENT_METHOD_LABELS[m]}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Client note (optional) — e.g. Regular fade"
        className="mb-3 h-11 w-full rounded-md border border-border bg-input/70 px-3 text-sm outline-none focus:border-brass/60"
      />
      <label className="mb-4 flex items-center justify-between rounded-md border border-border bg-card/60 p-3">
        <div>
          <div className="text-sm font-medium">This is a tip</div>
          <div className="text-[11px] text-muted-foreground">2025: deductible up to $25K on Schedule 1-A</div>
        </div>
        <button
          onClick={() => setIsTip((v) => !v)}
          className={`relative h-6 w-11 rounded-full transition ${isTip ? "bg-brass" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${isTip ? "left-5" : "left-0.5"}`} />
        </button>
      </label>
      <Numpad onKey={amt.press} />
      <button
        onClick={save}
        disabled={amt.num <= 0}
        className="mt-4 h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] font-semibold text-brass-foreground shadow-luxe tap-highlight disabled:opacity-40"
      >
        Save income
      </button>
    </Sheet>
  );
}

export function LogExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setStore] = useClipperStore();
  const amt = useAmount();
  const [cat, setCat] = useState<ExpenseCategory>("clippers");
  const [desc, setDesc] = useState("");

  const save = () => {
    if (amt.num <= 0) return;
    setStore((s) => ({
      ...s,
      expenseEntries: [
        ...s.expenseEntries,
        {
          id: uid(),
          amount: amt.num,
          date: new Date().toISOString(),
          category: cat,
          description: desc || undefined,
        },
      ],
    }));
    amt.reset();
    setDesc("");
    onClose();
  };

  const cats: ExpenseCategory[] = ["clippers", "products", "gas", "boothRent", "education", "other"];

  return (
    <Sheet open={open} onClose={onClose} title="Log expense">
      <div className="mb-4 text-center">
        <div className="font-display text-5xl text-destructive">−${amt.v}</div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`h-12 rounded-md border px-3 text-left text-sm font-medium ${
              cat === c ? "border-brass/70 bg-brass/10 text-foreground" : "border-border text-muted-foreground bg-card/60"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (optional) — e.g. Andis Master Clipper"
        className="mb-3 h-11 w-full rounded-md border border-border bg-input/70 px-3 text-sm outline-none focus:border-brass/60"
      />
      <div className="mb-3 rounded-md border border-dashed border-border bg-card/40 p-3 text-center text-xs text-muted-foreground">
        Tap to attach receipt photo
        <div className="mt-0.5 text-[10px] text-brass">PREMIUM · Receipt vault</div>
      </div>
      <Numpad onKey={amt.press} />
      <button
        onClick={save}
        disabled={amt.num <= 0}
        className="mt-4 h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] font-semibold text-brass-foreground shadow-luxe disabled:opacity-40"
      >
        Save expense
      </button>
    </Sheet>
  );
}

export function LogMilesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [store, setStore] = useClipperStore();
  const [step, setStep] = useState(0);
  const [miles, setMiles] = useState("");

  const save = () => {
    const m = Number(miles) || 0;
    if (m <= 0) return;
    setStore((s) => ({
      ...s,
      expenseEntries: [
        ...s.expenseEntries,
        {
          id: uid(),
          amount: +(m * s.settings.mileageRatePerMile).toFixed(2),
          date: new Date().toISOString(),
          category: "gas",
          description: `${m} mi business trip`,
          miles: m,
          tripType: "business",
        },
      ],
    }));
    setMiles("");
    setStep(0);
    onClose();
  };

  const close = () => {
    setStep(0);
    setMiles("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title="Log a trip">
      {step === 0 && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">Is this trip for work?</p>
          <button
            onClick={() => setStep(1)}
            className="mb-2 h-14 w-full rounded-md border border-brass/40 bg-brass/10 text-left tap-highlight"
          >
            <div className="px-4 font-semibold">Yes — barber business trip</div>
            <div className="px-4 text-xs text-muted-foreground">Supply runs · house calls · classes · 2nd location</div>
          </button>
          <button
            onClick={() => setStep(2)}
            className="h-14 w-full rounded-md border border-border bg-card/60 px-4 text-left text-sm text-muted-foreground tap-highlight"
          >
            Personal trip
          </button>
          <p className="mt-3 rounded-md border border-warning/30 bg-warning/5 p-3 text-[11px] text-muted-foreground">
            <strong className="text-warning">Heads up:</strong> commuting from home to your regular barbershop is NOT
            deductible. Only trips beyond your main shop qualify.
          </p>
        </div>
      )}
      {step === 1 && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Miles driven</label>
          <input
            type="number"
            inputMode="decimal"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            className="mt-1.5 h-16 w-full rounded-md border border-border bg-input/70 px-4 font-display text-3xl outline-none focus:border-brass/60"
            placeholder="0"
            autoFocus
          />
          <div className="mt-3 rounded-md border border-brass/20 bg-brass/5 p-3 text-sm">
            Deduction preview:{" "}
            <span className="brass-text font-semibold">
              ${((Number(miles) || 0) * store.settings.mileageRatePerMile).toFixed(2)}
            </span>
            <span className="text-muted-foreground"> · {store.settings.mileageRatePerMile.toFixed(2)}/mi (2025 IRS)</span>
          </div>
          <button
            onClick={save}
            disabled={!Number(miles)}
            className="mt-4 h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] font-semibold text-brass-foreground shadow-luxe disabled:opacity-40"
          >
            Save trip
          </button>
        </div>
      )}
      {step === 2 && (
        <div>
          <p className="text-sm text-muted-foreground">
            Personal trips aren't deductible — nothing was logged. You can always reclassify later if it was actually for work.
          </p>
          <button onClick={close} className="mt-4 h-12 w-full rounded-md border border-border text-sm">
            Got it
          </button>
        </div>
      )}
    </Sheet>
  );
}
