"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ImpactItem } from "@/lib/seed-data";
import { track } from "@/lib/track";

type CartState = {
  qty: Record<string, number>;
  custom: number; // custom amount in INR (0 = none)
  campaign: { slug: string; title: string } | null;
};

type Ctx = CartState & {
  catalog: ImpactItem[];
  lines: { item: ImpactItem; qty: number; subtotal: number }[];
  total: number;
  count: number;
  hydrated: boolean;
  isBottomDonateOpen: boolean;
  donateInitialAmount: number;
  donateInitialTierId?: string;
  donateInitialPurpose?: string;
  donateInitialOccasion?: string;
  setQty: (slug: string, qty: number) => void;
  setCustom: (amount: number) => void;
  setDedicatedAmount: (amount: number) => void;
  setCampaign: (c: CartState["campaign"]) => void;
  openBottomDonate: (initialAmount?: number, initialTierId?: string, initialPurpose?: string, initialOccasion?: string) => void;
  closeBottomDonate: () => void;
  toggleBottomDonate: () => void;
  clear: () => void;
};

const KEY = "janaseva-cart-v1";
const empty: CartState = { qty: {}, custom: 0, campaign: null };
const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ catalog, children }: { catalog: ImpactItem[]; children: ReactNode }) {
  const [state, setState] = useState<CartState>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [isBottomDonateOpen, setIsBottomDonateOpen] = useState(false);
  const [donateInitialAmount, setDonateInitialAmount] = useState(0);
  const [donateInitialTierId, setDonateInitialTierId] = useState<string | undefined>(undefined);
  const [donateInitialPurpose, setDonateInitialPurpose] = useState<string | undefined>(undefined);
  const [donateInitialOccasion, setDonateInitialOccasion] = useState<string | undefined>(undefined);

  useEffect(() => {
    // 1. Globally persist telecaller referral parameter (?ref=TCxx)
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get("ref");
        if (refParam) {
          const cleanRef = refParam.trim().toUpperCase();
          if (/^[A-Z0-9_-]+$/.test(cleanRef)) {
            sessionStorage.setItem("antigravity_caller_ref", cleanRef);
            localStorage.setItem("antigravity_caller_ref", cleanRef);
          }
        }
      } catch {}
    }

    // 2. Hydrate cart state from localStorage
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const cleanedQty = { ...(parsed.qty || {}) };
        // Purge legacy stale "meal" (₹101) slug if stored from older builds
        if (cleanedQty["meal"] && (!parsed.custom || parsed.custom === 0)) {
          delete cleanedQty["meal"];
        }
        queueMicrotask(() => {
          setState({ ...empty, ...parsed, qty: cleanedQty });
          setHydrated(true);
        });
        return;
      }
    } catch {}
    queueMicrotask(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const setQty = useCallback((slug: string, qty: number) => {
    const q = Math.max(0, Math.min(999, Math.floor(qty)));
    setState((s) => {
      const next = { ...s.qty };
      if (q === 0) delete next[slug];
      else next[slug] = q;
      return { ...s, qty: next };
    });
    if (q > 0) track("item_add", { slug, qty: q });
  }, []);
  const setCustom = useCallback((amount: number) => setState((s) => ({ ...s, custom: Math.max(0, Math.min(500000, Math.floor(amount || 0))) })), []);
  const setDedicatedAmount = useCallback((amount: number) => {
    const validAmount = Math.max(0, Math.min(500000, Math.floor(amount || 0)));
    setState((s) => ({
      qty: {}, // Reset individual items to prevent double-counting or invalid arithmetic additions
      custom: validAmount,
      campaign: s.campaign,
    }));
    setDonateInitialAmount(validAmount);
  }, []);
  const setCampaign = useCallback((campaign: CartState["campaign"]) => setState((s) => ({ ...s, campaign })), []);
  const clear = useCallback(() => setState((s) => ({ ...empty, campaign: s.campaign })), []);

  const openBottomDonate = useCallback((initialAmount?: number, initialTierId?: string, initialPurpose?: string, initialOccasion?: string) => {
    if (initialAmount && initialAmount > 0) {
      const validAmount = Math.max(0, Math.min(500000, Math.floor(initialAmount)));
      setDonateInitialAmount(validAmount);
      // Synchronize cart custom amount and clear old item quantities so Giving Basket matches immediately
      setState((s) => ({
        qty: {},
        custom: validAmount,
        campaign: s.campaign,
      }));
    }
    if (initialTierId) {
      setDonateInitialTierId(initialTierId);
    }
    if (initialPurpose) {
      setDonateInitialPurpose(initialPurpose);
    }
    if (initialOccasion) {
      setDonateInitialOccasion(initialOccasion);
    }
    setIsBottomDonateOpen(true);
    track("bottom_donate_open", {
      initialAmount: initialAmount || 0,
      initialTierId: initialTierId || "",
      initialPurpose: initialPurpose || "",
      initialOccasion: initialOccasion || "",
    });
  }, []);

  const closeBottomDonate = useCallback(() => {
    setIsBottomDonateOpen(false);
  }, []);

  const toggleBottomDonate = useCallback(() => {
    setIsBottomDonateOpen((prev) => !prev);
  }, []);

  const value = useMemo<Ctx>(() => {
    const lines = catalog
      .filter((i) => (state.qty[i.slug] ?? 0) > 0)
      .map((item) => ({ item, qty: state.qty[item.slug], subtotal: item.unitPrice * state.qty[item.slug] }));
    const total = lines.reduce((a, l) => a + l.subtotal, 0) + state.custom;
    const count = lines.reduce((a, l) => a + l.qty, 0) + (state.custom > 0 ? 1 : 0);
    return {
      ...state,
      catalog,
      lines,
      total,
      count,
      hydrated,
      isBottomDonateOpen,
      donateInitialAmount,
      donateInitialTierId,
      donateInitialPurpose,
      donateInitialOccasion,
      setQty,
      setCustom,
      setDedicatedAmount,
      setCampaign,
      openBottomDonate,
      closeBottomDonate,
      toggleBottomDonate,
      clear,
    };
  }, [
    state,
    catalog,
    hydrated,
    isBottomDonateOpen,
    donateInitialAmount,
    donateInitialTierId,
    donateInitialPurpose,
    donateInitialOccasion,
    setQty,
    setCustom,
    setDedicatedAmount,
    setCampaign,
    openBottomDonate,
    closeBottomDonate,
    toggleBottomDonate,
    clear,
  ]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
