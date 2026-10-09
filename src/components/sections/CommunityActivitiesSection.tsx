"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container, Head, Section } from "../ui";
import { useCart } from "../CartProvider";
import { track } from "@/lib/track";

export type ActivityCategory =
  | "all"
  | "food"
  | "health"
  | "cleanliness"
  | "education"
  | "village";

export type NgoActivity = {
  id: string;
  category: "food" | "health" | "cleanliness" | "education" | "village";
  categoryLabel: string;
  title: string;
  subtitle: string;
  cadence: string;
  image: string;
  metricBadge: string;
  emotionalTag: string;
  shortDesc: string;
  keyPoints: string[];
  suggestedTierId: string;
  suggestedAmount: number;
  tierName: string;
  volunteerRole: string;
};

const ACTIVITIES: NgoActivity[] = [
  {
    id: "food-distribution",
    category: "food",
    categoryLabel: "Annadana & Meals",
    title: "Hot Meal Feeds & Hunger Relief",
    subtitle: "Fresh satvik food served with dignity",
    cadence: "Weekly Seva & Drives",
    image: "/media/banana-leaf-feast.jpg",
    metricBadge: "15,000+ Meals Served",
    emotionalTag: "🍲 Zero hunger for destitute elders",
    shortDesc: "Beyond daily campus cooking, we distribute hot rice, aromatic sambar, and fresh vegetables to homeless elders and hospital bystanders.",
    keyPoints: ["Freshly prepared satvik meals", "Eco-friendly leaf-lined packaging", "Dignity and warmth for every soul"],
    suggestedTierId: "food_one_day",
    suggestedAmount: 4500,
    tierName: "Tier 01: Full Day Annadana",
    volunteerRole: "Kitchen Seva & Distribution",
  },
  {
    id: "health-camps",
    category: "health",
    categoryLabel: "Healthcare & Arogya",
    title: "Free Medical Camps & Pediatric Care",
    subtitle: "Healing hands for children and elders",
    cadence: "Monthly Health Camp",
    image: "/media/yoga-day.jpg",
    metricBadge: "3,400+ Screenings",
    emotionalTag: "🩺 Loving medical consultations",
    shortDesc: "Volunteer doctors conduct general health screenings, pediatric growth checks, dental checkups, and free medicine distribution.",
    keyPoints: ["Doctor consultations & prescriptions", "Pediatric multivitamins & syrups", "Free dental kits & hygiene guidance"],
    suggestedTierId: "food_one_month",
    suggestedAmount: 1500,
    tierName: "Arogya Seva & Nutrition",
    volunteerRole: "Doctors, Nurses & Coordinators",
  },
  {
    id: "school-vidya",
    category: "education",
    categoryLabel: "Vidya & Schooling",
    title: "Rural Government School Kits",
    subtitle: "Pencils, books & equal dignity in school",
    cadence: "Academic Term Drive",
    image: "/media/art-drawings.jpg",
    metricBadge: "2,200+ School Kits",
    emotionalTag: "📚 No child left without books",
    shortDesc: "Equipping rural primary school kids with sturdy school bags, full notebook bundles, geometry kits, and uniforms to prevent dropouts.",
    keyPoints: ["Sturdy backpacks & notebook sets", "Geometry boxes & writing stationery", "Equal pride and confidence in class"],
    suggestedTierId: "education_one_month",
    suggestedAmount: 3200,
    tierName: "Tier 04: Monthly Vidya Kit",
    volunteerRole: "Subject Tutors & Youth Mentors",
  },
  {
    id: "city-cleaning",
    category: "cleanliness",
    categoryLabel: "Swachh & Nature Seva",
    title: "City Cleaning & Public Parks Seva",
    subtitle: "Creating green, clean neighborhood spaces",
    cadence: "Bi-Weekly Cleanliness",
    image: "/media/flag-hoisting-rangoli.jpg",
    metricBadge: "35+ Cleanliness Drives",
    emotionalTag: "🧹 Civic pride & clean earth",
    shortDesc: "Our boys, caretakers, and citizen volunteers pick up safety gear to clean public parks, government school grounds, and neighborhood lakes.",
    keyPoints: ["Park & school ground cleanups", "Plastic-free awareness campaigns", "Native tree plantation (Vanamahotsava)"],
    suggestedTierId: "cloth_one_set",
    suggestedAmount: 1600,
    tierName: "Tier 03: Field Care Sets",
    volunteerRole: "Youth Cleanliness Champions",
  },
  {
    id: "village-awareness",
    category: "village",
    categoryLabel: "Village Outreach",
    title: "Rural Child Rights & Family Guidance",
    subtitle: "Empowering families to educate children",
    cadence: "Monthly Village Visits",
    image: "/media/constitution-day.jpg",
    metricBadge: "18+ Villages Reached",
    emotionalTag: "🌾 Protecting every child's future",
    shortDesc: "Grassroots visits to villages around Bengaluru, counseling parents against child labor, preventing child marriage, and securing schooling.",
    keyPoints: ["Compulsory education counseling", "Menstrual hygiene & sanitation talks", "Government welfare access guidance"],
    suggestedTierId: "education_one_year",
    suggestedAmount: 9600,
    tierName: "Tier 05: Yearly Schooling",
    volunteerRole: "Social Workers & Campaigners",
  },
  {
    id: "clean-water",
    category: "health",
    categoryLabel: "Water & Sanitization",
    title: "Pure Drinking Water & Hygiene Kits",
    subtitle: "Safe drinking water for vulnerable homes",
    cadence: "Quarterly Field Drives",
    image: "/media/lawn-cheer-circle.jpg",
    metricBadge: "850+ Families Served",
    emotionalTag: "💧 Pure water saves precious lives",
    shortDesc: "Setting up bio-sand water filters and distributing soap kits in unserved peri-urban pockets to protect young children from waterborne illness.",
    keyPoints: ["Community bio-sand water filtration", "Soap & antiseptic distribution", "Hygiene demonstrations for families"],
    suggestedTierId: "food_one_day",
    suggestedAmount: 2500,
    tierName: "Tier 01: Seva Care",
    volunteerRole: "Sanitation Volunteers",
  },
];

