"use client";

import { useEffect, useRef } from "react";
import { formatINR } from "@/lib/site";
import { useCart } from "./CartProvider";

interface ReelCard {
  type: "video" | "image";
  src: string;
  poster?: string;
  time: string;
  title: string;
  kannada: string;
  impactTag: string;
  sponsorAmount: number;
}

const REEL_ITEMS: ReelCard[] = [
  {
    type: "video",
    src: "/media/video-chant-prayer.mp4",
    poster: "/media/annadana-hall-hd.jpg",
    time: "06:30 AM",
    title: "Morning Prayer & Chanting of Shlokas",
    kannada: "ಮುಂಜಾನೆಯ ಸಾಮೂಹಿಕ ಪ್ರಾರ್ಥನೆ ಹಾಗೂ ಶಾಂತಿ ಮಂತ್ರ",
    impactTag: "Morning Shloka Prayer",
    sponsorAmount: 150,
  },
  {
    type: "image",
    src: "/media/annadana-hall-hd.jpg",
    time: "08:00 AM",
    title: "25 Resident Boys in Prayer Before Hot Meals",
    kannada: "ಎಲ್ಲಾ 25 ಮಕ್ಕಳಿಗೆ ಪೌಷ್ಟಿಕ ಅನ್ನದಾನ ಪ್ರಾರ್ಥನೆ",
    impactTag: "Hot Annadana Seva",
    sponsorAmount: 100,
  },
  {
    type: "video",
    src: "/media/video-chess-boys.mp4",
    poster: "/media/carrom-play.jpg",
    time: "10:00 AM",
    title: "Hall Chess Tournament & Intellectual Strategy",
    kannada: "ಚದುರಂಗ ಮತ್ತು ಕ್ಯಾರಮ್ ಆಟದ ಸ್ಪರ್ಧೆ",
    impactTag: "Mind Sports & Chess",
    sponsorAmount: 250,
  },
  {
    type: "image",
    src: "/media/birthday-cake-celebration.jpg",
    time: "12:30 PM",
    title: "Real Birthday Cake Cutting with Well-Wisher",
    kannada: "ದಾನಿಗಳ ಜೊತೆ ಹುಟ್ಟುಹಬ್ಬದ ಸಂಭ್ರಮ ಹಾಗೂ ಕೇಕ್ ಕತ್ತರಿಸುವಿಕೆ",
    impactTag: "Birthday Cake & Joy",
    sponsorAmount: 3500,
  },
  {
    type: "image",
    src: "/media/banana-leaf-feast.jpg",
    time: "01:30 PM",
    title: "Traditional Festival Banana Leaf Feast (Bale Ele Oota)",
    kannada: "ಸಾಂಪ್ರದಾಯಿಕ ಬಾಳೆ ಎಲೆ ಹಬ್ಬದ ಊಟ",
    impactTag: "Traditional Feast",
    sponsorAmount: 500,
  },
  {
    type: "image",
    src: "/media/art-drawings.jpg",
    time: "03:30 PM",
    title: "Art & Drawing Competition Creations",
    kannada: "ಚಿತ್ರಕಲೆ ಸ್ಪರ್ಧೆ ಹಾಗೂ ಕಲಾ ಪ್ರದರ್ಶನ",
    impactTag: "Art & Drawing Kits",
    sponsorAmount: 300,
  },
  {
    type: "image",
    src: "/media/yoga-day.jpg",
    time: "04:30 PM",
    title: "International Yoga Day & Sukhasana Meditation",
    kannada: "ಅಂತರರಾಷ್ಟ್ರೀಯ ಯೋಗ ದಿನ ಹಾಗೂ ಧ್ಯಾನ",
    impactTag: "Yoga & Wellness",
    sponsorAmount: 200,
  },
  {
    type: "image",
    src: "/media/flag-hoisting-rangoli.jpg",
    time: "05:30 PM",
    title: "Independence Day Flag Hoisting & Tricolour Rangoli",
    kannada: "ಸ್ವಾತಂತ್ರ್ಯ ದಿನಾಚರಣೆ ಹಾಗೂ ತ್ರಿವರ್ಣ ನಕಾಶೆ ರಂಗೋಲಿ",
    impactTag: "National Pride",
    sponsorAmount: 1000,
  },
  {
    type: "image",
    src: "/media/diwali-deepas.jpg",
    time: "06:45 PM",
    title: "Diwali Deepotsava with Handheld Glowing Clay Lamps",
    kannada: "ದೀಪಾವಳಿ ದೀಪೋತ್ಸವ ಹಾಗೂ ಮಕ್ಕಳ ಸಂಭ್ರಮ",
    impactTag: "Festival of Lights",
    sponsorAmount: 800,
  },
  {
    type: "image",
    src: "/media/excellence-certificates.jpg",
    time: "08:00 PM",
    title: "Academic & Competition Excellence Certificates",
    kannada: "ಪ್ರತಿಭಾ ಪ್ರಶಸ್ತಿ ಹಾಗೂ ಶೈಕ್ಷಣಿಕ ಪ್ರಮಾಣಪತ್ರಗಳು",
    impactTag: "Excellence Awards",
    sponsorAmount: 600,
  },
];

