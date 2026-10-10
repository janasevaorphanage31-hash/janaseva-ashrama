"use client";

import { useState } from "react";
import { Container, Head, Section } from "../ui";
import { SITE } from "@/lib/site";
import { track } from "@/lib/track";

type CommunityRole = "VOLUNTEER" | "INFLUENCER" | "COMPANY_CSR" | "WHATSAPP_AMBASSADOR";

interface RoleOption {
  id: CommunityRole;
  badge: string;
  title: string;
  titleKn: string;
  tagline: string;
  icon: string;
  skills: string[];
  placeholderHandle: string;
  handleLabel: string;
}

const ROLES: RoleOption[] = [
  {
    id: "VOLUNTEER",
    badge: "Youth & Mentors",
    title: "Weekend Volunteer",
    titleKn: "ಸ್ವಯಂಸೇವಕರು",
    tagline: "Teach, tutor, play sports, or serve wholesome meals to 25 resident boys on weekends.",
    icon: "🤝",
    skills: [
      "📐 Math & Science Tutoring",
      "🗣️ Spoken English & Reading",
      "🎨 Arts, Drawing & Crafts",
      "⚽ Sports & Yoga Coaching",
      "💻 Computer Basics & Coding",
      "🍲 Kitchen & Annadana Seva",
      "🩺 Health & Dental Camps",
    ],
    placeholderHandle: "College / Workplace (e.g. RV College, Infosys)",
    handleLabel: "College or Company",
  },
  {
    id: "INFLUENCER",
    badge: "Creators & Media",
    title: "Content Creator / Influencer",
    titleKn: "ಕಂಟೆಂಟ್ ಕ್ರಿಯೇಟರ್ಸ್",
    tagline: "Visit our Bangalore ashrama, film authentic reels, and share our children's stories with your audience.",
    icon: "📸",
    skills: [
      "🎥 Instagram Reels & Stories",
      "📸 Photography & Portraits",
      "📱 YouTube Vlogs & Documentaries",
      "🎙️ Podcasts & Live Sessions",
      "✍️ Blog Posts & Social Articles",
      "📢 Community Fundraiser Host",
    ],
    placeholderHandle: "@yourhandle (Instagram / YouTube link)",
    handleLabel: "Social Media Handle",
  },
  {
    id: "COMPANY_CSR",
    badge: "Corporate & NGO",
    title: "Corporate CSR Partner",
    titleKn: "ಕಾರ್ಪೊರೇಟ್ ಸಿಎಸ್ಆರ್",
    tagline: "Organize employee volunteering drives, matching grant programs, and Form 28 / CSR-1 compliant projects.",
    icon: "🏢",
    skills: [
      "🏢 Employee Volunteering Day",
      "💼 Payroll Giving Program",
      "📦 Bulk Grocery & Ration Drive",
      "💻 Digital Lab Sponsorship",
      "🏗️ Ashrama Facility Upgrades",
      "📄 CSR-1 Grant / Annual MOU",
    ],
    placeholderHandle: "Company Name (e.g. Wipro Cares, Biocon)",
    handleLabel: "Company / Foundation Name",
  },
  {
    id: "WHATSAPP_AMBASSADOR",
    badge: "Daily Updates",
    title: "WhatsApp Sevak Network",
    titleKn: "ವಾಟ್ಸಾಪ್ ಸಮುದಾಯ",
    tagline: "Get direct WhatsApp updates on ashrama grocery shortages, child exam results, and festive seva calls.",
    icon: "💬",
    skills: [
      "📢 Urgent Ration Alerts",
      "🎂 Special Birthday Blessing Calls",
      "🎉 Festival Annadana Updates",
      "🏆 Child Academic Milestone Reports",
      "🕊️ Prayer & Daily Routine Broadcasts",
    ],
    placeholderHandle: "Your City / Area (e.g. Bangalore South, Jayanagar)",
    handleLabel: "Residential Area / City",
  },
];

