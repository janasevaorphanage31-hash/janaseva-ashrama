"use client";

import { useState } from "react";
import { Container, Section } from "../ui";
import { SITE } from "@/lib/site";
import { track } from "@/lib/track";

type CommunityRole = "VOLUNTEER" | "INFLUENCER" | "COMPANY_CSR" | "WHATSAPP_AMBASSADOR";

interface RolePathway {
  id: CommunityRole;
  badge: string;
  badgeColor: string;
  title: string;
  titleKn: string;
  timeCommitment: string;
  tagline: string;
  icon: string;
  skills: string[];
  handleLabel: string;
  placeholderHandle: string;
  submitButtonText: string;
}

const PATHWAYS: RolePathway[] = [
  {
    id: "VOLUNTEER",
    badge: "Most Needed",
    badgeColor: "bg-emerald-600 text-white",
    title: "Academic Mentor",
    titleKn: "ವಿದ್ಯಾ ಮಾರ್ಗದರ್ಶಕರು",
    timeCommitment: "2.5 Hours / Weekend",
    tagline: "Teach Spoken English, simplify Math, guide Science, or mentor daily homework for 25 resident boys.",
    icon: "📚",
    skills: [
      "🗣️ Spoken English & Reading",
      "📐 School Math & Tables",
      "🔬 Science & Experiments",
      "📝 School Homework Help",
      "💻 Computer Basics & Coding",
      "📅 Saturday Morning (10:30 AM – 1:00 PM)",
      "📅 Sunday Morning (10:30 AM – 1:00 PM)",
    ],
    handleLabel: "College or Workplace",
    placeholderHandle: "e.g. RV College, BMSCE, Infosys, Cisco, Student",
    submitButtonText: "Sign Up as Academic Mentor (2.5 hrs/wk) 💛",
  },
  {
    id: "VOLUNTEER",
    badge: "Joy & Energy",
    badgeColor: "bg-amber-600 text-white",
    title: "Life Skills & Sports Coach",
    titleKn: "ಕ್ರೀಡೆ & ಜೀವನ ಕೌಶಲ್ಯ",
    timeCommitment: "2.5 Hours / Weekend",
    tagline: "Coach weekend cricket, teach yoga, lead chess games, art & drawing, or guide public speaking workshops.",
    icon: "⚽",
    skills: [
      "🏏 Cricket & Sports Coaching",
      "🧘 Yoga & Meditation",
      "🎨 Art, Sketching & Crafts",
      "♟️ Chess Strategy & Carrom",
      "🎵 Vocal Music & Shloka Chanting",
      "🎤 Public Speaking & Confidence",
      "📅 Sunday Evening (4:30 PM – 7:00 PM)",
    ],
    handleLabel: "Sport / Hobby Expertise",
    placeholderHandle: "e.g. Yoga Instructor, Cricket Club, Artist, Chess player",
    submitButtonText: "Sign Up as Sports & Life Skills Coach ⚽",
  },
  {
    id: "INFLUENCER",
    badge: "Media & Voice",
    badgeColor: "bg-rose-600 text-white",
    title: "Changemaker & Storyteller",
    titleKn: "ಸಮುದಾಯ ಧ್ವನಿ",
    timeCommitment: "Flexible / Campus Visits",
    tagline: "Visit our Turahalli campus, capture respectful photos/reels, write stories, and lead ration drives in your network.",
    icon: "📸",
    skills: [
      "🎥 Instagram Reels & Video",
      "📸 Photography & Portraits",
      "✍️ LinkedIn & Social Stories",
      "📦 College / Society Grocery Drive",
      "🤝 Community Fundraiser Lead",
      "📢 WhatsApp Ambassador",
    ],
    handleLabel: "Social Media / Portfolio",
    placeholderHandle: "e.g. @yourhandle on Instagram, YouTube link, or blog",
    submitButtonText: "Join as Storyteller & Changemaker 📢",
  },
  {
    id: "COMPANY_CSR",
    badge: "Corporate & Teams",
    badgeColor: "bg-teal-700 text-white",
    title: "Corporate CSR & Team Seva",
    titleKn: "ಕಾರ್ಪೊರೇಟ್ ಸಿಎಸ್ಆರ್",
    timeCommitment: "Group Drives & MOUs",
    tagline: "Bring your company team for an impactful employee volunteering day, payroll giving, or CSR grant partnership.",
    icon: "🏢",
    skills: [
      "🏢 Employee Volunteering Day",
      "📦 Monthly Ration & Grocery Drive",
      "💻 Digital Computer Lab Sponsorship",
      "📄 Form 28 / CSR-1 Annual MOU",
      "💼 Payroll Giving Matching Program",
      "🩺 Health & Pediatric Dental Camp",
    ],
    handleLabel: "Company / Foundation Name",
    placeholderHandle: "e.g. Wipro Cares, Biocon Foundation, TCS, Startup",
    submitButtonText: "Partner with Janaseva CSR 🏢",
  },
];

