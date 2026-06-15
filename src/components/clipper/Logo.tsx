import { cn } from "@/lib/utils";

/**
 * Minimal, refined Clipper monogram.
 * A geometric "C" with an inscribed period — wordmark-style luxury.
 */
export function ClipperMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      aria-label="Clipper"
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="11"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      <path
        d="M27 13.5C25.4 11.9 23.3 11 21 11C16.6 11 13 14.6 13 19V21C13 25.4 16.6 29 21 29C23.3 29 25.4 28.1 27 26.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="28" cy="28" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function ClipperWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display tracking-[-0.045em] text-[18px] font-medium leading-none", className)}>
      Clipper<span className="text-brass">.</span>
    </span>
  );
}
