"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import Image from "next/image";
import { Container, Head, Section } from "../ui";
import { useCart } from "../CartProvider";
import { formatINR, SITE } from "@/lib/site";
import type { WishVideoItem, CelebrationPackageItem, SiteContentMap } from "@/lib/site-content";
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
  menuTags?: string[];
}

const FEAST_OPTIONS: FeastOption[] = [
  {
    id: "feast-lunch",
    slug: "meal",
    title: "Special Birthday Lunch with Payasam",
    cost: 3501,
    description: "Hot rice with ghee, South Indian sambar, seasonal vegetable curry, crispy pooris, and traditional festival sweet payasam served to all 25 resident boys.",
    servings: "Feeds all 25 boys in ashrama",
    popular: true,
    menuTags: ["🍚 Hot Rice & Ghee", "🍲 Sambar & Rasam", "🫓 Pooris & Sagu", "🍮 Sweet Payasam", "🥗 Curd & Papads"],
  },
  {
    id: "feast-snacks",
    slug: "fruits",
    title: "Evening Snacks & Fresh Fruit Platter",
    cost: 2501,
    description: "Warm badam milk, healthy evening savouries, fresh apple and banana baskets, and joyful evening celebration time with the children.",
    servings: "Evening treat for all 25 boys",
    menuTags: ["🥛 Warm Badam Milk", "🍎 Fresh Apple Crates", "🍌 Fresh Bananas", "🥨 Evening Savouries"],
  },
  {
    id: "feast-breakfast",
    slug: "meal",
    title: "Wholesome Morning Breakfast",
    cost: 1501,
    description: "Nutritious steaming idlis or upma, fresh coconut chutney, hot sambar, and warm milk to start the boys' school day with energy.",
    servings: "Morning breakfast for all 25 boys",
    menuTags: ["🥟 Steaming Idlis", "🥥 Coconut Chutney", "🍲 Hot Sambar", "🥛 Warm Morning Milk"],
  },
  {
    id: "feast-full-day",
    slug: "pantry",
    title: "Complete 24-Hour Day Nourishment & Care",
    cost: 7501,
    description: "Sponsor breakfast, special birthday lunch with sweets, evening snacks with fresh fruit, and wholesome dinner for the entire 24-hour cycle.",
    servings: "Full 24-hour Ashrama meal coverage for 25 boys",
    menuTags: ["🌅 Morning Breakfast", "🍲 Festive Lunch & Sweets", "🍎 Evening Fruits & Milk", "🌙 Wholesome Dinner"],
  },
];

interface CelebrationShowcase {
  id: string;
  category: "birthday" | "anniversary" | "memory" | "baby" | "milestone";
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
    category: "birthday",
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
    category: "anniversary",
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
    category: "milestone",
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
  {
    id: "showcase-4",
    category: "memory",
    celebrantName: "Late Smt. Saraswathi Amma's Smriti Seva",
    occasion: "In Loving Memory (Punyatithi)",
    donorName: "Ramesh & Sunita (Basavanagudi)",
    deliveredDate: "Delivered on WhatsApp • 05 Oct",
    packageTitle: "Special Festive Lunch with Payasam",
    packageCost: 3501,
    videoUrl: "/media/video-chant-prayer.mp4",
    thumbnailUrl: "/media/lunch-platter.jpg",
    quote: "Shanti Mantra chanted in memory of respected Saraswathi Amma. All 25 children folded their hands in gratitude for the nourishing anna dana.",
    highlights: "Sacred Gayatri prayer · Banana leaf satvik annadana · Eternal blessings",
  },
  {
    id: "showcase-5",
    category: "baby",
    celebrantName: "Baby Aaradhya's Namakarana Seva",
    occasion: "Newborn Baby Blessings",
    donorName: "Deepak & Swathi (Jayanagar)",
    deliveredDate: "Delivered on WhatsApp • 08 Oct",
    packageTitle: "Evening Snacks & Fresh Fruits",
    packageCost: 2501,
    videoUrl: "/media/video-chess-boys.mp4",
    thumbnailUrl: "/media/birthday-cake-celebration.jpg",
    quote: "Joyful blessings and prayers for little Baby Aaradhya! May she grow with good health, wisdom, and boundless smiles!",
    highlights: "Warm sweet milk · Fresh apple crates · Heartfelt child prayers",
  },
];

const OCCASION_FILTERS = [
  { id: "all", label: "All Celebrations", icon: "✨" },
  { id: "birthday", label: "Birthdays", icon: "🎂" },
  { id: "anniversary", label: "Anniversaries", icon: "💍" },
  { id: "memory", label: "In Loving Memory", icon: "🕊️" },
  { id: "baby", label: "Baby & Newborn", icon: "👶" },
  { id: "milestone", label: "Career / New House", icon: "🎓" },
];

