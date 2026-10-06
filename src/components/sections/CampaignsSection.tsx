"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Chip, Container, Head, Section } from "../ui";
import { formatINR, OCCASIONS, CAMPAIGN_TYPES } from "@/lib/site";
export { OCCASIONS, CAMPAIGN_TYPES };

export interface OccasionItem {
  name: string;
  desc: string;
  image: string;
  video: string;
}

export const OCCASIONS_LIST: OccasionItem[] = [
  {
    name: "BIRTHDAY",
    desc: "Sponsor meals, sweets, or school books on your birthday.",
    image: "/media/meals.jpg",
    video: "/media/ashrama_video.mp4",
  },
  {
    name: "FIRST SALARY",
    desc: "Celebrate your first paycheck by giving back to young dreamers.",
    image: "/media/learning.jpg",
    video: "/media/chapter3_vidya.mp4",
  },
  {
    name: "GRADUATION",
    desc: "Mark academic success by equipping students with learning tools.",
    image: "/media/books.jpg",
    video: "/media/chapter1_dawn.mp4",
  },
  {
    name: "ANNIVERSARY",
    desc: "Celebrate togetherness by sharing warmth and stability.",
    image: "/media/community.jpg",
    video: "/media/chapter5_night.mp4",
  },
  {
    name: "FESTIVAL",
    desc: "Spread joy on Diwali, Ugadi, Eid, or Christmas.",
    image: "/media/fruits.jpg",
    video: "/media/ashrama_journey.mp4",
  },
  {
    name: "THANK YOU",
    desc: "Say thank you to mentors and friends with meaningful giving.",
    image: "/media/school-kit.jpg",
    video: "/media/chapter4_play.mp4",
  },
  {
    name: "TRIBUTE",
    desc: "Honor the sacred memory of beloved elders with lasting care.",
    image: "/media/pantry.jpg",
    video: "/media/chapter2_breakfast.mp4",
  },
  {
    name: "ACHIEVEMENT",
    desc: "Celebrate a promotion, award, or personal milestone.",
    image: "/media/play.jpg",
    video: "/media/chapter4_play.mp4",
  },
  {
    name: "JUST BECAUSE",
    desc: "Make an ordinary day extraordinary for a child.",
    image: "/media/food.jpg",
    video: "/media/ashrama_video.mp4",
  },
];

export type CampaignCardData = {
  slug: string;
  title: string;
  occasion: string;
  coverImage: string | null;
  videoUrl?: string | null;
  organizerName: string;
  goalAmount: number;
  raised: number;
  supporters: number;
  isSample: boolean;
};

