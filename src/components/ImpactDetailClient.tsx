"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { Container, Section } from "./ui";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";
import type { ImpactItem } from "@/lib/seed-data";

interface MediaItem {
  type: "image" | "video";
  url: string;
  poster?: string;
  caption?: string;
}

interface SchemeTier {
  id: string;
  title: string;
  qty: number;
  description: string;
  popular?: boolean;
}

export function ImpactDetailClient({
  item,
  relatedItems,
}: {
  item: ImpactItem;
  relatedItems: ImpactItem[];
}) {
  const router = useRouter();
  const cart = useCart();
  const existingQty = cart.qty[item.slug] || 0;
  const [selectedQty, setSelectedQty] = useState(existingQty > 0 ? existingQty : 1);
  const [addedToast, setAddedToast] = useState(false);

  // Parse Media Gallery
  const mediaList: MediaItem[] = parseMediaGallery(item);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const activeMedia = mediaList[activeMediaIndex] || mediaList[0];

  // Parse or Generate Marketing Donation Schemes
  const schemes: SchemeTier[] = parseDonationSchemes(item);

  const subtotal = item.unitPrice * selectedQty;

  const handleQtyChange = (val: number) => {
    const q = Math.max(1, Math.min(999, Math.floor(val)));
    setSelectedQty(q);
  };

  const handleSelectScheme = (scheme: SchemeTier) => {
    handleQtyChange(scheme.qty);
    track("select_scheme", { slug: item.slug, scheme: scheme.id, qty: scheme.qty });
  };

  const handleAddToCart = () => {
    cart.setQty(item.slug, selectedQty);
    track("item_add", { slug: item.slug, qty: selectedQty, source: "detail_page" });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleGiveNow = () => {
    cart.setQty(item.slug, selectedQty);
    track("checkout_start", { slug: item.slug, qty: selectedQty, from: "detail_give_now" });
    router.push("/checkout");
  };

  return (
    <Section tone="cream" className="pt-4 pb-24">
      <Container className="max-w-5xl">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-teal-900/60">
          <Link href="/" className="hover:text-teal-900 transition">Home</Link>
          <span>/</span>
          <Link href="/impact" className="hover:text-teal-900 transition">Today&apos;s Needs</Link>
          <span>/</span>
          <span className="text-teal-900 font-bold">{item.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* 1. Interactive Multi-Media Display (Image or Video) */}
            <div className="overflow-hidden rounded-3xl bg-teal-950 shadow-md">
              <div className="relative h-72 w-full sm:h-96 bg-teal-950 flex items-center justify-center">
                {activeMedia.type === "video" ? (
                  <div className="relative h-full w-full">
                    {activeMedia.url.includes("youtube.com") || activeMedia.url.includes("youtu.be") ? (
                      <iframe
                        src={activeMedia.url}
                        title={item.name}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={activeMedia.url}
                        poster={activeMedia.poster || item.imageUrl || "/media/poster.jpg"}
                        controls
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <Image
                      src={activeMedia.url}
                      alt={activeMedia.caption || item.name}
                      fill
                      priority
                      className="object-cover opacity-90 transition duration-300"
                      sizes="(max-width: 1024px) 100vw, 600px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-transparent to-transparent pointer-events-none" />
                  </>
                )}

                {/* Overlaid badges */}
                <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
                      {item.category || "Care"}
                    </span>
                    {item.todayNeed && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-saffron px-2.5 py-0.5 text-xs font-bold text-white shadow">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Today&apos;s Urgent Need
                      </span>
                    )}
                  </div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
                    {item.name}
                  </h1>
                </div>
              </div>

              {/* Multi-Media Thumbnail Carousel Strip */}
              {mediaList.length > 1 && (
                <div className="bg-teal-900/60 p-3 border-t border-teal-800/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-teal-200/80 mb-2">
                    Media Gallery & Documentary Proof:
                  </p>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                    {mediaList.map((m, idx) => (
                      <button
                        key={m.url + idx}
                        type="button"
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                          activeMediaIndex === idx
                            ? "border-gold shadow-md scale-105"
                            : "border-white/20 opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`View media ${idx + 1}`}
                      >
                        {m.type === "video" ? (
                          <div className="flex h-full w-full items-center justify-center bg-teal-950 text-gold">
                            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        ) : (
                          <Image
                            src={m.url}
                            alt={`Thumbnail ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        )}
                        {m.type === "video" && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[8px] font-bold text-white">
                            VIDEO
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
              <h2 className="font-display text-lg font-bold text-teal-900 mb-2">
                About This Need
              </h2>
              <p className="text-sm text-teal-950/80 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Operational Impact Breakdown */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
              <h2 className="font-display text-lg font-bold text-teal-900">
                What this makes possible
              </h2>
              <p className="mt-2 text-sm text-teal-950/75 leading-relaxed">
                {item.operationalMeaning ||
                  "Every unit contributed directly supports real daily operations at Janaseva Ashrama, ensuring dignity, stability, and care for every resident."}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-cream p-4 border border-teal-900/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-saffron-dark">Direct Ashrama Provision</p>
                  <p className="mt-1 text-xs text-teal-950/70">
                    No middlemen or third-party sourcing fees. Supplies are procured directly by resident caretakers.
                  </p>
                </div>
                <div className="rounded-2xl bg-cream p-4 border border-teal-900/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Dignity & Child Safeguarding</p>
                  <p className="mt-1 text-xs text-teal-950/70">
                    Children are never treated as emotional conversion props. Needs are met with genuine respect and affection.
                  </p>
                </div>
              </div>
            </div>

            {/* Transparent Cost Accounting Block */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-teal-900">
                    Why {formatINR(item.unitPrice)} per unit?
                  </h2>
                  <p className="text-xs text-teal-900/60 font-semibold mt-0.5">
                    Transparent operational accounting definition
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <span>✓</span> Verified by Finance
                </span>
              </div>

              <p className="mt-3 text-sm text-teal-950/75 leading-relaxed">
                {item.accountingMeaning ||
                  `This unit cost covers the verified purchase and delivery of one ${item.unitLabel || "unit"} as accounted by the Ashrama trust operations.`}
              </p>

              <ul className="mt-4 space-y-2 border-t border-teal-900/10 pt-3 text-xs text-teal-900/80">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Form 10AC Provisional 80G tax benefit applicable</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Direct Ashrama account settlement via Razorpay</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Server-side verification preventing duplicate debit</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Strategic Donation Schemes & Giving Action */}
          <aside className="space-y-5 lg:sticky lg:top-20 h-fit">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
              {/* Unit Base Price */}
              <div className="flex items-baseline justify-between border-b border-teal-900/10 pb-4">
                <div>
                  <span className="font-display text-3xl font-bold text-teal-900">
                    {formatINR(item.unitPrice)}
                  </span>
                  <span className="text-xs font-semibold text-teal-900/60 ml-1.5">
                    / {item.unitLabel || "unit"}
                  </span>
                </div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                  80G Eligible
                </span>
              </div>

              {/* 2. Strategic Donation Schemes (Marketing Tiers) */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-teal-900/70">
                    Select Giving Scheme:
                  </label>
                  <span className="text-[10px] font-bold text-saffron-dark uppercase tracking-wider">
                    High-Impact Schemes
                  </span>
                </div>

                <div className="space-y-2">
                  {schemes.map((scheme) => {
                    const isSelected = selectedQty === scheme.qty;
                    const schemeTotal = item.unitPrice * scheme.qty;
                    return (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() => handleSelectScheme(scheme)}
                        className={`focus-ring w-full rounded-2xl p-3 text-left transition border ${
                          isSelected
                            ? "border-saffron bg-saffron/10 ring-2 ring-saffron shadow-sm"
                            : "border-teal-900/10 bg-cream/40 hover:bg-cream"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-teal-900">
                              {scheme.title}
                            </span>
                            {scheme.popular && (
                              <span className="rounded bg-saffron px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                Popular
                              </span>
                            )}
                          </div>
                          <span className="font-display font-bold text-sm text-saffron-dark">
                            {formatINR(schemeTotal)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-teal-950/65 leading-tight">
                          {scheme.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Custom Quantity Controls */}
              <div className="mt-5 pt-4 border-t border-teal-900/10">
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-2">
                  Or Customize Number of Units:
                </label>

                {/* Stepper & Input */}
                <div className="flex items-center rounded-2xl border-2 border-teal-900/15 bg-cream p-1.5">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(selectedQty - 1)}
                    disabled={selectedQty <= 1}
                    className="h-10 w-10 rounded-xl bg-white font-bold text-teal-900 shadow-sm transition hover:bg-teal-50 disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={selectedQty}
                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                    className="w-full bg-transparent text-center font-display text-lg font-bold text-teal-900 outline-none"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange(selectedQty + 1)}
                    disabled={selectedQty >= 999}
                    className="h-10 w-10 rounded-xl bg-teal-900 font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="mt-5 rounded-2xl bg-sand/60 p-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-teal-900/70 uppercase tracking-wider">Total Contribution</span>
                  <span className="font-display text-2xl font-bold text-teal-900">{formatINR(subtotal)}</span>
                </div>
                <p className="mt-1 text-[11px] text-teal-950/60">
                  Supports {selectedQty} {selectedQty === 1 ? (item.unitLabel || "unit") : `${item.unitLabel || "unit"}s`} for Janaseva Ashrama
                </p>
              </div>

              {/* Actions */}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={handleGiveNow}
                  className="focus-ring w-full rounded-xl bg-saffron px-6 py-4 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-saffron-dark active:scale-95"
                >
                  GIVE NOW ({formatINR(subtotal)})
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="focus-ring w-full rounded-xl border-2 border-teal-900/20 bg-white px-6 py-3.5 text-sm font-bold text-teal-900 transition hover:bg-cream active:scale-95"
                >
                  ADD TO IMPACT BASKET
                </button>

                {addedToast && (
                  <div className="rounded-xl bg-emerald-100 p-2.5 text-center text-xs font-bold text-emerald-900 animate-fade-in">
                    ✓ Added to your basket! Review or checkout anytime.
                  </div>
                )}
              </div>

              {/* Occasion prompt */}
              <div className="mt-4 border-t border-teal-900/10 pt-4 text-center">
                <p className="text-xs text-teal-950/70">
                  Giving for a birthday or milestone?
                </p>
                <Link
                  href="/celebrate-birthday"
                  className="mt-1 inline-block text-xs font-bold text-saffron-dark hover:underline"
                >
                  Explore Birthday Feasts &amp; Visits →
                </Link>
              </div>
            </div>

            {/* Basket status snippet */}
            {cart.total > 0 && (
              <div className="rounded-2xl bg-teal-900 p-4 text-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-200">Basket Total ({cart.count} items)</p>
                  <p className="font-display text-lg font-bold">{formatINR(cart.total)}</p>
                </div>
                <Link
                  href="/checkout"
                  className="rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white shadow hover:bg-saffron-dark"
                >
                  Proceed to Checkout →
                </Link>
              </div>
            )}
          </aside>
        </div>

        {/* Related Needs */}
        {relatedItems.length > 0 && (
          <div className="mt-16 pt-8 border-t border-teal-900/10">
            <h2 className="font-display text-xl font-bold text-teal-900 mb-6">
              Other Verified Needs Today
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedItems.slice(0, 3).map((rel) => (
                <div
                  key={rel.slug}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-teal-950 mb-3">
                      <Image
                        src={rel.imageUrl || "/media/poster.jpg"}
                        alt={rel.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900/60">
                      {rel.category || "Care"}
                    </span>
                    <h3 className="font-display text-base font-bold text-teal-900 mt-1">
                      {rel.name}
                    </h3>
                    <p className="text-xs text-teal-950/70 mt-1 line-clamp-2">
                      {rel.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-teal-900/10 flex items-center justify-between">
                    <span className="font-display font-bold text-teal-900 text-sm">
                      {formatINR(rel.unitPrice)}
                    </span>
                    <Link
                      href={`/impact/${rel.slug}`}
                      className="rounded-xl bg-teal-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                    >
                      View Need →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}

/** Parses gallery string or creates curated Ashrama media gallery */
function parseMediaGallery(item: ImpactItem): MediaItem[] {
  const result: MediaItem[] = [];
  const primaryImg = item.imageUrl || "/media/poster.jpg";
  result.push({ type: "image", url: primaryImg, caption: item.name });

  if (item.gallery) {
    try {
      if (item.gallery.startsWith("[")) {
        const parsed = JSON.parse(item.gallery);
        if (Array.isArray(parsed)) {
          for (const p of parsed) {
            if (typeof p === "string" && p !== primaryImg) {
              result.push({
                type: p.endsWith(".mp4") || p.includes("youtube") || p.includes("youtu.be") ? "video" : "image",
                url: p,
              });
            } else if (p && typeof p === "object" && p.url) {
              result.push(p);
            }
          }
        }
      } else {
        const split = item.gallery.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
        for (const url of split) {
          if (url !== primaryImg) {
            result.push({
              type: url.endsWith(".mp4") || url.includes("youtube") || url.includes("youtu.be") ? "video" : "image",
              url,
            });
          }
        }
      }
    } catch {
      // ignore parse error and fallback
    }
  }

  // If no additional media, attach relevant real Ashrama documentary media by category
  if (result.length < 2) {
    const cat = (item.category || "").toLowerCase();
    if (cat.includes("annadana") || cat.includes("food") || cat.includes("meal")) {
      result.push({ type: "image", url: "/media/meals.jpg", caption: "Freshly prepared in Ashrama kitchen" });
      result.push({ type: "image", url: "/media/fruits.jpg", caption: "Orchard fruits & morning nutrition" });
      result.push({ type: "video", url: "/media/chapter2_breakfast.mp4", poster: "/media/food.jpg", caption: "Breakfast documentary" });
    } else if (cat.includes("vidya") || cat.includes("edu") || cat.includes("school")) {
      result.push({ type: "image", url: "/media/learning.jpg", caption: "Evening study hour" });
      result.push({ type: "image", url: "/media/books.jpg", caption: "Notebooks and mentoring" });
      result.push({ type: "video", url: "/media/chapter3_vidya.mp4", poster: "/media/education.jpg", caption: "Education documentary" });
    } else if (cat.includes("sport") || cat.includes("activ") || cat.includes("play")) {
      result.push({ type: "image", url: "/media/activities.jpg", caption: "Play & games" });
      result.push({ type: "image", url: "/media/janaseva-ashrama-original.jpg", caption: "Ashrama grounds" });
      result.push({ type: "video", url: "/media/chapter4_play.mp4", poster: "/media/play.jpg", caption: "Playtime documentary" });
    } else {
      result.push({ type: "image", url: "/media/learning.jpg", caption: "Daily care" });
      result.push({ type: "image", url: "/media/janaseva-ashrama-original.jpg", caption: "Safe environment" });
      result.push({ type: "video", url: "/media/ashrama_video.mp4", poster: "/media/poster.jpg", caption: "Campus overview" });
    }
  }

  return result;
}

/** Parses donation schemes or creates strategic marketing donation tiers */
function parseDonationSchemes(item: ImpactItem): SchemeTier[] {
  if (item.schemes) {
    try {
      const parsed = JSON.parse(item.schemes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s, idx) => ({
          id: s.id || `scheme-${idx}`,
          title: s.title || `Tier ${idx + 1}`,
          qty: Math.max(1, Math.floor(Number(s.qty) || Number(s.amount ? s.amount / item.unitPrice : 1))),
          description: s.description || `Provides ${s.qty || 1} units of ${item.name}`,
          popular: !!s.popular,
        }));
      }
    } catch {
      // fallback to generated
    }
  }

  // Dynamic high-converting marketing strategies based on unit price
  const p = item.unitPrice;
  return [
    {
      id: "scheme-single",
      title: `Single Child Support`,
      qty: 1,
      description: `Immediate direct support for 1 child (${formatINR(p)})`,
    },
    {
      id: "scheme-group",
      title: `Group / Classroom (10 Units)`,
      qty: 10,
      description: `Covers an entire group of 10 children (${formatINR(p * 10)})`,
    },
    {
      id: "scheme-ashrama",
      title: `Full Ashrama Feast (25 Children)`,
      qty: 25,
      description: `Complete support for all 25 resident children today (${formatINR(p * 25)})`,
      popular: true,
    },
    {
      id: "scheme-month",
      title: `Sustained Month Support`,
      qty: 100,
      description: `Long-term 100-unit operational care package (${formatINR(p * 100)})`,
    },
  ];
}
