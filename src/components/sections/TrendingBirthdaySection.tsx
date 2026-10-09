"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import Image from "next/image";
import { Container, Head, Section } from "../ui";
import { useCart } from "../CartProvider";
import { formatINR, SITE } from "@/lib/site";
import type { WishVideoItem } from "@/lib/site-content";
import { track } from "@/lib/track";
import {
  BirthdayCakeIcon,
  FeastPlatterIcon,
  VisitAshramaIcon,
  TrendingSparkIcon,
  CalendarSlotIcon,
  MapPinIcon,
} from "../icons/CelebrationIcons";

interface FeastOption {
  id: string;
  slug: string;
  title: string;
  cost: number;
  description: string;
  servings: string;
  popular?: boolean;
}

const FEAST_OPTIONS: FeastOption[] = [
  {
    id: "feast-lunch",
    slug: "meal",
    title: "Special Birthday Lunch with Payasam",
    cost: 3501,
    description: "Hot rice, sambar, seasonal vegetable curry, pooris, and traditional festival sweet (payasam) served to all 25 boys.",
    servings: "Feeds all 25 boys in ashrama",
    popular: true,
  },
  {
    id: "feast-snacks",
    slug: "fruits",
    title: "Evening Snacks & Fresh Fruit Platter",
    cost: 2501,
    description: "Evening warm milk, healthy savouries, banana/apple fruit baskets, and joyful evening celebration time.",
    servings: "Evening treat for all 25 boys",
  },
  {
    id: "feast-breakfast",
    slug: "meal",
    title: "Wholesome Morning Breakfast",
    cost: 1501,
    description: "Nutritious steaming idlis or upma, chutney, and warm milk to start the boys' school day with energy.",
    servings: "Morning breakfast for all 25 boys",
  },
  {
    id: "feast-full-day",
    slug: "pantry",
    title: "Complete Day Nourishment & Care",
    cost: 7501,
    description: "Sponsor breakfast, special birthday lunch with sweets, evening snacks, and wholesome dinner for the entire day.",
    servings: "Full 24-hour Ashrama meal coverage for 25 boys",
  },
];

interface CelebrationShowcase {
  id: string;
  celebrantName: string;
  occasion: string;
  donorName: string;
  deliveredDate: string;
  packageTitle: string;
  packageCost: number;
  videoUrl: string;
  thumbnailUrl: string;
  quote: string;
  highlights: string;
}

const CELEBRATION_SHOWCASES: CelebrationShowcase[] = [
  {
    id: "showcase-1",
    celebrantName: "Little Ananya's 7th Birthday",
    occasion: "7th Birthday Feast",
    donorName: "Priya & Rajesh (Bengaluru)",
    deliveredDate: "Delivered on WhatsApp • 28 Sep",
    packageTitle: "Special Birthday Lunch with Payasam",
    packageCost: 3501,
    videoUrl: "/media/video-chant-prayer.mp4",
    thumbnailUrl: "/media/birthday-cake-celebration.jpg",
    quote: "Happy Birthday Ananya Didi! Thank you for the sweet payasam and celebration! All 25 of us chanted your name and prayed for your happiness!",
    highlights: "Red rose petals · Sweet payasam feast · Personal WhatsApp song",
  },
  {
    id: "showcase-2",
    celebrantName: "Dr. & Mrs. Kulkarni's 25th Anniversary",
    occasion: "Silver Jubilee Celebration",
    donorName: "Siddharth Kulkarni (Indiranagar)",
    deliveredDate: "Delivered on WhatsApp • 01 Oct",
    packageTitle: "Complete Day Nourishment & Fruits",
    packageCost: 7501,
    videoUrl: "/media/video-chess-boys.mp4",
    thumbnailUrl: "/media/birthday-donor-roses.jpg",
    quote: "Happy 25th Anniversary Uncle & Aunty! All 25 boys chanted your names during morning prayer and thanked you for the wholesome feast!",
    highlights: "Full day satvik meals · Shloka chanting blessing · 80G Tax receipt",
  },
  {
    id: "showcase-3",
    celebrantName: "Vikram's First Salary Milestone",
    occasion: "First Salary Dedication",
    donorName: "Vikram S. (Whitefield)",
    deliveredDate: "Delivered on WhatsApp • 03 Oct",
    packageTitle: "Evening Snacks & Fresh Fruit Platter",
    packageCost: 2501,
    videoUrl: "/media/video-chant-prayer.mp4",
    thumbnailUrl: "/media/banana-leaf-feast.jpg",
    quote: "Congratulations Vikram Bhaiya on your first job! May God bless you with immense success, health, and joy in your career!",
    highlights: "Fresh banana & apple baskets · Warm evening milk · Brotherly joy",
  },
];

