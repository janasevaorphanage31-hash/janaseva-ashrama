"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Container, Head, Section, Chip } from "../ui";
import { formatINR } from "@/lib/site";
import { useCart } from "../CartProvider";
import { track } from "@/lib/track";

export type VideoChapter = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  duration: string;
  videoSrc: string;
  posterSrc: string;
  associatedSlug: string;
  associatedItemName: string;
  associatedPrice: number;
  description: string;
};

const CHAPTERS: VideoChapter[] = [
  {
    id: "chapter1",
    number: "01",
    title: "Dawn Shloka & Morning Prayer",
    subtitle: "Chanting peace mantras, gratitude routines, and awakening energy",
    duration: "0:45",
    videoSrc: "/media/video-chant-prayer.mp4",
    posterSrc: "/media/poster-desktop.jpg",
    associatedSlug: "fruits",
    associatedItemName: "Fruit & Milk Basket",
    associatedPrice: 150,
    description: "Every morning begins at 6:00 AM with clean routines, Sanskrit prayer chanting, and quiet gratitude for a new day.",
  },
  {
    id: "chapter2",
    number: "02",
    title: "The Ashrama Kitchen & Annadana",
    subtitle: "Wholesome hot meals prepared fresh with motherly care",
    duration: "0:50",
    videoSrc: "/media/video-chant-prayer.mp4",
    posterSrc: "/media/banana-leaf-feast.jpg",
    associatedSlug: "meal",
    associatedItemName: "Warm Meal Support",
    associatedPrice: 100,
    description: "Steam rises from giant pots of rice, fresh sambar, and dal. All 25 boys receive dignified, nutritious sustenance.",
  },
  {
    id: "chapter3",
    number: "03",
    title: "Vidya: The Classroom & Art",
    subtitle: "Books, competitive artwork, and passionate teachers",
    duration: "0:52",
    videoSrc: "/media/video-chess-boys.mp4",
    posterSrc: "/media/art-drawings.jpg",
    associatedSlug: "school-kit",
    associatedItemName: "Complete School Kit",
    associatedPrice: 250,
    description: "Dedicated study hours where older mentors help younger students with math, reading, science, art, and English.",
  },
  {
    id: "chapter4",
    number: "04",
    title: "Chess Tournaments & Play",
    subtitle: "Strategic chess battles, carrom, laughter, and brotherhood",
    duration: "0:48",
    videoSrc: "/media/video-chess-boys.mp4",
    posterSrc: "/media/carrom-play.jpg",
    associatedSlug: "activities",
    associatedItemName: "Sports & Creative Kit",
    associatedPrice: 350,
    description: "Childhood belongs in every day of residential care. Focus, teamwork, chess strategy, and radiant smiles.",
  },
  {
    id: "chapter5",
    number: "05",
    title: "Evening Satsang & Rest",
    subtitle: "Warm blankets, safe dormitories, and peaceful sleep",
    duration: "0:42",
    videoSrc: "/media/video-chant-prayer.mp4",
    posterSrc: "/media/evening-satsang.jpg",
    associatedSlug: "bedding",
    associatedItemName: "Bedding & Warm Blanket",
    associatedPrice: 600,
    description: "After evening dinner, clean beds and warm blankets give every child the security they deserve for peaceful dreams.",
  },
];

