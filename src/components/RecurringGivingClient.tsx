"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { validateName, validateEmail, validatePhone, validatePan, sanitizePan } from "@/lib/validation";
import { ValidationErrorModal } from "@/components/ValidationErrorModal";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";

function cleanIndianMobile(val: string): string {
  let digits = val.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function RecurringGivingClient() {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(500);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pan, setPan] = useState("");
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [valModalOpen, setValModalOpen] = useState(false);
  const [valModalMsg, setValModalMsg] = useState("");

  const activeAmount = isCustom && Number(customInput) > 0 ? Number(customInput) : amount;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (activeAmount < 50) {
      setValModalMsg("Please select or enter a monthly amount of at least ₹50.");
      setValModalOpen(true);
      return;
    }

    const nameCheck = validateName(name, "Full name");
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

    const phoneCheck = validatePhone(phone, true, "Mobile phone number");
    if (!phoneCheck.valid) {
      setValModalMsg(phoneCheck.error!);
      setValModalOpen(true);
      return;
    }

    if (pan.trim()) {
      const panCheck = validatePan(pan, false);
      if (!panCheck.valid) {
        setValModalMsg(panCheck.error!);
        setValModalOpen(true);
        return;
      }
    }

    if (!consent) {
      setValModalMsg("Please check the explicit mandate consent to authorize recurring monthly debits.");
      setValModalOpen(true);
      return;
    }

    setLoading(true);
    track("recurring_giving_page_submit", { amount: activeAmount });

    const key = "sub_page_" + crypto.randomUUID() + "-" + Date.now().toString(36);

    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone,
            pan: pan.trim().toUpperCase() || undefined,
          },
          amount: activeAmount,
          idempotencyKey: key,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create monthly subscription.");

      if (data.mode === "demo") {
        router.push(`/my-impact?publicId=${data.publicId}`);
        return;
      }

      const ok = await loadRazorpay();
      if (!ok || !(window as any).Razorpay) {
        throw new Error("Could not load the Razorpay payment gateway.");
      }

      const rz = new (window as any).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Janaseva Ashrama",
        description: `Monthly Child Care Auto-Pay: ₹${data.amount}/month`,
        prefill: { name, email, contact: phone },
        theme: { color: "#06312f" },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (r: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const v = await fetch("/api/subscriptions/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publicId: data.publicId, ...r }),
            });
            const vd = await v.json();
            if (!v.ok) throw new Error(vd.error || "Verification failed.");
            router.push(`/receipt/${vd.donationPublicId || data.publicId}`);
          } catch (err: any) {
            setError(err.message);
            setLoading(false);
          }
        },
      });

      rz.on("payment.failed", () => {
        setError("Your mandate authorization was not completed. No amount has been debited.");
        setLoading(false);
      });

      rz.open();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-teal-900/10 shadow-lg">
        <div className="mb-4">
          <span className="inline-block rounded-full bg-saffron/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-saffron-dark mb-2">
            🔁 Razorpay Monthly Auto-Pay
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-950">
            Set Up Monthly Sustained Support
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-teal-950/70">
            Automate monthly care for 25 boys with 80G tax benefits. Cancel anytime with 1 click.
          </p>
        </div>

        {/* Amount Selector: ₹100 / ₹300 / ₹500 / ₹1,000 / Custom */}
        <label className="block text-xs font-bold text-teal-900/80 mb-2">
          Select Monthly Donation Amount:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { val: 100, label: "₹100/mo", sub: "Daily Milk" },
            { val: 300, label: "₹300/mo", sub: "Breakfasts" },
            { val: 500, label: "₹500/mo", sub: "Hot Meals", pop: true },
            { val: 1000, label: "₹1,000/mo", sub: "Vidya Kit" },
          ].map((item) => (
            <button
              type="button"
              key={item.val}
              onClick={() => {
                setAmount(item.val);
                setIsCustom(false);
              }}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                !isCustom && amount === item.val
                  ? "border-saffron bg-saffron/10 ring-2 ring-saffron"
                  : "border-teal-900/10 hover:border-teal-900/30 bg-cream/40"
              }`}
            >
              {item.pop && (
                <span className="absolute -top-2 right-2 rounded-full bg-emerald-700 px-1.5 py-0.2 text-[8px] font-black uppercase text-white">
                  Popular
                </span>
              )}
              <span className="font-bold text-teal-950 text-sm block">{item.label}</span>
              <span className="text-[10px] text-teal-950/60 block mt-0.5">{item.sub}</span>
            </button>
          ))}
        </div>

        {/* Custom Monthly Amount Toggle */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsCustom(!isCustom)}
            className="text-xs font-bold text-teal-900 hover:text-saffron transition underline cursor-pointer"
          >
            {isCustom ? "← Choose from presets" : "Or enter custom monthly amount →"}
          </button>
          {isCustom && (
            <div className="mt-2 relative animate-in fade-in">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-teal-900/60 font-mono">
                ₹
              </span>
              <input
                type="number"
                min={50}
                max={100000}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter custom amount (min ₹50)"
                className="w-full rounded-2xl border border-teal-900/15 pl-8 pr-4 py-2.5 text-sm font-bold text-teal-950 outline-none focus:ring-2 focus:ring-saffron"
              />
            </div>
          )}
        </div>

        {/* Reassurance Callout */}
        <div className="mt-4 rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-950 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Monthly Auto-Pay: {formatINR(activeAmount)} per month</span>
          </p>
          <p className="text-[11px] text-amber-900/80 leading-relaxed">
            Automatic collection via UPI AutoPay, Cards or NetBanking. You receive an official 80G tax receipt on email after every debit.
          </p>
        </div>

        {/* Donor Form Details */}
        <div className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Your Full Name *</label>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ""))}
              placeholder="e.g. Ramesh Kumar"
              className="w-full rounded-2xl border border-teal-900/15 px-4 py-2.5 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Email Address (for 80G receipts) *</label>
            <input
              name="email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh@example.com"
              className="w-full rounded-2xl border border-teal-900/15 px-4 py-2.5 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/80 mb-1">Mobile / WhatsApp Number *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-900/60 font-mono">
                +91
              </span>
              <input
                name="phone"
                required
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(cleanIndianMobile(e.target.value))}
                placeholder="9876543210"
                className="w-full rounded-2xl border border-teal-900/15 pl-12 pr-4 py-2.5 text-sm font-mono font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/80 mb-1">
              PAN Card (Optional · for Section 80G 50% Tax Deduction)
            </label>
            <input
              name="pan"
              maxLength={10}
              value={pan}
              onChange={(e) => setPan(sanitizePan(e.target.value))}
              placeholder="e.g. ABCDE1234F"
              className="w-full rounded-2xl border border-teal-900/15 px-4 py-2.5 text-sm font-mono uppercase font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          {/* Explicit Mandate Consent */}
          <label className="flex items-start gap-2.5 pt-2 text-xs text-teal-950 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-saffron"
            />
            <span>
              <strong>Mandate Authorization:</strong> I authorize Janaseva Ashrama to debit{" "}
              <strong>{formatINR(activeAmount)}/month</strong>. I understand I can pause or cancel anytime with 1-click in the donor dashboard.
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-saffron to-amber-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60 cursor-pointer active:scale-95"
        >
          {loading ? "Setting up Auto-Pay…" : `SET UP MONTHLY AUTO-PAY (${formatINR(activeAmount)}/MO) 🔁`}
        </button>

        <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-teal-950/65">
          <span>✓ 1-Click Cancel Anytime</span>
          <span>✓ Form 10AC 80G Receipt</span>
          <span>✓ 100% Direct Child Care</span>
        </div>
      </form>

      <ValidationErrorModal
        isOpen={valModalOpen}
        title="Please Review"
        message={valModalMsg}
        onClose={() => setValModalOpen(false)}
      />
    </>
  );
}