const METRICS_SUMMARY = [
  { label: "Free Health Camps", value: "24+", icon: "🩺", sub: "Screenings & medicines" },
  { label: "Meals Distributed", value: "15,000+", icon: "🍲", sub: "Hot satvik Annadana" },
  { label: "Cleanliness Drives", value: "35+", icon: "🧹", sub: "Parks & grounds cleaned" },
  { label: "Villages Reached", value: "18+", icon: "🌾", sub: "Rural child protection" },
];

export function CommunityActivitiesSection() {
  const [activeTab, setActiveTab] = useState<ActivityCategory>("all");
  const { openBottomDonate } = useCart();

  const filtered =
    activeTab === "all"
      ? ACTIVITIES
      : ACTIVITIES.filter((item) => item.category === activeTab);

  const handleSponsorTier = (tierId: string, amount: number) => {
    track("community_activity_sponsor", { tierId, amount });
    openBottomDonate(amount, tierId);
  };

  return (
    <Section id="activities" tone="sand" className="py-12 md:py-16 border-y border-teal-900/10">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <Head
            eyebrow="On-Ground Seva · ನೇರ ಸೇವೆ"
            title="Hands That Serve: Our Field Initiatives"
            lead="True seva goes beyond our gate. Every weekend, our caretakers, boys, and doctor volunteers step out to serve vulnerable families across Bengaluru."
          />
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="#official-tiers"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-saffron px-4 py-2.5 text-xs font-black text-white hover:bg-saffron-dark transition shadow-sm cursor-pointer"
            >
              <span>🏛️ 5 Official Tiers</span>
            </a>
            <a
              href="#volunteer"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm cursor-pointer"
            >
              <span>🤝 Join as Volunteer</span>
            </a>
          </div>
        </div>

        {/* 4 Punchy Metric Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 mb-8">
          {METRICS_SUMMARY.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl bg-white p-3.5 sm:p-4 border border-teal-900/10 shadow-2xs flex items-center gap-3"
            >
              <span className="text-2xl sm:text-3xl shrink-0 select-none" aria-hidden="true">
                {m.icon}
              </span>
              <div className="min-w-0">
                <span className="block font-display text-lg sm:text-xl font-bold text-teal-950">
                  {m.value}
                </span>
                <span className="block text-xs font-bold text-teal-900 truncate">
                  {m.label}
                </span>
                <span className="block text-[10px] text-teal-950/60 truncate">
                  {m.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Clean Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {(
            [
              { id: "all", label: "🌟 All Seva" },
              { id: "food", label: "🍲 Annadana Feeds" },
              { id: "health", label: "🩺 Health Camps" },
              { id: "education", label: "📚 School Vidya" },
              { id: "cleanliness", label: "🧹 Cleanliness" },
              { id: "village", label: "🌾 Village Outreach" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`focus-ring tap-scale shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-teal-900 text-white shadow-xs"
                  : "bg-white text-teal-950/75 border border-teal-900/10 hover:bg-cream hover:text-teal-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modern Activity Cards Grid: 1-col on mobile, 2-col on tablet, 3-col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((activity) => (
            <article
              key={activity.id}
              className="group flex flex-col justify-between rounded-3xl bg-white border border-teal-900/12 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div>
                {/* Photo & Badge Header */}
                <div className="relative aspect-[16/10] w-full bg-teal-950 overflow-hidden">
                  <Image
                    src={activity.image}
                    alt={activity.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-black/20 to-transparent" />

                  {/* Top Cadence Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="rounded-md bg-teal-950/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      {activity.cadence}
                    </span>
                  </div>

                  {/* Bottom Metric Pill */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white">
                    <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-black text-teal-950 shadow-2xs">
                      {activity.metricBadge}
                    </span>
                    <span className="text-[10px] text-amber-200 truncate">
                      {activity.emotionalTag}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 space-y-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-saffron-dark">
                    {activity.categoryLabel}
                  </span>

                  <h3 className="font-display text-base sm:text-lg font-bold text-teal-950 leading-tight">
                    {activity.title}
                  </h3>

                  <p className="text-xs text-teal-950/75 leading-relaxed">
                    {activity.shortDesc}
                  </p>

                  {/* 3 Compact Bullet Highlights */}
                  <div className="rounded-2xl bg-cream/70 p-2.5 sm:p-3 border border-teal-900/10 space-y-1 text-xs">
                    {activity.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-teal-950/85">
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span className="truncate">{pt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Volunteer Role */}
                  <div className="flex items-center gap-1.5 text-[11px] text-teal-900/70 font-semibold pt-1">
                    <span>🤝 Volunteer Seva:</span>
                    <span className="font-bold text-teal-950 truncate">{activity.volunteerRole}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Missing Inter-connections Connected */}
              <div className="p-4 sm:p-5 pt-0 border-t border-teal-900/5 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSponsorTier(activity.suggestedTierId, activity.suggestedAmount)}
                  className="focus-ring tap-scale flex w-full items-center justify-center gap-1.5 rounded-xl bg-saffron py-2.5 text-xs font-black text-white shadow-xs hover:bg-saffron-dark transition cursor-pointer"
                >
                  <span>Sponsor This Seva (₹{activity.suggestedAmount.toLocaleString("en-IN")}) 💝</span>
                </button>

                <div className="flex items-center justify-between text-[11px] pt-0.5 px-1">
                  <a
                    href="#official-tiers"
                    className="text-teal-900 font-bold underline hover:text-saffron-dark"
                  >
                    {activity.tierName} →
                  </a>
                  <a
                    href="#volunteer"
                    className="text-saffron-dark font-extrabold hover:underline"
                  >
                    Join Hands 🤝
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Interconnection Banner to Volunteer & Official Tiers */}
        <div className="mt-10 rounded-3xl bg-teal-950 p-5 sm:p-7 text-white shadow-md border border-teal-800 flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <span className="rounded-md bg-gold/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold">
              Corporate CSR &amp; Community Drives
            </span>
            <h4 className="font-display text-lg sm:text-xl font-bold mt-1.5">
              Organize a Health Camp, Food Drive or Tree Plantation with Your Team
            </h4>
            <p className="text-xs text-white/75 mt-1 max-w-2xl leading-relaxed">
              We coordinate with corporate CSR committees, colleges, and families for transparent weekend drives. 100% verified with photo reports &amp; 80G tax receipts.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <a
              href="#volunteer"
              className="focus-ring tap-scale flex-1 sm:flex-none rounded-xl bg-gold px-4 py-2.5 text-center text-xs font-bold text-teal-950 hover:bg-gold/90 transition shadow-xs"
            >
              Volunteer Form →
            </a>
            <a
              href="#official-tiers"
              className="focus-ring tap-scale flex-1 sm:flex-none rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-white/20 transition"
            >
              5 Official Tiers →
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}
