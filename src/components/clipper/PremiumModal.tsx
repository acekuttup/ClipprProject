import { useState } from "react";
import { Crown, X, Check } from "lucide-react";
import { useClipperStore } from "@/lib/clipper-store";

export function PremiumModal({ open, onClose, feature }: { open: boolean; onClose: () => void; feature?: string }) {
  const [, setStore] = useClipperStore();
  if (!open) return null;
  const upgrade = () => {
    setStore((s) => (s.user ? { ...s, user: { ...s.user, isPremium: true } } : s));
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="relative w-full max-w-md card-luxe p-6 pb-8 animate-in slide-in-from-bottom">
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brass to-oxblood shadow-luxe">
            <Crown className="h-5 w-5 text-brass-foreground" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-brass">Clipper Premium</div>
            <div className="font-display text-2xl">Sharpen your books</div>
          </div>
        </div>
        {feature && (
          <p className="mb-4 rounded-md border border-brass/25 bg-brass/5 p-3 text-sm">
            <strong className="text-brass">{feature}</strong> is a Premium feature.
          </p>
        )}
        <ul className="space-y-2.5 text-sm">
          {[
            "Auto-sync Cash App, Venmo & Zelle via secure bank link",
            "Schedule C PDF export — ready for your preparer",
            "Receipt photo vault with auto-categorize",
            "Auto trip detection — never miss a deductible mile",
            "1099-K reconciliation with gap detection",
            "Booth rent auto-logging with smart reminders",
          ].map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brass" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-baseline gap-2">
          <div className="font-display text-4xl brass-text">$8.99</div>
          <div className="text-sm text-muted-foreground">/month · cancel anytime</div>
        </div>
        <div className="text-xs text-muted-foreground">Or $79/year · save 27%</div>
        <button
          onClick={upgrade}
          className="mt-5 h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.6_0.13_55)] font-semibold text-brass-foreground shadow-luxe tap-highlight active:scale-[0.99]"
        >
          Start 7-day free trial
        </button>
        <button onClick={onClose} className="mt-2 h-10 w-full text-xs text-muted-foreground hover:text-foreground">
          Maybe later
        </button>
      </div>
    </div>
  );
}

export function usePremiumGate() {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>();
  const gate = (name?: string) => {
    setFeature(name);
    setOpen(true);
  };
  return { open, setOpen, feature, gate };
}