export function TrendingBirthdaySection({ wishVideos }: { wishVideos?: WishVideoItem[] }) {
  const { setCustom, openBottomDonate } = useCart();
  const [selectedFeast, setSelectedFeast] = useState<string>("feast-lunch");
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const activeFeast = FEAST_OPTIONS.find((f) => f.id === selectedFeast) || FEAST_OPTIONS[0];

  const handleSponsorOnline = (cost: number, occasionName: string) => {
    track("birthday_sponsor_click", { occasion: occasionName, amount: cost });
    openBottomDonate(cost, "birthday_feast");
  };

  const scrollShowcase = (direction: "left" | "right") => {
    if (trackRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <Section id="celebrate" tone="cream" className="py-12 md:py-16 overflow-hidden">
      <Container>
        {/* Trending Eyebrow Badge */}
        <div className="flex items-center justify-center mb-3">
          <div className="inline-flex items-center gap-2 rounded-xl bg-saffron/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-saffron-dark ring-1 ring-saffron/30">
            <TrendingSparkIcon className="h-4 w-4 text-saffron-dark" />
            <span>Trending in Bengaluru: Auspicious Birthday &amp; Milestone Giving</span>
          </div>
        </div>

        <Head
          eyebrow="Heartfelt Celebrations"
          title="Celebrate Your Birthday with 25 Boys"
          lead="Experience the profound joy of sharing your milestone with our 25 young boys. Sponsoring a birthday feast or visiting the Ashrama creates heartwarming memories that outlast any ordinary celebration."
        />

        {/* ── 3 DISTINCT CELEBRATION SHOWCASES IN HORIZONTAL MOVEMENT ── */}
        <div className="mt-8 relative w-full">
          {/* Section sub-header with direction controls */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-teal-950 uppercase tracking-wider">
                3 Real Delivered Celebrations (WhatsApp Video Proof)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollShowcase("left")}
                aria-label="Scroll left"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-teal-900/15 text-teal-900 hover:bg-teal-900 hover:text-white transition shadow-xs cursor-pointer"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollShowcase("right")}
                aria-label="Scroll right"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-teal-900/15 text-teal-900 hover:bg-teal-900 hover:text-white transition shadow-xs cursor-pointer"
              >
                →
              </button>
            </div>
          </div>

          {/* Horizontal Moving Reel: Touch-scrollable + Snap track with kinetic movement */}
          <div
            ref={trackRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 no-scrollbar scrollbar-none items-stretch"
          >
            {CELEBRATION_SHOWCASES.map((showcase, idx) => (
              <div
                key={showcase.id}
                className="snap-center shrink-0 w-[88vw] max-w-[380px] md:w-[380px] rounded-3xl bg-white border border-teal-900/15 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Media Header (Video player or poster) */}
                  <div className="relative aspect-[16/10] w-full bg-teal-950 overflow-hidden">
                    {activeVideoId === showcase.id ? (
                      <video
                        src={showcase.videoUrl}
                        poster={showcase.thumbnailUrl}
                        controls
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <Image
                          src={showcase.thumbnailUrl}
                          alt={showcase.celebrantName}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-500"
                          sizes="(max-width: 640px) 90vw, 380px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-black/20 to-transparent" />
                        
                        {/* Play Video Overlay Button */}
                        <button
                          type="button"
                          onClick={() => setActiveVideoId(showcase.id)}
                          className="absolute inset-0 flex items-center justify-center group/btn cursor-pointer"
                          aria-label={`Watch video of ${showcase.celebrantName}`}
                        >
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron text-white shadow-xl ring-4 ring-white/30 group-hover/btn:scale-110 transition-transform">
                            ▶
                          </span>
                        </button>
                      </>
                    )}

                    {/* Occasion Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="rounded-lg bg-teal-950/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gold shadow-sm">
                        Showcase 0{idx + 1}
                      </span>
                      <span className="rounded-lg bg-saffron px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                        {showcase.occasion}
                      </span>
                    </div>

                    <span className="absolute bottom-2 left-3 text-[10px] text-white/90 font-medium z-10 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{showcase.deliveredDate}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-lg font-bold text-teal-950 leading-tight">
                        {showcase.celebrantName}
                      </h4>
                      <span className="font-display font-extrabold text-base text-saffron-dark shrink-0 ml-2">
                        {formatINR(showcase.packageCost)}
                      </span>
                    </div>

                    <p className="text-xs text-teal-900/60 font-semibold mt-0.5">
                      Dedicated by {showcase.donorName}
                    </p>

                    {/* Speech Bubble: Real Delivered WhatsApp Greeting */}
                    <div className="mt-3 rounded-2xl bg-cream/70 p-3.5 border border-teal-900/10 text-xs text-teal-950/85 leading-relaxed">
                      <p className="italic">
                        &ldquo;{showcase.quote}&rdquo;
                      </p>
                      <p className="mt-2 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                        <span>✓✓ Delivered on WhatsApp with food photos &amp; 80G tax receipt</span>
                      </p>
                    </div>

                    <p className="mt-3 text-[11px] text-teal-900/70 font-medium">
                      ★ {showcase.highlights}
                    </p>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => handleSponsorOnline(showcase.packageCost, showcase.occasion)}
                    className="focus-ring tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-saffron-dark transition cursor-pointer"
                  >
                    <span>Sponsor This Feast ({formatINR(showcase.packageCost)}) 💝</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-teal-950/60 mt-1">
            Swipe horizontally ↔ to explore all 3 delivered celebration memories
          </p>
        </div>

        {/* ── 2 ACTIONABLE PILLARS: CUSTOM SPONSOR & VISIT IN PERSON ── */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pillar 1: Select & Customize a Feast Package */}
          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm ring-1 ring-teal-900/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-900/10">
                  <FeastPlatterIcon className="h-6 w-6 text-teal-800" />
                </span>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-600/20">
                  Form 10AC 80G Tax Deductible
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-teal-900">
                Custom Birthday Feast Packages
              </h3>
              <p className="mt-1 text-xs text-teal-950/70 leading-relaxed">
                Choose any wholesome meal package freshly prepared in our Ashrama kitchen for all 25 children in your family&apos;s name.
              </p>

              {/* Feast Selection Radio Cards */}
              <div className="mt-4 space-y-2">
                {FEAST_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFeast(f.id)}
                    className={`focus-ring w-full rounded-2xl p-3 text-left transition border cursor-pointer ${
                      selectedFeast === f.id
                        ? "border-saffron bg-saffron/10 ring-1 ring-saffron"
                        : "border-teal-900/10 bg-cream/40 hover:bg-cream"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-teal-900">{f.title}</span>
                      <span className="font-display font-bold text-sm text-saffron-dark">
                        {formatINR(f.cost)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-teal-950/65 line-clamp-2 leading-relaxed">
                      {f.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => handleSponsorOnline(activeFeast.cost, activeFeast.title)}
                className="focus-ring block w-full rounded-xl bg-saffron px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-saffron-dark active:scale-95 cursor-pointer"
              >
                Sponsor {activeFeast.title.split(" ")[0]} ({formatINR(activeFeast.cost)}) →
              </button>
              <p className="mt-2 text-center text-[11px] text-teal-950/60">
                WhatsApp singing video blessing included free with all feast bookings.
              </p>
            </div>
          </div>

          {/* Pillar 2: Visit & Celebrate in Person */}
          <div className="rounded-3xl bg-teal-950 p-6 sm:p-7 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-gold ring-1 ring-white/15">
                  <VisitAshramaIcon className="h-6 w-6 text-gold" />
                </span>
                <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                  Turahalli Campus
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-white">
                Visit &amp; Celebrate in Person
              </h3>
              <p className="mt-1 text-xs text-white/80 leading-relaxed">
                Bring your family and friends to Janaseva Ashrama in Turahalli, Bengaluru. Cut a cake, share sweets, and receive joyful blessings directly from the 25 boys.
              </p>

              {/* Slot Timings & Guidelines */}
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                  <div className="flex items-center gap-2 text-gold font-bold text-xs mb-1">
                    <CalendarSlotIcon className="h-4 w-4" />
                    <span>Recommended Celebration Slots:</span>
                  </div>
                  <ul className="text-xs text-white/85 space-y-1">
                    <li>• <strong>Morning Slot:</strong> 10:30 AM to 1:00 PM (Lunch Feast)</li>
                    <li>• <strong>Evening Slot:</strong> 4:30 PM to 6:30 PM (Cake &amp; Snacks)</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 text-xs text-white/85 leading-relaxed">
                  <div className="flex items-center gap-2 text-gold font-bold mb-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>Location:</span>
                  </div>
                  <p>{SITE.address}</p>
                  <p className="text-[11px] text-white/60 mt-1">
                    Near Govt School, Jayanagar Housing Society Layout, Turahalli, Bengaluru.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  "Hello Janaseva Ashrama, I would like to visit and celebrate my birthday with the children. Please guide me on booking a celebration slot."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <span>WhatsApp Visit Coordination (+91 {SITE.phone})</span>
              </a>
              <p className="text-center text-[10px] text-white/50">
                Please confirm 24 hours in advance to respect boys&apos; school study timings.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
