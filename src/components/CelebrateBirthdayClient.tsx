"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";
import { formatINR, SITE } from "@/lib/site";
import type { WishVideoItem, CelebrationPackageItem, SiteContentMap } from "@/lib/site-content";
import { track } from "@/lib/track";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePan,
  validateFutureDate,
  sanitizeNumeric,
  sanitizePan,
  sanitizeName,
  NAME_REGEX,
  EMAIL_REGEX,
  PAN_REGEX,
} from "@/lib/validation";
import { ValidationErrorModal } from "./ValidationErrorModal";
import {
  BirthdayCakeIcon,
  BlessingsHeartIcon,
  FeastPlatterIcon,
  VisitAshramaIcon,
  CalendarSlotIcon,
  MapPinIcon,
  TaxShieldIcon,
  WhatsAppStatusIcon,
  InstagramStoryIcon,
  TrendingSparkIcon,
} from "./icons/CelebrationIcons";

interface FeastPackage {
  id: string;
  name: string;
  price: number;
  highlight?: boolean;
  menu: string[];
  servings: string;
  badge?: string;
}

const PACKAGES: FeastPackage[] = [
  {
    id: "video-wish",
    name: "Personalized WhatsApp Video Song Blessing",
    price: 700,
    badge: "📱 ₹700 Accessible Seva",
    menu: [
      "Custom Name Placard held by 25 resident boys",
      "Happy Birthday Song in English & Kannada",
      "Sacred Vedic Ayu Suktam Long-Life Shloka Chanting",
      "Video delivered directly on WhatsApp within 3 hours",
    ],
    servings: "25 boys personalized video song on WhatsApp",
  },
  {
    id: "breakfast",
    name: "Morning Energy Breakfast",
    price: 1500,
    badge: "🌅 Morning Seva",
    menu: ["Steaming Idlis or Khara Bath", "Fresh Coconut Chutney", "Hot Sambar", "Warm Milk for all children"],
    servings: "All 25 resident children",
  },
  {
    id: "lunch-special",
    name: "Festive Special Lunch with Payasam",
    price: 3500,
    highlight: true,
    badge: "🔥 Most Popular Choice",
    menu: ["Hot Rice & Ghee", "Traditional South Indian Sambar & Rasam", "Crispy Pooris & Veg Sagu", "Traditional Sweet Payasam / Halwa", "Crisp Papads & Curd"],
    servings: "Complete festive lunch for all 25 children",
  },
  {
    id: "evening-snacks",
    name: "Evening Celebration & Fruit Basket",
    price: 2500,
    badge: "🍎 Fruits & Milk",
    menu: ["Warm Badam Milk", "Healthy Evening Savouries", "Fresh Apples & Bananas Fruit Basket", "Special Birthday Biscuits"],
    servings: "Joyful evening snack time for 25 children",
  },
  {
    id: "grand-birthday",
    name: "Grand Birthday Feast & Cake Cutting",
    price: 5500,
    badge: "🎂 Cake + Feast",
    menu: ["Large Eggless Birthday Cake", "Special Festive Lunch with Sweets", "Fresh Fruit Basket & Payasam", "Evening Hot Milk & Snacks"],
    servings: "Grand celebratory feast & cake distribution for 25 children",
  },
  {
    id: "full-day",
    name: "Grand Full-Day Nourishment & Care",
    price: 8500,
    badge: "👑 24-Hour Coverage",
    menu: ["Wholesome Morning Breakfast", "Festive Birthday Lunch with Sweets", "Evening Snacks & Fresh Fruits", "Warm Wholesome Dinner"],
    servings: "24-hour total nutritional sponsorship for the Ashrama",
  },
];

const OCCASIONS = [
  { id: "Birthday", label: "🎂 Birthday / Janmadina", desc: "Celebrate your or your loved one's birthday with sweet payasam and prayers." },
  { id: "Wedding Anniversary", label: "💍 Wedding Anniversary", desc: "Start another year of blessed marriage by feeding innocent children." },
  { id: "In Memory Of / Memorial (Shraddha / Punyatithi)", label: "🕊️ In Loving Memory (Smriti Seva)", desc: "Honor the sacred memory of beloved parents or elders with satvik annadana." },
  { id: "Newborn / Baby Blessings", label: "👶 Baby Shower / Namakarana", desc: "Bless the newly arrived angel with pure prayers from 25 little brothers." },
  { id: "Academic / Career Milestone", label: "🎓 Career / First Job / New Home", desc: "Share your professional success, new home (Griha Pravesha), or graduation." },
  { id: "General Family Blessings", label: "🌸 General Family Blessings", desc: "Seek health, harmony, and peace for your entire family." },
];

