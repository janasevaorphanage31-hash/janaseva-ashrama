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
  setQty: (slug: string, qty: number) => void;
  setCustom: (amount: number) => void;
  setCampaign: (c: CartState["campaign"]) => void;
  clear: () => void;
};

const KEY = "janaseva-cart-v1";
const empty: CartState = { qty: {}, custom: 0, campaign: null };
const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ catalog, children }: { catalog: ImpactItem[]; children: ReactNode }) {
  const [state, setState] = useState<CartState>(empty);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        queueMicrotask(() => {
          setState({ ...empty, ...parsed });
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
  const setCampaign = useCallback((campaign: CartState["campaign"]) => setState((s) => ({ ...s, campaign })), []);
  const clear = useCallback(() => setState((s) => ({ ...empty, campaign: s.campaign })), []);

  const value = useMemo<Ctx>(() => {
    const lines = catalog
      .filter((i) => (state.qty[i.slug] ?? 0) > 0)
      .map((item) => ({ item, qty: state.qty[item.slug], subtotal: item.unitPrice * state.qty[item.slug] }));
    const total = lines.reduce((a, l) => a + l.subtotal, 0) + state.custom;
    const count = lines.reduce((a, l) => a + l.qty, 0) + (state.custom > 0 ? 1 : 0);
    return { ...state, catalog, lines, total, count, hydrated, setQty, setCustom, setCampaign, clear };
  }, [state, catalog, hydrated, setQty, setCustom, setCampaign, clear]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
