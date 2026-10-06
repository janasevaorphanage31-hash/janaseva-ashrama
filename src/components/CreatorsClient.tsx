"use client";

import { useState, type FormEvent } from "react";
import { validateEmail } from "@/lib/validation";
import { ValidationErrorModal } from "@/components/ValidationErrorModal";

export function CreatorsClient() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [valModalOpen, setValModalOpen] = useState(false);
  const [valModalMsg, setValModalMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!displayName.trim() || displayName.trim().length < 2) {
      setValModalMsg("Please enter a valid Creator / Channel name (at least 2 characters).");
      setValModalOpen(true);
      return;
    }

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.valid) {
      setValModalMsg(emailCheck.error!);
      setValModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          instagram: instagram.trim(),
          youtube: youtube.trim(),
          bio: bio.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
      } else {
        setValModalMsg(data.error || "Failed to submit creator request.");
        setValModalOpen(true);
      }
    } catch {
      setValModalMsg("A network error occurred. Please try again.");
      setValModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-8 rounded-3xl bg-teal-900 p-8 text-white text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl text-saffron">
          ✓
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold">Onboarding Request Received!</h3>
        <p className="mt-2 text-sm leading-6 text-white/80">
          Thank you, {displayName}. Our outreach team will review your channel and reach out to collaborate on a verified Janaseva campaign.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-8 rounded-3xl bg-teal-900 p-6 text-white md:p-8">
        <h2 className="font-display text-2xl font-bold">Request creator onboarding</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-white/80 mb-1">Creator / Channel Name *</label>
            <input
              name="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Travel With Rahul"
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 mb-1">Contact Email *</label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@creatorhub.com"
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 mb-1">Instagram Handle (Optional)</label>
            <input
              name="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourhandle"
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 mb-1">YouTube Channel (Optional)</label>
            <input
              name="youtube"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="youtube.com/@channel"
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-white/80 mb-1">Campaign Idea / Audience Focus</label>
            <textarea
              name="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us what kind of content or campaign you want to create."
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-xl bg-saffron px-6 py-3 text-sm font-bold text-white transition hover:bg-saffron-dark disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Request review"}
        </button>

        <p className="mt-3 text-xs text-white/60">
          Creator campaigns are reviewed before publication. No follower or donor ranking is created.
        </p>
      </form>

      <ValidationErrorModal
        isOpen={valModalOpen}
        title="Invalid Entry"
        message={valModalMsg}
        onClose={() => setValModalOpen(false)}
      />
    </>
  );
}