export function CelebrateBirthdayClient({
  content,
  wishVideos,
}: {
  content?: Partial<SiteContentMap>;
  wishVideos?: WishVideoItem[];
}) {
  const { setCustom, openBottomDonate } = useCart();
  const rawPackages = content?.celebrationPackages;
  const packages: FeastPackage[] =
    rawPackages && rawPackages.length > 0
      ? rawPackages.map((p, idx) => ({
          ...p,
          badge: p.highlight ? "🔥 Most Popular Choice" : idx === 0 ? "🌅 Morning Seva" : "🍲 Wholesome Feast",
        }))
      : PACKAGES;

  const [selectedPkg, setSelectedPkg] = useState<string>(packages[1]?.id || packages[0]?.id || "lunch-special");
  const [activeWishIndex, setActiveWishIndex] = useState(0);

  const rawWishes = content?.wishVideos && content.wishVideos.length > 0 ? content.wishVideos : wishVideos;
  const wishes = rawWishes && rawWishes.length > 0 ? rawWishes : [
    {
      id: "wish-1",
      celebrantName: "Little Ananya's 7th Birthday",
      occasion: "7th Birthday",
      donorName: "Priya & Rajesh (Bengaluru)",
      deliveredDate: "Delivered on WhatsApp • 28 Sep 2026",
      packageTitle: "Special Birthday Lunch with Payasam",
      packageCost: 3500,
      videoUrl: "/media/video-chant-prayer.mp4",
      thumbnailUrl: "/media/birthday-cake-celebration.jpg",
      quote: "Happy Birthday Ananya Didi! Thank you for the sweet payasam and celebration! All 25 of us chanted your name and prayed for your happiness!",
    },
    {
      id: "wish-2",
      celebrantName: "Dr. & Mrs. Kulkarni's 25th Anniversary",
      occasion: "Silver Jubilee Anniversary",
      donorName: "Siddharth Kulkarni (Indiranagar)",
      deliveredDate: "Delivered on WhatsApp • 01 Oct 2026",
      packageTitle: "Complete Day Nourishment & Fruits",
      packageCost: 7500,
      videoUrl: "/media/video-chess-boys.mp4",
      thumbnailUrl: "/media/birthday-donor-roses.jpg",
      quote: "Happy 25th Anniversary Uncle & Aunty! All 25 children chanted your names during morning prayer and thanked you for the feast!",
    },
    {
      id: "wish-3",
      celebrantName: "Vikram's First Salary Celebration",
      occasion: "First Salary Milestone",
      donorName: "Vikram S. (Whitefield)",
      deliveredDate: "Delivered on WhatsApp • 03 Oct 2026",
      packageTitle: "Evening Snacks & Fresh Fruit Platter",
      packageCost: 2500,
      videoUrl: "/media/video-chant-prayer.mp4",
      thumbnailUrl: "/media/banana-leaf-feast.jpg",
      quote: "Congratulations Vikram Bhaiya on your first job! May God bless you with immense success in your career!",
    },
  ];

  const currentWish = wishes[activeWishIndex] || wishes[0];
  const [occasion, setOccasion] = useState<string>("Birthday");
  const [celebrantName, setCelebrantName] = useState<string>("");
  const [celebrationDate, setCelebrationDate] = useState<string>("");
  const [visitMode, setVisitMode] = useState<"in_person" | "remote">("in_person");
  const [slot, setSlot] = useState<string>("morning");
  const [guestCount, setGuestCount] = useState<string>("2-4");
  const [blessingMessage, setBlessingMessage] = useState<string>("");

  const [donorName, setDonorName] = useState<string>("");
  const [donorPhone, setDonorPhone] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [donorPan, setDonorPan] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationModalMessage, setValidationModalMessage] = useState("");
  const [copiedStory, setCopiedStory] = useState(false);

  // Community feed of upcoming celebrations
  const [communityCelebs, setCommunityCelebs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/celebrations")
      .then((r) => r.json())
      .then((d) => {
        if (d.celebrations) setCommunityCelebs(d.celebrations);
      })
      .catch(() => {});
  }, []);

  const activePackage = packages.find((p) => p.id === selectedPkg) || packages[1] || packages[0];

  const handleSponsor = (pkg: FeastPackage) => {
    track("birthday_package_select", { package: pkg.id, price: pkg.price });
    setCustom(pkg.price);
  };

  // Quick Date Preset Picker
  const handleQuickDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const iso = d.toISOString().split("T")[0];
    setCelebrationDate(iso);
  };

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBookingError("");

    // 1. Celebrant Name (letters only, min 2)
    const celCheck = validateName(celebrantName, "Celebrant name");
    if (!celCheck.valid) {
      setBookingError(celCheck.error!);
      setValidationModalMessage(celCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 2. Date validation (future date only, max 365 days)
    const dateCheck = validateFutureDate(celebrationDate, "Celebration date");
    if (!dateCheck.valid) {
      setBookingError(dateCheck.error!);
      setValidationModalMessage(dateCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 3. Donor Name
    const donorCheck = validateName(donorName, "Your name");
    if (!donorCheck.valid) {
      setBookingError(donorCheck.error!);
      setValidationModalMessage(donorCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 4. Phone validation (10-15 digits)
    const phoneCheck = validatePhone(donorPhone);
    if (!phoneCheck.valid) {
      setBookingError(phoneCheck.error!);
      setValidationModalMessage(phoneCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 5. Email (if entered, RFC compliant)
    if (donorEmail.trim()) {
      const emailCheck = validateEmail(donorEmail);
      if (!emailCheck.valid) {
        setBookingError(emailCheck.error!);
        setValidationModalMessage(emailCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    // 6. PAN (if entered, uppercase 5 letters + 4 digits + 1 letter)
    if (donorPan.trim()) {
      const panCheck = validatePan(donorPan);
      if (!panCheck.valid) {
        setBookingError(panCheck.error!);
        setValidationModalMessage(panCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    setSubmitting(true);
    track("birthday_booking_attempt", { occasion, package: selectedPkg, visitMode });

    try {
      const res = await fetch("/api/celebrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion,
          celebrantName: celebrantName.trim(),
          celebrationDate,
          packageId: selectedPkg,
          packageName: activePackage.name,
          amount: activePackage.price,
          visitMode,
          slot,
          guestCount,
          blessingMessage: blessingMessage.trim() || undefined,
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          donorEmail: donorEmail.trim() || undefined,
          donorPan: donorPan.trim() || undefined,
          website_hp: "",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Unable to reserve slot. Please check your details.");
      }

      setBookingSuccess(data.booking);
      track("birthday_booking_success", { reference: data.booking.reference });
    } catch (err: any) {
      setBookingError(err.message || "Failed to submit reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppBookingUrl = () => {
    const text = `Namaste Janaseva Ashrama! I have reserved a special day celebration for ${celebrantName} on ${celebrationDate} (${occasion} - ${activePackage.name} for ${formatINR(
      activePackage.price
    )}). Mode: ${visitMode === "in_person" ? `In-Person Visit (${slot} slot, ${guestCount} guests)` : "Remote Seva with Photo/Video"}. Please confirm my celebration slot!`;
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  const copyInstagramStory = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : (SITE.url || "https://www.janasevaashrama.org");
    const text = `Celebrated my special day by feeding 25 children at Janaseva Ashrama in Bengaluru! The purest smiles and sincere blessings. You can also celebrate your birthday or milestone here: ${origin}/celebrate-birthday #JanasevaAshrama #BirthdayGiving #BengaluruNGO #Bangalore`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 3000);
    }
  };

  return (
    <div className="space-y-12 pb-24 md:pb-6">
      {/* ── TOP OCCASION SELECTOR TRAY (TRENDING & INTERACTIVE) ── */}
      <div className="rounded-3xl bg-gradient-glass-card p-5 sm:p-7 border border-amber-500/25 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-celebrate px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs">
              <TrendingSparkIcon className="h-3.5 w-3.5 text-white" />
              <span>Choose Your Auspicious Occasion</span>
            </span>
            <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-teal-950">
              What Special Day Are You Celebrating?
            </h2>
          </div>
          <span className="text-xs font-bold text-amber-900/80 bg-amber-100/70 px-3 py-1 rounded-full self-start sm:self-center">
            25 Resident Boys · Form 10AC 80G Certified
          </span>
        </div>

        {/* Occasion Pill Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {OCCASIONS.map((occ) => {
            const isSelected = occasion === occ.id;
            return (
              <button
                key={occ.id}
                type="button"
                onClick={() => {
                  setOccasion(occ.id);
                  track("occasion_pill_select", { occasion: occ.id });
                }}
                className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-gradient-celebrate text-white border-amber-500 shadow-md glow-saffron scale-[1.02] font-black"
                    : "bg-white/90 text-teal-950/80 border-amber-500/20 hover:border-amber-500/50 hover:bg-white"
                }`}
              >
                <div className="text-xs font-bold leading-tight">{occ.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 1. FEAST PACKAGES GRID (REDESIGNED WITH GRADIENTS & MOBILE CARDS) ── */}
      <section className="rounded-3xl bg-gradient-to-b from-white via-amber-50/30 to-cream p-6 sm:p-8 shadow-xl border border-amber-500/25 relative overflow-hidden">
        {/* Subtle Ambient Light */}
        <div className="absolute top-0 right-0 h-64 w-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-celebrate px-4 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs glow-saffron animate-shimmer">
            <TrendingSparkIcon className="h-3.5 w-3.5" />
            <span>Trending in Bengaluru: Sponsor a Fresh Meal Feast</span>
          </span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-teal-950">
            Sponsor a Special Day Feast for 25 Children
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-teal-950/75 leading-relaxed">
            Every package is prepared satvik &amp; fresh in the Janaseva kitchen in your celebrant&apos;s name. Full 100% WhatsApp singing video proof included.
          </p>
        </div>

        {/* 5 Feast Packages Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {packages.map((pkg) => {
            const isSelected = selectedPkg === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between border ${
                  isSelected
                    ? "border-2 border-amber-500 bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/30 ring-2 ring-amber-400/40 shadow-xl scale-[1.02]"
                    : "border-amber-900/10 bg-white/95 hover:border-amber-500/40 hover:bg-amber-50/20 shadow-md"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-celebrate px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md glow-saffron whitespace-nowrap">
                    🔥 Most Popular Choice
                  </span>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-lg inline-block mb-1.5">
                    {pkg.badge || "Satvik Meal"}
                  </span>
                  <h3 className="font-display text-base font-bold text-teal-950 leading-snug">{pkg.name}</h3>
                  <p className="mt-2 font-display text-2xl font-black text-amber-600">
                    {formatINR(pkg.price)}
                  </p>
                  <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                    ✓ {pkg.servings}
                  </p>

                  <div className="mt-4 pt-3 border-t border-amber-500/15">
                    <p className="text-[10px] font-black text-teal-950/70 uppercase tracking-wider mb-2">
                      Fresh Menu Served:
                    </p>
                    <ul className="space-y-1.5 text-xs text-teal-950/80">
                      {pkg.menu.map((m) => (
                        <li key={m} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold shrink-0">•</span>
                          <span className="font-medium text-[11px] leading-tight">{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-amber-500/15 space-y-2">
                  <Link
                    href={`/checkout?amount=${pkg.price}&occasion=${encodeURIComponent(occasion)}`}
                    onClick={() => handleSponsor(pkg)}
                    className="focus-ring tap-scale block w-full rounded-2xl bg-gradient-celebrate py-3 text-center text-xs font-black uppercase tracking-wider text-white shadow-md glow-saffron transition hover:opacity-95 active:scale-95"
                  >
                    Sponsor Online ({formatINR(pkg.price)}) →
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPkg(pkg.id);
                      const bookingForm = document.getElementById("booking-section");
                      bookingForm?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full rounded-2xl border border-amber-500/30 bg-white py-2 text-center text-[11px] font-bold text-amber-900 hover:bg-amber-50 transition cursor-pointer"
                  >
                    Select for Celebration
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── REAL DELIVERED WHATSAPP VIDEO SHOWCASE (VIBRANT GLOW) ── */}
      <section className="overflow-hidden rounded-3xl bg-gradient-royal-emerald text-white shadow-2xl border border-emerald-500/30 relative glow-emerald">
        <div className="bg-white/10 px-4 sm:px-6 py-3 border-b border-white/15 backdrop-blur-md flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Real WhatsApp Delivery Proof Preview
            </span>
            <span className="rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-200 border border-emerald-400/30">
              Verified Video Delivery
            </span>
          </div>
          <span className="text-[11px] text-gold font-bold">
            {content?.celebrationVideoCost === 0 || !content?.celebrationVideoCost
              ? "✨ Personalized Video Blessing Included Free"
              : `${content?.celebrationVideoHeading || "Personalized Video Blessing"} (${formatINR(content.celebrationVideoCost)})`}
          </span>
        </div>

        <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-center">
          {/* Left: Video Player with Controls */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black ring-2 ring-white/20 shadow-2xl">
            <video
              key={currentWish.videoUrl}
              src={currentWish.videoUrl}
              poster={currentWish.thumbnailUrl}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Right: Delivered WhatsApp Chat Card */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-xl bg-gold px-3 py-1 text-xs font-black text-teal-950 uppercase tracking-wide shadow-sm">
                  {currentWish.occasion}
                </span>
                <span className="text-xs text-white/70 font-medium">
                  {currentWish.deliveredDate}
                </span>
              </div>

              <h3 className="mt-3 font-display text-xl sm:text-2xl font-bold text-white">
                {currentWish.celebrantName}
              </h3>
              <p className="text-xs text-gold/90 font-bold mt-0.5">
                Dedicated by {currentWish.donorName}
              </p>

              {/* WhatsApp Chat Speech Bubble */}
              <div className="mt-3 rounded-2xl bg-white/10 p-4 border border-white/15 text-xs text-white/95 leading-relaxed backdrop-blur-sm shadow-inner">
                <p className="italic font-medium">
                  &ldquo;{currentWish.quote}&rdquo;
                </p>
                <p className="mt-2 text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                  <span>✓✓ {content?.celebrationVideoDescription || "Delivered on WhatsApp with photos of food served & 80G tax receipt"}</span>
                </p>
              </div>
            </div>

            {/* Sample Selector Tabs */}
            <div>
              <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
                Tap to Watch Other Wish Greetings:
              </p>
              <div className="flex flex-wrap gap-2">
                {wishes.map((w, idx) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setActiveWishIndex(idx)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                      activeWishIndex === idx
                        ? "bg-gradient-celebrate text-white ring-2 ring-gold shadow-md glow-saffron font-black scale-105"
                        : "bg-white/15 text-white/85 hover:bg-white/25"
                    }`}
                  >
                    {w.celebrantName.split("'")[0] || w.occasion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CELEBRATION BOOKING & SCHEDULING FORM ── */}
      <section id="booking-section" className="rounded-3xl bg-gradient-royal-emerald p-6 sm:p-10 text-white shadow-2xl border border-emerald-500/30 glow-emerald">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.1fr] items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-gold border border-gold/30">
              <CalendarSlotIcon className="h-4 w-4" />
              <span>Prior Booking for Dignified Care</span>
            </div>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-white">
              Reserve Your Special Day Celebration
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Whether you wish to visit our Turahalli, Subramanyapura home in person to cut cake and serve the children, or celebrate remotely from anywhere in the world and receive celebration photos/videos, we warmly welcome your seva.
            </p>

            {/* Visit & Remote Guidelines */}
            <div className="mt-6 space-y-3.5 text-xs sm:text-sm text-white/90">
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3.5 border border-white/15 backdrop-blur-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gold/30 text-gold text-xs font-black">1</span>
                <div>
                  <strong className="text-gold">In-Person Visit:</strong> Bring your family and cake or sweets. Children assemble in our dining hall to chant prayers, sing, and let your family serve the feast.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3.5 border border-white/15 backdrop-blur-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gold/30 text-gold text-xs font-black">2</span>
                <div>
                  <strong className="text-gold">Remote Seva with Video Proof:</strong> Celebrating from outside Bengaluru? We display your name on the prayer board and send HD singing videos directly to your WhatsApp.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3.5 border border-white/15 backdrop-blur-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gold/30 text-gold text-xs font-black">3</span>
                <div>
                  <strong className="text-gold">Form 10AC 80G Tax Exemption:</strong> All celebration contributions receive an instant official Section 80G receipt with 50% income tax deduction under the IT Act.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Booking Form / Success State */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 text-teal-950 shadow-2xl border border-amber-500/25">
            {bookingSuccess ? (
              <div className="space-y-5 text-center py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <span className="rounded-full bg-emerald-100 px-3.5 py-1 font-mono text-xs font-bold text-emerald-900 border border-emerald-300">
                    Booking Confirmed: {bookingSuccess.reference}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-bold text-teal-950">
                    Celebration Slot Reserved!
                  </h3>
                  <p className="mt-2 text-xs text-teal-950/70 max-w-sm mx-auto">
                    We have recorded your celebration for <strong>{bookingSuccess.celebrantName}</strong> on <strong>{bookingSuccess.celebrationDate}</strong> ({bookingSuccess.packageName}).
                  </p>
                </div>

                <div className="rounded-2xl bg-cream p-4 border border-teal-900/10 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-teal-950/60">Occasion:</span>
                    <strong className="text-teal-950">{bookingSuccess.occasion}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-950/60">Package Sponsoring:</span>
                    <strong className="text-teal-950">{bookingSuccess.packageName} ({formatINR(bookingSuccess.amount)})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-950/60">Mode:</span>
                    <strong className="text-teal-950">{bookingSuccess.visitMode === "in_person" ? "In-Person Visit" : "Remote Seva with Photos"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-950/60">Status:</span>
                    <strong className="text-emerald-800 uppercase font-mono">{bookingSuccess.celebrationStatus}</strong>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <Link
                    href="/checkout"
                    onClick={() => setCustom(bookingSuccess.amount)}
                    className="focus-ring tap-scale block w-full rounded-2xl bg-gradient-celebrate px-5 py-3.5 text-center text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-xl glow-saffron transition hover:opacity-95 active:scale-95"
                  >
                    Complete Online Contribution ({formatINR(bookingSuccess.amount)} with 80G) →
                  </Link>

                  <a
                    href={getWhatsAppBookingUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring tap-scale flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3 text-center text-xs font-bold text-white shadow transition hover:opacity-95"
                  >
                    <WhatsAppStatusIcon className="h-4 w-4" />
                    <span>Confirm Slot on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="text-xs text-teal-950/60 underline hover:text-teal-950 pt-1"
                  >
                    Book Another Celebration
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
                  <h3 className="font-display text-lg font-bold text-teal-950">
                    Celebration Details
                  </h3>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                    Step 1 of 2
                  </span>
                </div>

                {bookingError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800">
                    {bookingError}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-teal-900/80 mb-1">
                      Occasion Type:
                    </label>
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2.5 text-xs font-bold text-teal-950"
                    >
                      {OCCASIONS.map((occ) => (
                        <option key={occ.id} value={occ.id}>{occ.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900/80 mb-1">
                      Celebrant Name *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Letters only, e.g. Aarav Sharma"
                      value={celebrantName}
                      onChange={(e) => setCelebrantName(sanitizeName(e.target.value))}
                      className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold text-teal-950"
                    />
                    {celebrantName.trim().length >= 2 && NAME_REGEX.test(celebrantName.trim()) && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <span>✓</span> Written on the special prayer board
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Date Presets & Custom Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-teal-900/80">
                      Date of Celebration *:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickDate(0)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 hover:bg-amber-200"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDate(1)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 hover:bg-amber-200"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDate(3)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 hover:bg-amber-200"
                      >
                        Weekend
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={celebrationDate}
                    onChange={(e) => setCelebrationDate(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold text-teal-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-900/80 mb-1">
                    Selected Feast Package:
                  </label>
                  <select
                    value={selectedPkg}
                    onChange={(e) => setSelectedPkg(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-bold text-teal-950"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatINR(p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visit Mode Toggle */}
                <div>
                  <label className="block text-xs font-bold text-teal-900/80 mb-1.5">
                    How will you celebrate?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisitMode("in_person")}
                      className={`rounded-xl p-3 text-left border transition text-xs cursor-pointer ${
                        visitMode === "in_person"
                          ? "border-teal-950 bg-teal-950 text-white font-bold shadow-sm"
                          : "border-teal-900/15 bg-cream text-teal-950 hover:bg-sand"
                      }`}
                    >
                      <p className="font-bold">In-Person Visit</p>
                      <p className="text-[10px] opacity-80">Visit &amp; serve at Turahalli home</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitMode("remote")}
                      className={`rounded-xl p-3 text-left border transition text-xs cursor-pointer ${
                        visitMode === "remote"
                          ? "border-teal-950 bg-teal-950 text-white font-bold shadow-sm"
                          : "border-teal-900/15 bg-cream text-teal-950 hover:bg-sand"
                      }`}
                    >
                      <p className="font-bold">Remote Seva</p>
                      <p className="text-[10px] opacity-80">Receive Photo/Video on WhatsApp</p>
                    </button>
                  </div>
                </div>

                {/* Conditional In-Person Slots */}
                {visitMode === "in_person" && (
                  <div className="grid gap-3 sm:grid-cols-2 bg-cream/70 p-3 rounded-2xl border border-teal-900/10">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/80 mb-1">
                        Time Slot:
                      </label>
                      <select
                        value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                        className="focus-ring w-full rounded-xl border border-teal-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-teal-950"
                      >
                        <option value="morning">Morning (11:30 AM - 1:00 PM Lunch Seva)</option>
                        <option value="evening">Evening (4:30 PM - 8:00 PM Snacks &amp; Cake)</option>
                        <option value="full_day">Full Day Attendance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-teal-900/80 mb-1">
                        Family Members:
                      </label>
                      <select
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className="focus-ring w-full rounded-xl border border-teal-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-teal-950"
                      >
                        <option value="1-2">1 to 2 persons</option>
                        <option value="2-4">2 to 4 family members</option>
                        <option value="5-10">5 to 10 persons (Group)</option>
                        <option value="10+">More than 10 persons</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Blessing message */}
                <div>
                  <label className="block text-xs font-bold text-teal-900/80 mb-1">
                    Prayer or Blessing for the Children&apos;s Board:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. May all children grow in wisdom, good health, and joyful dreams."
                    value={blessingMessage}
                    onChange={(e) => setBlessingMessage(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold text-teal-950"
                  />
                </div>

                {/* Donor Contact Details */}
                <div className="border-t border-teal-900/10 pt-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900/60">
                    Coordinator &amp; 80G Receipt Details
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/80 mb-1">
                        Your Full Name *:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Letters only, e.g. Anita Sharma"
                        value={donorName}
                        onChange={(e) => setDonorName(sanitizeName(e.target.value))}
                        className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold text-teal-950"
                      />
                      {donorName.trim().length >= 2 && NAME_REGEX.test(donorName.trim()) && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <span className="font-bold">✓</span> Booking coordinator confirmed
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-teal-900/80 mb-1">
                        WhatsApp Mobile No *:
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={15}
                        placeholder="10-digit mobile"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(sanitizeNumeric(e.target.value).slice(0, 15))}
                        className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold text-teal-950"
                      />
                      {donorPhone.length === 10 && /^[6-9]\d{9}$/.test(donorPhone) && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <span className="font-bold">✓</span> We will send ashrama celebration photos here
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/80 mb-1">
                        Email Address (for 80G Receipt):
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold text-teal-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-teal-900/80 mb-1">
                        PAN Number (Optional for 80G):
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        value={donorPan}
                        onChange={(e) => setDonorPan(sanitizePan(e.target.value))}
                        className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold uppercase font-mono text-teal-950"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="focus-ring tap-scale flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-celebrate px-6 py-4 font-black uppercase tracking-wider text-white shadow-xl glow-saffron hover:opacity-95 transition text-xs sm:text-sm active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer animate-shimmer"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Reserving Celebration Slot...</span>
                      </>
                    ) : (
                      `Reserve Celebration Slot (${formatINR(activePackage.price)}) →`
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-teal-950/60 font-medium">
                    Reserve your date now; you can contribute online via UPI/Card or at the Ashrama during your visit.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. COMMUNITY CELEBRATIONS SCHEDULE FEED ── */}
      {communityCelebs.length > 0 && (
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-900">
                Community Joy
              </span>
              <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-teal-950">
                Recent &amp; Upcoming Celebrations at Janaseva
              </h3>
              <p className="text-xs text-teal-950/70 mt-1">
                See fellow donors celebrating birthdays and life moments with our children.
              </p>
            </div>
            <Link
              href="#booking-section"
              className="rounded-xl bg-teal-900 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition shrink-0"
            >
              Book Your Date →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {communityCelebs.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-cream/50 p-4 border border-teal-900/10 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-teal-900/60">{c.celebrationDate}</span>
                    <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-teal-950">
                      {c.occasion}
                    </span>
                  </div>
                  <h4 className="mt-2 font-display text-sm font-bold text-teal-950">
                    {c.celebrantName}
                  </h4>
                  <p className="text-[11px] text-teal-950/70 mt-0.5 font-medium">
                    {c.packageName}
                  </p>
                </div>
                <div className="pt-2 border-t border-teal-900/10 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    {c.celebrationStatus}
                  </span>
                  <span className="text-teal-900/50 font-mono text-[10px]">{c.reference}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. SOCIAL MEDIA STORY GENERATOR ── */}
      <section className="rounded-3xl bg-gradient-glass-card p-6 sm:p-8 shadow-xl border border-amber-500/25">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-rose-800 ring-1 ring-rose-200">
              <InstagramStoryIcon className="h-3.5 w-3.5 text-rose-600" />
              <span>Inspire Your Circle</span>
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-teal-950">
              Trending on Instagram, WhatsApp &amp; Facebook
            </h2>
            <p className="mt-2 text-sm text-teal-950/75 leading-relaxed">
              When one donor celebrates their birthday at Janaseva Ashrama and posts a heartwarming story, their friends get inspired to do the same on their birthdays. You start a ripple effect of compassion across Bengaluru!
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={copyInstagramStory}
                className="focus-ring tap-scale inline-flex items-center gap-2 rounded-2xl bg-teal-950 px-5 py-3 text-xs font-black text-white transition hover:bg-teal-900 active:scale-95 cursor-pointer"
              >
                <span>{copiedStory ? "Copied to Clipboard! 🎉" : "Copy Birthday Caption for Instagram"}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hey! For my special day this year, I am celebrating with 25 children at Janaseva Ashrama in Bengaluru. Join me or sponsor a wholesome meal here: ${typeof window !== "undefined" ? window.location.origin : (SITE.url || "https://www.janasevaashrama.org")}/celebrate-birthday`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring tap-scale inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-white px-5 py-3 text-xs font-bold text-teal-950 transition hover:bg-cream cursor-pointer"
              >
                <WhatsAppStatusIcon className="h-4 w-4 text-emerald-600" />
                <span>Share on WhatsApp Status</span>
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-amber-50/60 p-6 border border-amber-500/20 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Suggested Social Media Post:</span>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-amber-500/15 text-xs sm:text-sm text-teal-950 space-y-3 font-sans">
              <p className="font-bold text-teal-950">
                &ldquo;A birthday party lasts an evening. Feeding 25 children creates warmth that lasts a lifetime.&rdquo;
              </p>
              <p className="text-teal-950/70 text-xs leading-relaxed">
                Celebrating another year of life by sharing festive meals with the young souls at Janaseva Ashrama Bangalore. If you want to make your milestone truly count, visit them in Turahalli, Subramanyapura or sponsor a feast.
              </p>
              <div className="pt-2 border-t border-amber-500/15 text-[11px] font-black text-amber-700">
                #JanasevaAshrama #BirthdayCelebration #BangaloreNGO #FeedTheHungry #BirthdayGiving
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. LOCATION & ROUTE GUIDANCE ── */}
      <section className="rounded-3xl bg-cream p-6 sm:p-8 border border-teal-900/10">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-900/10 px-3 py-1 text-xs font-bold text-teal-900">
              <MapPinIcon className="h-3.5 w-3.5 text-amber-600" />
              <span>Bengaluru Ashram Location</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-teal-950">
              How to Reach Janaseva Ashrama
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-teal-950/75 leading-relaxed">
              Located in Turahalli, Subramanyapura (Bangalore - 560061). Easily accessible from Kanakapura Road, Banashankari, Uttarahalli, and NICE Road.
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-teal-900">
              <p><strong>Address:</strong> {SITE.address}</p>
              <p><strong>Landmark:</strong> Near Govt School, Jayanagar Housing Society Layout</p>
              <p><strong>Visiting Hours:</strong> 10:00 AM to 6:00 PM (Prior notice requested)</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring tap-scale inline-flex items-center gap-2 rounded-2xl bg-teal-950 px-5 py-3 text-xs font-bold text-white transition hover:bg-teal-900 cursor-pointer"
              >
                <MapPinIcon className="h-4 w-4 text-gold" />
                <span>Open in Google Maps</span>
              </a>
              <a
                href={`tel:${SITE.phone}`}
                className="focus-ring tap-scale inline-flex items-center gap-2 rounded-2xl border border-teal-900/20 bg-white px-4 py-3 text-xs font-bold text-teal-900 transition hover:bg-sand cursor-pointer"
              >
                <span>Call +91 {SITE.phone}</span>
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber-500/20 shadow-md min-h-[220px] bg-white flex items-center justify-center p-6 text-center">
            <div>
              <VisitAshramaIcon className="h-12 w-12 text-amber-700 mx-auto mb-2" />
              <h3 className="font-display font-bold text-teal-950 text-base">Direct GPS Navigation</h3>
              <p className="text-xs text-teal-950/70 mt-1 max-w-xs mx-auto">
                Tap below to open turn-by-turn navigation directly on your phone.
              </p>
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-xl bg-gradient-celebrate px-5 py-2.5 text-xs font-black uppercase text-white hover:opacity-95 transition shadow glow-saffron cursor-pointer"
              >
                Start Navigation →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY MOBILE BOTTOM CELEBRATION ACTION BAR (DONOR CLICKABLE FOR MOBILE) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 border-t border-amber-500/25 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase font-bold text-teal-950/60 truncate">
            {activePackage.name}
          </div>
          <div className="text-base font-black text-amber-600 leading-tight">
            {formatINR(activePackage.price)}
          </div>
        </div>

        <Link
          href={`/checkout?amount=${activePackage.price}&occasion=${encodeURIComponent(occasion)}`}
          onClick={() => handleSponsor(activePackage)}
          className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-2xl bg-gradient-celebrate px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl glow-saffron shrink-0 active:scale-95 animate-shimmer"
        >
          <span>Sponsor Feast 💝 →</span>
        </Link>
      </div>

      <ValidationErrorModal
        isOpen={validationModalOpen}
        message={validationModalMessage}
        onClose={() => setValidationModalOpen(false)}
      />
    </div>
  );
}
