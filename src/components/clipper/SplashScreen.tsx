import { useEffect, useState } from "react";
import { ClipperMark } from "./Logo";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 350);
    const t2 = setTimeout(() => setPhase("out"), 1300);
    const t3 = setTimeout(onDone, 1650);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
      style={{
        transition: "opacity 350ms ease-out",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.82 0.2 152 / 0.08) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          transition: "opacity 350ms ease-out, transform 500ms cubic-bezier(0.34,1.56,0.64,1)",
          opacity: phase === "in" ? 0 : 1,
          transform: phase === "in" ? "scale(0.82)" : "scale(1)",
        }}
        className="relative flex flex-col items-center gap-5"
      >
        {/* Logo mark with ring */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-[28px] blur-2xl"
            style={{ background: "oklch(0.82 0.2 152 / 0.25)", transform: "scale(1.4)" }}
          />
          <div className="relative grid h-24 w-24 place-items-center rounded-[28px] border border-white/[0.06] bg-card/80 shadow-card">
            <ClipperMark size={52} className="text-brass" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-[28px] tracking-[-0.04em] text-foreground">
            Clipper<span className="text-brass">.</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Your pocket accountant
          </span>
        </div>
      </div>
    </div>
  );
}
