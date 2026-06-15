import { useState } from "react";
import { X, Mail, Lock, User, Scissors, Sparkles } from "lucide-react";
import { useClipperStore, type BusinessProfile } from "@/lib/clipper-store";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "profile";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setStore] = useClipperStore();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [profile, setProfile] = useState<BusinessProfile>({
    name: "",
    shopName: "",
    avgCutsPerDay: 8,
    avgRate: 35,
    yearsExperience: 3,
    specialty: "",
  });

  if (!open) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin") {
      setStore((s) => ({
        ...s,
        user: { email, name: name || email.split("@")[0], isPremium: false, signedUpAt: new Date().toISOString() },
      }));
      onClose();
      return;
    }
    // signup -> profile builder
    setProfile((p) => ({ ...p, name: name || p.name }));
    setMode("profile");
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStore((s) => ({
      ...s,
      user: { email, name: profile.name || name || email.split("@")[0], isPremium: false, signedUpAt: new Date().toISOString() },
      profile,
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-md card-luxe animate-in slide-in-from-bottom duration-300">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-accent tap-highlight"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {mode !== "profile" ? (
          <form onSubmit={handleAuth} className="p-7 pt-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brass to-oxblood">
                <Scissors className="h-5 w-5 text-brass-foreground" />
              </div>
              <div>
                <div className="font-display text-2xl">{mode === "signup" ? "Join Clipper" : "Welcome back"}</div>
                <div className="text-xs text-muted-foreground">
                  {mode === "signup" ? "Built for the chair" : "Sign in to your books"}
                </div>
              </div>
            </div>

            {mode === "signup" && (
              <Field icon={<User className="h-4 w-4" />} value={name} onChange={setName} placeholder="Your name" />
            )}
            <Field icon={<Mail className="h-4 w-4" />} value={email} onChange={setEmail} placeholder="you@email.com" type="email" required />
            <Field icon={<Lock className="h-4 w-4" />} value={password} onChange={setPassword} placeholder="Password" type="password" required />

            <button
              type="submit"
              className="mt-5 h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] font-semibold text-brass-foreground shadow-luxe tap-highlight active:scale-[0.99]"
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "signup" ? "Already have an account? Sign in" : "New to Clipper? Create account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleProfileSave} className="p-7 pt-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brass to-oxblood">
                <Sparkles className="h-5 w-5 text-brass-foreground" />
              </div>
              <div>
                <div className="font-display text-2xl">Build your profile</div>
                <div className="text-xs text-muted-foreground">Helps us tailor your tax estimates</div>
              </div>
            </div>

            <Field
              label="Your name"
              value={profile.name}
              onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
              placeholder="e.g. Marcus"
              required
            />
            <Field
              label="Shop or booth name"
              value={profile.shopName ?? ""}
              onChange={(v) => setProfile((p) => ({ ...p, shopName: v }))}
              placeholder="e.g. Heritage Cuts"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <NumberField
                label="Avg cuts / day"
                value={profile.avgCutsPerDay}
                onChange={(v) => setProfile((p) => ({ ...p, avgCutsPerDay: v }))}
              />
              <NumberField
                label="Avg rate ($)"
                value={profile.avgRate}
                onChange={(v) => setProfile((p) => ({ ...p, avgRate: v }))}
              />
            </div>

            <NumberField
              label="Years in the chair"
              value={profile.yearsExperience ?? 0}
              onChange={(v) => setProfile((p) => ({ ...p, yearsExperience: v }))}
            />

            <Field
              label="Your specialty"
              value={profile.specialty ?? ""}
              onChange={(v) => setProfile((p) => ({ ...p, specialty: v }))}
              placeholder="e.g. Skin fades, beard sculpting"
            />

            <div className="mt-4 rounded-md border border-brass/20 bg-brass/5 p-3 text-xs text-muted-foreground">
              Projected annual gross:{" "}
              <span className="brass-text font-semibold">
                ${(profile.avgCutsPerDay * profile.avgRate * 5 * 50).toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              className="mt-5 h-12 w-full rounded-md bg-gradient-to-r from-brass to-[oklch(0.62_0.18_150)] font-semibold text-brass-foreground shadow-luxe tap-highlight active:scale-[0.99]"
            >
              Save & continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  icon?: React.ReactNode;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="mb-3 block">
      {label && <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>}
      <div className={cn("flex h-12 items-center gap-2 rounded-md border border-border bg-input/70 px-3 focus-within:border-brass/60 focus-within:ring-1 focus-within:ring-brass/40")}>
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input
          className="h-full w-full bg-transparent outline-none placeholder:text-muted-foreground/60"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          required={required}
        />
      </div>
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      <input
        type="number"
        inputMode="decimal"
        className="h-12 w-full rounded-md border border-border bg-input/70 px-3 outline-none focus:border-brass/60 focus:ring-1 focus:ring-brass/40"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}
