import { useEffect, useState } from "react";
import { useClipperStore } from "@/lib/clipper-store";
import { ChevronRight } from "lucide-react";

interface Step {
  target: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: "home-net",
    title: "In Your Pocket",
    body: "Your day's take, minus expenses. Tracked live as you log.",
  },
  {
    target: "home-actions",
    title: "One-tap logging",
    body: "Log a cut, an expense, or a trip in under five seconds with the custom numpad.",
  },
  {
    target: "tab-review",
    title: "Review Queue",
    body: "Premium synced transactions land here first. Classify as Business or Personal — never auto-saved.",
  },
  {
    target: "tab-taxes",
    title: "Tax-ready, year-round",
    body: "Schedule C exports, SE tax estimate, and 1099-K reconciliation — built for your preparer.",
  },
];

const POPUP_H = 170;
const POPUP_MARGIN = 12;
const TAB_BAR_H = 80; // bottom tab bar + safe area

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
    const t = setTimeout(measure, 80);
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

  // Smart placement: fully above or fully below — never overlapping the target
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;
  const popTop = (() => {
    if (!rect) return vh - POPUP_H - TAB_BAR_H - 8;
    const spaceBelow = vh - rect.bottom - TAB_BAR_H - POPUP_MARGIN;
    const spaceAbove = rect.top - POPUP_MARGIN - 16;
    if (spaceBelow >= POPUP_H) return rect.bottom + POPUP_MARGIN;
    if (spaceAbove >= POPUP_H) return rect.top - POPUP_H - POPUP_MARGIN;
    // Fallback: float above the tab bar
    return vh - POPUP_H - TAB_BAR_H - 8;
  })();

  return (
    <div className="fixed inset-0 z-[60]" aria-modal>
      {/* Spotlight overlay — cut-out via box-shadow */}
      {highlight ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-brass/80 transition-all duration-300"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/82 pointer-events-none" />
      )}

      {/* Dismiss tap on overlay */}
      <div className="absolute inset-0" onClick={finish} />

      {/* Tooltip card — always outside the highlighted zone */}
      <div
        className="pointer-events-auto absolute left-4 right-4 mx-auto max-w-sm card-luxe p-5 shadow-luxe animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{ top: popTop }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-brass">
          Step {i + 1} of {STEPS.length}
        </div>
        <div className="font-display text-xl">{step.title}</div>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>

        {/* Progress dots */}
        <div className="mt-3 flex items-center gap-1.5">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === i ? "w-4 bg-brass" : idx < i ? "w-1 bg-brass/40" : "w-1 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={finish}
            className="text-xs text-muted-foreground hover:text-foreground tap-highlight"
          >
            Skip tour
          </button>
          <button
            onClick={next}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] px-4 text-sm font-semibold text-brass-foreground tap-highlight active:scale-[0.98]"
          >
            {i === STEPS.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
