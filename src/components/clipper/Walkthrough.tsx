import { useEffect, useRef, useState } from "react";
import { useClipperStore } from "@/lib/clipper-store";
import { ChevronRight } from "lucide-react";

type Tab = "home" | "history" | "review" | "taxes" | "settings";

interface Step {
  target: string;
  tab: Tab; // which screen to be on while this step is shown
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: "home-net",
    tab: "home",
    title: "In Your Pocket",
    body: "Your day's take, minus expenses. Tracked live as you log.",
  },
  {
    target: "home-actions",
    tab: "home",
    title: "One-tap logging",
    body: "Log a cut, an expense, or a trip in under five seconds with the custom numpad.",
  },
  {
    target: "tab-review",
    tab: "review",
    title: "Review Queue",
    body: "Synced transactions land here first. Classify as Business or Personal — nothing is auto-saved.",
  },
  {
    target: "tab-taxes",
    tab: "taxes",
    title: "Tax-ready, year-round",
    body: "Schedule C exports, SE tax estimate, and 1099-K reconciliation — built for your preparer.",
  },
];

const POPUP_H = 185;
const POPUP_MARGIN = 14;
const TAB_BAR_H = 90;

interface Props {
  setTab: (tab: Tab) => void;
}

export function Walkthrough({ setTab }: Props) {
  const [store, setStore] = useClipperStore();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const measureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = store.hasCompletedOnboarding && !store.hasCompletedWalkthrough && !!store.user;
  const step = STEPS[i];

  // Switch to the correct tab whenever the step changes
  useEffect(() => {
    if (!active) return;
    setTab(step.tab);
  }, [i, active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Measure the target element — allow extra time for tab re-render
  useEffect(() => {
    if (!active) return;

    const measure = () => {
      const el = document.querySelector(`[data-walkthrough="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    };

    // Clear any pending measurement from the previous step
    if (measureTimerRef.current) clearTimeout(measureTimerRef.current);

    // First pass: quick (tab bar items are always in DOM)
    measure();
    // Second pass: after tab content has rendered
    measureTimerRef.current = setTimeout(measure, 280);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, step, i]);

  if (!active) return null;

  const finish = () => {
    setStore((s) => ({ ...s, hasCompletedWalkthrough: true }));
    setTab("home");
  };
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

  const vh = typeof window !== "undefined" ? window.innerHeight : 844;

  // Smart placement: never overlap the highlighted element
  const popTop = (() => {
    if (!rect) return vh - POPUP_H - TAB_BAR_H - 8;
    const spaceBelow = vh - rect.bottom - TAB_BAR_H - POPUP_MARGIN;
    const spaceAbove = rect.top - POPUP_MARGIN - 16;
    if (spaceBelow >= POPUP_H) return rect.bottom + POPUP_MARGIN;
    if (spaceAbove >= POPUP_H) return rect.top - POPUP_H - POPUP_MARGIN;
    return vh - POPUP_H - TAB_BAR_H - 8;
  })();

  return (
    <div className="fixed inset-0 z-[60]" aria-modal>
      {/* Spotlight — dim everything except the target */}
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
        <div className="pointer-events-none absolute inset-0 bg-black/82" />
      )}

      {/* Tap backdrop to skip */}
      <div className="absolute inset-0" onClick={finish} />

      {/* Tooltip — always clear of the highlighted element */}
      <div
        key={i}
        className="pointer-events-auto absolute left-4 right-4 mx-auto max-w-sm card-luxe p-5 shadow-luxe animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{ top: Math.max(16, popTop) }}
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
