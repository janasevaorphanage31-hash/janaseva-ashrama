"use client";

import Link from "next/link";
import { useState } from "react";
import { Container, Head, Section } from "../ui";
import { useCart } from "../CartProvider";
import { formatINR, SITE } from "@/lib/site";
import type { WishVideoItem } from "@/lib/site-content";
import { track } from "@/lib/track";
import {
  BirthdayCakeIcon,
  BlessingsHeartIcon,
  FeastPlatterIcon,
  VisitAshramaIcon,
  TrendingSparkIcon,
  CalendarSlotIcon,
  MapPinIcon,
  TaxShieldIcon,
  WhatsAppStatusIcon,
  InstagramStoryIcon,
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
    cost: 3500,
    description: "Hot rice, sambar, seasonal vegetable curry, pooris, and traditional festival sweet (payasam) served to all 25 children.",
    servings: "Feeds all 25 children",
    popular: true,
  },
  {
    id: "feast-snacks",
    slug: "fruits",
    title: "Evening Snacks & Fresh Fruit Platter",
    cost: 2500,
    description: "Evening warm milk, healthy savouries, banana/apple fruit baskets, and joyful evening celebration time.",
    servings: "Evening treat for 25 children",
  },
  {
    id: "feast-breakfast",
    slug: "meal",
    title: "Wholesome Morning Breakfast",
    cost: 1500,
    description: "Nutritious steaming idlis or upma, chutney, and warm milk to start the children's school day with energy.",
    servings: "Morning breakfast for all 25 children",
  },
  {
    id: "feast-full-day",
    slug: "pantry",
    title: "Complete Day Nourishment & Care",
    cost: 7500,
    description: "Sponsor breakfast, special birthday lunch with sweets, evening snacks, and wholesome dinner for the entire day.",
    servings: "Full 24-hour Ashrama meal coverage",
  },
];