export function TrendingBirthdaySection({
  packages,
  wishVideos,
  content,
}: {
  packages?: CelebrationPackageItem[];
  wishVideos?: WishVideoItem[];
  content?: Partial<SiteContentMap>;
}) {
  const { openBottomDonate } = useCart();
  const rawPackages = content?.celebrationPackages || packages;
  const feastOptions: FeastOption[] =
    rawPackages && rawPackages.length > 0
      ? rawPackages.map((p) => ({
          id: p.id,
          slug: "meal",
          title: p.name,
          cost: p.price,
          description: p.menu.join(", "),
          servings: p.servings,
          popular: p.highlight,
          menuTags: p.menu,
        }))
      : FEAST_OPTIONS;

  const [selectedFeast, setSelectedFeast] = useState<string>(feastOptions[0]?.id || "feast-lunch");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const activeFeast = feastOptions.find((f) => f.id === selectedFeast) || feastOptions[0];

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

  const activeWishList = content?.wishVideos || wishVideos;
  const baseShowcases: CelebrationShowcase[] =
    activeWishList && activeWishList.length > 0
      ? activeWishList.map((w, idx) => ({
          id: w.id || `wish-${idx}`,
          category: (idx % 2 === 0 ? "birthday" : "anniversary") as any,
          celebrantName: w.celebrantName,
          occasion: w.occasion,
          donorName: w.donorName,
          deliveredDate: w.deliveredDate,
          packageTitle: w.packageTitle,
          packageCost: w.packageCost,
          videoUrl: w.videoUrl,
          thumbnailUrl: w.thumbnailUrl || "/media/birthday-cake-celebration.jpg",
          quote: w.quote,
          highlights: "Delivered on WhatsApp · Chanted prayers & sweet feast",
        }))
      : CELEBRATION_SHOWCASES;

  const filteredShowcases =
    selectedCategory === "all"
      ? baseShowcases
      : baseShowcases.filter((s) => s.category === selectedCategory);

  return (
    <Section id="celebrate" tone="white" className="py-14 md:py-20 relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-cream">
      {/* Radiant Background Aura Lights */}
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-rose-400/15 blur-3xl pointer-events-none" />

      <Container>
        {/* Top Auspicious Pill Badge */}
        <div className="flex flex-col items-center justify-center text-center mb-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-celebrate px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-md glow-saffron animate-shimmer">
            <TrendingSparkIcon className="h-4 w-4 text-white" />
            <span>🔥 Trending Seva: Celebrate Auspicious Days with 25 Boys</span>
          </div>

          <p className="mt-2 text-[11px] font-bold text-amber-900/80 uppercase tracking-widest">
            ಜನ್ಮದಿನ ಹಾಗೂ ವಿಶೇಷ ದಿನಗಳ ಪವಿತ್ರ ಅನ್ನದಾನ ಸೇವೆ · Bengaluru
          </p>
        </div>

        <Head
          eyebrow="Heartfelt Celebrations &amp; Blessings"
          title="Turn Your Special Day into 25 Smiling Faces"
          lead="Hot sweet payasam, steaming pooris, and 25 cheerful voices chanting your family's name in morning prayers. Receive their personalized singing blessing video delivered directly to your WhatsApp."
        />

        {/* ── LIVE TRUST STRIP (Social Proof) ── */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-teal-950/80">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 border border-amber-500/20 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>14 Celebrations Blessed This Month</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 border border-amber-500/20 shadow-xs">
            <span>🎥 100% WhatsApp Singing Video Proof</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 border border-amber-500/20 shadow-xs">
            <span>🛡️ Form 10AC 80G Tax Deductible (50%)</span>
          </span>
        </div>

        {/* ── OCCASION SELECTOR TABS (MOBILE-FIRST SCROLLABLE) ── */}
        <div className="mt-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none pb-2 justify-start sm:justify-center">
            {OCCASION_FILTERS.map((occ) => {
              const active = selectedCategory === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(occ.id);
                    track("celebration_occasion_tab_click", { occasion: occ.id });
                  }}
                  className={`focus-ring tap-scale inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-bold shrink-0 cursor-pointer transition-all duration-200 ${
                    active
                      ? "bg-gradient-celebrate text-white shadow-md glow-saffron scale-[1.03] font-black"
                      : "bg-white/85 text-teal-950/80 border border-amber-500/20 hover:bg-white hover:text-teal-950"
                  }`}
                >
                  <span className="text-sm">{occ.icon}</span>
                  <span>{occ.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DELIVERED CELEBRATION SHOWCASES (HORIZONTAL REEL) ── */}
        <div className="mt-6 relative w-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-teal-950 uppercase tracking-wider">
                {filteredShowcases.length} Real Delivered Blessings (WhatsApp Video Proof)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollShowcase("left")}
                aria-label="Scroll left"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-amber-500/30 text-amber-900 hover:bg-amber-500 hover:text-white transition shadow-xs cursor-pointer active:scale-95"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollShowcase("right")}
                aria-label="Scroll right"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-amber-500/30 text-amber-900 hover:bg-amber-500 hover:text-white transition shadow-xs cursor-pointer active:scale-95"
              >
                →
              </button>
            </div>
          </div>

          {/* Horizontal Snap Track */}
          <div
            ref={trackRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 no-scrollbar scrollbar-none items-stretch"
          >
            {filteredShowcases.map((showcase, idx) => (
              <div
                key={showcase.id}
                className="snap-center shrink-0 w-[88vw] max-w-[380px] md:w-[380px] rounded-3xl bg-gradient-glass-card border border-amber-500/25 shadow-lg hover:shadow-2xl hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-950/30 to-transparent" />

                        {/* Radiant Play Video Button */}
                        <button
                          type="button"
                          onClick={() => setActiveVideoId(showcase.id)}
                          className="absolute inset-0 flex items-center justify-center group/btn cursor-pointer"
                          aria-label={`Watch celebration blessing video of ${showcase.celebrantName}`}
                        >
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-celebrate text-white shadow-2xl ring-4 ring-white/50 group-hover/btn:scale-110 transition-transform glow-saffron">
                            <span className="ml-0.5 text-lg">▶</span>
                          </span>
                        </button>
                      </>
                    )}

                    {/* Occasion Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="rounded-xl bg-teal-950/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gold shadow-sm border border-gold/30">
                        Memory 0{idx + 1}
                      </span>
                      <span className="rounded-xl bg-gradient-celebrate px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                        {showcase.occasion}
                      </span>
                    </div>

                    <span className="absolute bottom-2 left-3 text-[10px] text-white/95 font-semibold z-10 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{showcase.deliveredDate}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-lg font-bold text-teal-950 leading-tight">
                        {showcase.celebrantName}
                      </h4>
                      <span className="font-display font-black text-base text-amber-600 shrink-0">
                        {formatINR(showcase.packageCost)}
                      </span>
                    </div>

                    <p className="text-xs text-teal-900/70 font-semibold mt-1">
                      Dedicated by {showcase.donorName}
                    </p>

                    {/* Speech Bubble: Real Delivered WhatsApp Greeting */}
                    <div className="mt-3 rounded-2xl bg-amber-50/80 p-3.5 border border-amber-500/20 text-xs text-teal-950 leading-relaxed shadow-xs">
                      <p className="italic font-medium">
                        &ldquo;{showcase.quote}&rdquo;
                      </p>
                      <p className="mt-2 text-[10px] text-emerald-800 font-black flex items-center gap-1">
                        <span>✓✓ Delivered on WhatsApp with food photos &amp; 80G receipt</span>
                      </p>
                    </div>

                    <p className="mt-3 text-[11px] text-teal-900/80 font-medium flex items-center gap-1">
                      <span>★</span>
                      <span>{showcase.highlights}</span>
                    </p>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => handleSponsorOnline(showcase.packageCost, showcase.occasion)}
                    className="focus-ring tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-celebrate py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md glow-saffron hover:opacity-95 transition cursor-pointer"
                  >
                    <span>Sponsor This Feast ({formatINR(showcase.packageCost)}) 💝</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-teal-950/60 mt-1">
            Swipe horizontally ↔ to explore real delivered celebration memories
          </p>
        </div>

        {/* ── 2 ACTIONABLE PILLARS: CUSTOM SPONSOR & VISIT IN PERSON ── */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pillar 1: Select & Customize a Feast Package */}
          <div className="rounded-3xl bg-gradient-glass-card p-6 sm:p-8 shadow-xl border border-amber-500/25 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30">
                  <FeastPlatterIcon className="h-6 w-6 text-amber-700" />
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800 ring-1 ring-emerald-600/30">
                  Form 10AC 80G Tax Exemption
                </span>
              </div>

              <h3 className="mt-4 font-display text-2xl font-bold text-teal-950">
                Sponsor a Wholesome Feast Package
              </h3>
              <p className="mt-1 text-xs text-teal-950/70 leading-relaxed">
                Choose any wholesome meal freshly prepared in our Ashrama kitchen for all 25 children in your family&apos;s name.
              </p>

              {/* Feast Selection Cards */}
              <div className="mt-5 space-y-2.5">
                {feastOptions.map((f) => {
                  const isSelected = selectedFeast === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFeast(f.id);
                        track("celebration_package_select", { packageId: f.id, cost: f.cost });
                      }}
                      className={`focus-ring w-full rounded-2xl p-4 text-left transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? "border-2 border-amber-500 bg-gradient-to-br from-amber-50 via-orange-50/60 to-rose-50/30 ring-2 ring-amber-400/30 shadow-md"
                          : "border-teal-900/10 bg-white/90 hover:bg-amber-50/20 hover:border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-teal-950">{f.title}</span>
                          {f.popular && (
                            <span className="rounded-full bg-gradient-celebrate px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-xs">
                              🔥 Popular
                            </span>
                          )}
                        </div>
                        <span className="font-display font-black text-base text-amber-600">
                          {formatINR(f.cost)}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-teal-950/70 line-clamp-2 leading-relaxed">
                        {f.description}
                      </p>

                      {/* Menu Pills */}
                      {f.menuTags && f.menuTags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {f.menuTags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-semibold text-teal-900 border border-teal-900/10"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => handleSponsorOnline(activeFeast.cost, activeFeast.title)}
                className="focus-ring tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-celebrate py-4 text-center text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-xl glow-saffron transition hover:opacity-95 active:scale-95 cursor-pointer animate-shimmer"
              >
                <span>Sponsor {activeFeast.title.split(" ")[0]} ({formatINR(activeFeast.cost)}) 💝 →</span>
              </button>
              <p className="mt-2 text-center text-[11px] text-teal-950/70 font-semibold">
                {content?.celebrationVideoCost === 0 || !content?.celebrationVideoCost
                  ? "✨ Personalized WhatsApp singing video blessing included free with all feast bookings."
                  : `${content?.celebrationVideoHeading || "WhatsApp video blessing"} available for ${formatINR(content.celebrationVideoCost)}.`}
              </p>
            </div>
          </div>

          {/* Pillar 2: Visit & Celebrate in Person */}
          <div className="rounded-3xl bg-gradient-royal-emerald p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/30 flex flex-col justify-between relative overflow-hidden glow-emerald">
            {/* Ambient Background Gold Light */}
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gold/10 blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-gold ring-1 ring-white/20">
                  <VisitAshramaIcon className="h-6 w-6 text-gold" />
                </span>
                <span className="rounded-full bg-gold/20 px-3 py-1 text-[11px] font-black text-gold uppercase tracking-wider border border-gold/30">
                  Turahalli Bangalore Campus
                </span>
              </div>

              <h3 className="mt-4 font-display text-2xl font-bold text-white">
                Visit &amp; Celebrate in Person
              </h3>
              <p className="mt-1 text-xs text-white/85 leading-relaxed">
                Bring your family and friends to Janaseva Ashrama in Turahalli, Bengaluru. Cut a cake, distribute sweets, and receive joyful blessings directly from the 25 boys.
              </p>

              {/* Slot Timings & Guidelines */}
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-white/10 p-4 border border-white/15 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-gold font-bold text-xs mb-1.5">
                    <CalendarSlotIcon className="h-4 w-4" />
                    <span>Recommended Celebration Slots:</span>
                  </div>
                  <ul className="text-xs text-white/90 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      <span><strong>Morning Slot:</strong> 10:30 AM to 1:00 PM (Lunch Feast with the boys)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      <span><strong>Evening Slot:</strong> 4:30 PM to 6:30 PM (Cake cutting &amp; snacks)</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 border border-white/15 backdrop-blur-sm text-xs text-white/90 leading-relaxed">
                  <div className="flex items-center gap-2 text-gold font-bold mb-1.5">
                    <MapPinIcon className="h-4 w-4" />
                    <span>Campus Location:</span>
                  </div>
                  <p className="font-medium">{SITE.address}</p>
                  <p className="text-[11px] text-white/70 mt-1">
                    Near Govt School, Jayanagar Housing Society Layout, Turahalli, Bengaluru 560061.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/15 space-y-2.5">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  "Hello Janaseva Ashrama, I would like to visit and celebrate our special day with the children. Please guide me on booking an in-person celebration slot."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring tap-scale flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 text-center text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-xl transition hover:from-emerald-600 hover:to-teal-700 active:scale-95 cursor-pointer"
              >
                <span>💬 WhatsApp Visit Coordination (+91 {SITE.phone})</span>
              </a>
              <p className="text-center text-[11px] text-white/60">
                Please inform 24 hours in advance so our kitchen staff can coordinate the meal timing.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
