"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { validateName, sanitizeName } from "@/lib/validation";
import { ValidationErrorModal } from "./ValidationErrorModal";

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Graduation",
  "First Salary",
  "Achievement",
  "Festival",
  "Thank You",
  "Tribute",
  "Just Because",
  "Custom",
];

export function GiftImpactWizard() {
  const router = useRouter();
  const cart = useCart();
  const [form, setForm] = useState({
    occasion: "Birthday",
    recipientName: "",
    senderName: "",
    message: "",
    allowSenderName: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  async function start() {
    setError("");

    // 1. Recipient Name validation (letters only)
    const recCheck = validateName(form.recipientName, "Recipient name");
    if (!recCheck.valid) {
      setError(recCheck.error!);
      setModalMsg(recCheck.error!);
      setModalOpen(true);
      return;
    }

    // 2. Sender Name validation (if provided)
    if (form.senderName.trim()) {
      const sndCheck = validateName(form.senderName, "Your display name");
      if (!sndCheck.valid) {
        setError(sndCheck.error!);
        setModalMsg(sndCheck.error!);
        setModalOpen(true);
        return;
      }
    }

    setBusy(true);
    try {
      const r = await fetch("/api/gifts/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not start the gift.");
      cart.clear();
      cart.setCampaign(null);
      router.push(`/impact?giftReference=${encodeURIComponent(d.reference)}`);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      setModalMsg(msg);
      setModalOpen(true);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
        <p className="text-sm font-semibold text-teal-900">Gift details</p>
        <p className="mt-1 text-xs text-teal-950/60">
          These details travel with the gift through checkout. The gift card is created only after the donation is verified.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-teal-900">
            Occasion
            <select
              value={form.occasion}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              className="focus-ring mt-1 w-full rounded-2xl border-2 border-teal-900/10 bg-cream px-4 py-3"
            >
              {OCCASIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-teal-900">
            Recipient name (Letters only)
            <input
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: sanitizeName(e.target.value) })}
              className="focus-ring mt-1 w-full rounded-2xl border-2 border-teal-900/10 bg-cream px-4 py-3"
              placeholder="Who is this for? e.g. Sneha"
            />
          </label>
          <label className="text-sm font-semibold text-teal-900">
            Your display name <span className="font-normal text-teal-900/50">(optional)</span>
            <input
              value={form.senderName}
              onChange={(e) => setForm({ ...form, senderName: sanitizeName(e.target.value) })}
              className="focus-ring mt-1 w-full rounded-2xl border-2 border-teal-900/10 bg-cream px-4 py-3"
              placeholder="e.g. Ramesh Uncle"
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-xs font-semibold text-teal-900 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowSenderName}
              onChange={(e) => setForm({ ...form, allowSenderName: e.target.checked })}
              className="rounded accent-teal-800"
            />{" "}
            Show my name on the gift
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold text-teal-900">
          Message{" "}
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={3}
            maxLength={500}
            className="focus-ring mt-1 w-full rounded-2xl border-2 border-teal-900/10 bg-cream px-4 py-3"
            placeholder="A short message for the card..."
          />
        </label>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <button
          onClick={start}
          disabled={busy}
          className="focus-ring mt-5 w-full rounded-xl bg-saffron px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-saffron-dark disabled:opacity-60 transition"
        >
          {busy ? "Preparing your gift…" : "CHOOSE THE IMPACT"}
        </button>
      </div>

      <ValidationErrorModal
        isOpen={modalOpen}
        message={modalMsg}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
