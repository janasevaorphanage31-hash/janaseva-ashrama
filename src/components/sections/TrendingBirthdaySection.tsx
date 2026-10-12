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
  TrendingSparkIcon,
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
  starter?: boolean;
  icon: string;
  features: string[];
  menuTags: string[];
}

export const TRENDING_BIRTHDAY_PACKAGES: BirthdayPackage[] = [
  {
    id: "pkg-video-blessing",
    slug: "video",
    title: "Personalized WhatsApp Video Song Blessing",
    tag: "📱 ₹700 Accessible Seva",
    kannada: "ಮಕ್ಕಳಿಂದ ವೈಯಕ್ತಿಕ ಹುಟ್ಟುಹಬ್ಬದ ಹಾಡು & ಹರಕೆ",
    cost: 700,
    starter: true,
    description: "All 25 boys hold a custom name placard, sing 'Happy Birthday' in English & Kannada, and chant sacred Ayu Suktam shlokas for your health and long life.",
    servings: "25 boys singing video on WhatsApp",
    icon: "📱",
    features: [
      "Custom name placard held by 25 boys",
      "Happy Birthday song & Vedic Ayu Suktam prayer",
      "Sent directly to your WhatsApp within 3 hours",
      "Official Form 10AC 80G tax receipt included",
    ],
    menuTags: ["📱 WhatsApp Video", "🎶 Birthday Song", "📿 Vedic Chants", "📜 80G Tax Free"],
  },
  {
    id: "pkg-cake",
    slug: "cake",
    title: "Birthday Cake Cutting & Singing Blessing",
    tag: "🍰 Fresh Cake & Song",
    kannada: "ಹುಟ್ಟುಹಬ್ಬದ ಕೇಕ್ ಹಾಗೂ ಹಾಡಿನ ಹರಕೆ",
    cost: 1500,
    description: "Fresh 1kg eggless bakery cake with celebrant's name written in icing. 25 boys gather around, sing, cut cake, and share joyous sweets.",
    servings: "25 boys cake celebration",
    icon: "🎂",
    features: [
      "Custom name on fresh 1kg eggless cake",
      "25 boys singing Happy Birthday video on WhatsApp",
      "Sweet distribution & high-res photographs",
      "Form 10AC 80G tax exemption benefit",
    ],
    menuTags: ["🎂 1kg Eggless Cake", "🍬 Traditional Sweets", "🎥 Singing Video", "📸 High-Res Photos"],
  },
  {
    id: "pkg-lunch",
    slug: "meal",
    title: "Special Banana Leaf Festival Feast + Payasam",
    tag: "⭐ Most Popular Choice",
    kannada: "ಸಂಭ್ರಮದ ಬಾಳೆ ಎಲೆ ಊಟ ಹಾಗೂ ಸಿಹಿ ಪಾಯಸ",
    cost: 3501,
    popular: true,
    description: "Traditional South Indian Banana Leaf (Bale Ele Oota) festival lunch served hot to all 25 boys in honour of your special day.",
    servings: "Full satvik feast for all 25 boys",
    icon: "🍛",
    features: [
      "Full banana leaf satvik feast for 25 boys",
      "Sweet Payasam, Pooris, Sagu, Sambar, Rice & Curd",
      "Morning Vedic Shloka chanting of your family's name",
      "WhatsApp video proof of boys relishing the feast",
    ],
    menuTags: ["🍚 Rice & Ghee", "🫓 Pooris & Sagu", "🍲 Dal Sambar", "🍮 Sweet Payasam"],
  },
  {
    id: "pkg-vidya",
    slug: "education",
    title: "Birthday Vidya Daan (School Kits Gift)",
    tag: "📚 Education Seva",
    kannada: "ವಿದ್ಯಾ ಕಿಟ್ ಹಾಗೂ ಲೇಖನ ಸಾಮಗ್ರಿ ಸೇವೆ",
    cost: 2100,
    description: "Gift school notebooks, pens, drawing kits, and geometry sets to all 25 school-going boys in the celebrant's honor.",
    servings: "25 boys complete school stationery",
    icon: "📚",
    features: [
      "Class notebooks & pens for all 25 boys",
      "Art & geometry stationery sets",
      "Personalized blessing note signed by boys",
      "Form 10AC 80G tax deduction receipt",
    ],
    menuTags: ["📓 Class Notebooks", "✏️ Geometry Sets", "🎨 Drawing Kits", "📜 Blessing Card"],
  },
  {
    id: "pkg-snacks",
    slug: "fruits",
    title: "Evening Snacks, Fruit Baskets & Badam Milk",
    tag: "🍎 Nutrition & Joy",
    kannada: "ಸಂಜೆಯ ತಿಂಡಿ, ಹಣ್ಣುಗಳ ಬುಟ್ಟಿ ಹಾಗೂ ಬಾದಾಮಿ ಹಾಲು",
    cost: 2501,
    description: "Steaming hot badam milk, evening savouries, and 10kg fresh apple & banana baskets for a joyful evening celebration party.",
    servings: "Evening celebration for 25 boys",
    icon: "🍎",
    features: [
      "Warm nutritious Badam Milk for all 25 boys",
      "10kg fresh apple & banana crates",
      "Evening snacks, games & laughter",
      "High-res WhatsApp video & photo updates",
    ],
    menuTags: ["🥛 Badam Milk", "🍎 Fresh Apple Crates", "🍌 Fresh Bananas", "🥨 Evening Savouries"],
  },
  {
    id: "pkg-full-day",
    slug: "pantry",
    title: "Complete 24-Hour Birthday Annadana Sponsorship",
    tag: "👑 Complete 24h Seva",
    kannada: "ಸಂಪೂರ್ಣ ದಿನದ ಅನ್ನದಾನ ಹಾಗೂ ಪೋಷಣೆ",
    cost: 7501,
    description: "Sponsor breakfast, cake, festive lunch with sweets, evening fruits, and dinner for the entire 24-hour cycle for all 25 boys.",
    servings: "Full 24-hour Ashrama coverage for 25 boys",
    icon: "👑",
    features: [
      "All 3 meals + evening fruits + birthday cake",
      "Entire day dedicated in celebrant's name",
      "Sacred morning Gayatri & Shanti prayers",
      "Official framed Birthday Honor Certificate + Video",
    ],
    menuTags: ["🌅 Breakfast", "🍛 Festive Lunch & Sweets", "🍎 Fruits & Milk", "🌙 Wholesome Dinner"],
  },
];

