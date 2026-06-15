import { useEffect, useRef, useState } from "react";

/** Count up from 0 to target. Re-runs when target changes. */
export function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + (target - from) * eased;
      setV(next);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      fromRef.current = v;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return v;
}
