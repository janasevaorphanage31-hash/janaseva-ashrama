"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Head, Section } from "../ui";
import { formatINR } from "@/lib/site";
import { BirthdayCakeIcon, BlessingsHeartIcon, WhatsAppStatusIcon } from "../icons/CelebrationIcons";

export interface DeliveredWish {
  id: string;
  celebrantName: string;
  occasion: string;
  donorName: string;
  deliveredDate: string;
  packageTitle: string;
  packageCost: number;
  videoUrl: string;
  thumbnailUrl?: string;
  quote: string;
  sharesCount: number;
}

const SAMPLE_DELIVERED_WISHES: DeliveredWish[] = [
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
    quote: "Happy Birthday Ananya Didi! Thank you for the sweet payasam and pooris! We sang for your bright future!",
    sharesCount: 142,
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
    quote: "Happy 25th Anniversary Uncle & Aunty! All 48 of us prayed for your health and happiness during morning prayer!",
    sharesCount: 89,
  },
  {
    id: "wish-3",
    celebrantName: "Vikram's First Salary Celebration",
    occasion: "First Salary Milestone",
    donorName: "Vikram S. (Tech Professional, Whitefield)",
    deliveredDate: "Delivered on WhatsApp • 03 Oct 2026",
    packageTitle: "Evening Snacks & Fresh Fruit Platter",
    packageCost: 2500,
    videoUrl: "/media/chapter4_play.mp4",
    thumbnailUrl: "/media/pantry.jpg",
    quote: "Congratulations Vikram Bhaiya on your first job! May God bless you with immense success in your career!",
    sharesCount: 116,
  },
];

export function DeliveredWishesSection() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <Section id="delivered-wishes" tone="white" className="py-12 md:py-16">
      <Container>
        {/* Eyebrow badge */}
        <div className="flex items-center justify-center mb-3">
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-600/20">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Done & Delivered: Celebration Wish Videos</span>
          </div>
        </div>

        <Head
          eyebrow="Proof of Pure Joy"
          title="Personalized Wish Videos Sent to Donors"
          lead="Every time you sponsor a birthday or family milestone, our 48+ children record a personalized greeting calling your celebrant by name. Here is real video proof of smiles delivered directly to donors on WhatsApp."
        />

        {/* Wish Video Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_DELIVERED_WISHES.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between overflow-hidden rounded-3xl bg-cream/35 ring-1 ring-teal-900/10 shadow-sm transition hover:shadow-md hover:ring-teal-900/20"
            >
              <div>
                {/* Video / Thumbnail Player Box */}
                <div className="relative aspect-video w-full bg-teal-950 overflow-hidden group">
                  <video
                    src={item.videoUrl}
                    poster={item.thumbnailUrl}
                    playsInline
                    preload="metadata"
                    controls
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-950/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm ring-1 ring-white/10">
                      <BirthdayCakeIcon className="h-3.5 w-3.5 text-gold" />
                      {item.occasion}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <span className="rounded-lg bg-emerald-700/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      Verified Delivered
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-teal-900 leading-snug">
                      {item.celebrantName}
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-teal-950/60 font-medium">
                    Dedicated by {item.donorName}
                  </p>

                  {/* Children's quote */}
                  <div className="mt-3 rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-saffron-dark mb-1">
                      <BlessingsHeartIcon className="h-3.5 w-3.5 text-saffron-dark" />
                      <span>Children&apos;s Greeting in Video:</span>
                    </div>
                    <p className="text-xs italic text-teal-950/80 leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>

                  {/* Delivery & Package Details */}
                  <div className="mt-3 flex items-center justify-between text-xs text-teal-950/70 border-t border-teal-900/10 pt-2.5">
                    <span>{item.packageTitle}</span>
                    <strong className="text-teal-900">{formatINR(item.packageCost)}</strong>
                  </div>

                  <p className="mt-1 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                    <WhatsAppStatusIcon className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{item.deliveredDate}</span>
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-5 pt-0">
                <Link
                  href="/celebrate-special-day"
                  className="focus-ring block w-full rounded-xl bg-teal-900 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-teal-800 active:scale-95"
                >
                  Sponsor to Get Your Wish Video →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works Explainer Banner */}
        <div className="mt-10 rounded-3xl bg-teal-950 p-6 sm:p-8 text-white shadow-md">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/20 text-gold text-xs font-bold">1</span>
              <h4 className="font-display text-sm font-bold text-white">1. Choose Date & Sponsoring Package</h4>
              <p className="text-xs text-teal-100/75 leading-relaxed">
                Pick your loved one&apos;s birthday, anniversary, or milestone and select a lunch, breakfast, or cake feast.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/20 text-gold text-xs font-bold">2</span>
              <h4 className="font-display text-sm font-bold text-white">2. Children Record Personalized Video</h4>
              <p className="text-xs text-teal-100/75 leading-relaxed">
                On the celebration day, all 48+ children assemble with a festive board displaying the celebrant&apos;s name and sing a joyful greeting.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/20 text-gold text-xs font-bold">3</span>
              <h4 className="font-display text-sm font-bold text-white">3. Delivered Directly to Your WhatsApp</h4>
              <p className="text-xs text-teal-100/75 leading-relaxed">
                Receive the video in crystal clear HD along with your official 80G tax receipt, ready to share with family and social media.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