export function CampaignCard({ c }: { c: CampaignCardData }) {
  const [playingVideo, setPlayingVideo] = useState(false);
  const pct = Math.min(100, Math.round((c.raised / c.goalAmount) * 100));

  return (
    <div className="block w-[78vw] max-w-[330px] overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-teal-900/10 transition hover:shadow-md md:w-auto md:max-w-none flex flex-col justify-between">
      <div>
        <div className="relative aspect-[16/10] bg-teal-100 overflow-hidden">
          {playingVideo && c.videoUrl ? (
            <video
              src={c.videoUrl}
              autoPlay
              controls
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              {c.coverImage && (
                <Image
                  src={c.coverImage}
                  alt={c.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 300px, 400px"
                />
              )}
              <span className="absolute left-3 top-3">
                <Chip tone="plain">{c.occasion}</Chip>
              </span>
              {c.isSample && (
                <span className="absolute right-3 top-3">
                  <Chip tone="gold">Example</Chip>
                </span>
              )}
              {c.videoUrl && (
                <button
                  type="button"
                  onClick={() => setPlayingVideo(true)}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-950/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm hover:bg-teal-900 transition"
                >
                  <span>▶ Watch Video</span>
                </button>
              )}
            </>
          )}
        </div>
        <div className="p-4">
          <Link href={`/campaigns/${c.slug}`}>
            <h4 className="font-display text-base sm:text-lg font-bold leading-snug text-teal-900 hover:text-saffron-dark transition">
              {c.title}
            </h4>
          </Link>
          <p className="mt-0.5 text-xs text-teal-950/60">by {c.organizerName}</p>

          <div
            className="mt-3 h-2 overflow-hidden rounded-md bg-teal-100"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Verified progress"
          >
            <div className="h-full rounded-md bg-saffron" style={{ width: `${pct}%` }} />
          </div>

          <p className="mt-2 flex justify-between text-xs text-teal-950/70">
            <span>
              <strong className="text-teal-900">{formatINR(c.raised)}</strong> of {formatINR(c.goalAmount)}
            </span>
            <span>
              {c.supporters} supporter{c.supporters === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>

      <div className="p-4 pt-0">
        <Link
          href={`/campaigns/${c.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-saffron-dark hover:underline"
        >
          View Campaign & Support →
        </Link>
      </div>
    </div>
  );
}

export function CampaignsSection({
  campaigns,
  standalone = false,
}: {
  campaigns: CampaignCardData[];
  standalone?: boolean;
}) {
  const [activeMediaModal, setActiveMediaModal] = useState<OccasionItem | null>(null);

  return (
    <Section id="create" tone="cream" className="py-12 md:py-16">
      <Container>
        {/* Header: MAKE A DAY MATTER */}
        <Head
          eyebrow="Occasion Giving"
          title="Make a Day Matter"
          lead="Turn your birthday, anniversary, first salary, or cherished milestone into verified daily nourishment and education for children at Janaseva Ashrama."
        />

        {/* 9 Occasion Cards Grid with Image & Video Display */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
          {OCCASIONS_LIST.map((occ) => (
            <div
              key={occ.name}
              className="flex flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-teal-900/10 transition hover:shadow-md hover:ring-saffron/40 w-full min-w-0"
            >
              {/* Media Preview Box (Image + Video Trigger) */}
              <div className="relative aspect-[16/9] w-full bg-teal-950 overflow-hidden group">
                <Image
                  src={occ.image}
                  alt={occ.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-black/20" />

                <div className="absolute top-2.5 left-2.5">
                  <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-teal-950 tracking-wider backdrop-blur-sm">
                    {occ.name}
                  </span>
                </div>

                {/* Watch Celebration Video Button */}
                <button
                  type="button"
                  onClick={() => setActiveMediaModal(occ)}
                  className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-lg bg-teal-950/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-saffron hover:text-white transition"
                  title="Watch Celebration Clip"
                >
                  <span>▶ Watch Video</span>
                </button>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-display text-base font-bold text-teal-900">
                    {occ.name}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-teal-950/70">
                    {occ.desc}
                  </p>
                </div>

                {/* Action Buttons: Rounded-xl, No pill shape */}
                <div className="mt-4 pt-3 border-t border-teal-900/5 flex items-center gap-2">
                  <Link
                    href={`/campaigns/new?occasion=${encodeURIComponent(occ.name)}&type=Individual`}
                    className="focus-ring flex-1 rounded-xl bg-saffron py-2 text-center text-xs font-bold text-white hover:bg-saffron-dark transition shadow-sm"
                  >
                    CREATE AN IMPACT
                  </Link>
                  <Link
                    href={`/checkout?occasion=${encodeURIComponent(occ.name)}`}
                    className="focus-ring rounded-xl bg-cream px-3 py-2 text-center text-xs font-semibold text-teal-900 border border-teal-900/15 hover:bg-sand transition"
                    title="Dedicate a contribution today"
                  >
                    Dedicate
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Player Modal */}
        {activeMediaModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/80 p-4 backdrop-blur-sm"
            onClick={() => setActiveMediaModal(null)}
          >
            <div
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-teal-950 text-white shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">
                    {activeMediaModal.name} CELEBRATION
                  </span>
                  <span className="text-xs text-white/70">Ashrama Moments</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMediaModal(null)}
                  className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20"
                >
                  Close ✕
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <video
                  src={activeMediaModal.video}
                  autoPlay
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-teal-900/60">
                <div>
                  <h4 className="font-display font-bold text-sm text-white">
                    Celebrate {activeMediaModal.name} at Janaseva
                  </h4>
                  <p className="text-xs text-teal-100/75 mt-0.5">
                    {activeMediaModal.desc}
                  </p>
                </div>
                <Link
                  href={`/campaigns/new?occasion=${encodeURIComponent(activeMediaModal.name)}&type=Individual`}
                  onClick={() => setActiveMediaModal(null)}
                  className="rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition shadow"
                >
                  Start This Occasion Seva →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Active Verified Campaigns Showcase */}
        {campaigns.length > 0 && (
          <div className="mt-14 border-t border-teal-900/10 pt-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                  Active Community Campaigns
                </h3>
                <p className="text-xs sm:text-sm text-teal-950/65 mt-0.5">
                  See how supporters across India are turning their special days into verified impact.
                </p>
              </div>
              <Link
                href="/campaigns"
                className="text-xs font-bold text-saffron-dark hover:underline"
              >
                View all campaigns →
              </Link>
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <div className="swipe md:grid md:grid-cols-3 md:gap-5 md:overflow-visible w-full max-w-full">
                {campaigns.map((c) => (
                  <CampaignCard key={c.slug} c={c} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Fast Action */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-teal-900/10 pt-6">
          <Link
            href="/make-a-day-matter"
            className="focus-ring rounded-xl bg-teal-900 px-6 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-teal-800 shadow"
          >
            EXPLORE OCCASION GIVING →
          </Link>
          {!standalone && (
            <Link
              href="/gift-impact"
              className="text-xs font-bold text-saffron-dark hover:underline"
            >
              Or send a digital Impact Gift card to a friend →
            </Link>
          )}
        </div>
      </Container>
    </Section>
  );
}
