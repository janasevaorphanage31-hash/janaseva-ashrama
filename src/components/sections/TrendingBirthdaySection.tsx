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

export interface BirthdayPackage {
  id: string;
  slug: string;
  title: string;
  tag: string;
  kannada: string;
  cost: number;
  description: string;
  servings: string;
  popular?: boolean;
  icon: string;
  features: string[];
  menuTags: string[];
}

export const TRENDING_BIRTHDAY_PACKAGES: BirthdayPackage[] = [
  {
    id: "pkg-cake",
    slug: "cake",
    title: "Birthday Cake Cutting & Singing Blessing",
    tag: "🍰 Cake & Video Song",
    kannada: "ಹುಟ್ಟುಹಬ್ಬದ ಕೇಕ್ ಹಾಗೂ ಹಾಡಿನ ಹರಕೆ",
    cost: 1500,
    description: "Fresh 1kg eggless bakery cake with celebrant's name written in icing. All 25 boys gather around, sing Happy Birthday, and distribute sweets.",
    servings: "25 boys singing celebration",
    icon: "🎂",
    features: [
      "Custom name on fresh eggless cake",
      "25 boys singing video song on WhatsApp",
      "Sweet distribution & photographs",
      "Form 10AC 80G Tax Exemption receipt",
    ],
    menuTags: ["🎂 1kg Eggless Cake", "🍬 Traditional Sweets", "🎥 WhatsApp Singing Video", "📸 High-Res Photos"],
  },
  {
    id: "pkg-lunch",
    slug: "meal",
    title: "Special Birthday Festival Feast with Sweet Payasam",
    tag: "⭐ Most Popular Seva",
    kannada: "ಸಂಭ್ರಮದ ಬಾಳೆ ಎಲೆ ಊಟ ಹಾಗೂ ಸಿಹಿ ಪಾಯಸ",
    cost: 3501,
    description: "Traditional South Indian Banana Leaf (Bale Ele Oota) festival lunch served hot to all 25 boys in honour of the birthday celebrant.",
    servings: "Full satvik lunch for all 25 boys",
    popular: true,
    icon: "🍛",
    features: [
      "Full banana leaf satvik feast for 25 boys",
      "Sweet Payasam, Pooris, Sagu, Sambar & Rice",
      "Morning Vedic Shloka chanting of your family's name",
      "WhatsApp video of boys chanting & eating",
    ],
    menuTags: ["🍚 Hot Sona Masoori Rice & Ghee", "🫓 Crispy Pooris & Sagu", "🍲 Dal Sambar & Rasam", "🍮 Traditional Sweet Payasam", "🥗 Curd & Papads"],
  },
  {
    id: "pkg-vidya",
    slug: "education",
    title: "Birthday Vidya Daan (Stationery & School Kits)",
    tag: "📚 Vidya Blessing",
    kannada: "ವಿದ್ಯಾ ಕಿಟ್ ಹಾಗೂ ಲೇಖನ ಸಾಮಗ್ರಿ ಸೇವೆ",
    cost: 2100,
    description: "Distribute school notebooks, geometric instruments, pens, pencils, and art supplies to all 25 school-going boys in the celebrant's honor.",
    servings: "25 boys complete school stationery",
    icon: "📚",
    features: [
      "Class notebooks & pens for all 25 boys",
      "Art & drawing stationery kits",
      "Blessing cards signed by the boys",
      "Form 10AC 80G tax benefit",
    ],
    menuTags: ["📓 Ruled Class Notebooks", "✏️ Geometry & Pen Kits", "🎨 Drawing & Colour Books", "📜 Personalized Blessing Card"],
  },
  {
    id: "pkg-snacks",
    slug: "fruits",
    title: "Evening Snacks, Fresh Fruit Baskets & Badam Milk",
    tag: "🍎 Fruits & Milk",
    kannada: "ಸಂಜೆಯ ತಿಂಡಿ, ಹಣ್ಣುಗಳ ಬುಟ್ಟಿ ಹಾಗೂ ಬಾದಾಮಿ ಹಾಲು",
    cost: 2501,
    description: "Steaming hot badam milk, healthy evening savouries, and 10kg fresh apple & banana baskets for an energetic evening playtime celebration.",
    servings: "Evening celebration for all 25 boys",
    icon: "🍎",
    features: [
      "Warm nutritious Badam Milk",
      "10kg fresh apple & seasonal fruit crates",
      "Evening snacks & joyous games with boys",
      "WhatsApp video & photo updates",
    ],
    menuTags: ["🥛 Steaming Badam Milk", "🍎 Fresh Apple Crates", "🍌 Cavendish Bananas", "🥨 Evening Crispy Savouries"],
  },
  {
    id: "pkg-full-day",
    slug: "pantry",
    title: "Complete 24-Hour Birthday Annadana Sponsorship",
    tag: "👑 Complete 24h Seva",
    kannada: "ಸಂಪೂರ್ಣ ದಿನದ ಅನ್ನದಾನ ಹಾಗೂ ಪೋಷಣೆ",
    cost: 7501,
    description: "Sponsor breakfast, cake, festive lunch with sweets, evening snacks, and wholesome dinner for the entire 24-hour cycle for all 25 resident boys.",
    servings: "Full 24-hour Ashrama coverage for 25 boys",
    icon: "👑",
    features: [
      "All 3 meals + evening snacks + birthday cake",
      "Entire day dedicated in celebrant's name",
      "Chanted morning Gayatri & Shanti prayers",
      "Framed Birthday Honor Certificate & WhatsApp Chronicle",
    ],
    menuTags: ["🌅 Morning Idlis & Chutney", "🍛 Festive Lunch with Sweets", "🍎 Evening Fruits & Milk", "🌙 Wholesome Dinner"],
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
    occasion: "7th Birthday Feast & Cake",
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
    category: "birthday",
    celebrantName: "Rohan's 25th Birthday Milestone",
    occasion: "25th Birthday Celebration",
    donorName: "Rohan S. (Whitefield, Bangalore)",
    deliveredDate: "Delivered on WhatsApp • 03 Oct",
    packageTitle: "Birthday Cake & Evening Snacks",
    packageCost: 2501,
    videoUrl: "/media/video-chant-prayer.mp4",
    thumbnailUrl: "/media/banana-leaf-feast.jpg",
    quote: "Happy 25th Birthday Rohan Bhaiya! Thank you for sharing your big milestone with us! May God grant you endless joy and career success!",
    highlights: "Fresh fruit baskets · Cake cutting ceremony · Brotherly laughter",
  },
  {
    id: "showcase-4",
    category: "baby",
    celebrantName: "Baby Aarav's 1st Birthday (Namakarana)",
    occasion: "1st Birthday Blessing",
    donorName: "Deepak & Swathi (Jayanagar)",
    deliveredDate: "Delivered on WhatsApp • 08 Oct",
    packageTitle: "Special Festive Lunch with Payasam",
    packageCost: 3501,
    videoUrl: "/media/video-chess-boys.mp4",
    thumbnailUrl: "/media/birthday-cake-celebration.jpg",
    quote: "Joyful blessings and prayers for little Baby Aarav! May he grow with robust health, brilliant wisdom, and boundless smiles!",
    highlights: "Warm sweet payasam · Fresh fruit crates · Heartfelt child prayers",
  },
  {
    id: "showcase-5",
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

  const birthdayPackages: BirthdayPackage[] =
    rawPackages && rawPackages.length > 0
      ? rawPackages.map((p) => ({
          id: p.id,
          slug: "meal",
          title: p.name,
          tag: p.highlight ? "⭐ Popular Seva" : "🎂 Birthday Blessing",
          kannada: "ಮಕ್ಕಳೊಂದಿಗೆ ಹುಟ್ಟುಹಬ್ಬದ ಸಂಭ್ರಮ",
          cost: p.price,
          description: p.menu.join(", "),
          servings: p.servings,
          popular: p.highlight,
          icon: "🎂",
          features: [
            p.servings,
            "Personalized WhatsApp Video Blessing",
            "Photos of children enjoying celebration",
            "Form 10AC 80G Tax Exemption receipt",
          ],
          menuTags: p.menu,
        }))
      : TRENDING_BIRTHDAY_PACKAGES;

  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    birthdayPackages.find((p) => p.popular)?.id || birthdayPackages[1]?.id || birthdayPackages[0]?.id
  );
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const activePackage =
    birthdayPackages.find((p) => p.id === selectedPkgId) || birthdayPackages[0];

  const handleSponsorPackage = (pkg: BirthdayPackage) => {
    track("birthday_package_sponsor_click", {
      packageId: pkg.id,
      title: pkg.title,
      cost: pkg.cost,
    });
    openBottomDonate(
      pkg.cost,
      "birthday_feast",
      `${pkg.title} (${formatINR(pkg.cost)}) for 25 Boys`,
      "Birthday Celebration"
    );
  };

  const scrollShowcase = (direction: "left" | "right") => {
    if (trackRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <Section
      id="celebrate"
      tone="white"
      className="py-14 md:py-24 relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-cream scroll-mt-20"
    >
      {/* Radiant Background Aura Lights */}
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-rose-400/15 blur-3xl pointer-events-none" />

      <Container>
        {/* ── 1. TRENDING HERO HEADER ── */}
        <div className="flex flex-col items-center justify-center text-center mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-orange-500 px-4 sm:px-5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg glow-saffron animate-shimmer">
            <BirthdayCakeIcon className="h-4 w-4 text-white" />
            <span>🎂 Trending in Bangalore: Celebrate Birthday with 25 Orphaned Boys</span>
          </div>

          <p className="mt-2.5 text-xs sm:text-sm font-bold text-amber-900/80 uppercase tracking-widest">
            ಜನ್ಮದಿನ ಹಾಗೂ ಮಹೋತ್ಸವಗಳ ಪವಿತ್ರ ಅನ್ನದಾನ ಸೇವೆ · Janaseva Ashrama Bengaluru
          </p>
        </div>

        <Head
          eyebrow="Heartfelt Birthday Seva · 100% Verified Allocation"
          title="Turn Your Birthday into 25 Smiling Faces"
          lead="A party lasts one evening. Feeding 25 resident boys steaming festival meals, cutting a cake, and hearing their joyful voices chant your name in morning prayers creates blessings that last a lifetime."
        />

        {/* ── 2. TRUST HIGHLIGHT BAR (WHY DONORS LOVE CELEBRATING HERE) ── */}
        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold text-teal-950">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 border border-amber-500/25 shadow-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 text-lg">
              🎥
            </span>
            <div>
              <p className="font-extrabold text-teal-950 leading-tight">WhatsApp Video</p>
              <p className="text-[10px] text-teal-950/60 font-medium">Boys singing with your name</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 border border-amber-500/25 shadow-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 text-lg">
              🎂
            </span>
            <div>
              <p className="font-extrabold text-teal-950 leading-tight">Cake &amp; Payasam</p>
              <p className="text-[10px] text-teal-950/60 font-medium">Freshly served to 25 boys</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 border border-amber-500/25 shadow-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 text-lg">
              🛡️
            </span>
            <div>
              <p className="font-extrabold text-teal-950 leading-tight">80G Tax Free</p>
              <p className="text-[10px] text-teal-950/60 font-medium">Form 10AC tax deductible</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 border border-amber-500/25 shadow-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-700 text-lg">
              📍
            </span>
            <div>
              <p className="font-extrabold text-teal-950 leading-tight">Visit Campus</p>
              <p className="text-[10px] text-teal-950/60 font-medium">Turahalli, South Bengaluru</p>
            </div>
          </div>
        </div>

        {/* ── 3. INTERACTIVE BIRTHDAY PACKAGE SELECTOR (MARKET TRENDING) ── */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 border border-amber-500/30">
              Select Your Celebration Package
            </span>
            <h3 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-teal-950">
              Transparent Birthday Packages for 25 Boys
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-teal-950/70 max-w-xl mx-auto">
              Choose how you want to celebrate. Each package includes food preparation, cake cutting, singing video proof, and instant 80G tax receipt.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {birthdayPackages.map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`group relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
                    isSelected
                      ? "bg-white shadow-2xl ring-2 ring-amber-500 border-amber-500 scale-[1.02]"
                      : "bg-white/85 hover:bg-white shadow-md hover:shadow-xl border-amber-500/20 hover:border-amber-400"
                  }`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        pkg.popular
                          ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs"
                          : "bg-teal-950/10 text-teal-900"
                      }`}
                    >
                      {pkg.tag}
                    </span>
                    <span className="text-2xl">{pkg.icon}</span>
                  </div>

                  {/* Pricing & Title */}
                  <div>
                    <h4 className="font-display text-lg sm:text-xl font-extrabold text-teal-950 leading-snug">
                      {pkg.title}
                    </h4>
                    <p className="text-[11px] text-amber-800/80 font-bold mt-0.5">
                      {pkg.kannada}
                    </p>

                    <div className="my-4 flex items-baseline gap-2">
                      <span className="font-display text-3xl sm:text-4xl font-black text-amber-600">
                        {formatINR(pkg.cost)}
                      </span>
                      <span className="text-xs text-teal-950/60 font-semibold">
                        / all 25 boys
                      </span>
                    </div>

                    <p className="text-xs text-teal-950/75 leading-relaxed">
                      {pkg.description}
                    </p>

                    {/* Features checklist */}
                    <ul className="mt-4 space-y-2 text-xs text-teal-950/85">
                      {pkg.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                            ✓
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Menu Tags */}
                    {pkg.menuTags && (
                      <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-teal-900/10">
                        {pkg.menuTags.map((menu, mIdx) => (
                          <span
                            key={mIdx}
                            className="rounded-lg bg-sand/60 px-2 py-0.5 text-[10px] font-semibold text-teal-900"
                          >
                            {menu}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 1-Tap CTA Button */}
                  <div className="mt-6 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSponsorPackage(pkg);
                      }}
                      className="focus-ring tap-scale w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 py-3.5 text-center text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Sponsor This Birthday ({formatINR(pkg.cost)})</span>
                      <span>💝 →</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. REAL DELIVERED WHATSAPP VIDEO PROOF MEMORIES (REEL) ── */}
        <div className="mt-16 relative w-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-500/30">
                100% Transparent Proof
              </span>
              <h3 className="mt-1.5 font-display text-xl sm:text-2xl font-extrabold text-teal-950">
                Real Delivered Birthday Celebrations
              </h3>
              <p className="text-xs text-teal-950/65">
                Every celebration receives high-resolution WhatsApp video and photos within 3 hours of the feast.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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
            {CELEBRATION_SHOWCASES.map((showcase, idx) => (
              <div
                key={showcase.id}
                className="snap-center shrink-0 w-[88vw] max-w-[380px] md:w-[380px] rounded-3xl bg-white border border-amber-500/25 shadow-lg hover:shadow-2xl hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
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
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-2xl ring-4 ring-white/50 group-hover/btn:scale-110 transition-transform glow-saffron">
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
                      <span className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
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
                    onClick={() =>
                      openBottomDonate(
                        showcase.packageCost,
                        "birthday_feast",
                        `${showcase.celebrantName} (${formatINR(showcase.packageCost)})`,
                        showcase.occasion
                      )
                    }
                    className="focus-ring tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md glow-saffron hover:opacity-95 transition cursor-pointer"
                  >
                    <span>Sponsor This Birthday Feast ({formatINR(showcase.packageCost)}) 💝</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-teal-950/60 mt-1">
            Swipe horizontally ↔ to explore real delivered celebration videos from WhatsApp
          </p>
        </div>

        {/* ── 5. VISIT IN PERSON AT TURAHALLI BANGALORE CAMPUS ── */}
        <div className="mt-14 rounded-3xl bg-teal-950 text-white p-6 sm:p-10 shadow-2xl border border-amber-400/30 relative overflow-hidden">
          {/* Ambient Lighting */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-bold text-gold border border-gold/30">
                <MapPinIcon className="h-4 w-4" />
                <span>Visit Turahalli Bangalore Campus in Person</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Want to Cut the Birthday Cake with the 25 Boys in Person?
              </h3>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Bring your family and friends to Janaseva Ashrama in Turahalli, Bengaluru. Cut the cake, serve meals with your own hands, and celebrate amidst cheerful giggles and blessings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-2xl bg-white/10 p-3.5 border border-white/15">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>🌅 Morning Feast Slot</span>
                  </p>
                  <p className="text-[11px] text-white/80 mt-1">
                    11:30 AM – 1:00 PM: Traditional lunch serving &amp; blessings
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3.5 border border-white/15">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>🎂 Evening Cake Slot</span>
                  </p>
                  <p className="text-[11px] text-white/80 mt-1">
                    4:30 PM – 8:00 PM: Cake cutting, playtime snacks &amp; celebration
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  "Hello Janaseva Ashrama, I would like to visit your Turahalli campus to celebrate a birthday with the children. Please help me book an in-person celebration slot."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring tap-scale flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] px-6 py-4 text-center text-xs sm:text-sm font-black uppercase tracking-wider text-teal-950 shadow-xl transition active:scale-95 cursor-pointer"
              >
                <span>💬 WhatsApp to Reserve Celebration Slot</span>
              </a>

              <Link
                href="/celebrate-birthday"
                className="focus-ring tap-scale flex items-center justify-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 px-6 py-3.5 text-center text-xs sm:text-sm font-bold text-white transition cursor-pointer"
              >
                <span>Open Full Birthday Booking Portal →</span>
              </Link>

              <p className="text-center text-[11px] text-white/60">
                Please notify 24–48 hours in advance so our kitchen can schedule the meal timing without overlapping celebrations.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
