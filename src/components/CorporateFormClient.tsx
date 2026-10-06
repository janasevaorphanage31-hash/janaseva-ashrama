"use client";

import { useState, type FormEvent } from "react";
import { validateName, validateEmail, validatePhone, sanitizeNumeric, sanitizeName } from "@/lib/validation";
import { ValidationErrorModal } from "./ValidationErrorModal";

export function CorporateFormClient() {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    interest: "CSR project",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.companyName.trim() || form.companyName.trim().length < 2) {
      setModalMsg("Please enter a valid company or organization name.");
      setModalOpen(true);
      return;
    }

    const nameCheck = validateName(form.contactName, "Contact person name");
    if (!nameCheck.valid) {
      setModalMsg(nameCheck.error!);
      setModalOpen(true);
      return;
    }

    const emailCheck = validateEmail(form.email, true);
    if (!emailCheck.valid) {
      setModalMsg(emailCheck.error!);
      setModalOpen(true);
      return;
    }

    if (form.phone.trim()) {
      const phoneCheck = validatePhone(form.phone, false, "Phone number");
      if (!phoneCheck.valid) {
        setModalMsg(phoneCheck.error!);
        setModalOpen(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("companyName", form.companyName);
      fd.append("contactName", form.contactName);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("interest", form.interest);
      fd.append("message", form.message);

      const res = await fetch("/api/corporate", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setModalMsg(data.error || "Failed to submit inquiry. Please try again.");
        setModalOpen(true);
      }
    } catch {
      setModalMsg("Network error. Please try again or call us directly.");
      setModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-3xl bg-teal-900 p-8 text-center text-white" role="status">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-800 text-teal-200 ring-2 ring-white/20">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-bold">Thank You!</h3>
        <p className="mt-2 text-sm text-white/80 max-w-md mx-auto">
          Your CSR inquiry has been received. Our leadership team will review your proposal and get in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-8 rounded-3xl bg-teal-900 p-6 text-white md:p-8">
        <h2 className="font-display text-2xl font-bold">Start a CSR conversation</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            name="companyName"
            required
            placeholder="Company name *"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="rounded-2xl bg-white px-4 py-3 text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
          />
          <input
            name="contactName"
            required
            placeholder="Contact person (Letters only) *"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: sanitizeName(e.target.value) })}
            className="rounded-2xl bg-white px-4 py-3 text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Work email address *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-2xl bg-white px-4 py-3 text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
          />
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={15}
            placeholder="Phone number (Numbers only)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: sanitizeNumeric(e.target.value).slice(0, 15) })}
            className="rounded-2xl bg-white px-4 py-3 text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
          />
          <select
            name="interest"
            value={form.interest}
            onChange={(e) => setForm({ ...form, interest: e.target.value })}
            className="rounded-2xl bg-white px-4 py-3 text-teal-950 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-saffron"
          >
            <option>CSR project</option>
            <option>Employee volunteering</option>
            <option>Team Impact</option>
            <option>Product donation</option>
            <option>Impact reporting</option>
          </select>
          <textarea
            name="message"
            placeholder="What would your team like to make possible?"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="rounded-2xl bg-white px-4 py-3 text-teal-950 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-saffron"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 rounded-xl bg-saffron px-6 py-3 text-sm font-bold text-white hover:bg-saffron-dark disabled:opacity-50 transition shadow"
        >
          {submitting ? "Sending..." : "Send enquiry"}
        </button>
        <p className="mt-3 text-xs text-white/60">
          No payment is taken from this form. A team member will review the enquiry and respond.
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
