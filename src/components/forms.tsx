"use client";

import Link from "next/link";
import { useState } from "react";
import { track } from "@/lib/track";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateAmount,
  sanitizeNumeric,
  sanitizeName,
} from "@/lib/validation";
import { ValidationErrorModal } from "./ValidationErrorModal";

const inputCls =
  "mt-1 w-full rounded-2xl border-2 border-teal-900/15 bg-cream px-4 py-3 text-base text-teal-900 outline-none focus:border-teal-800";
const labelCls = "block text-sm font-semibold text-teal-900";

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export function VolunteerForm({
  interests,
  initial,
}: {
  interests: { key: string; t: string }[];
  initial: string;
}) {
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    interestArea: initial,
    skills: "",
    availability: "Weekends",
    message: "",
    consent: false,
  });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  if (state === "done") {
    return (
      <div className="rounded-3xl bg-teal-900 p-6 text-center text-white" role="status">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-800 text-teal-200 ring-1 ring-white/20">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-1 font-display text-2xl font-bold">Thank you!</p>
        <p className="mt-1 text-sm text-white/80">
          Your volunteer application was submitted. Our team will review and contact you.
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        className="space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (state === "busy") return;
          setError("");

          // 1. Name check
          const nameCheck = validateName(f.name, "Your name");
          if (!nameCheck.valid) {
            setError(nameCheck.error!);
            setModalMsg(nameCheck.error!);
            setModalOpen(true);
            return;
          }

          // 2. Email check
          const emailCheck = validateEmail(f.email, true);
          if (!emailCheck.valid) {
            setError(emailCheck.error!);
            setModalMsg(emailCheck.error!);
            setModalOpen(true);
            return;
          }

          // 3. Phone check
          if (f.phone.trim()) {
            const phoneCheck = validatePhone(f.phone, false, "Mobile phone number");
            if (!phoneCheck.valid) {
              setError(phoneCheck.error!);
              setModalMsg(phoneCheck.error!);
              setModalOpen(true);
              return;
            }
          }

          // 4. Consent check
          if (!f.consent) {
            const msg = "Please tick the consent checkbox so we may contact you about your application.";
            setError(msg);
            setModalMsg(msg);
            setModalOpen(true);
            return;
          }

          setState("busy");
          try {
            await post("/api/volunteers", f);
            track("volunteer_submitted", { interestArea: f.interestArea });
            setState("done");
          } catch (err) {
            const msg = (err as Error).message;
            setError(msg);
            setModalMsg(msg);
            setModalOpen(true);
            setState("idle");
          }
        }}
      >
        <label className={labelCls}>
          Interest area
          <select
            className={inputCls}
            value={f.interestArea}
            onChange={(e) => setF({ ...f, interestArea: e.target.value })}
          >
            {interests.map((i) => (
              <option key={i.key} value={i.key}>
                {i.t}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Full Name (Letters only)
          <input
            className={inputCls}
            required
            autoComplete="name"
            placeholder="e.g. Ramesh Kumar"
            value={f.name}
            onChange={(e) => setF({ ...f, name: sanitizeName(e.target.value) })}
          />
        </label>
        <label className={labelCls}>
          Email Address
          <input
            className={inputCls}
            type="email"
            required
            autoComplete="email"
            placeholder="name@example.com"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </label>
        <label className={labelCls}>
          Phone (Numbers only, optional)
          <input
            className={inputCls}
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={15}
            placeholder="10-digit mobile number"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: sanitizeNumeric(e.target.value).slice(0, 15) })}
          />
        </label>
        <label className={labelCls}>
          Skills
          <textarea
            className={inputCls}
            rows={2}
            placeholder="Teaching, design, video editing..."
            value={f.skills}
            onChange={(e) => setF({ ...f, skills: e.target.value })}
          />
        </label>
        <label className={labelCls}>
          Availability
          <select
            className={inputCls}
            value={f.availability}
            onChange={(e) => setF({ ...f, availability: e.target.value })}
          >
            <option>Weekdays</option>
            <option>Weekends</option>
            <option>Evenings</option>
            <option>Flexible</option>
          </select>
        </label>
        <label className={labelCls}>
          Message
          <textarea
            className={inputCls}
            rows={3}
            placeholder="Tell us about yourself and why you'd like to volunteer..."
            value={f.message}
            onChange={(e) => setF({ ...f, message: e.target.value })}
          />
        </label>
        <label className="flex items-start gap-2 rounded-xl bg-cream p-3 text-sm text-teal-900 cursor-pointer">
          <input
            type="checkbox"
            checked={f.consent}
            onChange={(e) => setF({ ...f, consent: e.target.checked })}
            className="mt-1 h-4 w-4 accent-teal-800"
          />
          <span>I consent to Janaseva contacting me about this volunteer application.</span>
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
            {error}
          </p>
        )}
        <button
          disabled={state === "busy"}
          className="focus-ring w-full rounded-xl bg-saffron px-6 py-3.5 text-sm font-bold text-white hover:bg-saffron-dark disabled:opacity-60 transition"
        >
          {state === "busy" ? "Sending…" : "Submit application"}
        </button>
        <p className="text-xs text-teal-950/50">
          Personal details remain private and are used only for volunteer coordination.
        </p>
      </form>

      <ValidationErrorModal
        isOpen={modalOpen}
        message={modalMsg}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