export function CommunityV2Section({ standalone = false }: { standalone?: boolean }) {
  const [activePathwayIndex, setActivePathwayIndex] = useState(0);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Bengaluru",
    handleOrOrg: "",
    reach: "",
    message: "",
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    name: string;
    role: string;
    whatsappUrl: string;
  } | null>(null);

  const currentPathway = PATHWAYS[activePathwayIndex];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handlePathwayChange = (index: number) => {
    setActivePathwayIndex(index);
    setSelectedSkills([]);
    setError("");
    track("volunteer_pathway_tab_click", { title: PATHWAYS[index].title });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError("Please enter your full name (minimum 2 characters).");
      return;
    }
    if (!form.phone.trim()) {
      setError("Please enter your WhatsApp phone number so the coordinator can message you.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email address for certificate and schedule updates.");
      return;
    }

    setBusy(true);
    track("volunteer_form_submit", { role: currentPathway.id, pathway: currentPathway.title });

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: currentPathway.id,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          city: form.city.trim() || "Bengaluru",
          handleOrOrg: form.handleOrOrg.trim(),
          reach: form.reach.trim(),
          skills: [currentPathway.title, ...selectedSkills].join(", "),
          message: form.message.trim(),
          whatsappOptIn: true,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        name: string;
        role: string;
        whatsappUrl: string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not complete registration. Please check your information.");
      }

      setSuccessData({
        name: data.name || form.name,
        role: currentPathway.title,
        whatsappUrl: data.whatsappUrl,
      });
      track("volunteer_form_success", { role: currentPathway.id, pathway: currentPathway.title });
    } catch (err: any) {
      setError(err?.message || "Could not complete registration. Please WhatsApp us directly.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      id="volunteer"
      tone="white"
      className="py-10 sm:py-14 md:py-16 relative overflow-hidden bg-gradient-to-b from-white via-cream/40 to-sand/30 scroll-mt-20"
    >
      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 -z-10 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 h-80 w-80 rounded-full bg-teal-900/10 blur-3xl pointer-events-none" />

      <Container>
        {/* ── 1. EMOTIONAL U&I INSPIRED HEADER ── */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-teal-900/10 border border-amber-500/30 px-3.5 sm:px-4 py-1.5 text-xs font-black uppercase tracking-wider text-teal-950 mb-3 shadow-2xs">
            <span className="text-sm">🌟</span>
            <span>Join as a Weekend Mentor · 2.5 Hours / Week</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-950 leading-tight">
            Give 2.5 Hours a Week. Change a Child’s Story in Bengaluru.
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">
            ವಾರಾಂತ್ಯದ 2.5 ಗಂಟೆಗಳು — ನಮ್ಮ 25 ಮಕ್ಕಳ ಭವಿಷ್ಯದಲ್ಲಿ ಹೊಸ ಬೆಳಕು ಮೂಡಿಸಿ
          </p>

          <p className="mt-3 text-xs sm:text-sm md:text-base text-teal-950/75 leading-relaxed max-w-2xl mx-auto">
            You don’t need a teaching certificate or superpowers. All it takes is 2.5 hours on a weekend, an open heart,
            and the warmth to show up for 25 orphaned boys growing up at Janaseva Ashrama in Turahalli, Bangalore South.
            Be the elder brother, tutor, or coach they look forward to meeting every week.
          </p>

          {/* Quick Helplines */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                "Namaste! I would like to volunteer 2.5 hours a week at Janaseva Ashrama in Turahalli. Please guide me on next weekend's orientation."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring tap-scale inline-flex items-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] px-4.5 py-2.5 text-xs font-black text-teal-950 shadow-md transition cursor-pointer"
            >
              <span>💬 WhatsApp Volunteer Lead (+91 94481 05663)</span>
            </a>
            <a
              href="#contact"
              className="focus-ring tap-scale inline-flex items-center gap-2 rounded-2xl border border-teal-900/20 bg-white px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-cream transition cursor-pointer"
            >
              <span>📍 Directions to Turahalli Ashrama</span>
            </a>
          </div>
        </div>

        {/* ── 2. THE 3-STEP JOURNEY (U&I CONCEPT) ── */}
        <div className="mb-10 sm:mb-14">
          <div className="text-center mb-5">
            <span className="text-[11px] font-black uppercase tracking-widest text-teal-900/70">
              Simple &amp; Clear Process · How It Works
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 max-w-4xl mx-auto">
            <div className="rounded-2xl bg-white border border-teal-900/10 p-4 sm:p-5 shadow-xs relative">
              <span className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white shadow-xs">
                1
              </span>
              <div className="pt-1">
                <p className="font-display font-black text-sm text-teal-950">60-Second Signup</p>
                <p className="text-[11px] text-teal-950/70 mt-1 leading-relaxed">
                  Choose your interest: Academic Mentoring, Sports &amp; Life Skills, Storytelling, or Corporate CSR.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-teal-900/10 p-4 sm:p-5 shadow-xs relative">
              <span className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-teal-800 text-[11px] font-black text-white shadow-xs">
                2
              </span>
              <div className="pt-1">
                <p className="font-display font-black text-sm text-teal-950">Sunday Campus Visit &amp; Prasadam</p>
                <p className="text-[11px] text-teal-950/70 mt-1 leading-relaxed">
                  Visit our green campus at Turahalli, Bangalore South. Meet the 25 boys, the warden, and share satvik lunch.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-teal-900/10 p-4 sm:p-5 shadow-xs relative">
              <span className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white shadow-xs">
                3
              </span>
              <div className="pt-1">
                <p className="font-display font-black text-sm text-teal-950">2.5 Hrs/Wk + Official Certificate</p>
                <p className="text-[11px] text-teal-950/70 mt-1 leading-relaxed">
                  Mentor on your chosen weekend slot. Earn an official verified NGO Volunteer Certificate for college &amp; career.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. 4 KEY REASONS TO VOLUNTEER WITH US ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-10 max-w-5xl mx-auto text-xs">
          <div className="rounded-2xl bg-white/95 p-3 sm:p-3.5 border border-amber-500/20 shadow-2xs">
            <span className="text-xl">👦</span>
            <p className="font-extrabold text-teal-950 mt-1">25 Real Resident Boys</p>
            <p className="text-[10px] text-teal-950/60 mt-0.5 leading-snug">
              Direct 1-on-1 impact. They know your name and smile when you arrive.
            </p>
          </div>

          <div className="rounded-2xl bg-white/95 p-3 sm:p-3.5 border border-emerald-500/20 shadow-2xs">
            <span className="text-xl">📜</span>
            <p className="font-extrabold text-teal-950 mt-1">Verified Certificate</p>
            <p className="text-[10px] text-teal-950/60 mt-0.5 leading-snug">
              Registered Form 10AC trust experience certificate for college &amp; LinkedIn.
            </p>
          </div>

          <div className="rounded-2xl bg-white/95 p-3 sm:p-3.5 border border-rose-500/20 shadow-2xs">
            <span className="text-xl">🍛</span>
            <p className="font-extrabold text-teal-950 mt-1">Satvik Anna Prasadam</p>
            <p className="text-[10px] text-teal-950/60 mt-0.5 leading-snug">
              Enjoy warm traditional ashrama lunch served together after weekend sessions.
            </p>
          </div>

          <div className="rounded-2xl bg-white/95 p-3 sm:p-3.5 border border-teal-500/20 shadow-2xs">
            <span className="text-xl">📍</span>
            <p className="font-extrabold text-teal-950 mt-1">Turahalli, South Bangalore</p>
            <p className="text-[10px] text-teal-950/60 mt-0.5 leading-snug">
              Next to Turahalli Forest (clean air, calm campus, 10 mins from Kanakapura Rd Metro).
            </p>
          </div>
        </div>

        {/* ── 4. PATHWAY TABS (SELECT YOUR ROLE) ── */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-teal-950/80 uppercase tracking-wider">
              Step 1: Choose Your Volunteer Pathway
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
            {PATHWAYS.map((p, idx) => {
              const isSelected = activePathwayIndex === idx;
              return (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handlePathwayChange(idx)}
                  className={`relative flex flex-col items-start p-3 sm:p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-teal-950 text-white border-teal-900 shadow-md ring-2 ring-amber-400/50"
                      : "bg-white hover:bg-cream text-teal-950/80 border-teal-900/10 hover:border-teal-900/25"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-xl">{p.icon}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isSelected ? "bg-amber-400 text-teal-950" : p.badgeColor
                      }`}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <h3 className={`font-bold text-xs sm:text-sm leading-snug ${isSelected ? "text-white" : "text-teal-950"}`}>
                    {p.title}
                  </h3>
                  <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? "text-teal-200" : "text-teal-950/60"}`}>
                    {p.timeCommitment}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 5. INTERACTIVE REGISTRATION CARD ── */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-teal-900/10 shadow-xl shadow-teal-950/5 p-5 sm:p-7 md:p-9">
          {successData ? (
            /* SUCCESS VIEW */
            <div className="text-center py-6 sm:py-8 max-w-xl mx-auto space-y-4 animate-in fade-in duration-300">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-3xl shadow-inner">
                🎉
              </div>
              <div>
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
                  Volunteer Application Received ✅
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-teal-950">
                  Welcome to the Family, {successData.name}!
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-teal-950/70 leading-relaxed">
                  Thank you for stepping up as an <strong>{successData.role}</strong>. The 25 boys at Turahalli are excited to meet you!
                  Join our official WhatsApp Volunteer Community below to receive orientation schedules, lesson plans, and ashrama visit details.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <a
                  href={successData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring tap-scale flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] px-6 py-3.5 text-xs sm:text-sm font-black text-teal-950 shadow-md transition w-full sm:w-auto cursor-pointer"
                >
                  <span>💬 Join Volunteer WhatsApp Group →</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessData(null);
                    setForm({
                      name: "",
                      phone: "",
                      email: "",
                      city: "Bengaluru",
                      handleOrOrg: "",
                      reach: "",
                      message: "",
                    });
                    setSelectedSkills([]);
                  }}
                  className="rounded-2xl border border-teal-900/20 px-4 py-3 text-xs font-bold text-teal-950 hover:bg-cream transition cursor-pointer"
                >
                  Register Another Volunteer
                </button>
              </div>
            </div>
          ) : (
            /* APPLICATION FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Pathway Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-teal-900/10 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentPathway.icon}</span>
                    <h3 className="font-display text-base sm:text-lg font-black text-teal-950">
                      {currentPathway.title} Registration
                    </h3>
                  </div>
                  <p className="text-xs text-teal-950/70 mt-0.5">{currentPathway.tagline}</p>
                </div>
                <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 rounded-xl px-2.5 py-1 border border-emerald-200/60 self-start sm:self-center shrink-0">
                  ⏱️ {currentPathway.timeCommitment}
                </div>
              </div>

              {/* Skill / Activity Selection Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-950/70 mb-2">
                  Select Your Skills or Preferred Slots (Tap to choose):
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {currentPathway.skills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                          isSelected
                            ? "bg-amber-500 text-teal-950 border-amber-600 shadow-2xs"
                            : "bg-cream/80 text-teal-950/80 border-teal-900/10 hover:border-teal-900/30"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Core Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    Your Full Name <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-xs sm:text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-1 focus:ring-teal-900/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    WhatsApp Mobile Number <span className="text-amber-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-950/50">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-xl border border-teal-900/20 bg-white pl-11 pr-3 py-2 text-xs sm:text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-1 focus:ring-teal-900/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    Email Address <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-xs sm:text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-1 focus:ring-teal-900/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    City / Locality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru (South, Jayanagar, etc.)"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-xs sm:text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-1 focus:ring-teal-900/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    {currentPathway.handleLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={currentPathway.placeholderHandle}
                    value={form.handleOrOrg}
                    onChange={(e) => setForm({ ...form, handleOrOrg: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-xs sm:text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-1 focus:ring-teal-900/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    Weekend Slot Preference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saturday Mornings, Sunday Afternoons"
                    value={form.reach}
                    onChange={(e) => setForm({ ...form, reach: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-xs sm:text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-1 focus:ring-teal-900/20 outline-none"
                  />
                </div>
              </div>

              {/* Message / Motivation */}
              <div>
                <label className="block text-xs font-bold text-teal-950 mb-1">
                  Tell us a bit about why you want to volunteer (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. I want to help kids learn Spoken English and build confidence. I am free on Sundays..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-xs sm:text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-1 focus:ring-teal-900/20 outline-none resize-none"
                />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-800 border border-red-200">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-teal-950/60 leading-relaxed">
                  We respect your privacy. Your phone number is only used for Janaseva Ashrama volunteer coordination.
                </p>

                <button
                  type="submit"
                  disabled={busy}
                  className="focus-ring tap-scale flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md transition disabled:opacity-75 disabled:cursor-not-allowed w-full sm:w-auto shrink-0 cursor-pointer"
                >
                  {busy ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    currentPathway.submitButtonText
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </Container>
    </Section>
  );
}
