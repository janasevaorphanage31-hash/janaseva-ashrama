"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container, Head, Section } from "../ui";
import { useCart } from "../CartProvider";
import { track } from "@/lib/track";

export type ActivityCategory =
  | "all"
  | "health"
  | "food"
  | "cleanliness"
  | "village"
  | "education";

export type NgoActivity = {
  id: string;
  category: "health" | "food" | "cleanliness" | "village" | "education";
  categoryLabel: string;
  title: string;
  subtitle: string;
  cadence: string;
  image: string;
  metricBadge: string;
  description: string;
  keyHighlights: string[];
  sponsorSlug?: string;
  sponsorName?: string;
  sponsorAmount?: number;
  volunteerRole?: string;
};

const ACTIVITIES: NgoActivity[] = [
  {
    id: "health-camps",
    category: "health",
    categoryLabel: "Health & Medical",
    title: "Free Medical Camps & Pediatric Care",
    subtitle: "Healthcare access for rural and urban underprivileged families",
    cadence: "Monthly Health Camp",
    image: "/media/health.jpg",
    metricBadge: "24+ Camps · 3,400+ Beneficiaries",
    description:
      "Regular medical checkup camps organized in partnership with volunteer doctors. Providing comprehensive general physician consultations, pediatric growth screenings, dental hygiene checkups, and vision tests for children, destitute elders, and daily-wage families.",
    keyHighlights: [
      "Free doctor consultation & pediatric health screening",
      "Essential prescription medicines & pediatric vitamins distributed free",
      "Dental hygiene checkup & free dental care kits",
      "Vision tests & coordination for corrective treatments",
    ],
    sponsorSlug: "health",
    sponsorName: "Sponsor Medical Care Unit",
    sponsorAmount: 500,
    volunteerRole: "Doctors, Nurses & Camp Coordinators",
  },
  {
    id: "food-distribution",
    category: "food",
    categoryLabel: "Annadana & Food Relief",
    title: "Food Distribution & Hunger Relief Drives",
    subtitle: "Wholesome, dignified hot meals served directly to those in need",
    cadence: "Weekly Seva & Crisis Drives",
    image: "/media/food.jpg",
    metricBadge: "15,000+ Hot Meals · 450+ Ration Kits",
    description:
      "Beyond daily residential campus dining, our Annadana outreach drives distribute freshly prepared, hot nutritious meals (rice, aromatic sambar, lentils, and seasonal vegetables) to homeless elders, daily-wage laborers, and hospital patient bystanders across South Bengaluru.",
    keyHighlights: [
      "Hot, hygienic meals cooked with pure ingredients and motherly care",
      "Eco-friendly, leaf-lined packaging distributed with utmost dignity",
      "Monthly 50kg dry ration grocery sacks for impoverished households",
      "Emergency hunger relief during severe weather and local distress",
    ],
    sponsorSlug: "meal",
    sponsorName: "Sponsor 5 Warm Meals",
    sponsorAmount: 500,
    volunteerRole: "Kitchen Seva, Packaging & Ground Distribution",
  },
  {
    id: "city-cleaning",
    category: "cleanliness",
    categoryLabel: "City Cleaning & Swachh Seva",
    title: "City Cleaning & Swachh Seva Drives",
    subtitle: "Fostering civic pride, green public spaces, and clean surroundings",
    cadence: "Bi-Weekly Community Drive",
    image: "/media/garden.jpg",
    metricBadge: "35+ Cleanliness Drives · 1,200+ kg Waste Cleared",
    description:
      "Volunteer-driven environmental cleanliness and civic hygiene drives. Our children, youth mentors, and citizen volunteers join hands with safety gear to clean public parks, government school grounds, lake surroundings, and neighborhood street corners.",
    keyHighlights: [
      "Active street & park cleaning using safety gloves, brooms, and dustbins",
      "Citizen awareness on wet/dry waste segregation and single-use plastic reduction",
      "Native tree sapling plantation drives (Vanamahotsava) in public spaces",
      "Instilling civic responsibility and environmental hygiene in growing youth",
    ],
    volunteerRole: "Youth Volunteers & Community Cleanliness Champions",
  },
  {
    id: "village-awareness",
    category: "village",
    categoryLabel: "Rural Village Outreach",
    title: "Village Awareness & Social Rights Campaigns",
    subtitle: "Grassroots education, child safety, and empowerment in rural clusters",
    cadence: "Monthly Village Visits",
    image: "/media/community.jpg",
    metricBadge: "18+ Villages Reached · 1,500+ Families Guided",
    description:
      "Grassroots field campaigns in rural villages and peri-urban settlements surrounding Bengaluru. We conduct interactive street meetings with village panchayats and families to advocate for compulsory schooling, child protection rights, and safe sanitation.",
    keyHighlights: [
      "Counseling parents against child labor & advocating compulsory education",
      "Menstrual hygiene awareness, sanitation & safe drinking water workshops",
      "Guidance on government welfare schemes (Aadhaar, Ration Cards, Ayushman Bharat)",
      "Awareness against child marriage & empowering young girls to stay in school",
    ],
    volunteerRole: "Social Workers, Translators & Street Campaigners",
  },
  {
    id: "school-vidya",
    category: "education",
    categoryLabel: "Vidya Educational Outreach",
    title: "Rural Government School Kit Distribution",
    subtitle: "Providing underprivileged students with essential learning tools",
    cadence: "Academic Term Drives",
    image: "/media/school-kit.jpg",
    metricBadge: "2,200+ School Kits Distributed",
    description:
      "To prevent school dropouts caused by financial hardship, we visit remote rural primary schools to equip deserving young students with brand-new, sturdy school bags, full sets of notebooks, geometry tools, pencil sets, and uniforms.",
    keyHighlights: [
      "Sturdy school backpacks packed with curriculum notebooks and stationery",
      "Ensuring equality in classrooms so no child feels inferior or unprepared",
      "Weekend remedial tutoring workshops in basic mathematics and spoken English",
      "Career aspiration counseling for higher secondary students",
    ],
    sponsorSlug: "school-kit",
    sponsorName: "Sponsor 2 Complete School Kits",
    sponsorAmount: 500,
    volunteerRole: "Subject Tutors, Reading Mentors & Career Guides",
  },
  {
    id: "clean-water-sanitation",
    category: "cleanliness",
    categoryLabel: "Clean Water & Hygiene",
    title: "Rural Drinking Water & Sanitation Drives",
    subtitle: "Safe drinking water purification units & sanitation setups in rural clusters",
    cadence: "Quarterly Field Drives",
    image: "/media/wellness.jpg",
    metricBadge: "12+ Water Points · 850+ Families",
    description:
      "Preventing waterborne illnesses among vulnerable rural children and elders by distributing community water filters, setting up clean water stations, and conducting hygiene workshops in unserved peri-urban pockets.",
    keyHighlights: [
      "Community ceramic & bio-sand water filters installed in village centers",
      "Hygiene, soap distribution & safe water handling demonstrations",
      "Sanitation kit distribution with antiseptic supplies and clean storage buckets",
      "Follow-up water quality testing and community maintenance training",
    ],
    sponsorSlug: "health",
    sponsorName: "Support Rural Clean Water",
    sponsorAmount: 500,
    volunteerRole: "Sanitation Volunteers & Field Technicians",
  },
];

