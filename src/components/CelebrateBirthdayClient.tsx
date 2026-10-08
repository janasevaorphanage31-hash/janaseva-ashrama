"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";
import { formatINR, SITE } from "@/lib/site";
import type { WishVideoItem } from "@/lib/site-content";
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
}

const PACKAGES: FeastPackage[] = [
  {
    id: "breakfast",
    name: "Morning Energy Breakfast",
    price: 1500,
    menu: ["Steaming Idlis or Khara Bath", "Fresh Coconut Chutney", "Hot Sambar", "Warm Milk for all children"],
    servings: "All 25 resident children",
  },
  {
    id: "lunch-special",
    name: "Festive Special Lunch with Payasam",
    price: 3500,
    highlight: true,
    menu: ["Hot Rice & Ghee", "Traditional South Indian Sambar & Rasam", "Crispy Pooris & Veg Sagu", "Traditional Sweet Payasam / Halwa", "Crisp Papads & Curd"],
    servings: "Complete festive lunch for all 25 children",
  },
  {
    id: "evening-snacks",
    name: "Evening Celebration & Fruit Basket",
    price: 2500,
    menu: ["Warm Badam Milk", "Healthy Evening Savouries", "Fresh Apples & Bananas Fruit Basket", "Special Birthday Biscuits"],
    servings: "Joyful evening snack time for 25 children",
  },
  {
    id: "grand-birthday",
    name: "Grand Birthday Feast & Cake Cutting",
    price: 5500,
    menu: ["Large Eggless Birthday Cake", "Special Festive Lunch with Sweets", "Fresh Fruit Basket & Payasam", "Evening Hot Milk & Snacks"],
    servings: "Grand celebratory feast & cake distribution for 25 children",
  },
  {
    id: "full-day",
    name: "Grand Full-Day Nourishment & Care",
    price: 8500,
    menu: ["Wholesome Morning Breakfast", "Festive Birthday Lunch with Sweets", "Evening Snacks & Fresh Fruits", "Warm Wholesome Dinner"],
    servings: "24-hour total nutritional sponsorship for the Ashrama",
  },
];

const OCCASIONS = [
  "Birthday",
  "Wedding Anniversary",
  "In Memory Of / Memorial (Shraddha / Punyatithi)",
  "Academic / Career Milestone",
  "Auspicious Festival / Thanksgiving Seva",
  "General Family Blessings",
];

