"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatINR, FORM_10AC, SITE } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import { trackDonationSuccess } from "@/lib/tracking";

export function ThankYouClient() {
  const searchParams = useSearchParams();

  const rawAmount = searchParams.get("amount");
  const paymentId = searchParams.get("payment_id") || "";
  const orderId = searchParams.get("order_id") || "";
  const subscriptionId = searchParams.get("subscription_id") || "";
  const freq = searchParams.get("freq") || "";
  const callerRef = searchParams.get("ref") || "";
  const receiptId = searchParams.get("receipt_id") || "";
  const isDemo = searchParams.get("demo") === "true";

  const amount = rawAmount ? parseFloat(rawAmount) : 1000;
  const [copiedLink, setCopiedLink] = useState(false);

  // Trigger fallback conversion tracking on page mount (with deduplication protection)
  useEffect(() => {
    if (amount > 0) {
      trackDonationSuccess({
        amount,
        paymentId: paymentId || undefined,
        orderId: orderId || undefined,
        callerRef: callerRef || undefined,
        receiptId: receiptId || undefined,
      });
    }
  }, [amount, paymentId, orderId, callerRef, receiptId]);

  const shareText = `I just made a donation of ${formatINR(
    amount,
  )} to sponsor nutritious meals and education for 25 resident orphaned boys at Janaseva Ashrama Bangalore. 100% 80G Tax Deductible (Form 10AC). Celebrate your special day with them too: ${
    SITE.url
  }/donate${callerRef ? `?ref=${callerRef}` : ""}`;

  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = () => {
    const donateUrl = `${SITE.url}/donate${callerRef ? `?ref=${callerRef}` : ""}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(donateUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* ── Top Auspicious Celebration Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950 p-6 sm:p-10 text-white shadow-2xl text-center border border-gold/20">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex justify-center mb-4">
            <LogoMark size={64} className="shadow-lg ring-4 ring-gold/40" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 border border-gold/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-gold mb-3">
            <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
            Donation Received &amp; Verified
          </span>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-gold">
            Dhanyavadagalu! 🙏
          </h1>

          <p className="mt-2 text-base sm:text-lg text-emerald-100/90 max-w-lg font-medium leading-relaxed">
            Your generous contribution of{" "}
            <strong className="text-white font-black underline decoration-gold underline-offset-4">
              {formatINR(amount)}
            </strong>{" "}
            has been received with immense gratitude for the 25 resident boys at
            Janaseva Ashrama Bangalore.
          </p>

          {/* Recurring Mandate Badge */}
          {(subscriptionId || (freq && freq !== "onetime")) && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-amber-400/20 px-4 py-1.5 text-xs text-amber-200 backdrop-blur-sm border border-amber-300/40 font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {freq.toUpperCase()} Autopay Mandate Active · Instant 80G on every debit
              </span>
            </div>
          )}

          {/* Telecaller Attribution Badge */}
          {callerRef && callerRef !== "DIRECT" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-1.5 text-xs text-white backdrop-blur-sm border border-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>
                Care Advisor Ref: <strong>{callerRef}</strong> (Attributed)
              </span>
            </div>
          )}

          {isDemo && (
            <div className="mt-4 rounded-xl bg-amber-500/20 border border-amber-400/40 px-4 py-1.5 text-xs font-bold text-amber-200">
              Sandbox Demo Contribution — Test Gateway Mode
            </div>
          )}
        </div>
      </div>

      {/* ── Transaction Details & Receipt Summary ── */}
      <div className="mt-6 rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-teal-900/10">
        <h2 className="text-xs font-black uppercase tracking-wider text-teal-900/60 mb-4">
          Transaction Confirmation
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-2xl bg-cream/30 p-3.5 border border-teal-900/10">
            <p className="text-teal-950/60 font-medium">Contribution Amount</p>
            <p className="text-lg font-bold text-teal-950 mt-0.5">
              {formatINR(amount)}
            </p>
          </div>

          <div className="rounded-2xl bg-cream/30 p-3.5 border border-teal-900/10">
            <p className="text-teal-950/60 font-medium">Payment Gateway Status</p>
            <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Razorpay Secured &amp; Captured
            </p>
          </div>

          {paymentId && (
            <div className="rounded-2xl bg-cream/30 p-3.5 border border-teal-900/10 sm:col-span-2">
              <p className="text-teal-950/60 font-medium">Payment Reference ID</p>
              <p className="text-xs font-mono font-bold text-teal-950 mt-0.5 break-all">
                {paymentId}
              </p>
            </div>
          )}

          {orderId && (
            <div className="rounded-2xl bg-cream/30 p-3.5 border border-teal-900/10 sm:col-span-2">
              <p className="text-teal-950/60 font-medium">Gateway Order ID</p>
              <p className="text-xs font-mono text-teal-950/80 mt-0.5 break-all">
                {orderId}
              </p>
            </div>
          )}

          {(subscriptionId || (freq && freq !== "onetime")) && (
            <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 sm:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-amber-950 font-bold text-xs">Giving Cadence &amp; Mandate Status</p>
                <span className="rounded bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5">
                  Mandate Active
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1">
                Cadence: <strong>{freq.charAt(0).toUpperCase() + freq.slice(1)} Recurring Punya</strong>
                {subscriptionId && <> · Mandate ID: <code className="font-mono text-[11px]">{subscriptionId}</code></>}
              </p>
              <p className="text-[11px] text-amber-900/75 mt-1 font-medium">
                🛡️ You are in complete control. You can pause or cancel your autopayment anytime in 1 click or by messaging WhatsApp (+91 99803 59595).
              </p>
            </div>
          )}
        </div>

        {/* ── Section 80G Tax Exemption Note ── */}
        <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white font-bold text-sm">
              80G
            </div>
            <div className="text-xs text-emerald-950 leading-relaxed">
              <p className="font-bold text-emerald-900 text-sm">
                100% Section 80G Tax Exemption
              </p>
              <p className="mt-1 text-emerald-800">
                Government of India Form 10AC Provisional Approval:{" "}
                <span className="font-mono font-bold">{FORM_10AC.urn}</span>{" "}
                (Reg: {SITE.urn}). Your digital 80G tax receipt has been generated and
                dispatched to your registered WhatsApp &amp; Email.
              </p>
            </div>
          </div>

          {receiptId && (
            <div className="mt-4 pt-3 border-t border-emerald-200">
              <Link
                href={`/receipt/${encodeURIComponent(receiptId)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
              >
                View &amp; Print Official Tax Receipt ↗
              </Link>
            </div>
          )}
        </div>

        {/* ── Morning Prayer Dedication Note ── */}
        <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 p-4 text-xs text-amber-950 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span>✨</span> Morning Prayer Dedication
          </div>
          <p className="mt-1 text-amber-900/80">
            Every morning at 6:30 AM, all 25 boys and elders gather for prayer in
            the campus hall. They will chant prayers for your family&apos;s peace,
            health, and prosperity.
          </p>
        </div>
      </div>

      {/* ── WhatsApp Sharing & Viral Impact ── */}
      <div className="mt-6 rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-teal-900/10 text-center">
        <h3 className="font-display text-lg font-bold text-teal-950">
          Share Your Auspicious Act with Loved Ones
        </h3>
        <p className="mt-1 text-xs text-teal-950/70 max-w-md mx-auto">
          Inspire your friends and family to dedicate meals or celebrate birthdays
          with 25 resident boys in Turahalli Bangalore.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 shadow-md hover:shadow-lg transition active:scale-95"
          >
            <svg
              className="h-4 w-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            Share on WhatsApp
          </a>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-2xl bg-sand/60 hover:bg-sand text-teal-950 font-bold text-xs px-5 py-3 border border-teal-900/10 transition active:scale-95"
          >
            {copiedLink ? "✓ Copied to Clipboard!" : "📋 Copy Donation Link"}
          </button>
        </div>
      </div>

      {/* ── Actions & Navigation ── */}
      <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
        <Link
          href={`/donate${callerRef ? `?ref=${callerRef}` : ""}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-teal-900 hover:text-teal-950 underline underline-offset-4"
        >
          ← Make Another Dedication
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-teal-950 hover:bg-teal-900 text-gold font-bold text-xs px-5 py-2.5 transition shadow"
        >
          Return to Ashrama Home →
        </Link>
      </div>
    </div>
  );
}
