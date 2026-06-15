import { useState } from "react";
import { Scissors, ChevronRight, Check } from "lucide-react";
import { useClipperStore, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/clipper-store";

export function OnboardingFlow() {
  const [store, setStore] = useClipperStore();
  const [step, setStep] = useState(0);
  const [methods, setMethods] = useState<PaymentMethod[]>(store.settings.preferredPaymentMethods);
  const [rentAmount, setRentAmount] = useState<string>("");
  const [rentFreq, setRentFreq] = useState<"weekly" | "monthly">("weekly");

  if (store.hasCompletedOnboarding) return null;

  const finish = () => {
    setStore((s) => ({
      ...s,
      hasCompletedOnboarding: true,
      settings: { ...s.settings, preferredPaymentMethods: methods },
      boothRentConfig:
        Number(rentAmount) > 0
          ? { amount: Number(rentAmount), frequency: rentFreq, active: true, dayOfWeek: 5 }
          : s.boothRentConfig,
    }));
  };

  const toggle = (m: PaymentMethod) =>
    setMethods((arr) => (arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m]));

  const methodOptions: PaymentMethod[] = ["cash", "cashApp", "venmo", "zelle", "appleCash", "applePay", "other"];

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div className="pinstripe h-1 w-full opacity-60" />
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-10">
        {step === 0 && (
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brass to-oxblood shadow-luxe">
              <Scissors className="h-9 w-9 text-brass-foreground" />
            </div>
            <h1 className="font-display text-4xl leading-tight">
              <span className="brass-text">Clipper</span>
            </h1>
            <p className="mt-1 text-sm uppercase tracking-[0.25em] text-muted-foreground">Barber Finance, sharpened</p>
            <p className="mt-6 text-base text-foreground/85">
              The only books a self-employed barber actually needs. Daily income, expenses, mileage, and a real
              Schedule C export.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">No bank login. No accountant. About 2 minutes to set up.</p>
          </div>
        )}

        {step === 1 && (
          <div className="mx-auto max-w-md">
            <StepHeader n={1} title="How do clients pay you?" sub="Pick all that apply. We'll show only these when you log income." />
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {methodOptions.map((m) => {
                const on = methods.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => toggle(m)}
                    className={`flex h-14 items-center justify-between rounded-md border px-4 text-left tap-highlight transition ${
                      on
                        ? "border-brass/70 bg-brass/10 text-foreground"
                        : "border-border bg-card/60 text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm font-medium">{PAYMENT_METHOD_LABELS[m]}</span>
                    {on && <Check className="h-4 w-4 text-brass" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-md">
            <StepHeader n={2} title="Do you pay booth rent?" sub="We'll auto-log it on schedule so you never forget." />
            <div className="mt-5">
              <label className="block text-xs font-medium text-muted-foreground">Amount</label>
              <div className="mt-1.5 flex h-14 items-center rounded-md border border-border bg-input/70 px-3">
                <span className="mr-1 font-display text-2xl text-muted-foreground">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="h-full w-full bg-transparent font-display text-2xl outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {(["weekly", "monthly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRentFreq(f)}
                  className={`h-11 flex-1 rounded-md border text-sm font-medium capitalize ${
                    rentFreq === f ? "border-brass/70 bg-brass/10 text-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Skip if you don't rent a booth — you can add this later in Settings.</p>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brass/10 ring-1 ring-brass/30">
              <Check className="h-7 w-7 text-brass" />
            </div>
            <h2 className="font-display text-3xl">You're all set</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your books live on this device. Upgrade to Clipper Premium to auto-sync Cash App, Venmo, and Zelle, plus
              unlock the Schedule C PDF export.
            </p>
            <div className="card-luxe mt-6 p-4 text-left">
              <div className="text-[11px] uppercase tracking-[0.18em] text-brass">Premium preview</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brass" /> Bank-sync Review Queue</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brass" /> Schedule C PDF export</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brass" /> Auto trip detection</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brass" /> Receipt photo vault</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/95 p-5 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="h-12 rounded-md border border-border px-4 text-sm text-muted-foreground tap-highlight"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (step === 3 ? finish() : setStep(step + 1))}
            className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-brass to-[oklch(0.6_0.13_55)] font-semibold text-brass-foreground shadow-luxe tap-highlight active:scale-[0.99]"
          >
            {step === 0 ? "Get started" : step === 3 ? "Open Clipper" : "Continue"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto mt-3 flex max-w-md justify-center gap-1.5">
          {[0, 1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1 rounded-full transition-all ${n === step ? "w-8 bg-brass" : "w-2 bg-border"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-brass">Step {n} of 3</div>
      <h2 className="mt-1 font-display text-3xl leading-tight">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
