// Core types and Clipper data store (localStorage)
import { useEffect, useState, useCallback } from "react";

export type PaymentMethod = "cash" | "cashApp" | "venmo" | "zelle" | "appleCash" | "applePay" | "other";
export type ExpenseCategory = "clippers" | "products" | "gas" | "boothRent" | "education" | "other";

export interface IncomeEntry {
  id: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  clientNote?: string;
  source: "manual" | "synced";
  confirmed: boolean;
  isTip?: boolean;
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description?: string;
  photoFileName?: string;
  miles?: number;
  tripType?: "business" | "personal";
  startLocation?: string;
  autoLogged?: boolean;
  voided?: boolean;
}

export interface BusinessProfile {
  name: string;
  shopName?: string;
  avgCutsPerDay: number;
  avgRate: number;
  yearsExperience?: number;
  specialty?: string;
}

export interface AppSettings {
  businessCode: string;
  mileageRatePerMile: number;
  mileageRateYear: number;
  boothRentNotificationsOn: boolean;
  reviewQueueBadgeOn: boolean;
  weeklyReceiptPromptOn: boolean;
  preferredPaymentMethods: PaymentMethod[];
  workLocationName?: string;
  workCoords?: { lat: number; lng: number };
}

export interface BoothRentConfig {
  amount: number;
  frequency: "weekly" | "monthly" | "custom";
  dayOfWeek?: number;
  active: boolean;
}

export interface AuthUser {
  email: string;
  name: string;
  isPremium: boolean;
  signedUpAt: string;
}

export interface ClipperStore {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  boothRentConfig?: BoothRentConfig;
  settings: AppSettings;
  profile?: BusinessProfile;
  user?: AuthUser;
  hasCompletedOnboarding: boolean;
  hasCompletedWalkthrough: boolean;
}

const DEFAULT_STORE: ClipperStore = {
  incomeEntries: [],
  expenseEntries: [],
  settings: {
    businessCode: "812111",
    mileageRatePerMile: 0.7,
    mileageRateYear: 2025,
    boothRentNotificationsOn: true,
    reviewQueueBadgeOn: true,
    weeklyReceiptPromptOn: true,
    preferredPaymentMethods: ["cash", "cashApp", "venmo", "zelle"],
  },
  hasCompletedOnboarding: false,
  hasCompletedWalkthrough: false,
};

const STORAGE_KEY = "clipper_store_v1";

function loadStore(): ClipperStore {
  if (typeof window === "undefined") return DEFAULT_STORE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw) as Partial<ClipperStore>;
    return { ...DEFAULT_STORE, ...parsed, settings: { ...DEFAULT_STORE.settings, ...(parsed.settings ?? {}) } };
  } catch {
    return DEFAULT_STORE;
  }
}

function saveStore(s: ClipperStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

type Listener = (s: ClipperStore) => void;
const listeners = new Set<Listener>();
let current: ClipperStore | null = null;

function getCurrent(): ClipperStore {
  if (current === null) current = loadStore();
  return current;
}

function setStore(updater: (s: ClipperStore) => ClipperStore) {
  const next = updater(getCurrent());
  current = next;
  saveStore(next);
  listeners.forEach((l) => l(next));
}

export function useClipperStore() {
  const [state, setState] = useState<ClipperStore>(() => (typeof window === "undefined" ? DEFAULT_STORE : getCurrent()));
  useEffect(() => {
    // Hydrate from localStorage on mount (SSR safety)
    const s = getCurrent();
    setState(s);
    const l: Listener = (s) => setState(s);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const update = useCallback((u: (s: ClipperStore) => ClipperStore) => setStore(u), []);
  return [state, update] as const;
}

// Helpers
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  cashApp: "Cash App",
  venmo: "Venmo",
  zelle: "Zelle",
  appleCash: "Apple Cash",
  applePay: "Apple Pay",
  other: "Other",
};

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  clippers: "Clippers & Tools",
  products: "Hair Products",
  gas: "Gas & Mileage",
  boothRent: "Booth Rent",
  education: "Education",
  other: "Other",
};

export const SCHEDULE_C_LINES: Record<ExpenseCategory, string> = {
  gas: "Line 9",
  boothRent: "Line 20b",
  clippers: "Line 22",
  products: "Line 22",
  education: "Line 27b",
  other: "Line 27b",
};
