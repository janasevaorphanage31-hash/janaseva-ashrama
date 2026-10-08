"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "./CartProvider";
import { Container, Head, Section, Chip } from "./ui";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";
import { DonationStrategySuite } from "./DonationStrategySuite";

const QUICK_GIVE_PRESETS = [100, 250, 500, 1000, 2500];

const CATEGORIES = [
  { id: "all", label: "All Needs", icon: "🌟" },
  { id: "Annadana", label: "Food & Annadana", icon: "🍲" },
  { id: "Vidya", label: "Education & Vidya", icon: "📚" },
  { id: "Arogya", label: "Healthcare & Arogya", icon: "🩺" },
  { id: "Ashraya", label: "Shelter & Care", icon: "🏠" },
  { id: "Celebrations", label: "Feasts & Milestones", icon: "🎉" },
];

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

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const giftReference = search.get("giftReference") || "";

  useEffect(() => {
    if (campaign) {
      queueMicrotask(() => setCampaign(campaign));
    }
  }, [campaign, setCampaign]);

  useEffect(() => {
    track("cart_view", { page });
  }, [page]);

  // Compute category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: catalog.length };
    for (const item of catalog) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [catalog]);

  // Priority-sorted and category-filtered catalog: Today's need first, then featured items
  const filtered = useMemo(() => {
    const list =
      selectedCategory === "all"
        ? [...catalog]
        : catalog.filter((item) => item.category === selectedCategory);

    return list.sort((a, b) => {
      if (a.todayNeed && !b.todayNeed) return -1;
      if (!a.todayNeed && b.todayNeed) return 1;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.sortOrder - b.sortOrder;
    });
  }, [catalog, selectedCategory]);

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
    <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm ring-1 border border-teal-900/10 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-teal-900">Your Giving Basket</h3>
          <p className="text-[11px] text-teal-950/60 mt-0.5">100% Direct Ashrama Allocation</p>
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
            Select items from the catalog categories to support nutritious meals, school kits, or medical diagnostics.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2.5 text-xs sm:text-sm text-teal-950 font-mono">
            {lines.map((l) => (
              <li key={l.item.slug} className="flex justify-between items-center gap-2 border-b border-teal-900/5 pb-2">
                <div className="min-w-0">
                  <p className="font-bold text-teal-900 truncate">{l.item.name}</p>
                  <p className="text-[11px] text-teal-950/55">{formatINR(l.item.unitPrice)} × {l.qty}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold">{formatINR(l.subtotal)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQty(l.item.slug, l.qty - 1)}
                      className="h-5 w-5 rounded bg-cream text-teal-900 hover:bg-sand flex items-center justify-center text-xs font-bold"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setQty(l.item.slug, l.qty + 1)}
                      className="h-5 w-5 rounded bg-cream text-teal-900 hover:bg-sand flex items-center justify-center text-xs font-bold"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setQty(l.item.slug, 0)}
                      className="text-xs text-red-700/60 hover:text-red-800 ml-1 p-1"
                      aria-label={`Remove ${l.item.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {custom > 0 && (
              <li className="flex justify-between items-center gap-2 border-b border-teal-900/5 pb-2">
                <div>
                  <p className="font-bold text-teal-900">Custom amount</p>
                  <p className="text-[11px] text-teal-950/55">Direct support</p>
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

          {/* Recommended 1-Tap Add-on */}
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
                    className="focus-ring rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-teal-900 shadow-2xs border border-teal-900/10 hover:bg-gold transition active:scale-95"
                  >
                    + Fruits ({formatINR(150)})
                  </button>
                )}
                {!hasMeal && (
                  <button
                    type="button"
                    onClick={() => setQty("meal", 1)}
                    className="focus-ring rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-teal-900 shadow-2xs border border-teal-900/10 hover:bg-gold transition active:scale-95"
                  >
                    + Warm Meal ({formatINR(100)})
                  </button>
                )}
                {!hasSchoolKit && (
                  <button
                    type="button"
                    onClick={() => setQty("school-kit", 1)}
                    className="focus-ring rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-teal-900 shadow-2xs border border-teal-900/10 hover:bg-gold transition active:scale-95"
                  >
                    + School Kit ({formatINR(250)})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dedication Reminder */}
          <div className="rounded-xl bg-teal-50 p-2.5 text-[11px] text-teal-900 leading-snug flex items-center gap-2">
            <span className="text-base">🎂</span>
            <span>Dedicate this gift for a Birthday or Anniversary during checkout.</span>
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between border-t border-dashed border-teal-900/20 pt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Total Contribution</span>
        <span className="font-display text-2xl sm:text-3xl font-bold text-teal-900" aria-live="polite">
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
        className={`focus-ring block rounded-xl px-5 py-3.5 sm:py-4 text-center text-xs sm:text-sm font-bold tracking-wide text-white transition active:scale-95 ${
          total === 0
            ? "cursor-not-allowed bg-teal-900/30"
            : "bg-saffron shadow-md hover:bg-saffron-dark"
        }`}
      >
        PROCEED TO IMPACT CHECKOUT ({formatINR(total)}) →
      </Link>

      <div className="text-center text-[10px] sm:text-[11px] text-teal-950/60 space-y-1">
        <p className="flex items-center justify-center gap-1 font-semibold text-emerald-800">
          <span>✓</span> Form 10AC 80G Tax Deductible (URN: AABTJ7431MF20231)
        </p>
        <p className="font-medium text-teal-900/85">
          Instant UPI (GPay / PhonePe / Paytm) · Zero Platform Fee · WhatsApp Video Proof
        </p>
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
    <Section id="impact" tone="sand" className="py-10 md:py-16">
      <Container>
        {/* Header */}
        <Head
          eyebrow="Categorized Daily Needs"
          title="Explore Direct Impact Catalogs"
          lead="Choose specific needs from verified Food, Education, Health, and Shelter pillars. Adjust quantities with complete transparency and receive 80G tax benefits."
        />

        {/* Category Pill Filters */}
        <div className="mt-6 mb-8 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] ?? 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`focus-ring inline-flex items-center gap-1.5 rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition active:scale-95 ${
                  isSelected
                    ? "bg-teal-900 text-white shadow-sm ring-2 ring-saffron"
                    : "bg-white text-teal-950/80 border border-teal-900/10 hover:bg-cream"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    isSelected ? "bg-saffron text-white" : "bg-teal-100 text-teal-900"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content Layout: Catalog Grid + Sticky Basket */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] w-full min-w-0">
          <div className="space-y-6 min-w-0 w-full">
            {/* 2-Column Responsive Impact Product Cards Grid */}
            <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-5 w-full min-w-0">
              {filtered.map((item) => {
                const q = qty[item.slug] ?? 0;
                return (
                  <li
                    key={item.slug}
                    className={`flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-white p-2.5 sm:p-4 md:p-5 shadow-xs ring-1 sm:ring-2 transition-all duration-300 hover:shadow-md ${
                      q > 0 ? "ring-saffron" : "ring-teal-900/10 hover:ring-teal-900/25"
                    }`}
                  >
                    <div>
                      {/* Product Card Image Header */}
                      <div className="relative aspect-[4/3] xs:aspect-[16/11] sm:aspect-[16/10] overflow-hidden rounded-xl sm:rounded-2xl bg-teal-900 mb-2 sm:mb-3">
                        <Image
                          src={item.imageUrl || "/media/poster.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover transition duration-300 hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 350px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-transparent to-transparent" />
                        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-wrap items-center gap-1">
                          <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur truncate max-w-[85px] sm:max-w-none">
                            {item.category || "General"}
                          </span>
                          {item.todayNeed && (
                            <span className="rounded-md bg-saffron px-1.5 py-0.5 text-[8px] sm:text-[10px] font-extrabold text-white shadow-2xs">
                              Today
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-display text-xs sm:text-base md:text-lg font-bold text-teal-900 leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs leading-relaxed text-teal-950/70 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="mt-1.5 sm:mt-2.5 flex items-center justify-between text-[9px] sm:text-[10px]">
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-800 ring-1 ring-emerald-600/20 truncate">
                          ✓ 80G Tax
                        </span>
                        <Link
                          href={`/impact/${item.slug}`}
                          className="font-bold text-saffron-dark hover:underline inline-flex items-center gap-0.5 shrink-0"
                        >
                          Details →
                        </Link>
                      </div>
                    </div>

                    {/* Pricing & Quantity Controls */}
                    <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-teal-900/10">
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1.5 sm:gap-2">
                        <div>
                          <p className="font-display text-sm sm:text-lg md:text-xl font-bold text-teal-900">
                            {formatINR(item.unitPrice)}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-teal-950/50 font-semibold truncate">
                            per {item.unitLabel || "unit"}
                          </p>
                        </div>

                        {q === 0 ? (
                          <div className="flex items-center gap-1 w-full xs:w-auto">
                            <button
                              type="button"
                              onClick={() => setQty(item.slug, 1)}
                              className="focus-ring flex-1 xs:flex-none rounded-xl bg-saffron px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white shadow-xs hover:bg-saffron-dark transition active:scale-95 text-center whitespace-nowrap"
                            >
                              + Give
                            </button>
                            <button
                              type="button"
                              onClick={() => setQty(item.slug, 5)}
                              className="hidden sm:inline-block focus-ring rounded-xl bg-cream px-2 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold text-teal-900 border border-teal-900/15 hover:bg-sand transition"
                              title="Add 5 units"
                            >
                              +5
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-0.5 sm:gap-1 rounded-xl bg-teal-100 p-0.5 sm:p-1 w-full xs:w-auto justify-center"
                            role="group"
                            aria-label={`${item.name} quantity`}
                          >
                            <button
                              type="button"
                              aria-label={`Remove one ${item.name}`}
                              onClick={() => setQty(item.slug, q - 1)}
                              className="focus-ring grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg bg-white text-xs sm:text-base font-bold text-teal-900 shadow-2xs"
                            >
                              −
                            </button>
                            <span
                              className="w-5 sm:w-7 text-center font-bold text-teal-900 text-xs sm:text-sm"
                              aria-live="polite"
                            >
                              {q}
                            </span>
                            <button
                              type="button"
                              aria-label={`Add one ${item.name}`}
                              onClick={() => setQty(item.slug, q + 1)}
                              className="focus-ring grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg bg-teal-900 text-xs sm:text-base font-bold text-white shadow-2xs"
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
                No impact items available in this category.
              </div>
            )}

            {/* Quick Impact Fast Path */}
            <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-teal-900/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-teal-900">
                    Quick Impact Presets
                  </h3>
                  <p className="text-xs text-teal-950/65 mt-0.5">
                    Fast 1-tap contribution chips ideal for mobile donors.
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron/15 text-saffron-dark">
                  ⚡
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_GIVE_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustom(amt)}
                    className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition focus-ring active:scale-95 ${
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

        {/* Multi-Strategy Donation Accelerator Suite & Business Plan Exporter */}
        <DonationStrategySuite />
      </Container>
    </Section>
  );
}