export function DocumentaryVideoSection({
  chapters,
}: {
  chapters?: VideoChapter[];
} = {}) {
  const activeChapters = chapters && chapters.length > 0 ? chapters : CHAPTERS;
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cart = useCart();

  const current = activeChapters[activeChapterIndex] || activeChapters[0];

  const handleSelectChapter = (index: number) => {
    setActiveChapterIndex(index);
    setIsPlaying(true);
    track("video_chapter_switch", { chapter: activeChapters[index]?.id });
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSupportMoment = (slug: string) => {
    cart.setQty(slug, (cart.qty[slug] || 0) + 1);
    cart.openBottomDonate(current.associatedPrice);
    track("support_video_moment", { slug, chapter: current.id });
  };

  return (
    <Section id="videos" tone="teal" className="overflow-hidden py-10 md:py-16 scroll-mt-14">
      <div id="documentary" className="scroll-mt-14" />
      <Container>
        <div className="mb-2">
          <Chip tone="gold">Documentary Lens</Chip>
        </div>
        <Head
          eyebrow="Life In Motion"
          title="See Real Daily Life at Janaseva Ashrama"
          lead="Watch authentic, unstaged moments from our home. Experience dawn to dusk with the children, and choose a moment you would love to support."
          light
        />

        {/* Video Player & Chapters Layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start w-full min-w-0">
          {/* Main Video Viewport (7 Cols) */}
          <div className="lg:col-span-7 w-full min-w-0">
            <div className="relative overflow-hidden rounded-3xl bg-teal-950 shadow-2xl ring-1 ring-white/15">
              <video
                ref={videoRef}
                key={current.videoSrc}
                poster={current.posterSrc}
                playsInline
                muted={isMuted}
                autoPlay
                loop
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="aspect-[16/10] w-full object-cover"
              >
                <source src={current.videoSrc} type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>

              {/* Floating Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-transparent to-teal-950/30 pointer-events-none" />

              {/* Top Bar on Video */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="rounded-md bg-teal-950/80 px-3 py-1 text-xs font-bold text-gold backdrop-blur-md">
                  Chapter {current.number}: {current.title}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMuted((v) => !v)}
                  className="focus-ring flex items-center gap-1.5 rounded-xl bg-teal-950/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md hover:bg-teal-900 transition"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    {isMuted ? (
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    ) : (
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    )}
                  </svg>
                  <span>{isMuted ? "Sound Off" : "Sound On"}</span>
                </button>
              </div>

              {/* Bottom Video Controls & Info */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="max-w-md">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    {current.subtitle}
                  </p>
                  <p className="mt-1 text-xs text-white/80 line-clamp-2">
                    {current.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-900 shadow-lg hover:bg-gold transition active:scale-95 font-bold"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? "❚❚" : "▶"}
                  </button>
                </div>
              </div>
            </div>

            {/* Support This Moment Callout Box */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
              <div className="flex items-center gap-3.5">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-teal-900 shrink-0 ring-1 ring-white/20">
                  <Image
                    src={current.posterSrc}
                    alt={current.associatedItemName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gold">
                    Support This Daily Moment
                  </p>
                  <h4 className="font-display text-base font-bold text-white">
                    {current.associatedItemName}: {formatINR(current.associatedPrice)}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSupportMoment(current.associatedSlug)}
                className="focus-ring w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-saffron px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-saffron-dark transition active:scale-95 shrink-0 animate-heartbeat"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
                </span>
                <span>💝 SPONSOR THIS MOMENT</span>
                <span>({formatINR(current.associatedPrice)})</span>
              </button>
            </div>
          </div>

          {/* Chapter Selector Playlist (5 Cols) */}
          <div className="lg:col-span-5 w-full min-w-0 space-y-2.5">
            <h3 className="font-display text-lg font-bold text-white mb-2">
              Daily Documentary Chapters
            </h3>

            {activeChapters.map((ch, idx) => {
              const active = idx === activeChapterIndex;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectChapter(idx)}
                  className={`focus-ring w-full text-left rounded-2xl p-3.5 transition flex items-center gap-3.5 ${
                    active
                      ? "bg-white text-teal-950 shadow-lg ring-2 ring-gold"
                      : "bg-white/10 text-white hover:bg-white/15 ring-1 ring-white/10"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-teal-950">
                    <Image
                      src={ch.posterSrc}
                      alt={ch.title}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                      {ch.duration}
                    </span>
                    {active && (
                      <span className="absolute inset-0 grid place-items-center bg-teal-900/60 text-xs font-bold text-gold">
                        ▶
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${active ? "text-saffron-dark" : "text-gold"}`}>
                        Chapter {ch.number}
                      </span>
                      {active && (
                        <span className="rounded-md bg-teal-900 px-2 py-0.5 text-[9px] font-bold text-white">
                          NOW PLAYING
                        </span>
                      )}
                    </div>
                    <p className={`font-display text-sm font-bold truncate ${active ? "text-teal-900" : "text-white"}`}>
                      {ch.title}
                    </p>
                    <p className={`text-xs truncate ${active ? "text-teal-950/70" : "text-white/60"}`}>
                      {ch.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Trust Transparency Strip */}
            <div className="mt-4 rounded-2xl bg-teal-950/60 p-4 text-[11px] text-white/70 space-y-1.5 ring-1 ring-white/10">
              <p className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Authentic Documentary:</strong> All videos recorded with consent at Janaseva Ashrama.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>No Intermediaries:</strong> 100% of contributions directly support Ashrama needs.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Form 10AC:</strong> Provisional 80G tax receipt issued instantly on payment.</span>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