export function TrendingBirthdaySection({ wishVideos }: { wishVideos?: WishVideoItem[] }) {
  const { setCustom } = useCart();
  const [selectedFeast, setSelectedFeast] = useState<string>("feast-lunch");
  const [copiedStory, setCopiedStory] = useState(false);
  const [activeWishIndex, setActiveWishIndex] = useState(0);

  const activeFeast = FEAST_OPTIONS.find((f) => f.id === selectedFeast) || FEAST_OPTIONS[0];

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

  const handleSponsorOnline = () => {
    track("birthday_sponsor_click", { feast: activeFeast.id, amount: activeFeast.cost });
    // Add custom amount equal to feast cost to the cart
    setCustom(activeFeast.cost);
  };

  const handleCopyStory = () => {
    const text = `This birthday, I am celebrating with 25 children at Janaseva Ashrama in Bengaluru! Instead of material gifts, join me in sponsoring wholesome meals: https://janasevaorphanage.org/celebrate-birthday #JanasevaAshrama #BirthdayGiving #Bengaluru`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 3000);
    }
  };

  return (
    <Section id="celebrate" tone="cream" className="py-12 md:py-16">
      <Container>
        {/* Trending Eyebrow Badge */}
        <div className="flex items-center justify-center mb-3">
          <div className="inline-flex items-center gap-2 rounded-xl bg-saffron/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-saffron-dark ring-1 ring-saffron/30">
            <TrendingSparkIcon className="h-4 w-4 text-saffron-dark" />
            <span>Trending in Bengaluru: Birthday Giving</span>
          </div>
        </div>

        <Head
          eyebrow="Heartfelt Celebrations"
          title="Celebrate Your Birthday with 25 Children"
          lead="Experience the profound joy of sharing your milestone with young souls. Sponsoring a birthday feast or visiting the Ashrama creates heartwarming memories that outlast any ordinary party."
        />

        {/* Real Delivered WhatsApp Wish Video Showcase Card */}
        <div className="mt-6 overflow-hidden rounded-3xl bg-teal-950 text-white shadow-xl border border-teal-800">
          <div className="bg-teal-900/90 px-4 sm:px-6 py-3 border-b border-teal-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                WhatsApp Delivery Preview
              </span>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Delivered Within 2 Hours of Lunch
              </span>
            </div>
            <span className="text-[11px] text-gold font-semibold">
              Included Free With All Feast Bookings
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

                <h4 className="mt-2.5 font-display text-lg sm:text-xl font-bold text-white">
                  {currentWish.celebrantName}
                </h4>
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
        </div>

        {/* 3 Main Action Pillars */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pillar 1: Sponsor a Birthday Feast (Interactive Selector) */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 flex flex-col justify-between">
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
                1. Sponsor a Birthday Feast
              </h3>
              <p className="mt-1 text-xs text-teal-950/70 leading-relaxed">
                Choose a wholesome meal package freshly prepared in our Ashrama kitchen for all 25 children in your name.
              </p>

              {/* Feast Selection Radio Cards */}
              <div className="mt-4 space-y-2.5">
                {FEAST_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFeast(f.id)}
                    className={`focus-ring w-full rounded-2xl p-3 text-left transition border ${
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
                    <p className="mt-1 text-[11px] text-teal-950/65 line-clamp-2 leading-relaxed">
                      {f.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-teal-900/10">
              <Link
                href="/checkout"
                onClick={handleSponsorOnline}
                className="focus-ring block w-full rounded-xl bg-saffron px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-saffron-dark active:scale-95"
              >
                Sponsor {activeFeast.title.split(" ")[0]} ({formatINR(activeFeast.cost)}) →
              </Link>
              <p className="mt-2 text-center text-[11px] text-teal-950/60">
                Direct bank receipt issued instantly with 80G tax benefit.
              </p>
            </div>
          </div>

          {/* Pillar 2: Visit the Ashrama in Person */}
          <div className="rounded-3xl bg-teal-950 p-6 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-gold ring-1 ring-white/15">
                  <VisitAshramaIcon className="h-6 w-6 text-gold" />
                </span>
                <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                  In-Person Visit
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-white">
                2. Visit &amp; Celebrate in Person
              </h3>
              <p className="mt-1 text-xs text-white/80 leading-relaxed">
                Bring your family and children to Janaseva Ashrama in Turahalli, Subramanyapura. Cut a cake, share healthy treats, and receive unconditional blessings.
              </p>

              {/* Slot Timings & Guidelines */}
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                  <div className="flex items-center gap-2 text-gold font-bold text-xs mb-1">
                    <CalendarSlotIcon className="h-4 w-4" />
                    <span>Recommended Celebration Slots:</span>
                  </div>
                  <ul className="text-xs text-white/85 space-y-1">
                    <li>• <strong>Morning Slot:</strong> 10:30 AM to 1:00 PM (Lunch)</li>
                    <li>• <strong>Evening Slot:</strong> 4:30 PM to 6:30 PM (Cake &amp; Snacks)</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 text-xs text-white/85 leading-relaxed">
                  <div className="flex items-center gap-2 text-gold font-bold mb-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>Location:</span>
                  </div>
                  <p>{SITE.address}</p>
                  <p className="text-[11px] text-white/60 mt-1">Near Govt School, Jayanagar Housing Society Layout, accessible from Kanakapura Road, Banashankari, and South Bengaluru.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  "Hello Janaseva Ashrama, I would like to visit and celebrate my birthday with the children. Please guide me on booking a visiting slot."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
              >
                <WhatsAppStatusIcon className="h-4 w-4" />
                <span>Book Birthday Visit via WhatsApp</span>
              </a>

              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex items-center justify-center gap-2 w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-center text-xs font-bold text-white transition hover:bg-white/20"
              >
                <MapPinIcon className="h-4 w-4 text-gold" />
                <span>Open Google Maps Directions</span>
              </a>
            </div>
          </div>

          {/* Pillar 3: Viral Social & Friends Campaign */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-saffron/15 text-saffron-dark ring-1 ring-saffron/20">
                  <BirthdayCakeIcon className="h-6 w-6 text-saffron-dark" />
                </span>
                <span className="rounded-md bg-gold/20 px-2.5 py-1 text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                  Community Impact
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-teal-900">
                3. Ask Friends to Donate Meals
              </h3>
              <p className="mt-1 text-xs text-teal-950/70 leading-relaxed">
                Create a dedicated Birthday Fundraiser. Invite your WhatsApp groups, Instagram followers, and colleagues to gift meals instead of material gifts.
              </p>

              {/* Instagram / Social Share Box */}
              <div className="mt-4 rounded-2xl bg-sand/60 p-4 border border-teal-900/10">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-xs mb-2">
                  <InstagramStoryIcon className="h-4 w-4 text-rose-600" />
                  <span>Trending on Instagram & Facebook Stories</span>
                </div>
                <p className="text-[11px] text-teal-950/75 italic leading-relaxed">
                  &ldquo;This year, instead of expensive dinners, I chose to feed 25 children at Janaseva Ashrama. Best birthday ever!&rdquo;
                </p>
                <button
                  type="button"
                  onClick={handleCopyStory}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-teal-900/20 bg-white px-3 py-1.5 text-[11px] font-bold text-teal-900 hover:bg-cream transition"
                >
                  <span>{copiedStory ? "Copied Story Text!" : "Copy Instagram Story Text"}</span>
                </button>
              </div>

              {/* Why It Outlasts a Party */}
              <div className="mt-4 space-y-2 text-xs text-teal-950/80">
                <div className="flex items-start gap-2">
                  <BlessingsHeartIcon className="h-4 w-4 text-saffron-dark shrink-0 mt-0.5" />
                  <span><strong>Childhood Gratitude:</strong> Children sing, clap, and pray for your wellbeing and prosperity.</span>
                </div>
                <div className="flex items-start gap-2">
                  <TaxShieldIcon className="h-4 w-4 text-teal-800 shrink-0 mt-0.5" />
                  <span><strong>Clean Safeguards:</strong> Child dignity strictly preserved; zero commercial filming or exploitation.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-teal-900/10 space-y-2">
              <Link
                href="/celebrate-special-day"
                className="focus-ring block w-full rounded-xl bg-teal-900 px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-teal-800 active:scale-95"
              >
                Book Special Day Celebration (Feast &amp; Visit) →
              </Link>
              <Link
                href="/campaigns/new?occasion=Birthday&type=Individual"
                className="focus-ring block w-full rounded-xl border border-teal-900/20 bg-cream py-2.5 text-center text-xs font-bold text-teal-900 transition hover:bg-sand"
              >
                Create a Birthday Campaign Page
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