export function HorizontalMovingReel() {
  const { openBottomDonate } = useCart();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Duplicate items for a continuous seamless marquee loop
  const displayItems = [...REEL_ITEMS, ...REEL_ITEMS];

  return (
    <div className="w-full max-w-full overflow-hidden bg-teal-950 py-5 sm:py-7 border-y border-white/10 select-none">
      {/* Header Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Life in Motion at Janaseva Ashrama
          </span>
          <span className="hidden sm:inline text-xs text-white/50">·</span>
          <span className="hidden sm:inline text-xs text-white/70">
            A Day in the Life of 25 Orphaned Boys in Bengaluru
          </span>
        </div>

        <button
          type="button"
          onClick={() => openBottomDonate(4500, "food_one_day")}
          className="text-[11px] font-bold text-amber-300 hover:text-white underline underline-offset-4 cursor-pointer"
        >
          Sponsor a Day (₹4,500) →
        </button>
      </div>

      {/* Moving Marquee Container */}
      <div
        ref={scrollerRef}
        className="relative w-full overflow-hidden"
        aria-label="Horizontal moving reel of photos and videos of Janaseva boys"
      >
        <div className="animate-marquee flex gap-4 pl-4 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
          {displayItems.map((item, idx) => (
            <div
              key={`${item.time}-${idx}`}
              className="group relative h-72 w-56 sm:h-80 sm:w-64 shrink-0 overflow-hidden rounded-2xl bg-teal-900 border border-white/15 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-amber-400"
            >
              {/* Media Background */}
              {item.type === "video" ? (
                <video
                  src={item.src}
                  poster={item.poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-950/40 to-transparent" />

              {/* Time Badge (Top Left) */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-teal-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur border border-white/15">
                {item.type === "video" && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                )}
                <span>{item.time}</span>
              </div>

              {/* Impact Tag (Top Right) */}
              <div className="absolute top-3 right-3 rounded-lg bg-white/20 px-2 py-1 text-[9px] font-black uppercase text-white backdrop-blur">
                {item.impactTag}
              </div>

              {/* Bottom Information & Action */}
              <div className="absolute inset-x-0 bottom-0 p-3.5 space-y-2">
                <div>
                  <h4 className="font-display text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-amber-200/90 font-medium truncate mt-0.5">
                    {item.kannada}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/15">
                  <span className="text-xs font-black text-amber-300">
                    {formatINR(item.sponsorAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBottomDonate(item.sponsorAmount);
                    }}
                    className="focus-ring tap-scale rounded-lg bg-amber-500 hover:bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase text-teal-950 shadow transition cursor-pointer"
                  >
                    Sponsor 💝
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
