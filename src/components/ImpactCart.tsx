"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "./CartProvider";
import { Container, Head, Section, Chip } from "./ui";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";

const QUICK_GIVE_PRESETS = [100, 250, 500, 1000, 2500];

export function ImpactCart({
  campaign,
  missionSlug,
  page = false,
}: {
  campaign?: { slug: string; title: string } | null;
  missionSlug?: string | null;
  page?: boolean;
}) {
  const cart = useCart();
  const search = useSearchParams();
  const { catalog, lines, total, qty, custom, setQty, setCustom, setCampaign, hydrated } = cart;

  const giftReference = search.get("giftReference") || "";

  useEffect(() => {
    if (campaign) {
      queueMicrotask(() => setCampaign(campaign));
    }
  }, [campaign, setCampaign]);

  useEffect(() => {
    track("cart_view", { page });
  }, [page]);

  // Clean priority-sorted catalog: Today's need first, then featured items
  const filtered = useMemo(() => {
    return [...catalog].sort((a, b) => {
      if (a.todayNeed && !b.todayNeed) return -1;
      if (!a.todayNeed && b.todayNeed) return 1;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.sortOrder - b.sortOrder;
    });
  }, [catalog]);

  const itemCount = useMemo(() => {
    return lines.reduce((acc, l) => acc + l.qty, 0) + (custom > 0 ? 1 : 0);
  }, [lines, custom]);

  const checkoutHref = (() => {
    const params = new URLSearchParams();
    if (missionSlug) params.set("mission", missionSlug);
    if (giftReference) params.set("giftReference", giftReference);
    const qs = params.toString();
    return qs ? `/checkout?${qs}` : "/checkout";
  })();

  const hasFruits = lines.some((l) => l.item.slug === "fruits");
  const hasMeal = lines.some((l) => l.item.slug === "meal");
  const hasSchoolKit = lines.some((l) => l.item.slug === "school-kit");

  const summary = (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 border border-teal-900/10 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-teal-900">Your Giving Basket</h3>
          <p className="text-[11px] text-teal-950/60 mt-0.5">Direct Ashrama Allocation</p>
        </div>
        {giftReference && <Chip tone="orange">Gift ready</Chip>}
      </div>

      {cart.campaign && (
        <p className="flex items-start justify-between gap-2 rounded-xl bg-saffron/10 px-3 py-2 text-xs font-semibold text-saffron-dark">
          <span>Supporting campaign: {cart.campaign.title}</span>
          <button className="underline hover:text-teal-900" onClick={() => cart.setCampaign(null)}>
            remove
          </button>
        </p>
      )}

      {!hydrated || total === 0 ? (
        <div className="rounded-2xl bg-cream p-4 text-center">
          <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-teal-900">Your basket is waiting</p>
          <p className="mt-1 text-xs text-teal-950/65 leading-relaxed">
            Select items from the catalog on the left to support nutritious meals, school kits, or healthcare.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2.5 text-sm text-teal-950 font-mono">
            {lines.map((l) => (
              <li key={l.item.slug} className="flex justify-between items-center gap-2 border-b border-teal-900/5 pb-2">
                <div className="min-w-0">
                  <p className="font-bold text-teal-900 truncate">{l.item.name}</p>
                  <p className="text-xs text-teal-950/55">{formatINR(l.item.unitPrice)} × {l.qty}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold">{formatINR(l.subtotal)}</span>
                  <button
                    type="button"
                    onClick={() => setQty(l.item.slug, 0)}
                    className="text-xs text-red-700/60 hover:text-red-800 ml-1 p-1"
                    aria-label={`Remove ${l.item.name}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
            {custom > 0 && (
              <li className="flex justify-between items-center gap-2 border-b border-teal-900/5 pb-2">
                <div>
                  <p className="font-bold text-teal-900">Custom amount</p>
                  <p className="text-xs text-teal-950/55">Direct support</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold">{formatINR(custom)}</span>
                  <button
                    type="button"
                    onClick={() => setCustom(0)}
                    className="text-xs text-red-700/60 hover:text-red-800 ml-1 p-1"
                    aria-label="Remove custom amount"
                  >
                    ✕
                  </button>
                </div>
              </li>
            )}
          </ul>

          {/* GiveA Pattern: Recommended 1-Tap Add-on */}
          {(!hasFruits || !hasMeal || !hasSchoolKit) && (
            <div className="rounded-2xl bg-sand/40 p-3 text-xs border border-teal-900/10">
              <p className="font-bold text-teal-900 flex items-center gap-1.5">
                <svg className="h-4 w-4 text-saffron-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Recommended Bundle Add-on:</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {!hasFruits && (
                  <button
                    type="button"
                    onClick={() => setQty("fruits", 1)}
                    className="focus-ring rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-teal-900 shadow-sm border border-teal-900/10 hover:bg-gold transition active:scale-95"
                  >
                    + Fruit Basket ({formatINR(150)})
                  </button>
                )}
                {!hasMeal && (
                  <button
                    type="button"
                    onClick={() => setQty("meal", 1)}
                    className="focus-ring rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-teal-900 shadow-sm border border-teal-900/10 hover:bg-gold transition active:scale-95"
                  >
                    + Warm Meal ({formatINR(100)})
                  </button>
                )}
                {!hasSchoolKit && (
                  <button
                    type="button"
                    onClick={() => setQty("school-kit", 1)}
                    className="focus-ring rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-teal-900 shadow-sm border border-teal-900/10 hover:bg-gold transition active:scale-95"
                  >
                    + School Kit ({formatINR(250)})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dedication Reminder */}
          <div className="rounded-xl bg-teal-50 p-2.5 text-[11px] text-teal-900 leading-snug flex items-center gap-2">
            <svg className="h-4 w-4 fill-current text-teal-800 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
            </svg>
            <span>You can dedicate this gift on a Birthday or Anniversary during checkout.</span>
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between border-t border-dashed border-teal-900/20 pt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Total Contribution</span>
        <span className="font-display text-3xl font-bold text-teal-900" aria-live="polite">
          {formatINR(hydrated ? total : 0)}
        </span>
      </div>

      <Link
        href={checkoutHref}
        aria-disabled={total === 0}
        onClick={(e) => {
          if (total === 0) e.preventDefault();
          else track("checkout_start", { total });
        }}
        className={`focus-ring block rounded-xl px-6 py-4 text-center text-sm font-bold tracking-wide text-white transition active:scale-95 ${
          total === 0
            ? "cursor-not-allowed bg-teal-900/30"
            : "bg-saffron shadow-lg hover:bg-saffron-dark"
        }`}
      >
        PROCEED TO IMPACT CHECKOUT ({formatINR(total)}) →
      </Link>

      <div className="text-center text-[11px] text-teal-950/60 space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-semibold text-emerald-800">
          <span>✓</span> Form 10AC 80G Tax Deductible (URN: AABTJ7431MF20231)
        </p>
        <p className="font-medium text-teal-900/85">
          Instant UPI (GPay / PhonePe / Paytm) · Zero Platform Fee · WhatsApp Video Proof
        </p>
        <p>256-bit SSL encrypted · Official 80G receipt sent to WhatsApp &amp; Email</p>
      </div>

      {total > 0 && (
        <button
          onClick={cart.clear}
          className="block w-full text-center text-xs text-teal-900/50 hover:text-teal-900 underline pt-1"
        >
          Clear all items
        </button>
      )}
    </div>
  );

  return (
    <Section id="impact" tone="sand" className="py-12 md:py-16">
      <Container>
        {/* Section 10: EXPLORE IMPACT */}
        <Head
          eyebrow="Real Daily Needs"
          title="Explore Impact"
          lead="Choose what you'd like to support from verified daily needs. Adjust quantities, review transparent breakdowns, and give with complete clarity."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] w-full min-w-0">
          <div className="space-y-6 min-w-0 w-full">
            {/* Premium Impact Product Cards Grid */}
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full min-w-0">
              {filtered.map((item) => {
                const q = qty[item.slug] ?? 0;
                return (
                  <li
                    key={item.slug}
                    className={`flex flex-col justify-between rounded-3xl bg-white p-4 sm:p-5 shadow-sm ring-2 transition-all duration-300 hover:shadow-md ${
                      q > 0 ? "ring-saffron" : "ring-teal-900/10 hover:ring-teal-900/25"
                    }`}
                  >
                    <div>
                      {/* Product Card Image Header */}
                      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-teal-900 mb-3">
                        <Image
                          src={item.imageUrl || "/media/poster.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 350px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="rounded-md bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur">
                            {item.category || "General"}
                          </span>
                          {item.todayNeed && (
                            <span className="rounded-md bg-saffron px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow">
                              Today&apos;s Need
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-display text-lg sm:text-xl font-bold text-teal-900 leading-snug">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-teal-950/70 line-clamp-2">
                        {item.description}
                      </p>

                      {item.operationalMeaning && (
                        <p className="mt-2 rounded-xl bg-sand/50 p-2 text-[11px] text-teal-950/80 leading-relaxed border-l-2 border-saffron line-clamp-2">
                          {item.operationalMeaning}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-600/20">
                          ✓ 80G Tax Exemption
                        </span>
                        <Link
                          href={`/impact/${item.slug}`}
                          className="text-xs font-bold text-saffron-dark hover:underline inline-flex items-center gap-1"
                        >
                          Breakdown →
                        </Link>
                      </div>
                    </div>

                    {/* Pricing & Quantity Controls */}
                    <div className="mt-4 pt-3 border-t border-teal-900/10">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-display text-xl font-bold text-teal-900">
                            {formatINR(item.unitPrice)}
                          </p>
                          <p className="text-[10px] text-teal-950/50 font-semibold">
                            per {item.unitLabel || "support unit"}
                          </p>
                        </div>

                        {q === 0 ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setQty(item.slug, 1)}
                              className="focus-ring rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white shadow hover:bg-saffron-dark transition active:scale-95"
                            >
                              MAKE AN IMPACT
                            </button>
                            <button
                              type="button"
                              onClick={() => setQty(item.slug, 5)}
                              className="focus-ring rounded-xl bg-cream px-2.5 py-2 text-[11px] font-bold text-teal-900 border border-teal-900/15 hover:bg-sand transition"
                              title="Add 5 units"
                            >
                              +5
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-1 rounded-xl bg-teal-100 p-1"
                            role="group"
                            aria-label={`${item.name} quantity`}
                          >
                            <button
                              type="button"
                              aria-label={`Remove one ${item.name}`}
                              onClick={() => setQty(item.slug, q - 1)}
                              className="focus-ring grid h-8 w-8 place-items-center rounded-lg bg-white text-base font-bold text-teal-900 shadow-sm"
                            >
                              −
                            </button>
                            <span
                              className="w-7 text-center font-bold text-teal-900 text-sm"
                              aria-live="polite"
                            >
                              {q}
                            </span>
                            <button
                              type="button"
                              aria-label={`Add one ${item.name}`}
                              onClick={() => setQty(item.slug, q + 1)}
                              className="focus-ring grid h-8 w-8 place-items-center rounded-lg bg-teal-900 text-base font-bold text-white shadow-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {filtered.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center text-sm text-teal-950/70 shadow-sm">
                No impact items available at this time.
              </div>
            )}

            {/* Section 15: QUICK IMPACT (Mobile Fast Path) */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-teal-900">
                    Quick Impact
                  </h3>
                  <p className="text-xs text-teal-950/65 mt-0.5">
                    Fast contribution presets ideal for QR code and mobile visitors.
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron/15 text-saffron-dark">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </div>

              {/* Preset Chips (Section 15 Requirement: ₹100, ₹250, ₹500, ₹1000, ₹2500, Custom) */}
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_GIVE_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustom(amt)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition focus-ring active:scale-95 ${
                      custom === amt
                        ? "bg-saffron text-white shadow-md font-extrabold"
                        : "bg-cream text-teal-900 border border-teal-900/15 hover:bg-sand"
                    }`}
                  >
                    {formatINR(amt)}
                  </button>
                ))}
              </div>

              {/* Custom Numeric Input */}
              <div className="pt-2">
                <label
                  htmlFor="custom-inp"
                  className="block text-xs font-bold uppercase tracking-wider text-teal-900/60 mb-1"
                >
                  Or enter your own custom amount (₹10 to ₹5,00,000)
                </label>
                <div className="flex items-center rounded-2xl border-2 border-teal-900/15 bg-cream px-4 focus-within:border-teal-800">
                  <span className="text-lg font-bold text-teal-900">₹</span>
                  <input
                    id="custom-inp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter custom amount"
                    value={custom > 0 ? String(custom) : ""}
                    onChange={(e) => setCustom(Number(e.target.value.replace(/\D/g, "")))}
                    className="w-full bg-transparent px-3 py-3 text-base sm:text-lg font-bold text-teal-900 outline-none"
                  />
                  {custom > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustom(0)}
                      className="text-xs text-teal-900/50 hover:text-teal-900 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Basket Summary (Right Rail on Desktop) */}
          <div className="lg:sticky lg:top-28 lg:self-start w-full min-w-0">
            {summary}
          </div>
        </div>
      </Container>
    </Section>
  );
}
