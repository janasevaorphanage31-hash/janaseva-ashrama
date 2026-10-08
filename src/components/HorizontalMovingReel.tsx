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
    src: "/media/chapter1_dawn.mp4",
    poster: "/media/garden.jpg",
    time: "06:00 AM",
    title: "Dawn Prayers & Quiet Courtyard Awakening",
    kannada: "ಮುಂಜಾನೆಯ ಪ್ರಾರ್ಥನೆ ಮತ್ತು ಸತ್ಸಂಗ",
    impactTag: "Morning Milk & Care",
    sponsorAmount: 150,
  },
  {
    type: "image",
    src: "/media/meals.jpg",
    time: "08:00 AM",
    title: "25 Resident Boys Sharing Hot Breakfast",
    kannada: "ಎಲ್ಲಾ 25 ಮಕ್ಕಳಿಗೆ ಪೌಷ್ಟಿಕ ಉಪಹಾರ",
    impactTag: "Hot Annadana",
    sponsorAmount: 100,
  },
  {
    type: "video",
    src: "/media/chapter2_breakfast.mp4",
    poster: "/media/food.jpg",
    time: "08:30 AM",
    title: "Fresh Steaming Annadana in Ashrama Kitchen",
    kannada: "ಶುದ್ಧ ಹಾಗೂ ಪೌಷ್ಟಿಕ ಅಡುಗೆ ತಯಾರಿ",
    impactTag: "Kitchen Ration",
    sponsorAmount: 500,
  },
  {
    type: "image",
    src: "/media/learning.jpg",
    time: "10:30 AM",
    title: "Classroom Lessons, Notebooks & Big Dreams",
    kannada: "ಶಾಲಾ ವಿದ್ಯಾಭ್ಯಾಸ ಮತ್ತು ಬರವಣಿಗೆ",
    impactTag: "School Kits & Vidya",
    sponsorAmount: 250,
  },
  {
    type: "video",
    src: "/media/chapter3_vidya.mp4",
    poster: "/media/books.jpg",
    time: "11:30 AM",
    title: "Dedicated Mentorship & Homework Support",
    kannada: "ಸಂಜೆ ಟ್ಯೂಷನ್ ಮತ್ತು ಮಾರ್ಗದರ್ಶನ",
    impactTag: "Teacher Coaching",
    sponsorAmount: 400,
  },
  {
    type: "image",
    src: "/media/play.jpg",
    time: "04:45 PM",
    title: "Courtyard Games, Cricket & Carefree Joy",
    kannada: "ಸಂಜೆ ಆಟ ಮತ್ತು ಸ್ನೇಹ ಬಂಧ",
    impactTag: "Childhood Joy",
    sponsorAmount: 350,
  },
  {
    type: "video",
    src: "/media/chapter4_play.mp4",
    poster: "/media/play.jpg",
    time: "05:30 PM",
    title: "Laughter and Brotherhood in the Courtyard",
    kannada: "ಮಕ್ಕಳ ಮುಖದಲ್ಲಿ ಹರ್ಷದ ನಗು",
    impactTag: "Sports & Play",
    sponsorAmount: 200,
  },
  {
    type: "image",
    src: "/media/community.jpg",
    time: "07:30 PM",
    title: "Loving Guidance & Elder Caretaker Blessing",
    kannada: "ಪ್ರೀತಿ ಮತ್ತು ಸುರಕ್ಷಿತ ಆಶ್ರಯ",
    impactTag: "Home & Shelter",
    sponsorAmount: 1000,
  },
  {
    type: "video",
    src: "/media/chapter5_night.mp4",
    poster: "/media/poster-desktop.jpg",
    time: "08:30 PM",
    title: "Night Security, Evening Milk & Peaceful Sleep",
    kannada: "ಶಾಂತಿಯುತ ನಿದ್ರೆ ಮತ್ತು ರಕ್ಷಣೆ",
    impactTag: "Warm Bed & Security",
    sponsorAmount: 1500,
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
