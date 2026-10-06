"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container, Head, Section } from "../ui";

const SKILLS = [
  "Teaching & Tutoring",
  "Photography & Videography",
  "Art, Music & Dance",
  "Sports & Physical Fitness",
  "Spoken English & Communication",
  "Computer & Tech Literacy",
  "Kitchen & Dining Seva",
  "Medical & Health Camps",
];

const INFLUENCER_NICHES = [
  "Lifestyle & Travel Creators",
  "Tech & Coding Influencers",
  "Food & Nutrition Bloggers",
  "Fitness & Sports Creators",
  "Student & College Ambassadors",
  "Artists & Entertainment Creators",
];

export function InvolvedSection({ standalone = false }: { standalone?: boolean }) {
  const [activeTab, setActiveTab] = useState<"volunteers" | "influencers">("volunteers");
  const [selectedSkill, setSelectedSkill] = useState("Teaching & Tutoring");
  const [playingVideo, setPlayingVideo] = useState(false);

  return (
    <Section id="volunteer" tone="white" className="py-12 md:py-16">
      <Container>
        {/* Section Header */}
        <Head
          eyebrow="Share Your Talent & Reach"
          title="Give Your Time: Volunteers & Social Media Influencers"
          lead="Money is not the only way to create lasting impact. Whether you teach in our classroom or share our children's stories with your social media followers, you can transform young lives."
        />

        {/* Dual Tab Switcher: Volunteers vs Influencers */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-2xl bg-cream p-1.5 ring-1 ring-teal-900/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab("volunteers");
                setPlayingVideo(false);
              }}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "volunteers"
                  ? "bg-teal-900 text-white shadow-sm"
                  : "text-teal-900/70 hover:text-teal-900"
              }`}
            >
              <span>On-Ground Seva Volunteers</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("influencers");
                setPlayingVideo(false);
              }}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "influencers"
                  ? "bg-teal-900 text-white shadow-sm"
                  : "text-teal-900/70 hover:text-teal-900"
              }`}
            >
              <span>Social Media Influencers &amp; Creators</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ON-GROUND VOLUNTEERS */}
        {activeTab === "volunteers" && (
          <div className="rounded-3xl bg-cream p-6 sm:p-8 ring-1 ring-teal-900/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Media Box (Image & Video Preview) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="relative aspect-[4/3] w-full rounded-2xl bg-teal-950 overflow-hidden shadow-md ring-1 ring-teal-900/10">
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
                      alt="Janaseva Volunteers"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <div>
                        <p className="text-xs font-bold text-white">Weekend Mentorship Seva</p>
                        <p className="text-[11px] text-teal-100/75">Over 240+ teaching hours logged</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlayingVideo(true)}
                        className="rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-saffron-dark transition"
                      >
                        ▶ Watch Video
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-teal-950/70 font-medium">
                <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center">
                  <strong className="block text-teal-900 text-sm">48+ Children</strong> Guided every weekend
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center">
                  <strong className="block text-teal-900 text-sm">Zero Fee</strong> Mentorship for all
                </div>
              </div>
            </div>

            {/* Interactive Volunteer Selector */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-2.5">
                  Select Your Skill or Seva Area:
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((skillName) => (
                    <button
                      key={skillName}
                      type="button"
                      onClick={() => setSelectedSkill(skillName)}
                      className={`focus-ring inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                        selectedSkill === skillName
                          ? "bg-teal-900 text-white shadow-sm ring-2 ring-teal-900"
                          : "bg-white text-teal-900 hover:bg-sand ring-1 ring-teal-900/10"
                      }`}
                    >
                      <span>{skillName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-teal-900/10 text-xs text-teal-950/75 space-y-2">
                <p className="font-bold text-teal-900">
                  How Volunteer Seva Works at Janaseva:
                </p>
                <ul className="space-y-1 list-disc pl-4 text-xs">
                  <li>Flexible Saturday and Sunday slots (10:30 AM to 1:00 PM or 4:00 PM to 6:30 PM).</li>
                  <li>Structured syllabus guidance provided by our resident teachers.</li>
                  <li>Official Volunteer Experience Certificate issued after 10 completed hours.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-teal-900/10">
                <div>
                  <p className="text-xs font-bold text-teal-900">
                    Ready to volunteer for {selectedSkill}?
                  </p>
                  <p className="text-[11px] text-teal-950/60">
                    Our coordinator will connect with you via WhatsApp.
                  </p>
                </div>

                <Link
                  href={`/janaseva-crew?skill=${encodeURIComponent(selectedSkill)}&role=Volunteer`}
                  className="focus-ring rounded-xl bg-teal-900 px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-teal-800 transition active:scale-95"
                >
                  APPLY AS VOLUNTEER →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOCIAL MEDIA INFLUENCERS & CREATORS */}
        {activeTab === "influencers" && (
          <div className="rounded-3xl bg-cream p-6 sm:p-8 ring-1 ring-teal-900/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Media Box (Image & Video Preview) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="relative aspect-[4/3] w-full rounded-2xl bg-teal-950 overflow-hidden shadow-md ring-1 ring-teal-900/10">
                {playingVideo ? (
                  <video
                    src="/media/ashrama_journey.mp4"
                    autoPlay
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <Image
                      src="/media/community.jpg"
                      alt="Creator Collaboration with Janaseva"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <div>
                        <p className="text-xs font-bold text-white">Creator & Influencer Reels</p>
                        <p className="text-[11px] text-teal-100/75">Spreading awareness to 500K+ viewers</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlayingVideo(true)}
                        className="rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-saffron-dark transition"
                      >
                        ▶ Watch Reel
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-teal-950/70 font-medium">
                <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center">
                  <strong className="block text-teal-900 text-sm">100% Ethical</strong> Child dignity strictly preserved
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center">
                  <strong className="block text-teal-900 text-sm">Verified Link</strong> Instant donation page for your bio
                </div>
              </div>
            </div>

            {/* Creator Partnership Content */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="rounded-md bg-saffron/20 px-2.5 py-1 text-[10px] font-bold text-saffron-dark uppercase tracking-wider">
                  Amplify with Your Voice
                </span>
                <h3 className="mt-2 font-display text-xl font-bold text-teal-900">
                  Are You a Creator or Influencer?
                </h3>
                <p className="mt-1 text-xs text-teal-950/70 leading-relaxed">
                  Use your platform to mobilize daily meals, textbooks, and warmth for 48+ children. Visit our Bengaluru campus, create authentic content, and inspire your community to give.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-2">
                  Creator Niches We Welcome:
                </label>
                <div className="flex flex-wrap gap-2">
                  {INFLUENCER_NICHES.map((niche) => (
                    <span
                      key={niche}
                      className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-teal-900 border border-teal-900/10"
                    >
                      {niche}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-teal-900/10 text-xs text-teal-950/75 space-y-2">
                <p className="font-bold text-teal-900">
                  What Creators Receive from Janaseva:
                </p>
                <ul className="space-y-1 list-disc pl-4 text-xs">
                  <li>Campus Visit Pass with guided tour and meet-and-greet with children.</li>
                  <li>Custom Verified Campaign Page with your handle to put directly in your bio/story.</li>
                  <li>Real-time donation tracking so you and your followers see every meal funded.</li>
                  <li>Zero commercial exploitation guidelines to ensure children&apos;s pride and safety.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-teal-900/10">
                <div>
                  <p className="text-xs font-bold text-teal-900">
                    Collaborate as a Creator or Influencer
                  </p>
                  <p className="text-[11px] text-teal-950/60">
                    We welcome accounts of all sizes (Nano, Micro &amp; Mega creators).
                  </p>
                </div>

                <Link
                  href="/janaseva-crew?role=Creator"
                  className="focus-ring rounded-xl bg-saffron px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-saffron-dark transition active:scale-95"
                >
                  COLLABORATE AS CREATOR →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Corporate / CSR Box */}
        <div id="csr" className="mt-12 scroll-mt-20 rounded-3xl bg-teal-900 p-6 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-block rounded-xl bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold mb-2">
                Corporate / CSR Partnerships
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Partner with Janaseva Ashrama
              </h3>
              <p className="mt-2 text-sm text-teal-100/80 max-w-xl leading-relaxed">
                Empower your organization to make a transparent social impact through pantry sponsorships, learning infrastructure, employee volunteering days, and audited CSR projects.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {["Form 10AC 80G Tax Exemption", "Audited CSR Utilization", "Employee Volunteering", "Custom Impact Reports"].map((x) => (
                  <span key={x} className="rounded-xl bg-white/10 px-3 py-1 text-teal-100">
                    ✓ {x}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0">
              <Link
                href="/corporate"
                className="focus-ring inline-block rounded-xl bg-saffron px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-saffron-dark transition active:scale-95"
              >
                EXPLORE CSR PARTNERSHIP →
              </Link>
            </div>
          </div>
        </div>

        {!standalone && (
          <div className="mt-6 text-center">
            <Link
              href="/skill-giving"
              className="text-xs font-bold text-teal-800 hover:text-teal-950 underline underline-offset-4"
            >
              Learn about our Give Your Skill mentorship network →
            </Link>
          </div>
        )}
      </Container>
    </Section>
  );
}
