import { useEffect, useState } from "react";
import { useClipperStore } from "@/lib/clipper-store";
import { ChevronRight } from "lucide-react";

interface Step {
  target: string; // data-walkthrough id
  title: string;
  body: string;
  placement?: "top" | "bottom";
}

const STEPS: Step[] = [
  {
    target: "home-net",
    title: "In Your Pocket",
    body: "Your day's take, minus expenses. Tracked live as you log.",
    placement: "bottom",
  },
  {
    target: "home-actions",
    title: "One-tap logging",
    body: "Log a cut, an expense, or a trip in under five seconds with the custom numpad.",
    placement: "top",
  },
  {
    target: "tab-review",
    title: "Review Queue",
    body: "Premium synced transactions land here first. Classify as Business or Personal — never auto-saved.",
    placement: "top",
  },
  {
    target: "tab-taxes",
    title: "Tax-ready, year-round",
    body: "Schedule C exports, SE tax estimate, and 1099-K reconciliation — built for your preparer.",
    placement: "top",
  },
];

export function Walkthrough() {
  const [store, setStore] = useClipperStore();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const active = store.hasCompletedOnboarding && !store.hasCompletedWalkthrough && !!store.user;
  const step = STEPS[i];

  useEffect(() => {
    if (!active) return;
    const measure = () => {
      const el = document.querySelector(`[data-walkthrough="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    };
    measure();
    const t = setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, step]);

  if (!active) return null;

  const finish = () => setStore((s) => ({ ...s, hasCompletedWalkthrough: true }));
  const next = () => (i === STEPS.length - 1 ? finish() : setI(i + 1));

  const pad = 8;
  const highlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const popTop =
    rect && step.placement === "top"
      ? rect.top - 12 - 160
      : rect
      ? rect.bottom + 16
      : 200;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Dim overlay with cut-out using box-shadow trick */}
      {highlight ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-brass transition-all duration-300"
          style={{
            ...highlight,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/78" />
      )}

      {/* Popover */}
      <div
        className="absolute left-4 right-4 mx-auto max-w-sm card-luxe p-5 shadow-luxe animate-in fade-in slide-in-from-bottom-2"
        style={{ top: Math.max(16, popTop) }}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-brass">
          Step {i + 1} of {STEPS.length}
        </div>
        <div className="font-display text-xl">{step.title}</div>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={finish} className="text-xs text-muted-foreground hover:text-foreground tap-highlight">
            Skip tour
          </button>
          <button
            onClick={next}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-gradient-to-r from-brass to-[oklch(0.6_0.13_55)] px-4 text-sm font-semibold text-brass-foreground tap-highlight active:scale-[0.98]"
          >
            {i === STEPS.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
