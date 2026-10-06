"use client";

import { useState, type FormEvent } from "react";
import { validateName, validateEmail } from "@/lib/validation";
import { ValidationErrorModal } from "@/components/ValidationErrorModal";

export function RecurringGivingClient() {
  const [amount, setAmount] = useState<number>(500);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [valModalOpen, setValModalOpen] = useState(false);
  const [valModalMsg, setValModalMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nameCheck = validateName(name, "Your name");
    if (!nameCheck.valid) {
      setValModalMsg(nameCheck.error!);
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
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("email", email.trim().toLowerCase());
      fd.append("amount", String(amount));

      const res = await fetch("/api/recurring-giving", {
        method: "POST",
        body: fd,
      });

      if (res.ok || res.redirected) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setValModalMsg(data.error || "Failed to record recurring giving request.");
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
        <h3 className="mt-4 font-display text-2xl font-bold text-teal-950">Thank you for pledging!</h3>
        <p className="mt-2 text-sm leading-6 text-teal-900/70">
          Your regular giving preference for ₹{amount.toLocaleString("en-IN")}/month has been recorded. Our team will reach out with the verified subscription flow.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="rounded-3xl bg-white p-6 ring-1 ring-teal-900/10">
        <div className="grid grid-cols-3 gap-2">
          {[250, 500, 1000].map((n) => (
            <label
              key={n}
              onClick={() => setAmount(n)}
              className={`cursor-pointer rounded-2xl border p-3 text-center transition ${
                amount === n
                  ? "border-saffron bg-saffron/10 ring-2 ring-saffron"
                  : "border-teal-900/10 hover:border-teal-900/30"
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name="amount"
                value={n}
                checked={amount === n}
                onChange={() => setAmount(n)}
              />
              <span className="font-bold text-teal-900">₹{n.toLocaleString("en-IN")}</span>
              <span className="block text-xs text-teal-950/55">monthly</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-teal-900/80 mb-1">Your Full Name *</label>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ""))}
            placeholder="Letters only, e.g. Ananya Rao"
            className="w-full rounded-2xl border border-teal-900/10 px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
          />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-bold text-teal-900/80 mb-1">Email Address *</label>
          <input
            name="email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. ananya@example.com"
            className="w-full rounded-2xl border border-teal-900/10 px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-saffron px-6 py-3 text-sm font-bold text-white transition hover:bg-saffron-dark disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Request regular giving"}
        </button>

        <p className="mt-3 text-xs text-center text-teal-950/55">
          This form records interest; it does not silently create a recurring charge.
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
