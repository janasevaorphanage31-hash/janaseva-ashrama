"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container, Head, Section } from "../ui";
import { useCart } from "../CartProvider";
import { track } from "@/lib/track";
import {
  CURATED_GALLERY,
  GALLERY_CATEGORIES,
  type GalleryItem,
  type GalleryCategory,
} from "@/data/ashrama-curated-gallery";

export function RealBoysGallerySection() {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>("All Moments");
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { setQty, openBottomDonate } = useCart();

  // Filter items based on active category
  const filteredItems = useMemo(() => {
    if (selectedCategory === "All Moments") return CURATED_GALLERY;
    return CURATED_GALLERY.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  // Keyboard navigation for Lightbox
  const handleNext = useCallback(() => {
    if (!activeItem) return;
    const currentIndex = filteredItems.findIndex((it) => it.id === activeItem.id);
    const nextIndex = (currentIndex + 1) % filteredItems.length;
    setActiveItem(filteredItems[nextIndex]);
  }, [activeItem, filteredItems]);

  const handlePrev = useCallback(() => {
    if (!activeItem) return;
    const currentIndex = filteredItems.findIndex((it) => it.id === activeItem.id);
    const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setActiveItem(filteredItems[prevIndex]);
  }, [activeItem, filteredItems]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!activeItem) return;
      if (e.key === "Escape") setActiveItem(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeItem, handleNext, handlePrev]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (activeItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeItem]);

  const handleSponsorAnnadana = (item: GalleryItem) => {
    setQty("meal", 1);
    track("add_to_cart", {
      item: "meal",
      amount: 100,
      source: "gallery_modal",
      mediaId: item.id,
    });
    openBottomDonate(100, "daily-meal");
    setActiveItem(null);
  };

  const handleCopyLink = (item: GalleryItem) => {
    const fullUrl = `${window.location.origin}${item.url}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <Section id="boys-gallery" tone="cream" className="py-14 md:py-24 border-y border-teal-900/10">
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <Head
            eyebrow="On-Ground Visual Documentation"
            title="Real Daily Life of Our 25 Resident Boys"
            lead="No actors, no staged stock models. Every photograph and video here was captured directly at our campus in Thurahalli, Bangalore — depicting authentic moments of Annadana shlokas, abacus math, morning yoga, festive deepas, and laughter."
          />
          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => openBottomDonate(100)}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-saffron px-5 py-3 text-xs font-bold text-white transition hover:bg-saffron-dark shadow-sm"
            >
              <span>🍛 Sponsor ₹100 Annadana</span>
            </button>
            <Link
              href="/contact#visit"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-teal-900/20 bg-white px-4 py-3 text-xs font-bold text-teal-900 transition hover:bg-teal-50"
            >
              <span>📍 Visit In Person</span>
            </Link>
          </div>
        </div>

        {/* Ashrama Key Highlights Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <div className="rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs flex items-center gap-3">
            <span className="text-2xl select-none" aria-hidden="true">👦</span>
            <div>
              <span className="block font-display text-xl font-bold text-teal-950">25 Boys</span>
              <span className="block text-xs text-teal-900/70 font-medium">Ages 6–16 sheltered</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs flex items-center gap-3">
            <span className="text-2xl select-none" aria-hidden="true">🍲</span>
            <div>
              <span className="block font-display text-xl font-bold text-teal-950">3 Hot Meals</span>
              <span className="block text-xs text-teal-900/70 font-medium">Pure satvik Annadana</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs flex items-center gap-3">
            <span className="text-2xl select-none" aria-hidden="true">📚</span>
            <div>
              <span className="block font-display text-xl font-bold text-teal-950">100% Free</span>
              <span className="block text-xs text-teal-900/70 font-medium">Vidya, books &amp; care</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs flex items-center gap-3">
            <span className="text-2xl select-none" aria-hidden="true">🛡️</span>
            <div>
              <span className="block font-display text-xl font-bold text-teal-950">JJ Act Reg.</span>
              <span className="block text-xs text-teal-900/70 font-medium">KA18CH0242 Verified</span>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          {GALLERY_CATEGORIES.map((cat) => {
            const count =
              cat === "All Moments"
                ? CURATED_GALLERY.length
                : CURATED_GALLERY.filter((it) => it.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`focus-ring shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-teal-900 text-white shadow-xs"
                    : "bg-white text-teal-950/75 border border-teal-900/10 hover:bg-sand/40 hover:text-teal-950"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-teal-900/10 text-teal-900"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Responsive Grid (2-col mobile, 3-col tablet, 4-col desktop) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveItem(item);
                }
              }}
              className="group relative flex flex-col justify-between rounded-2xl bg-white border border-teal-900/10 shadow-xs overflow-hidden cursor-pointer transition hover:-translate-y-1 hover:shadow-md focus-ring"
            >
              {/* Media Container */}
              <div className="relative aspect-4/3 w-full bg-teal-950/10 overflow-hidden">
                {item.type === "video" ? (
                  <div className="relative h-full w-full">
                    <video
                      src={item.url}
                      preload="metadata"
                      muted
                      playsInline
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-teal-950/30 flex items-center justify-center group-hover:bg-teal-950/20 transition">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron text-white shadow-lg group-hover:scale-110 transition">
                        <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                )}

                {/* Badges on media */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  <span className="rounded-md bg-teal-950/80 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                    {item.type === "video" ? "▶ Video" : "📷 Photo"}
                  </span>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="rounded-md bg-gold/95 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-teal-950 truncate max-w-[85%]">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Title & Kannada Snippet */}
              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-saffron-dark truncate" title={item.kannada}>
                    {item.kannada}
                  </p>
                  <h4 className="font-display text-xs sm:text-sm font-bold text-teal-950 line-clamp-2 mt-0.5 leading-snug">
                    {item.title}
                  </h4>
                </div>

                <div className="mt-2.5 pt-2 border-t border-teal-900/5 flex items-center justify-between text-[10px] text-teal-900/60 font-semibold">
                  <span className="group-hover:text-teal-900 group-hover:underline transition">View Full &rarr;</span>
                  <span>Janaseva Bangalore</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 rounded-3xl bg-teal-900 p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="inline-block rounded-md bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold mb-2">
              Open Campus Door Policy
            </span>
            <h3 className="font-display text-xl md:text-2xl font-bold">
              Visit Janaseva Ashrama &amp; Meet the 25 Boys in Person
            </h3>
            <p className="mt-1 text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed">
              We warmly invite donors, families, and volunteers to visit our facility at Thurahalli, Bangalore. Join our boys during morning Annadana, sit with them for lunch, or volunteer with weekend mathematics and art.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/contact#map"
              className="focus-ring rounded-xl bg-gold px-5 py-3 text-xs font-bold text-teal-950 transition hover:bg-gold/90 shadow-sm"
            >
              Get Campus Directions &rarr;
            </Link>
          </div>
        </div>
      </Container>

      {/* ==================== LIGHTBOX MODAL ==================== */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
        >
          <div
            className="relative flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-teal-950/80 text-white hover:bg-teal-950 transition shadow"
              aria-label="Close dialog"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Media Area (Left on Desktop, Top on Mobile) */}
            <div className="relative md:w-3/5 bg-teal-950 flex items-center justify-center min-h-[260px] md:min-h-[480px]">
              {activeItem.type === "video" ? (
                <video
                  src={activeItem.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[50vh] md:max-h-[85vh] w-full object-contain"
                />
              ) : (
                <div className="relative h-full w-full min-h-[280px] md:min-h-[480px]">
                  <Image
                    src={activeItem.url}
                    alt={activeItem.title}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              )}

              {/* Prev / Next buttons */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                aria-label="Previous item"
              >
                &#10094;
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                aria-label="Next item"
              >
                &#10095;
              </button>
            </div>

            {/* Info & Action Panel (Right on Desktop, Bottom on Mobile) */}
            <div className="md:w-2/5 p-5 md:p-6 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-[85vh]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-md bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {activeItem.category}
                  </span>
                  <span className="text-[10px] font-bold text-teal-900/60">
                    {activeItem.type === "video" ? "Real Video" : "Real Photo"}
                  </span>
                </div>

                <h3 className="font-display text-lg md:text-xl font-bold text-teal-950 leading-tight">
                  {activeItem.title}
                </h3>

                <p className="mt-1 text-xs font-semibold text-saffron-dark">
                  {activeItem.kannada}
                </p>

                <p className="mt-3 text-xs md:text-sm text-teal-950/80 leading-relaxed border-t border-teal-900/10 pt-3">
                  {activeItem.description}
                </p>

                <div className="mt-4 rounded-xl bg-cream/70 p-3 border border-teal-900/10 text-xs text-teal-900/80 space-y-1">
                  <p className="font-bold text-teal-950 flex items-center gap-1.5">
                    <span>📍</span> Location: Thurahalli, South Bengaluru
                  </p>
                  <p className="text-[11px] text-teal-900/70">
                    Direct beneficiary: 25 resident boys at Janaseva Samruddhi Education &amp; Rural Development Society.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-teal-900/10 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSponsorAnnadana(activeItem)}
                  className="focus-ring w-full rounded-xl bg-saffron px-4 py-3 text-xs font-bold text-white transition hover:bg-saffron-dark shadow-sm flex items-center justify-center gap-2"
                >
                  <span>🍛 Sponsor ₹100 Annadana for This Boy</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activeItem)}
                    className="flex-1 rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-[11px] font-bold text-teal-900 hover:bg-cream transition"
                  >
                    {copiedId === activeItem.id ? "✓ Link Copied!" : "🔗 Share / Copy URL"}
                  </button>
                  <a
                    href={activeItem.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-[11px] font-bold text-teal-900 hover:bg-cream transition text-center"
                  >
                    View Original
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
