"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container, Head, Section } from "../ui";
import { SITE } from "@/lib/site";
import { track } from "@/lib/track";

const SKILLS = [
  { name: "📐 Math & Science", id: "math" },
  { name: "🗣️ Spoken English", id: "english" },
  { name: "🎨 Art & Drawings", id: "art" },
  { name: "🧘 Yoga & Sports", id: "sports" },
  { name: "💻 Computer Basics", id: "computer" },
  { name: "🍲 Kitchen Seva", id: "kitchen" },
  { name: "🩺 Doctor & Health", id: "health" },
];

const CREATOR_TYPES = [
  "📸 Lifestyle & Travel",
  "💻 Tech & Students",
  "🍲 Food & Cooking",
  "🎨 Artists & Writers",
  "🏃 Sports & Fitness",
];

export function InvolvedSection({ standalone = false }: { standalone?: boolean }) {
  const [activeTab, setActiveTab] = useState<"volunteers" | "influencers">("volunteers");
  const [selectedSkill, setSelectedSkill] = useState("📐 Math & Science");
  const [playingVideo, setPlayingVideo] = useState(false);

  const handleWhatsAppVolunteer = () => {
    track("volunteer_whatsapp_click", { skill: selectedSkill });
    const text = encodeURIComponent(
      `Hello Janaseva Ashrama, I would like to volunteer on weekends for: ${selectedSkill}. Please let me know how I can join!`
    );
    window.open(`https://wa.me/${SITE.whatsapp}?text=${text}`, "_blank");
  };

  const handleWhatsAppCreator = () => {
    track("creator_whatsapp_click", { role: "creator" });
    const text = encodeURIComponent(
      "Hello Janaseva Ashrama, I am a content creator. I would like to visit the Bangalore ashrama and create reels/stories to support the 25 resident boys."
    );
    window.open(`https://wa.me/${SITE.whatsapp}?text=${text}`, "_blank");
  };

  return (
    <Section id="volunteer" tone="white" className="py-12 md:py-16">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <Head
            eyebrow="Share Your Time & Heart · ಸ್ವಯಂಸೇವೆ"
            title="Give Your Time: Teach, Mentor, or Share"
            lead="Money is not the only gift. Teach math, sing a song, play football, or share our children's story with your friends and followers."
          />
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="#official-tiers"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-saffron px-4 py-2.5 text-xs font-black text-white hover:bg-saffron-dark transition shadow-sm cursor-pointer"
            >
              <span>🏛️ 5 Official Tiers</span>
            </a>
            <a
              href="#contact"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl border border-teal-900/20 bg-sand/50 px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-sand transition cursor-pointer"
            >
              <span>📍 Visit Campus</span>
            </a>
          </div>
        </div>

        {/* Tab Switcher: Volunteers vs Influencers */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-2xl bg-cream p-1.5 ring-1 ring-teal-900/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab("volunteers");
                setPlayingVideo(false);
              }}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "volunteers"
                  ? "bg-teal-900 text-white shadow-sm"
                  : "text-teal-900/70 hover:text-teal-900"
              }`}
            >
              <span>🤝 Weekend Mentors &amp; Volunteers</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("influencers");
                setPlayingVideo(false);
              }}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "influencers"
                  ? "bg-teal-900 text-white shadow-sm"
                  : "text-teal-900/70 hover:text-teal-900"
              }`}
            >
              <span>📢 Creators &amp; Influencers</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: WEEKEND VOLUNTEERS ── */}
        {activeTab === "volunteers" && (
          <div className="rounded-3xl bg-cream/70 p-5 sm:p-8 border border-teal-900/12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center animate-fadeIn">
            {/* Left: Authentic Visual */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="relative aspect-[4/3] w-full rounded-2xl bg-teal-950 overflow-hidden shadow-md">
                {playingVideo ? (
                  <video
                    src="/media/ashrama_video.mp4"
                    autoPlay
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <Image
                      src="/media/volunteers.jpg"
                      alt="Janaseva Volunteers Mentoring Boys"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <div>
                        <p className="text-xs font-bold text-white">Weekend Mentorship Seva</p>
                        <p className="text-[10px] text-teal-100/75">240+ teaching hours logged</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlayingVideo(true)}
                        className="rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-saffron-dark transition cursor-pointer"
                      >
                        ▶ Watch Video
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-teal-950/80 font-medium text-center">
                <div className="rounded-xl bg-white p-2.5 border border-teal-900/10">
                  <strong className="block text-teal-900 text-sm">25 Boys</strong> Awaiting mentorship
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-teal-900/10">
                  <strong className="block text-teal-900 text-sm">Every Weekend</strong> Saturday &amp; Sunday
                </div>
              </div>
            </div>

            {/* Right: Interactive Skill Selector & WhatsApp Connect */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-2">
                  Select Your Skill or Passion:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((skill) => {
                    const isSelected = selectedSkill === skill.name;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => setSelectedSkill(skill.name)}
                        className={`focus-ring tap-scale inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-teal-900 text-white shadow-sm ring-2 ring-saffron scale-102"
                            : "bg-white text-teal-900 hover:bg-sand border border-teal-900/10"
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Short & Sweet Volunteer Guidelines */}
              <div className="rounded-2xl bg-white p-4 border border-teal-900/10 space-y-2 text-xs">
                <p className="font-bold text-teal-900 flex items-center gap-1.5">
                  <span>✨</span> How Weekend Seva Works:
                </p>
                <div className="space-y-1 text-teal-950/80">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Saturday &amp; Sunday slots: 10:30 AM to 1:00 PM or 4:00 PM to 6:30 PM.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Materials provided by ashrama. No commercial promotion permitted.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Official Volunteer Experience Certificate issued for your portfolio.</span>
                  </div>
                </div>
              </div>

              {/* 1-Tap Actions: Direct WhatsApp + Interconnections */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={handleWhatsAppVolunteer}
                  className="focus-ring tap-scale w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md transition cursor-pointer"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
                  </svg>
                  <span>Connect to Volunteer on WhatsApp →</span>
                </button>

                <a
                  href="#official-tiers"
                  className="w-full sm:w-auto text-center px-4 py-3.5 rounded-2xl bg-white border border-teal-900/15 text-xs font-bold text-teal-900 hover:bg-sand transition"
                >
                  Can&apos;t visit? Sponsor Tiers 🏛️
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: CREATORS & INFLUENCERS ── */}
        {activeTab === "influencers" && (
          <div className="rounded-3xl bg-cream/70 p-5 sm:p-8 border border-teal-900/12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center animate-fadeIn">
            {/* Left: Creator Reel Box */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="relative aspect-[4/3] w-full rounded-2xl bg-teal-950 overflow-hidden shadow-md">
                <Image
                  src="/media/community.jpg"
                  alt="Creator Collaboration with Janaseva"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs font-bold text-white">Ethical Storytelling</p>
                  <p className="text-[10px] text-teal-100/75">Spreading awareness to 500K+ caring viewers</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-teal-950/80 font-medium text-center">
                <div className="rounded-xl bg-white p-2.5 border border-teal-900/10">
                  <strong className="block text-teal-900 text-sm">Child Dignity</strong> 100% Protected
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-teal-900/10">
                  <strong className="block text-teal-900 text-sm">Bio Link</strong> Verified 80G Tax Page
                </div>
              </div>
            </div>

            {/* Right: Creator Perks & Collab Action */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="rounded-md bg-saffron/20 px-2.5 py-0.5 text-[10px] font-black text-saffron-dark uppercase tracking-wider">
                  Amplify with Your Voice
                </span>
                <h3 className="mt-1.5 font-display text-lg sm:text-xl font-bold text-teal-900">
                  Are You a Creator or Influencer?
                </h3>
                <p className="text-xs text-teal-950/75 leading-relaxed mt-1">
                  Use your platform to mobilize meals, textbooks, and warmth for 25 boys in Bangalore. Visit our campus, film respectful stories, and inspire your community.
                </p>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-1.5">
                  Creator Niches We Welcome:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CREATOR_TYPES.map((type) => (
                    <span
                      key={type}
                      className="rounded-xl bg-white px-3 py-1 text-xs font-bold text-teal-900 border border-teal-900/10"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3.5 border border-teal-900/10 space-y-1 text-xs text-teal-950/80">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Guided ashrama visit pass &amp; meeting with resident boys.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Custom verified donation link with instant 80G receipt for your bio.</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={handleWhatsAppCreator}
                  className="focus-ring tap-scale w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-saffron hover:bg-saffron-dark px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md transition cursor-pointer"
                >
                  <span>Collab via WhatsApp Chat 📢</span>
                </button>
                <a
                  href="#contact"
                  className="w-full sm:w-auto text-center px-4 py-3.5 rounded-2xl bg-white border border-teal-900/15 text-xs font-bold text-teal-900 hover:bg-sand transition"
                >
                  Visit Campus 📍
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Corporate / CSR Partnerships Callout */}
        <div id="csr" className="mt-8 rounded-3xl bg-teal-950 p-5 sm:p-7 text-white shadow-md border border-teal-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <span className="rounded-md bg-gold/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold">
              Corporate / CSR Partnerships (Form CSR-1 Verified)
            </span>
            <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-1.5">
              Partner with Janaseva Ashrama for Employee Seva
            </h3>
            <p className="text-xs text-white/75 mt-1 max-w-xl leading-relaxed">
              Organize company-wide meals sponsorship, weekend employee teaching drives, and CSR grant allocation with 100% verified documentation.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-amber-200">
              <span>✓ Form 10AC 80G Tax Exemption</span>
              <span>✓ MCA Form CSR-1 Approved</span>
              <span>✓ Audited Utilization Report</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/corporate"
              className="focus-ring tap-scale flex-1 sm:flex-none rounded-xl bg-gold px-5 py-3 text-center text-xs font-black text-teal-950 hover:bg-gold/90 transition shadow-xs"
            >
              Explore CSR Partnerships →
            </Link>
            <a
              href="#official-tiers"
              className="focus-ring tap-scale flex-1 sm:flex-none rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-center text-xs font-bold text-white hover:bg-white/20 transition"
            >
              5 Official Tiers →
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}