export function CelebrateBirthdayClient({ wishVideos }: { wishVideos?: WishVideoItem[] }) {
  const { setCustom } = useCart();
  const [selectedPkg, setSelectedPkg] = useState<string>("lunch-special");
  const [activeWishIndex, setActiveWishIndex] = useState(0);

  const wishes = wishVideos && wishVideos.length > 0 ? wishVideos : [
    {
      id: "wish-1",
      celebrantName: "Little Ananya's 7th Birthday",
      occasion: "7th Birthday",
      donorName: "Priya & Rajesh (Bengaluru)",
      deliveredDate: "Delivered on WhatsApp • 28 Sep 2026",
      packageTitle: "Special Birthday Lunch with Payasam",
      packageCost: 3500,
      videoUrl: "/media/ashrama_video.mp4",
      thumbnailUrl: "/media/meals.jpg",
      quote: "Happy Birthday Ananya Didi! Thank you for the sweet payasam and pooris! All 25 of us chanted your name and prayed for your happiness!",
    },
    {
      id: "wish-2",
      celebrantName: "Dr. & Mrs. Kulkarni's 25th Anniversary",
      occasion: "Silver Jubilee Anniversary",
      donorName: "Siddharth Kulkarni (Indiranagar)",
      deliveredDate: "Delivered on WhatsApp • 01 Oct 2026",
      packageTitle: "Complete Day Nourishment & Fruits",
      packageCost: 7500,
      videoUrl: "/media/chapter2_breakfast.mp4",
      thumbnailUrl: "/media/fruits.jpg",
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
      videoUrl: "/media/chapter4_play.mp4",
      thumbnailUrl: "/media/pantry.jpg",
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

  const activePackage = PACKAGES.find((p) => p.id === selectedPkg) || PACKAGES[1];

  const handleSponsor = (pkg: FeastPackage) => {
    track("birthday_package_select", { package: pkg.id, price: pkg.price });
    setCustom(pkg.price);
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

    // 2. Celebration Date (not in the past)
    const dateCheck = validateFutureDate(celebrationDate, "Celebration date");
    if (!dateCheck.valid) {
      setBookingError(dateCheck.error!);
      setValidationModalMessage(dateCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 3. Coordinator / Donor Name
    const donorCheck = validateName(donorName, "Coordinator / Your name");
    if (!donorCheck.valid) {
      setBookingError(donorCheck.error!);
      setValidationModalMessage(donorCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 4. Mobile number (numbers only, 10 digits)
    const phoneCheck = validatePhone(donorPhone, true, "WhatsApp mobile number");
    if (!phoneCheck.valid) {
      setBookingError(phoneCheck.error!);
      setValidationModalMessage(phoneCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 5. Email (if provided)
    if (donorEmail.trim()) {
      const emailCheck = validateEmail(donorEmail, false);
      if (!emailCheck.valid) {
        setBookingError(emailCheck.error!);
        setValidationModalMessage(emailCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    // 6. PAN (if provided)
    if (donorPan.trim()) {
      const panCheck = validatePan(donorPan, false);
      if (!panCheck.valid) {
        setBookingError(panCheck.error!);
        setValidationModalMessage(panCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/celebrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          celebrantName,
          occasion,
          celebrationDate,
          packageId: activePackage.id,
          packageName: activePackage.name,
          amount: activePackage.price,
          visitMode,
          timeSlot: visitMode === "in_person" ? slot : "remote",
          guestCount: visitMode === "in_person" ? guestCount : "none",
          blessingMessage,
          donorName,
          donorPhone,
          donorEmail,
          donorPan,
          paymentStatus: "pending",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || "Failed to submit booking.");
        setValidationModalMessage(data.error || "Failed to submit booking.");
        setValidationModalOpen(true);
      } else {
        setBookingSuccess(data.booking);
        track("celebration_booking_created", {
          reference: data.booking.reference,
          package: activePackage.id,
          amount: activePackage.price,
        });
      }
    } catch {
      setBookingError("Network error. Please try again or reach us via WhatsApp.");
    }
    setSubmitting(false);
  };

  const getWhatsAppBookingUrl = () => {
    const text = `Hello Janaseva Ashrama! I have booked a ${occasion} celebration for ${celebrantName || "my family"} on ${
      celebrationDate || "an upcoming date"
    }. Booking Reference: ${bookingSuccess?.reference || "Pending"}. Package: ${activePackage.name} (${formatINR(
      activePackage.price,
    )}). Mode: ${visitMode === "in_person" ? `In-Person Visit (${slot} slot, ${guestCount} guests)` : "Remote Seva with Photo/Video"}. Please confirm slot.`;
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  const copyInstagramStory = () => {
    const text = `Celebrated my special day by feeding 25 children at Janaseva Ashrama in Bengaluru! The purest smiles and sincere blessings. You can also celebrate your birthday or milestone here: https://www.janasevaashrama.org/celebrate-birthday #JanasevaAshrama #BirthdayGiving #BengaluruNGO #Bangalore`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 3000);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. FEAST PACKAGES GRID */}
      <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-saffron/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-saffron-dark">
            <TrendingSparkIcon className="h-3.5 w-3.5" />
            <span>Trending in Bengaluru</span>
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-teal-900 sm:text-3xl">
            Sponsor a Special Day Feast for 25 Children
          </h2>
          <p className="mt-2 text-sm text-teal-950/70">
            Celebrate your Birthday, Wedding Anniversary, Memorial Day, or Family Milestone with the children of Janaseva Ashrama.
          </p>
        </div>

        {/* 5 Feast Packages Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPkg === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-5 transition flex flex-col justify-between border ${
                  isSelected
                    ? "border-saffron bg-saffron/5 ring-2 ring-saffron shadow-md"
                    : "border-teal-900/10 bg-cream/30 hover:bg-cream/60"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-saffron px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    Most Popular Choice
                  </span>
                )}
                <div>
                  <h3 className="font-display text-base font-bold text-teal-900">{pkg.name}</h3>
                  <p className="mt-2 font-display text-2xl font-bold text-teal-900">
                    {formatINR(pkg.price)}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                    {pkg.servings}
                  </p>

                  <div className="mt-4 pt-3 border-t border-teal-900/10">
                    <p className="text-[11px] font-bold text-teal-900/70 uppercase tracking-wider mb-1.5">
                      What is Served:
                    </p>
                    <ul className="space-y-1 text-xs text-teal-950/75">
                      {pkg.menu.map((m) => (
                        <li key={m} className="flex items-start gap-1.5">
                          <span className="text-saffron-dark font-bold">•</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-teal-900/10 space-y-2">
                  <Link
                    href="/checkout"
                    onClick={() => handleSponsor(pkg)}
                    className="focus-ring block w-full rounded-xl bg-saffron py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-saffron-dark active:scale-95"
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
                    className="w-full rounded-xl border border-teal-900/20 bg-white py-1.5 text-center text-[11px] font-bold text-teal-900 hover:bg-cream transition"
                  >
                    Select for Celebration
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Real Delivered WhatsApp Wish Video Showcase Card */}
      <section className="overflow-hidden rounded-3xl bg-teal-950 text-white shadow-xl border border-teal-800">
        <div className="bg-teal-900/90 px-4 sm:px-6 py-3 border-b border-teal-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              WhatsApp Delivery Proof Preview
            </span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Delivered Directly on WhatsApp
            </span>
          </div>
          <span className="text-[11px] text-gold font-semibold">
            Included Free With Every Feast Booking
          </span>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-center">
          {/* Left: Video Player with Controls */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-lg">
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
                <span className="rounded-lg bg-gold px-2.5 py-1 text-xs font-black text-teal-950 uppercase tracking-wide">
                  {currentWish.occasion}
                </span>
                <span className="text-xs text-white/60">
                  {currentWish.deliveredDate}
                </span>
              </div>

              <h3 className="mt-2.5 font-display text-lg sm:text-xl font-bold text-white">
                {currentWish.celebrantName}
              </h3>
              <p className="text-xs text-gold/90 font-medium">
                Sponsored by {currentWish.donorName}
              </p>

              {/* WhatsApp Chat Speech Bubble */}
              <div className="mt-3 rounded-2xl bg-white/10 p-3.5 border border-white/10 text-xs text-white/90 leading-relaxed">
                <p className="italic">
                  &ldquo;{currentWish.quote}&rdquo;
                </p>
                <p className="mt-2 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                  <span>✓✓ Delivered on WhatsApp with photos of food served &amp; 80G tax receipt</span>
                </p>
              </div>
            </div>

            {/* Sample Selector Tabs */}
            <div>
              <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
                Tap to Watch Other Wish Greetings:
              </p>
              <div className="flex flex-wrap gap-2">
                {wishes.map((w, idx) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setActiveWishIndex(idx)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      activeWishIndex === idx
                        ? "bg-saffron text-white ring-2 ring-gold shadow-sm"
                        : "bg-white/15 text-white/80 hover:bg-white/25"
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

      {/* 2. SPECIAL DAY CELEBRATION BOOKING & SCHEDULING FORM */}
      <section id="booking-section" className="rounded-3xl bg-teal-950 p-6 sm:p-10 text-white shadow-lg">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.1fr] items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
              <CalendarSlotIcon className="h-4 w-4" />
              <span>Prior Booking for Dignified Care</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-white">
              Reserve Your Special Day Celebration
            </h2>
            <p className="mt-2 text-sm text-teal-100/80 leading-relaxed">
              Whether you wish to visit our Turahalli, Subramanyapura home in person to cut cake and serve the children with your own hands, or celebrate remotely from anywhere in the world and receive celebration photos/videos, we warmly welcome your seva.
            </p>

            {/* Visit & Remote Guidelines */}
            <div className="mt-6 space-y-4 text-xs sm:text-sm text-white/90">
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold text-xs font-bold">1</span>
                <div>
                  <strong className="text-gold">In-Person Experience:</strong> You are invited to bring an eggless cake or fresh sweets. Caregivers and children assemble in our dining hall to sing, pray for your wellbeing, and let your family serve the feast.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold text-xs font-bold">2</span>
                <div>
                  <strong className="text-gold">Remote Seva with Video Proof:</strong> Celebrating from outside Bengaluru? Our kitchen prepares your chosen feast on the exact date. We display your name on the prayer board, and send high-resolution celebration photos & videos directly to your WhatsApp.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold text-xs font-bold">3</span>
                <div>
                  <strong className="text-gold">Form 10AC 80G Tax Exemption:</strong> All celebration contributions receive an instant official Section 80G receipt with 50% income tax deduction under the Indian Income Tax Act.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Booking Form / Success State */}
          <div className="rounded-3xl bg-white p-6 sm:p-7 text-teal-950 shadow-md">
            {bookingSuccess ? (
              <div className="space-y-5 text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <span className="rounded-lg bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-900 border border-emerald-300">
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
                    className="focus-ring block w-full rounded-xl bg-saffron px-5 py-3 text-center text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-saffron-dark active:scale-95"
                  >
                    Complete Online Contribution ({formatINR(bookingSuccess.amount)} with 80G) →
                  </Link>

                  <a
                    href={getWhatsAppBookingUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-xs font-bold text-white shadow transition hover:bg-emerald-700"
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
                <h3 className="font-display text-lg font-bold text-teal-900 border-b border-teal-900/10 pb-2">
                  Special Day Details
                </h3>

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
                      className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold text-teal-950"
                    >
                      {OCCASIONS.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
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
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                        <span className="font-bold">✓</span> Written on the special prayer board
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-teal-900/80 mb-1">
                      Date of Celebration:
                    </label>
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
                      Feast Package:
                    </label>
                    <select
                      value={selectedPkg}
                      onChange={(e) => setSelectedPkg(e.target.value)}
                      className="focus-ring w-full rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-semibold text-teal-950"
                    >
                      {PACKAGES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatINR(p.price)})
                        </option>
                      ))}
                    </select>
                  </div>
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
                      className={`rounded-xl p-2.5 text-left border transition text-xs ${
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
                      className={`rounded-xl p-2.5 text-left border transition text-xs ${
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
                        <option value="morning">Morning (11:00 AM - 1:30 PM Lunch Seva)</option>
                        <option value="evening">Evening (4:30 PM - 6:30 PM Snacks & Cake)</option>
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
                    Coordinator & Receipt Details
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
                      {donorEmail.trim().length > 0 && EMAIL_REGEX.test(donorEmail.trim()) && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <span className="font-bold">✓</span> 80G PDF receipt will be emailed here
                        </p>
                      )}
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
                      {donorPan.length === 10 && PAN_REGEX.test(donorPan) && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <span className="font-bold">✓</span> Valid 80G tax deduction format
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="focus-ring w-full rounded-xl bg-saffron px-6 py-3 font-bold text-white shadow-sm hover:bg-saffron-dark transition text-xs sm:text-sm active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? "Reserving Slot..." : `Reserve Celebration Slot (${formatINR(activePackage.price)})`}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-teal-950/60">
                    No immediate online payment forced: reserve your date now, pay online with 80G or at the Ashrama.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 3. COMMUNITY CELEBRATIONS SCHEDULE FEED */}
      {communityCelebs.length > 0 && (
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-900">
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

      {/* 4. VIRAL SOCIAL MEDIA STORY GENERATOR */}
      <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-800 ring-1 ring-rose-200">
              <InstagramStoryIcon className="h-3.5 w-3.5 text-rose-600" />
              <span>Inspire Your Social Circle</span>
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-teal-900">
              Trending on Instagram, WhatsApp &amp; Facebook
            </h2>
            <p className="mt-2 text-sm text-teal-950/75 leading-relaxed">
              When one donor celebrates their birthday at Janaseva Ashrama and posts a heartwarming story, their friends get inspired to do the same on their birthdays. You start a ripple effect of compassion across Bengaluru!
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyInstagramStory}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-teal-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800 active:scale-95"
              >
                <span>{copiedStory ? "Copied to Clipboard!" : "Copy Birthday Caption for Instagram"}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  "Hey! For my birthday this year, I am celebrating with 25 children at Janaseva Ashrama in Bengaluru. Join me or sponsor a wholesome meal here: https://www.janasevaashrama.org/celebrate-birthday"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-2 rounded-xl border border-teal-900/20 bg-cream px-4 py-2.5 text-xs font-bold text-teal-900 transition hover:bg-sand"
              >
                <WhatsAppStatusIcon className="h-4 w-4 text-emerald-600" />
                <span>Share on WhatsApp Status</span>
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-sand/40 p-6 border border-teal-900/10">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sample Social Media Post:</span>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-teal-900/10 text-xs sm:text-sm text-teal-950 space-y-3 font-sans">
              <p className="font-semibold text-teal-900">
                &ldquo;A birthday party lasts an evening. Feeding 25 children creates warmth that lasts a lifetime.&rdquo;
              </p>
              <p className="text-teal-950/70 text-xs leading-relaxed">
                Celebrating another year of life by sharing festive meals with the young souls at Janaseva Ashrama Bangalore. If you want to make your milestone truly count, visit them in Turahalli, Subramanyapura or sponsor a feast.
              </p>
              <div className="pt-2 border-t border-teal-900/10 text-[11px] font-semibold text-saffron-dark">
                #JanasevaAshrama #BirthdayCelebration #BangaloreNGO #FeedTheHungry #BirthdayGiving
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LOCATION & ROUTE GUIDANCE */}
      <section className="rounded-3xl bg-cream p-6 sm:p-8 border border-teal-900/10">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-teal-900/10 px-3 py-1 text-xs font-bold text-teal-900">
              <MapPinIcon className="h-3.5 w-3.5 text-saffron-dark" />
              <span>Bengaluru Ashram Location</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-teal-900">
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
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-teal-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800"
              >
                <MapPinIcon className="h-4 w-4 text-gold" />
                <span>Open in Google Maps</span>
              </a>
              <a
                href={`tel:${SITE.phone}`}
                className="focus-ring inline-flex items-center gap-2 rounded-xl border border-teal-900/20 bg-white px-4 py-2.5 text-xs font-bold text-teal-900 transition hover:bg-sand"
              >
                <span>Call +91 {SITE.phone}</span>
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-teal-900/15 shadow-sm min-h-[220px] bg-sand flex items-center justify-center p-6 text-center">
            <div>
              <VisitAshramaIcon className="h-10 w-10 text-teal-800 mx-auto mb-2" />
              <h3 className="font-display font-bold text-teal-900 text-base">Direct GPS Navigation</h3>
              <p className="text-xs text-teal-950/70 mt-1 max-w-xs mx-auto">
                Tap below to open turn-by-turn navigation directly on your phone.
              </p>
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition shadow"
              >
                Start Navigation →
              </a>
            </div>
          </div>
        </div>
      </section>

      <ValidationErrorModal
        isOpen={validationModalOpen}
        message={validationModalMessage}
        onClose={() => setValidationModalOpen(false)}
      />
    </div>
  );
}