const COVERS = [
  { src: "/media/janaseva-ashrama-original.jpg", label: "Ashrama Campus" },
  { src: "/media/community.jpg", label: "Community" },
  { src: "/media/food.jpg", label: "Meals" },
  { src: "/media/education.jpg", label: "Learning" },
  { src: "/media/play.jpg", label: "Play" },
  { src: "/media/volunteers.jpg", label: "Volunteers" },
];

export function CampaignForm({
  occasions,
  types,
  initialOccasion,
  initialType,
}: {
  occasions: string[];
  types: string[];
  initialOccasion?: string;
  initialType?: string;
}) {
  const [f, setF] = useState({
    title: "",
    occasion: initialOccasion && occasions.includes(initialOccasion) ? initialOccasion : occasions[0],
    campaignType: initialType && types.includes(initialType) ? initialType : types[0],
    story: "",
    goalAmount: "5000",
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
    coverImage: COVERS[0].src,
  });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  if (state === "done") {
    return (
      <div className="rounded-3xl bg-teal-900 p-6 text-center text-white" role="status">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-800 text-teal-200 ring-1 ring-white/20">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-1 font-display text-2xl font-bold">Your campaign is submitted</p>
        <p className="mt-2 text-sm text-white/80">
          The Ashrama team reviews every campaign before it goes live. You can preview your page now and share
          it once approved.
        </p>
        <Link
          href={`/campaigns/${slug}`}
          className="mt-4 inline-block rounded-xl bg-saffron px-6 py-3 text-sm font-bold text-white shadow hover:bg-saffron-dark transition"
        >
          Preview my campaign
        </Link>
      </div>
    );
  }

  return (
    <>
      <form
        className="space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (state === "busy") return;
          setError("");

          // 1. Campaign title
          if (!f.title.trim() || f.title.trim().length < 5) {
            const msg = "Please enter a campaign title of at least 5 characters.";
            setError(msg);
            setModalMsg(msg);
            setModalOpen(true);
            return;
          }

          // 2. Story
          if (!f.story.trim() || f.story.trim().length < 20) {
            const msg = "Please share a brief story (at least 20 characters) explaining why this cause matters to you.";
            setError(msg);
            setModalMsg(msg);
            setModalOpen(true);
            return;
          }

          // 3. Goal Amount (number only, min 500)
          const goalCheck = validateAmount(f.goalAmount, 500, 10000000);
          if (!goalCheck.valid) {
            setError(goalCheck.error!);
            setModalMsg(goalCheck.error!);
            setModalOpen(true);
            return;
          }

          // 4. Organizer Name
          const nameCheck = validateName(f.organizerName, "Organizer name");
          if (!nameCheck.valid) {
            setError(nameCheck.error!);
            setModalMsg(nameCheck.error!);
            setModalOpen(true);
            return;
          }

          // 5. Organizer Email
          const emailCheck = validateEmail(f.organizerEmail, true);
          if (!emailCheck.valid) {
            setError(emailCheck.error!);
            setModalMsg(emailCheck.error!);
            setModalOpen(true);
            return;
          }

          // 6. Organizer Phone (required 10 digits)
          const phoneCheck = validatePhone(f.organizerPhone, true, "Organizer phone number");
          if (!phoneCheck.valid) {
            setError(phoneCheck.error!);
            setModalMsg(phoneCheck.error!);
            setModalOpen(true);
            return;
          }

          setState("busy");
          try {
            const d = await post("/api/campaigns", { ...f, goalAmount: Number(f.goalAmount) });
            track("campaign_created", { occasion: f.occasion });
            setSlug(d.slug);
            setState("done");
          } catch (err) {
            const msg = (err as Error).message;
            setError(msg);
            setModalMsg(msg);
            setModalOpen(true);
            setState("idle");
          }
        }}
      >
        <label className={labelCls}>
          Campaign title
          <input
            className={inputCls}
            required
            minLength={5}
            maxLength={120}
            placeholder="My Birthday - 100 Meal Challenge"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={labelCls}>
            Occasion
            <select
              className={inputCls}
              value={f.occasion}
              onChange={(e) => setF({ ...f, occasion: e.target.value })}
            >
              {occasions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            Campaign by
            <select
              className={inputCls}
              value={f.campaignType}
              onChange={(e) => setF({ ...f, campaignType: e.target.value })}
            >
              {types.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={labelCls}>
          Your story
          <textarea
            className={inputCls}
            rows={5}
            required
            minLength={20}
            maxLength={3000}
            placeholder="Why this day matters to you, and why you are choosing Janaseva."
            value={f.story}
            onChange={(e) => setF({ ...f, story: e.target.value })}
          />
        </label>
        <label className={labelCls}>
          Target Goal (₹ numbers only, min ₹500)
          <input
            className={inputCls}
            inputMode="numeric"
            required
            placeholder="e.g. 5000"
            value={f.goalAmount}
            onChange={(e) => setF({ ...f, goalAmount: sanitizeNumeric(e.target.value) })}
          />
        </label>
        <fieldset>
          <legend className={labelCls}>Cover image</legend>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {COVERS.map((c) => (
              <label
                key={c.src}
                className={`relative cursor-pointer overflow-hidden rounded-xl ring-2 ${
                  f.coverImage === c.src ? "ring-saffron" : "ring-transparent"
                }`}
              >
                <input
                  type="radio"
                  name="cover"
                  className="sr-only"
                  checked={f.coverImage === c.src}
                  onChange={() => setF({ ...f, coverImage: c.src })}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.src} alt={c.label} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-teal-950/50">
            Photos of children are curated to preserve privacy.
          </p>
        </fieldset>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={labelCls}>
            Your Full Name (Letters only)
            <input
              className={inputCls}
              required
              autoComplete="name"
              placeholder="e.g. Ananya Rao"
              value={f.organizerName}
              onChange={(e) => setF({ ...f, organizerName: sanitizeName(e.target.value) })}
            />
          </label>
          <label className={labelCls}>
            Email (for coordination)
            <input
              className={inputCls}
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={f.organizerEmail}
              onChange={(e) => setF({ ...f, organizerEmail: e.target.value })}
            />
          </label>
        </div>
        <label className={labelCls}>
          Mobile Phone (Numbers only)
          <input
            className={inputCls}
            type="tel"
            required
            autoComplete="tel"
            inputMode="numeric"
            maxLength={15}
            placeholder="10-digit mobile e.g. 9876543210"
            value={f.organizerPhone}
            onChange={(e) => setF({ ...f, organizerPhone: sanitizeNumeric(e.target.value).slice(0, 15) })}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
            {error}
          </p>
        )}
        <button
          disabled={state === "busy"}
          className="focus-ring w-full rounded-xl bg-saffron px-6 py-3.5 text-sm font-bold text-white hover:bg-saffron-dark disabled:opacity-60 transition"
        >
          {state === "busy" ? "Submitting…" : "Submit for review"}
        </button>
      </form>

      <ValidationErrorModal
        isOpen={modalOpen}
        message={modalMsg}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
