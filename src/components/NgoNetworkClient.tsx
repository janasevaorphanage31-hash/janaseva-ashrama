"use client";

import { useState, type FormEvent } from "react";
import { validateName, validateEmail } from "@/lib/validation";
import { ValidationErrorModal } from "@/components/ValidationErrorModal";

export function NgoNetworkClient() {
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
    location: "",
    focusAreas: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [valModalOpen, setValModalOpen] = useState(false);
  const [valModalMsg, setValModalMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setValModalMsg("Please enter your organization's legal name.");
      setValModalOpen(true);
      return;
    }

    const nameCheck = validateName(formData.contactName, "Contact person");
    if (!nameCheck.valid) {
      setValModalMsg(nameCheck.error!);
      setValModalOpen(true);
      return;
    }

    const emailCheck = validateEmail(formData.contactEmail, true);
    if (!emailCheck.valid) {
      setValModalMsg(emailCheck.error!);
      setValModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          contactName: formData.contactName.trim(),
          contactEmail: formData.contactEmail.trim().toLowerCase(),
          location: formData.location.trim(),
          focusAreas: formData.focusAreas.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
      } else {
        setValModalMsg(data.error || "Failed to submit partnership request.");
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
      <div className="rounded-3xl bg-white p-8 ring-1 ring-teal-900/10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-700">
          ✓
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold text-teal-950">Partnership Request Submitted!</h3>
        <p className="mt-2 text-sm leading-6 text-teal-900/70">
          Thank you, {formData.contactName}. We have received your collaboration request for {formData.name}. Our coordination committee will review the details and respond shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="rounded-3xl bg-white p-6 ring-1 ring-teal-900/10">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Organisation Name *</label>
            <input
              name="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Hope Foundation Trust"
              className="w-full rounded-2xl border border-teal-900/10 px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Contact Person *</label>
            <input
              name="contactName"
              required
              value={formData.contactName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactName: e.target.value.replace(/[^a-zA-Z\s.'-]/g, ""),
                })
              }
              placeholder="Letters only, e.g. Dr. K. Sharma"
              className="w-full rounded-2xl border border-teal-900/10 px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Official Email *</label>
            <input
              name="contactEmail"
              required
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="e.g. contact@hopefoundation.org"
              className="w-full rounded-2xl border border-teal-900/10 px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Location / City</label>
            <input
              name="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Bangalore, Karnataka"
              className="w-full rounded-2xl border border-teal-900/10 px-4 py-3 text-sm text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Focus Areas</label>
            <input
              name="focusAreas"
              value={formData.focusAreas}
              onChange={(e) => setFormData({ ...formData, focusAreas: e.target.value })}
              placeholder="e.g. Elder care, Child education, Nutrition distribution"
              className="w-full rounded-2xl border border-teal-900/10 px-4 py-3 text-sm text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Collaboration Proposal</label>
            <textarea
              name="message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="What would you like to collaborate on with Janaseva?"
              className="w-full rounded-2xl border border-teal-900/10 px-4 py-3 text-sm text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-xl bg-saffron px-6 py-3 text-sm font-bold text-white transition hover:bg-saffron-dark disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Request partnership review"}
        </button>

        <p className="mt-3 text-xs text-teal-950/55">Partner organisations are reviewed before public listing.</p>
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
