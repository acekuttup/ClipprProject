import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useClipperStore, type BoothRentConfig } from "@/lib/clipper-store";
import { Sheet, Numpad, useAmount } from "@/components/clipper/LogModals";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nextWeekdayOnOrAfter(date: Date, dow: number) {
  const d = new Date(date);
  const diff = (dow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function BoothRentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [store, setStore] = useClipperStore();
  const cfg = store.boothRentConfig;
  const amt = useAmount();
  const [frequency, setFrequency] = useState<BoothRentConfig["frequency"]>("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    amt.set(cfg ? String(cfg.amount) : "0");
    setFrequency(cfg?.frequency ?? "weekly");
    setDayOfWeek(cfg?.dayOfWeek ?? 1);
    setActive(cfg?.active ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    if (amt.num <= 0) return;
    const now = new Date();
    let lastLoggedDate: string | undefined;
    if (frequency === "weekly") {
      const firstDue = nextWeekdayOnOrAfter(now, dayOfWeek);
      const last = new Date(firstDue);
      last.setDate(last.getDate() - 7);
      lastLoggedDate = last.toISOString();
    } else if (frequency === "monthly") {
      // Use first of previous month so this month's rent auto-logs immediately if past the 1st
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      lastLoggedDate = last.toISOString();
    }
    setStore((s) => ({
      ...s,
      boothRentConfig: {
        amount: amt.num,
        frequency,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        active,
        lastLoggedDate,
      },
    }));
    onClose();
  };

  const remove = () => {
    setStore((s) => ({ ...s, boothRentConfig: undefined }));
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Booth rent"
      footer={
        <div>
          <Numpad onKey={amt.press} />
          <button
            onClick={save}
            disabled={amt.num <= 0}
            className="mt-4 h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] font-semibold text-brass-foreground shadow-luxe disabled:opacity-40"
          >
            Save booth rent
          </button>
          {cfg && (
            <button
              onClick={remove}
              className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-md text-xs text-destructive/80 tap-highlight hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove booth rent
            </button>
          )}
        </div>
      }
    >
      <div className="mb-4 text-center">
        <div className="font-display text-5xl text-destructive">−${amt.v}</div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {(["weekly", "monthly", "custom"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFrequency(f)}
            className={`h-11 rounded-md border text-sm font-medium capitalize ${
              frequency === f
                ? "border-brass/70 bg-brass/10 text-foreground"
                : "border-border text-muted-foreground bg-card/60"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {frequency === "weekly" && (
        <div className="mb-3">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">Due day</div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => setDayOfWeek(i)}
                className={`h-10 rounded-md border text-[11px] font-medium ${
                  dayOfWeek === i
                    ? "border-brass/70 bg-brass/15 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {frequency === "custom" && (
        <p className="mb-3 rounded-md border border-warning/30 bg-warning/5 p-3 text-[11px] text-muted-foreground">
          Custom schedules aren't auto-logged — log booth rent manually as an expense each time.
        </p>
      )}

      <label className="mb-4 flex items-center justify-between rounded-md border border-border bg-card/60 p-3">
        <div>
          <div className="text-sm font-medium">Auto-log this rent</div>
          <div className="text-[11px] text-muted-foreground">
            Creates the expense automatically when due
          </div>
        </div>
        <button
          onClick={() => setActive((v) => !v)}
          className={`relative h-6 w-11 rounded-full transition ${active ? "bg-brass" : "bg-muted"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${active ? "left-5" : "left-0.5"}`}
          />
        </button>
      </label>
    </Sheet>
  );
}
