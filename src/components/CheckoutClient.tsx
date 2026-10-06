"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePan,
  sanitizePan,
  sanitizeNumeric,
  sanitizeName,
  NAME_REGEX,
  EMAIL_REGEX,
  PAN_REGEX,
} from "@/lib/validation";
import { ValidationErrorModal } from "./ValidationErrorModal";

const OCCASION_CHOICES = [
  "Birthday",
  "Wedding Anniversary",
  "First Salary",
  "Graduation",
  "In Memory Of",
  "Festival / Celebration",
  "Tribute",
];

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => {
      open: () => void;
      on: (e: string, cb: (r: unknown) => void) => void;
    };
  }
}

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const inputCls =
  "w-full rounded-2xl border-2 border-teal-900/15 bg-cream px-4 py-3 text-base text-teal-900 outline-none focus:border-teal-800";

export function CheckoutClient() {
  const cart = useCart();
  const router = useRouter();
  const search = useSearchParams();

  const [form, setForm] = useState({ name: "", email: "", phone: "", pan: "", anonymous: false });
  const [dedicationEnabled, setDedicationEnabled] = useState(false);
  const [dedication, setDedication] = useState({ occasion: "Birthday", name: "", message: "" });
  const [deliveryPreference, setDeliveryPreference] = useState<"email" | "whatsapp" | "both">("both");
  const [updateConsent, setUpdateConsent] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [demoNote, setDemoNote] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationModalMessage, setValidationModalMessage] = useState("");
  const attempt = useRef<{ sig: string; key: string } | null>(null);

  // Check URL params for pre-set occasion (e.g. from Make a Day Matter)
  useEffect(() => {
    const occ = search.get("occasion");
    if (occ) {
      const match = OCCASION_CHOICES.find((o) => o.toLowerCase() === occ.toLowerCase());
      queueMicrotask(() => {
        setDedicationEnabled(true);
        if (match) setDedication((prev) => ({ ...prev, occasion: match }));
      });
    }
  }, [search]);

  if (!cart.hydrated) {
    return <div className="px-5 py-16 text-center text-teal-900/60">Loading your impact…</div>;
  }

  if (cart.total === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="font-display text-2xl font-bold text-teal-900">Your impact basket is empty</p>
        <p className="mt-2 text-teal-950/65">Choose an impact area or give your own amount to continue.</p>
        <Link
          href="/impact"
          className="mt-5 inline-block rounded-xl bg-saffron px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-saffron-dark transition"
        >
          BROWSE TODAY&apos;S NEEDS
        </Link>
      </div>
    );
  }

  const finish = (publicId: string) => {
    cart.clear();
    router.push(`/receipt/${publicId}`);
  };

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (busy) return;
    setError("");
    setPaymentFailed(false);

    // 1. Validate Donor Name (Letters and spaces only, min 2 chars)
    const nameCheck = validateName(form.name, "Full name");
    if (!nameCheck.valid) {
      setError(nameCheck.error!);
      setValidationModalMessage(nameCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 2. Validate Donor Email (RFC format)
    const emailCheck = validateEmail(form.email, true);
    if (!emailCheck.valid) {
      setError(emailCheck.error!);
      setValidationModalMessage(emailCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 3. Validate Phone (Digits only, exactly 10 digits for India or 10-15 digits)
    if (form.phone.trim()) {
      const phoneCheck = validatePhone(form.phone, false, "Mobile phone number");
      if (!phoneCheck.valid) {
        setError(phoneCheck.error!);
        setValidationModalMessage(phoneCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    // 4. Validate PAN (5 letters, 4 digits, 1 letter format)
    if (form.pan.trim()) {
      const panCheck = validatePan(form.pan, false);
      if (!panCheck.valid) {
        setError(panCheck.error!);
        setValidationModalMessage(panCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    // 5. Validate Dedication Name (if enabled)
    if (dedicationEnabled) {
      const dedCheck = validateName(dedication.name, "Dedication name");
      if (!dedCheck.valid) {
        setError(dedCheck.error!);
        setValidationModalMessage(dedCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    setBusy(true);
    track("checkout_submit", { total: cart.total });

    const items = cart.lines.map((l) => ({ slug: l.item.slug, qty: l.qty }));
    const missionSlug = search.get("mission") ?? "";
    const giftReference = search.get("giftReference") ?? "";
    const sig = JSON.stringify([
      items,
      cart.custom,
      cart.campaign?.slug ?? "",
      missionSlug,
      giftReference,
      dedicationEnabled ? dedication : null,
      deliveryPreference,
    ]);

    if (!attempt.current || attempt.current.sig !== sig) {
      attempt.current = { sig, key: crypto.randomUUID() + "-" + Date.now().toString(36) };
    }

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customAmount: cart.custom,
          campaignSlug: cart.campaign?.slug,
          missionSlug: missionSlug || undefined,
          giftReference: giftReference || undefined,
          donor: form,
          dedication: dedicationEnabled ? dedication : undefined,
          deliveryPreference,
          updateConsent,
          idempotencyKey: attempt.current.key,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      if (data.status) return finish(data.publicId); // already processed

      if (data.mode === "demo") {
        setDemoNote(true);
        await fetch("/api/donations/demo-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: data.publicId }),
        });
        return finish(data.publicId);
      }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load the secure payment gateway. Check your connection and try again.");
      }

      const rz = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount * 100,
        currency: "INR",
        name: "Janaseva Ashrama",
        description: dedicationEnabled ? `${dedication.occasion} Dedication` : "Impact contribution",
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#06312f" },
        modal: {
          ondismiss: () => {
            setBusy(false);
          },
        },
        handler: async (r: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const v = await fetch("/api/donations/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publicId: data.publicId, ...r }),
            });
            const vd = await v.json();
            if (!v.ok) throw new Error(vd.error || "Verification failed.");
            finish(data.publicId);
          } catch (err) {
            track("payment_failed", { stage: "verify" });
            setError((err as Error).message);
            setPaymentFailed(true);
            setBusy(false);
          }
        },
      });

      rz.on("payment.failed", () => {
        track("payment_failed", { stage: "gateway" });
        setError("Your payment was not completed by the gateway. No amount has been deducted.");
        setPaymentFailed(true);
        setBusy(false);
      });

      rz.open();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[1fr_380px]" noValidate>
      <div className="space-y-5">
        {/* Donor Info Card */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
          <h2 className="font-display text-xl font-bold text-teal-900">Your details</h2>
          <p className="mt-1 text-xs text-teal-950/60">
            Used for your official tax receipt. Never shared or sold.
          </p>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className="block text-sm font-semibold text-teal-900">
                Full name *
                <input
                  className={`${inputCls} mt-1`}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: sanitizeName(e.target.value) })}
                  placeholder="Letters only, e.g. Anita Sharma"
                  required
                />
              </label>
              {form.name.trim().length >= 2 && NAME_REGEX.test(form.name.trim()) && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="font-bold">✓</span> Printed on your 80G tax certificate
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-teal-900">
                Email address *
                <input
                  className={`${inputCls} mt-1`}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  required
                />
              </label>
              {EMAIL_REGEX.test(form.email.trim()) && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="font-bold">✓</span> Instant 80G PDF receipt will be sent here
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-teal-900">
                WhatsApp / Mobile Phone{" "}
                <span className="font-normal text-teal-900/50">(optional for updates)</span>
                <input
                  className={`${inputCls} mt-1`}
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="10-digit number e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: sanitizeNumeric(e.target.value).slice(0, 15) })}
                />
              </label>
              {form.phone.length === 10 && /^[6-9]\d{9}$/.test(form.phone) && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="font-bold">✓</span> 10-digit mobile confirmed for photo & video updates
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-teal-900">
                PAN Number{" "}
                <span className="font-normal text-teal-900/50">(optional, for official 80G tax receipt)</span>
                <input
                  className={`${inputCls} mt-1 uppercase font-mono`}
                  maxLength={10}
                  placeholder="10-character PAN e.g. ABCDE1234F"
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: sanitizePan(e.target.value) })}
                />
              </label>
              {form.pan.length === 10 && PAN_REGEX.test(form.pan) ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="font-bold">✓</span> Valid 80G tax exemption format confirmed
                </p>
              ) : form.pan.length > 0 && form.pan.length < 10 ? (
                <p className="mt-1 text-[11px] text-amber-800">
                  {10 - form.pan.length} more characters needed (e.g. ABCDE1234F)
                </p>
              ) : null}
            </div>

            {/* Anonymous preference */}
            <label className="flex items-start gap-3 rounded-2xl bg-cream p-3 text-sm text-teal-900 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded accent-teal-800"
                checked={form.anonymous}
                onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
              />
              <span>
                <strong>Keep my contribution anonymous:</strong> Do not display my name on the public Live Impact Wall or campaign pages.
              </span>
            </label>
          </div>
        </div>

        {/* Occasion / Dedication Block (GiveA-Style Feature) */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-teal-900">
                Dedicate this impact (Optional)
              </h2>
              <p className="text-xs text-teal-950/60 mt-0.5">
                Celebrate a birthday, anniversary, or dedicate this in memory of someone dear.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDedicationEnabled(!dedicationEnabled)}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                dedicationEnabled
                  ? "bg-saffron text-white"
                  : "bg-cream text-teal-900 border border-teal-900/15"
              }`}
            >
              {dedicationEnabled ? "Dedication Active ✓" : "+ Add Dedication"}
            </button>
          </div>

          {dedicationEnabled && (
            <div className="mt-4 space-y-3 pt-3 border-t border-teal-900/10">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-1.5">
                  Occasion Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {OCCASION_CHOICES.map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setDedication({ ...dedication, occasion: occ })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        dedication.occasion === occ
                          ? "bg-teal-900 text-white"
                          : "bg-cream text-teal-900 hover:bg-sand"
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70">
                  Honoree or Person&apos;s Name
                </label>
                <input
                  className={`${inputCls} mt-1`}
                  placeholder="e.g. Arjun, or Late Shri R. Sharma"
                  value={dedication.name}
                  onChange={(e) => setDedication({ ...dedication, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70">
                  Dedication Message (will appear on receipt & impact certificate)
                </label>
                <textarea
                  rows={2}
                  className={`${inputCls} mt-1 text-sm`}
                  placeholder="e.g. Wishing you boundless joy and health on your special day."
                  value={dedication.message}
                  onChange={(e) => setDedication({ ...dedication, message: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Delivery & Updates Consent (WhatsApp / Email) */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
          <h2 className="font-display text-lg font-bold text-teal-900">
            Receipt & Impact Proof Delivery
          </h2>
          <p className="mt-0.5 text-xs text-teal-950/60">
            Where would you like to receive your verified receipt and genuine impact reports?
          </p>
          <p className="mt-1 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
            <span>✓</span> Official 80G Tax Receipt (Form 10AC) &amp; meal proof video sent to your WhatsApp &amp; Email
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { id: "email", label: "Email only" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "both", label: "Both" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDeliveryPreference(p.id as typeof deliveryPreference)}
                className={`py-2 px-3 rounded-2xl text-xs font-bold text-center border transition ${
                  deliveryPreference === p.id
                    ? "bg-teal-900 text-white border-teal-900"
                    : "bg-cream text-teal-900 border-teal-900/15 hover:bg-sand"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="mt-3 flex items-start gap-2.5 text-xs text-teal-900/80 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded accent-teal-800"
              checked={updateConsent}
              onChange={(e) => setUpdateConsent(e.target.checked)}
            />
            <span>
              I wish to receive transparent updates when Janaseva Ashrama publishes verified outcome photos and reports. (Zero marketing spam).
            </span>
          </label>
        </div>

        {/* Error / Failure Banner with Graceful Recovery */}
        {error && (
          <div role="alert" className="rounded-3xl bg-red-50 p-5 ring-1 ring-red-200">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-sm text-red-900">
                  {paymentFailed ? "Payment Incomplete - No Amount Deducted" : "Attention"}
                </h3>
                <p className="mt-1 text-xs text-red-800 leading-relaxed">{error}</p>
                {paymentFailed && (
                  <p className="mt-2 text-xs text-red-700">
                    If an amount was debited by your UPI provider, it will be automatically reversed by your bank within 24-48 hours.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => submit()}
                    disabled={busy}
                    className="rounded-xl bg-red-700 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-red-800 disabled:opacity-50"
                  >
                    Retry Payment
                  </button>
                  <Link
                    href="/impact"
                    className="rounded-xl border border-red-300 px-4 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100"
                  >
                    Review Items
                  </Link>
                  <a
                    href="tel:9980359595"
                    className="text-xs font-bold text-red-900 underline ml-2"
                  >
                    Help: +91 9980359595
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Right Column Summary */}
      <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 lg:sticky lg:top-20">
        <h2 className="font-display text-xl font-bold text-teal-900">Your Impact Summary</h2>

        {cart.campaign && (
          <p className="mt-2 rounded-xl bg-saffron/10 px-3 py-2 text-xs font-semibold text-saffron-dark">
            Supporting: {cart.campaign.title}
          </p>
        )}

        {dedicationEnabled && dedication.name && (
          <div className="mt-2 rounded-xl bg-teal-50 px-3 py-2 text-xs text-teal-900 border border-teal-900/10">
            <span className="font-bold text-saffron-dark">{dedication.occasion}:</span> {dedication.name}
          </div>
        )}

        <ul className="mt-3 space-y-2 font-mono text-sm">
          {cart.lines.map((l) => (
            <li key={l.item.slug} className="flex justify-between gap-3">
              <span>{l.item.name.replace(" Support", "")} × {l.qty}</span>
              <span>{formatINR(l.subtotal)}</span>
            </li>
          ))}
          {cart.custom > 0 && (
            <li className="flex justify-between">
              <span>Your own contribution</span>
              <span>{formatINR(cart.custom)}</span>
            </li>
          )}
        </ul>

        <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-teal-900/20 pt-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Total</span>
          <span className="font-display text-3xl font-bold text-teal-900">{formatINR(cart.total)}</span>
        </div>

        <button
          disabled={busy}
          type="submit"
          className="focus-ring mt-4 w-full rounded-xl bg-saffron px-6 py-4 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-saffron-dark disabled:opacity-60"
        >
          {busy ? "Processing secure payment…" : `PAY ${formatINR(cart.total)} SECURELY`}
        </button>

        <Link
          href="/impact"
          className="mt-3 block text-center text-xs font-semibold text-teal-800 underline"
        >
          ← Edit impact basket
        </Link>

        <div className="mt-4 space-y-2 border-t border-teal-900/10 pt-3 text-xs text-teal-950/60 text-center">
          <p className="flex items-center justify-center gap-1.5 font-semibold text-teal-900">
            <svg className="h-4 w-4 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Instant UPI (GPay, PhonePe, Paytm, BHIM) &amp; Cards</span>
          </p>
          <p className="font-semibold text-emerald-800 text-[11px]">
            ✓ Form 10AC Provisional 80G Tax Deductible (URN: AABTJ7431MF20231)
          </p>
          <p>
            Zero platform commission deducted. Amounts are verified directly on our server.
          </p>
        </div>

        {demoNote && (
          <p className="mt-2 text-xs font-semibold text-saffron-dark text-center">
            Demo environment: Simulated payment verification.
          </p>
        )}
      </aside>

      {/* Mobile Sticky Bar */}
      <div className="fixed inset-x-3 bottom-[calc(4.8rem+env(safe-area-inset-bottom))] z-30 rounded-2xl bg-white/95 p-2.5 shadow-2xl ring-1 ring-teal-900/10 backdrop-blur lg:hidden no-print">
        <button
          disabled={busy}
          type="submit"
          className="focus-ring flex w-full items-center justify-between rounded-xl bg-saffron px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60 shadow-md"
        >
          <span>{busy ? "Please wait…" : "PAY SECURELY"}</span>
          <span>{formatINR(cart.total)}</span>
        </button>
      </div>

      <ValidationErrorModal
        isOpen={validationModalOpen}
        message={validationModalMessage}
        onClose={() => setValidationModalOpen(false)}
      />
    </form>
  );
}