export function CommunityV2Section({ standalone = false }: { standalone?: boolean }) {
  const [selectedRole, setSelectedRole] = useState<CommunityRole>("VOLUNTEER");
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

  const activeRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleRoleChange = (role: CommunityRole) => {
    setSelectedRole(role);
    setSelectedSkills([]);
    setError("");
    track("community_role_tab_click", { role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError("Please enter your full name (at least 2 letters).");
      return;
    }
    if (!form.phone.trim()) {
      setError("Please enter your WhatsApp mobile number for community coordination.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    track("community_form_submit", { role: selectedRole });

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          city: form.city.trim(),
          handleOrOrg: form.handleOrOrg.trim(),
          reach: form.reach.trim(),
          skills: selectedSkills.join(", "),
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
        throw new Error(data.error || "Submission failed. Please check your details.");
      }

      setSuccessData({
        name: data.name,
        role: data.role,
        whatsappUrl: data.whatsappUrl,
      });
      track("community_form_success", { role: selectedRole });
    } catch (err: any) {
      setError(err?.message || "Could not complete registration. Please try again or WhatsApp us directly.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section id="volunteer" tone="white" className="py-12 md:py-20 relative overflow-hidden">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-saffron/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-teal-900/5 blur-3xl" />

      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-saffron/10 border border-saffron/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-saffron-dark mb-3">
              <span>🌟 Community Network V2 · ಸ್ವಯಂಸೇವಕರು &amp; ಪಾಲುದಾರರು</span>
            </div>
            <Head
              eyebrow="Join The Janaseva Family"
              title="Give Your Time, Voice, or Company Support"
              lead="Love and guidance cannot be bought. Whether you are a college student teaching math, a creator filming stories, a corporate team planning CSR, or a donor wanting daily WhatsApp updates—there is a special place for you."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Namaste! I would like to know how I can volunteer or partner with Janaseva Ashrama.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring tap-scale inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-800 transition cursor-pointer"
            >
              <span>💬 Direct WhatsApp Helpline</span>
            </a>
            <a
              href="#contact"
              className="focus-ring tap-scale inline-flex items-center gap-2 rounded-2xl border border-teal-900/20 bg-cream px-4 py-3 text-xs font-bold text-teal-950 hover:bg-sand transition cursor-pointer"
            >
              <span>📍 Visit Ashrama Campus</span>
            </a>
          </div>
        </div>

        {/* ── 4 TABS: VOLUNTEER | CREATOR | CORPORATE | WHATSAPP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 mb-8">
          {ROLES.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleChange(r.id)}
                className={`relative flex flex-col items-start p-4 rounded-3xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-teal-950 text-white border-teal-900 shadow-xl shadow-teal-950/15 ring-2 ring-saffron/40"
                    : "bg-cream/70 hover:bg-cream text-teal-950/80 border-teal-900/10 hover:border-teal-900/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-2xl">{r.icon}</span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-saffron text-teal-950" : "bg-teal-900/10 text-teal-900"
                    }`}
                  >
                    {r.badge}
                  </span>
                </div>
                <h3 className={`font-bold text-sm ${isSelected ? "text-white" : "text-teal-950"}`}>{r.title}</h3>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${isSelected ? "text-teal-200/80" : "text-teal-950/60"}`}>
                  {r.titleKn}
                </p>
                {isSelected && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-teal-950 rotate-45 border-r border-b border-teal-900 hidden md:block" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── INTERACTIVE COMMUNITY FILING CARD ── */}
        <div className="rounded-3xl bg-white border border-teal-900/10 shadow-xl shadow-teal-950/5 p-6 sm:p-8 md:p-10">
          {successData ? (
            /* SUCCESS STATE WITH DIRECT 1-CLICK WHATSAPP JOIN */
            <div className="text-center py-8 max-w-xl mx-auto space-y-5 animate-in fade-in duration-300">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-4xl shadow-inner">
                🎉
              </div>
              <div>
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
                  Registration Successfully Recorded in Database ✅
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-teal-950">
                  Welcome to Janaseva, {successData.name}!
                </h3>
                <p className="mt-2 text-sm text-teal-950/70 leading-relaxed">
                  Your filing as a <strong>{activeRoleConfig.title}</strong> has been saved. Join our official WhatsApp
                  Sevak Group below for direct updates, visit timings, and coordinator contact.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={successData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring tap-scale flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-extrabold text-white shadow-lg hover:bg-emerald-700 transition w-full sm:w-auto cursor-pointer"
                >
                  <span className="text-lg">💬</span>
                  <span>Join Official WhatsApp Community Group →</span>
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
                  className="rounded-2xl border border-teal-900/20 px-5 py-3.5 text-xs font-bold text-teal-950 hover:bg-cream transition cursor-pointer"
                >
                  Register Another Person
                </button>
              </div>
            </div>
          ) : (
            /* FILING FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-teal-900/10 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeRoleConfig.icon}</span>
                    <h3 className="font-display text-lg sm:text-xl font-black text-teal-950">
                      {activeRoleConfig.title} Registration
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-teal-950/70 mt-1">{activeRoleConfig.tagline}</p>
                </div>
                <div className="text-xs text-emerald-800 font-bold bg-emerald-50 rounded-xl px-3 py-1.5 border border-emerald-200/60 self-start sm:self-center shrink-0">
                  🔒 Saved to NGO Database &amp; WhatsApp Verified
                </div>
              </div>

              {/* Skill / Focus Pill Selectors */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-950/70 mb-2.5">
                  Select Your Skill / Seva Interest (Tap to choose):
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeRoleConfig.skills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer border ${
                          isSelected
                            ? "bg-saffron text-teal-950 border-saffron-dark shadow-xs"
                            : "bg-cream text-teal-950/80 border-teal-900/10 hover:border-teal-900/30"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Core Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1.5">
                    Your Full Name <span className="text-saffron-dark">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3.5 py-2.5 text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-2 focus:ring-teal-900/10 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1.5">
                    WhatsApp Mobile Number <span className="text-saffron-dark">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-950/50">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-xl border border-teal-900/20 bg-white pl-12 pr-3.5 py-2.5 text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-2 focus:ring-teal-900/10 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1.5">
                    Email Address <span className="text-saffron-dark">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3.5 py-2.5 text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-2 focus:ring-teal-900/10 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1.5">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, Mysore, Tumkur"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3.5 py-2.5 text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-2 focus:ring-teal-900/10 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1.5">
                    {activeRoleConfig.handleLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={activeRoleConfig.placeholderHandle}
                    value={form.handleOrOrg}
                    onChange={(e) => setForm({ ...form, handleOrOrg: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3.5 py-2.5 text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-2 focus:ring-teal-900/10 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1.5">
                    Audience / Team Size / Availability
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekends only, 20k followers, 50 employees"
                    value={form.reach}
                    onChange={(e) => setForm({ ...form, reach: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 bg-white px-3.5 py-2.5 text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-2 focus:ring-teal-900/10 outline-none"
                  />
                </div>
              </div>

              {/* Message Box */}
              <div>
                <label className="block text-xs font-bold text-teal-950 mb-1.5">
                  How would you like to contribute? (Optional notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Share any specific ideas, dates you wish to visit, or questions..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 bg-white px-3.5 py-2 text-sm text-teal-950 placeholder-teal-950/40 focus:border-teal-900 focus:ring-2 focus:ring-teal-900/10 outline-none resize-none"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-800 border border-red-200">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-teal-950/60 leading-relaxed">
                  By joining, you agree to receive official Janaseva Ashrama seva updates. We never share your phone
                  number with third parties.
                </p>

                <button
                  type="submit"
                  disabled={busy}
                  className="focus-ring tap-scale flex items-center justify-center gap-2 rounded-2xl bg-saffron px-8 py-3.5 text-sm font-black text-white shadow-lg hover:bg-saffron-dark transition disabled:opacity-60 w-full sm:w-auto shrink-0 cursor-pointer"
                >
                  {busy ? (
                    "Filing to Community Database..."
                  ) : (
                    <>
                      <span>Join as {activeRoleConfig.title}</span>
                      <span>→</span>
                    </>
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