interface CelebrationShowcase {
  id: string;
  celebrantName: string;
  occasion: string;
  donorName: string;
  deliveredDate: string;
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
    occasion: "7th Birthday Feast & Cake",
    donorName: "Priya & Rajesh (Bengaluru)",
    deliveredDate: "Delivered on WhatsApp • 28 Sep",
    packageCost: 3501,
    videoUrl: "/media/video-chant-prayer.mp4",
    thumbnailUrl: "/media/birthday-cake-celebration.jpg",
    quote: "Happy Birthday Ananya Didi! Thank you for the sweet payasam! All 25 of us prayed for your health and joy!",
    highlights: "Sweet payasam feast · Personal WhatsApp singing video",
  },
  {
    id: "showcase-2",
    celebrantName: "Dr. Kulkarni's 50th Birthday",
    occasion: "50th Golden Milestone",
    donorName: "Siddharth Kulkarni (Indiranagar)",
    deliveredDate: "Delivered on WhatsApp • 01 Oct",
    packageCost: 7501,
    videoUrl: "/media/video-chess-boys.mp4",
    thumbnailUrl: "/media/birthday-donor-roses.jpg",
    quote: "Happy Birthday Doctor Uncle! All 25 boys chanted your name in morning prayer and thanked you for the feast!",
    highlights: "Full day satvik meals · Shloka chanting blessing",
  },
  {
    id: "showcase-3",
    celebrantName: "Rohan's 25th Birthday",
    occasion: "25th Birthday Celebration",
    donorName: "Rohan S. (Whitefield)",
    deliveredDate: "Delivered on WhatsApp • 03 Oct",
    packageCost: 2501,
    videoUrl: "/media/video-chant-prayer.mp4",
    thumbnailUrl: "/media/banana-leaf-feast.jpg",
    quote: "Happy 25th Birthday Rohan Bhaiya! Thank you for sharing your milestone with us! May God bless your career!",
    highlights: "Fresh fruit baskets · Cake cutting ceremony",
  },
  {
    id: "showcase-4",
    celebrantName: "Baby Aarav's 1st Birthday",
    occasion: "1st Birthday Blessing",
    donorName: "Deepak & Swathi (Jayanagar)",
    deliveredDate: "Delivered on WhatsApp • 08 Oct",
    packageCost: 3501,
    videoUrl: "/media/video-chess-boys.mp4",
    thumbnailUrl: "/media/birthday-cake-celebration.jpg",
    quote: "Blessings and prayers for Baby Aarav! May he grow with robust health, wisdom, and boundless smiles!",
    highlights: "Warm sweet payasam · Heartfelt child prayers",
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
          tag: p.highlight ? "⭐ Popular Seva" : p.price <= 700 ? "📱 ₹700 Video Blessing" : "🎂 Birthday Seva",
          kannada: "ಮಕ್ಕಳೊಂದಿಗೆ ಹುಟ್ಟುಹಬ್ಬದ ಸಂಭ್ರಮ",
          cost: p.price,
          description: p.menu.join(", "),
          servings: p.servings,
          popular: p.highlight,
          starter: p.price <= 700,
          icon: p.price <= 700 ? "📱" : p.price === 1500 ? "🎂" : "🍛",
          features: [
            p.servings,
            "Personalized WhatsApp Video Blessing",
            "Photos of children enjoying celebration",
            "Form 10AC 80G Tax Exemption receipt",
          ],
          menuTags: p.menu,
        }))
      : TRENDING_BIRTHDAY_PACKAGES;

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
      const scrollAmount = direction === "left" ? -300 : 300;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <Section
      id="celebrate"
      tone="white"
      className="py-10 sm:py-14 md:py-18 relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-cream scroll-mt-20"
    >
      {/* Background Aura */}
      <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-rose-400/15 blur-3xl pointer-events-none" />

      <Container>
        {/* ── 1. TRENDING EMOTIONAL HEADER ── */}
        <div className="flex flex-col items-center justify-center text-center mb-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-orange-500 px-3.5 sm:px-4.5 py-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-md glow-saffron animate-shimmer">
            <BirthdayCakeIcon className="h-4 w-4 text-white shrink-0" />
            <span>Celebrate Your Birthday with 25 Orphaned Boys in Bengaluru</span>
          </div>

          <p className="mt-2 text-[11px] sm:text-xs font-bold text-amber-900/80 uppercase tracking-widest">
            ಜನ್ಮದಿನದ ಪವಿತ್ರ ಅನ್ನದಾನ ಹಾಗೂ ಹರಕೆ ಸೇವೆ · Janaseva Ashrama Turahalli
          </p>
        </div>

        <Head
          eyebrow="Heartfelt Seva · 100% Direct Allocation · Turahalli Bangalore"
          title="Turn Your Special Day into 25 Smiling Faces"
          lead="A party lasts an evening. Feeding 25 resident boys steaming meals, cutting a cake, and hearing their sweet voices chant your name in morning prayers creates blessings that last a lifetime."
        />

        {/* ── 2. TRUST HIGHLIGHT BAR ── */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-xs font-bold text-teal-950">
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md p-2.5 sm:p-3 border border-amber-500/20 shadow-2xs">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 text-base">
              📱
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-teal-950 text-xs truncate">WhatsApp Video</p>
              <p className="text-[10px] text-teal-950/60 font-medium truncate">Boys singing your name</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md p-2.5 sm:p-3 border border-amber-500/20 shadow-2xs">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 text-base">
              🎂
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-teal-950 text-xs truncate">Fresh Cake &amp; Feast</p>
              <p className="text-[10px] text-teal-950/60 font-medium truncate">Served to 25 boys</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md p-2.5 sm:p-3 border border-amber-500/20 shadow-2xs">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 text-base">
              🛡️
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-teal-950 text-xs truncate">80G Tax Free</p>
              <p className="text-[10px] text-teal-950/60 font-medium truncate">Instant Form 10AC receipt</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md p-2.5 sm:p-3 border border-amber-500/20 shadow-2xs">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-700 text-base">
              📍
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-teal-950 text-xs truncate">Visit Campus</p>
              <p className="text-[10px] text-teal-950/60 font-medium truncate">Turahalli, Bengaluru</p>
            </div>
          </div>
        </div>

        {/* ── 3. MOBILE-FIRST RESPONSIVE GRID OF BIRTHDAY PACKAGES ── */}
        <div className="mt-8 sm:mt-12">
          <div className="text-center mb-6">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-800 border border-amber-500/30">
              Choose How You Want to Celebrate
            </span>
            <h3 className="mt-2 font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-teal-950">
              Transparent Birthday Packages for 25 Boys
            </h3>
            <p className="mt-1 text-xs text-teal-950/70 max-w-xl mx-auto">
              Every package includes hot meal preparation, sweet distribution, WhatsApp video proof, and an instant 80G tax receipt.
            </p>
          </div>

          {/* Clean Mobile Grid: 1 col on mobile, 2 col on tablet, 3 col on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
            {birthdayPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`group relative rounded-3xl p-4 sm:p-5 md:p-6 transition-all duration-300 flex flex-col justify-between border bg-white ${
                  pkg.popular
                    ? "shadow-xl ring-2 ring-amber-500 border-amber-500"
                    : pkg.starter
                    ? "shadow-md ring-1 ring-emerald-500/40 border-emerald-500/30"
                    : "shadow-sm hover:shadow-lg border-amber-500/20 hover:border-amber-400"
                }`}
              >
                <div>
                  {/* Badge & Icon Header */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        pkg.popular
                          ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs"
                          : pkg.starter
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-teal-950/10 text-teal-900"
                      }`}
                    >
                      {pkg.tag}
                    </span>
                    <span className="text-xl sm:text-2xl">{pkg.icon}</span>
                  </div>

                  {/* Title & Kannada subtitle */}
                  <h4 className="font-display text-base sm:text-lg font-extrabold text-teal-950 leading-snug">
                    {pkg.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-amber-800/80 font-bold mt-0.5">
                    {pkg.kannada}
                  </p>

                  {/* Price Tag */}
                  <div className="my-3 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-black text-amber-600">
                      {formatINR(pkg.cost)}
                    </span>
                    <span className="text-[11px] text-teal-950/60 font-semibold">
                      / {pkg.cost <= 700 ? "custom video" : "all 25 boys"}
                    </span>
                  </div>

                  <p className="text-xs text-teal-950/75 leading-relaxed line-clamp-3">
                    {pkg.description}
                  </p>

                  {/* Checklist */}
                  <ul className="mt-3.5 space-y-1.5 text-[11px] text-teal-950/85">
                    {pkg.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-1.5">
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black mt-0.5">
                          ✓
                        </span>
                        <span className="line-clamp-1">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Tags */}
                  {pkg.menuTags && (
                    <div className="mt-3 flex flex-wrap gap-1 pt-2.5 border-t border-teal-900/10">
                      {pkg.menuTags.map((menu, mIdx) => (
                        <span
                          key={mIdx}
                          className="rounded-lg bg-cream px-2 py-0.5 text-[9px] font-semibold text-teal-900"
                        >
                          {menu}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1-Tap Sponsor CTA Button */}
                <div className="mt-5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSponsorPackage(pkg)}
                    className="focus-ring tap-scale w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 py-3 text-center text-xs font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Sponsor ({formatINR(pkg.cost)})</span>
                    <span>💝 →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. REAL DELIVERED WHATSAPP VIDEO MEMORIES ── */}
        <div className="mt-12 sm:mt-16 relative w-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-500/30">
                Delivered on WhatsApp
              </span>
              <h3 className="mt-1 font-display text-lg sm:text-xl font-extrabold text-teal-950">
                Real Birthday Memories from Our Ashrama
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => scrollShowcase("left")}
                aria-label="Scroll left"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-amber-500/30 text-amber-900 hover:bg-amber-500 hover:text-white transition shadow-2xs cursor-pointer text-xs"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollShowcase("right")}
                aria-label="Scroll right"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-amber-500/30 text-amber-900 hover:bg-amber-500 hover:text-white transition shadow-2xs cursor-pointer text-xs"
              >
                →
              </button>
            </div>
          </div>

          {/* Horizontal Snap Track */}
          <div
            ref={trackRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 sm:gap-4 pb-3 no-scrollbar scrollbar-none items-stretch"
          >
            {CELEBRATION_SHOWCASES.map((showcase, idx) => (
              <div
                key={showcase.id}
                className="snap-center shrink-0 w-[84vw] max-w-[320px] rounded-2xl bg-white border border-amber-500/20 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div>
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
                          className="object-cover"
                          sizes="(max-width: 640px) 80vw, 320px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-950/30 to-transparent" />

                        <button
                          type="button"
                          onClick={() => setActiveVideoId(showcase.id)}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          aria-label={`Watch celebration blessing video of ${showcase.celebrantName}`}
                        >
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xl ring-2 ring-white/60">
                            <span className="ml-0.5 text-sm">▶</span>
                          </span>
                        </button>
                      </>
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                      <span className="rounded-lg bg-teal-950/90 px-2 py-0.5 text-[9px] font-black uppercase text-gold">
                        Memory 0{idx + 1}
                      </span>
                    </div>

                    <span className="absolute bottom-2 left-2 text-[9px] text-white/90 font-medium z-10 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{showcase.deliveredDate}</span>
                    </span>
                  </div>

                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="font-display text-sm font-bold text-teal-950 leading-tight">
                        {showcase.celebrantName}
                      </h4>
                      <span className="font-display font-black text-xs text-amber-600 shrink-0">
                        {formatINR(showcase.packageCost)}
                      </span>
                    </div>

                    <p className="text-[10px] text-teal-900/60 font-semibold mt-0.5">
                      Dedicated by {showcase.donorName}
                    </p>

                    <div className="mt-2 rounded-xl bg-amber-50/70 p-2.5 border border-amber-500/15 text-[11px] text-teal-950 leading-snug">
                      <p className="italic">&ldquo;{showcase.quote}&rdquo;</p>
                      <p className="mt-1 text-[9px] text-emerald-800 font-bold">
                        ✓✓ Delivered with WhatsApp video &amp; 80G receipt
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 pt-0">
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
                    className="focus-ring tap-scale flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 py-2.5 text-[11px] font-black uppercase text-white shadow-xs hover:opacity-95 transition cursor-pointer"
                  >
                    <span>Sponsor Feast ({formatINR(showcase.packageCost)}) 💝</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. VISIT IN PERSON AT TURAHALLI BANGALORE CAMPUS ── */}
        <div className="mt-10 sm:mt-14 rounded-3xl bg-teal-950 text-white p-5 sm:p-8 shadow-xl border border-amber-400/30 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gold/15 blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-0.5 text-xs font-bold text-gold border border-gold/30">
                <MapPinIcon className="h-3.5 w-3.5" />
                <span>Visit Turahalli Bangalore Campus in Person</span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                Want to Cut the Birthday Cake with the 25 Boys in Person?
              </h3>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Bring your family and friends to Janaseva Ashrama in Turahalli, Bengaluru. Cut the cake, serve meals with your own hands, and celebrate amidst cheerful giggles and blessings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="rounded-2xl bg-white/10 p-3 border border-white/15">
                  <p className="font-bold text-amber-300">
                    🌅 Morning Feast Slot
                  </p>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    11:30 AM – 1:00 PM: Traditional lunch serving &amp; blessings
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 border border-white/15">
                  <p className="font-bold text-amber-300">
                    🎂 Evening Cake Slot
                  </p>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    4:30 PM – 8:00 PM: Cake cutting, playtime snacks &amp; celebration
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-2.5">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  "Hello Janaseva Ashrama, I would like to visit your Turahalli campus to celebrate a birthday with the children. Please help me book an in-person celebration slot."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring tap-scale flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] px-5 py-3.5 text-center text-xs sm:text-sm font-black uppercase tracking-wider text-teal-950 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <span>💬 WhatsApp to Reserve Celebration Slot</span>
              </a>

              <Link
                href="/celebrate-birthday"
                className="focus-ring tap-scale flex items-center justify-center gap-1.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 px-5 py-3 text-center text-xs font-bold text-white transition cursor-pointer"
              >
                <span>Open Full Birthday Booking Portal →</span>
              </Link>

              <p className="text-center text-[10px] text-white/60">
                Please notify 24–48 hours in advance so our kitchen can schedule the meal timing without overlapping celebrations.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