const METRICS_SUMMARY = [
  { label: "Free Health Camps", value: "24+", icon: "🩺", sub: "Screenings & medicines" },
  { label: "Meals Distributed", value: "15,000+", icon: "🍲", sub: "Hot community Annadana" },
  { label: "Swachh Drives", value: "35+", icon: "🧹", sub: "Parks & public zones cleaned" },
  { label: "Villages Reached", value: "18+", icon: "🌾", sub: "Rural community empowerment" },
];

export function CommunityActivitiesSection() {
  const [activeTab, setActiveTab] = useState<ActivityCategory>("all");
  const [sponsorNotice, setSponsorNotice] = useState<string | null>(null);
  const { setQty } = useCart();

  const filtered =
    activeTab === "all"
      ? ACTIVITIES
      : ACTIVITIES.filter((item) => item.category === activeTab);

  const handleSponsor = (activity: NgoActivity) => {
    if (!activity.sponsorSlug) return;
    const qtyToAdd = activity.sponsorSlug === "meal" ? 5 : activity.sponsorSlug === "school-kit" ? 2 : 1;
    setQty(activity.sponsorSlug, qtyToAdd);
    track("add_to_cart", {
      item: activity.sponsorSlug,
      amount: activity.sponsorAmount ?? 0,
      source: "activities_section",
    });

    setSponsorNotice(`Added ${activity.sponsorName} (₹${activity.sponsorAmount}) to your Impact Cart!`);
    setTimeout(() => setSponsorNotice(null), 4000);

    const cartEl = document.getElementById("impact");
    if (cartEl) {
      cartEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Section id="activities" tone="sand" className="py-14 md:py-20 border-y border-teal-900/10">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <Head
            eyebrow="On-Ground Seva & Field Initiatives"
            title="NGO Activities & Community Outreach Campaigns"
            lead="Service is not confined to our residential campus walls. Janaseva Ashrama volunteers, doctors, and youth actively step out onto Bangalore's streets, hospitals, and surrounding rural villages to serve society."
          />
          <div className="shrink-0">
            <Link
              href="/get-involved#join"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-teal-900 px-5 py-3 text-xs font-bold text-white transition hover:bg-teal-950 shadow-sm"
            >
              <span>🤝 Join Next Weekend Drive</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Impact Metric Counters Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
          {METRICS_SUMMARY.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl bg-white p-4 md:p-5 border border-teal-900/10 shadow-xs flex items-center gap-3.5"
            >
              <span className="text-2xl md:text-3xl shrink-0 select-none" aria-hidden="true">
                {m.icon}
              </span>
              <div className="min-w-0">
                <span className="block font-display text-xl md:text-2xl font-bold text-teal-950">
                  {m.value}
                </span>
                <span className="block text-xs font-bold text-teal-900 truncate">
                  {m.label}
                </span>
                <span className="block text-[11px] text-teal-950/60 truncate">
                  {m.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          {(
            [
              { id: "all", label: "🌟 All Activities" },
              { id: "health", label: "🩺 Health Campaigns" },
              { id: "food", label: "🍲 Food Distribution" },
              { id: "cleanliness", label: "🧹 City Cleaning" },
              { id: "village", label: "🌾 Village Awareness" },
              { id: "education", label: "📚 School Vidya" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`focus-ring shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-teal-900 text-white shadow-xs"
                  : "bg-white text-teal-950/75 border border-teal-900/10 hover:bg-cream hover:text-teal-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback Alert when adding a sponsor item */}
        {sponsorNotice && (
          <div
            role="status"
            className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900 flex items-center justify-between gap-4 animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span>{sponsorNotice}</span>
            </div>
            <Link
              href="/checkout"
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-800 transition"
            >
              Go to Checkout &rarr;
            </Link>
          </div>
        )}

        {/* Activity Cards Grid: 2-in-a-row on mobile, 3-in-a-row on desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
          {filtered.map((activity) => (
            <article
              key={activity.id}
              className="group flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-white border border-teal-900/10 shadow-xs overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                {/* Photo & Badge Banner */}
                <div className="relative h-28 xs:h-32 sm:h-44 md:h-48 w-full bg-teal-900/10 overflow-hidden">
                  <Image
                    src={activity.image}
                    alt={activity.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-teal-950/25 to-transparent" />
                  
                  {/* Top Cadence Pill */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1">
                    <span className="rounded-full bg-teal-900/90 backdrop-blur-xs px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                      {activity.cadence}
                    </span>
                  </div>

                  {/* Bottom Metric Badge */}
                  <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between">
                    <span className="rounded-md sm:rounded-lg bg-gold/95 backdrop-blur-xs px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-black text-teal-950 shadow-xs truncate">
                      {activity.metricBadge}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-3 sm:p-5 md:p-6">
                  <span className="block text-[10px] sm:text-xs font-bold text-saffron-dark uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
                    {activity.categoryLabel}
                  </span>
                  <h3 className="font-display text-xs sm:text-base md:text-lg font-bold text-teal-950 leading-snug line-clamp-2">
                    {activity.title}
                  </h3>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-teal-950/70 font-medium line-clamp-1 sm:line-clamp-2">
                    {activity.subtitle}
                  </p>
                  
                  <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs leading-relaxed text-teal-950/80 border-t border-teal-900/5 pt-2 sm:pt-3 line-clamp-2 sm:line-clamp-none">
                    {activity.description}
                  </p>

                  {/* Key Highlights Checklist */}
                  <div className="mt-2.5 sm:mt-4 rounded-xl bg-cream/70 p-2 sm:p-3.5 border border-teal-900/10 space-y-1">
                    <span className="block text-[9px] sm:text-[11px] font-bold text-teal-900 uppercase tracking-wider mb-0.5 sm:mb-1">
                      Key Highlights:
                    </span>
                    {activity.keyHighlights.slice(0, 2).map((hl, i) => (
                      <div key={i} className="flex items-start gap-1 sm:gap-2 text-[9px] sm:text-[11px] text-teal-950/80">
                        <span className="text-emerald-700 font-bold shrink-0">✓</span>
                        <span className="leading-tight truncate sm:whitespace-normal">{hl}</span>
                      </div>
                    ))}
                    {activity.keyHighlights.slice(2).map((hl, i) => (
                      <div key={i} className="hidden sm:flex items-start gap-2 text-[11px] text-teal-950/80">
                        <span className="text-emerald-700 font-bold shrink-0">✓</span>
                        <span className="leading-tight">{hl}</span>
                      </div>
                    ))}
                  </div>

                  {/* Volunteer Role */}
                  {activity.volunteerRole && (
                    <div className="mt-2 sm:mt-3 flex items-center gap-1 text-[9px] sm:text-[11px] text-teal-900/70 font-semibold truncate">
                      <span>🤝</span>
                      <span className="truncate">{activity.volunteerRole}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 sm:p-5 md:p-6 pt-0 border-t border-teal-900/5 mt-2 sm:mt-4 flex flex-col gap-1.5 sm:flex-row sm:gap-2">
                {activity.sponsorSlug ? (
                  <button
                    type="button"
                    onClick={() => handleSponsor(activity)}
                    className="focus-ring w-full flex-1 rounded-xl bg-saffron px-2.5 py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-bold text-white transition hover:bg-saffron-dark shadow-xs"
                  >
                    Sponsor (₹{activity.sponsorAmount})
                  </button>
                ) : (
                  <Link
                    href="/get-involved?interest=Teaching#join"
                    className="focus-ring w-full flex-1 rounded-xl bg-teal-900 px-2.5 py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-bold text-white transition hover:bg-teal-950 shadow-xs"
                  >
                    Volunteer
                  </Link>
                )}
                <Link
                  href="/contact"
                  className="hidden sm:inline-block focus-ring rounded-xl border border-teal-900/15 bg-white px-3 py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-bold text-teal-900 transition hover:bg-cream"
                >
                  Inquire
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Corporate CSR & College Partner Callout */}
        <div className="mt-12 rounded-3xl bg-teal-900 p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-block rounded-md bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold mb-2">
              Corporate CSR &amp; College Youth Drives
            </span>
            <h4 className="font-display text-xl md:text-2xl font-bold">
              Organize a Health Camp, Food Drive or Swachh Seva with Your Team
            </h4>
            <p className="mt-2 text-xs md:text-sm text-white/80 leading-relaxed">
              We partner with corporate CSR committees, IT companies, and educational institutions to organize weekend on-ground community campaigns with full transparency, photo verification, and 80G tax benefit receipts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <Link
              href="/corporate"
              className="focus-ring rounded-xl bg-gold px-6 py-3 text-center text-xs font-bold text-teal-950 transition hover:bg-gold/90 shadow-sm"
            >
              Corporate CSR Partnership
            </Link>
            <Link
              href="/get-involved#join"
              className="focus-ring rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-center text-xs font-bold text-white transition hover:bg-white/20"
            >
              Volunteer as a Group
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
