"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";
import { isEmail } from "@/lib/server-utils";

type PaymentRecord = {
  id: number;
  publicId: string;
  receiptNo: string | null;
  amount: number;
  status: string;
  paidAt: string | null;
  recurringCycle: number | null;
};

type SubscriptionRecord = {
  publicId: string;
  status: string;
  mandateStatus: string;
  amount: number;
  currency: string;
  frequency: string;
  donorName: string;
  donorEmail: string;
  chargeCount: number;
  currentCycle: number;
  totalCycles: number;
  nextChargeAt: string | null;
  lastPaymentAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  payments: PaymentRecord[];
};

export function MyImpactClient({ initialPublicId }: { initialPublicId?: string }) {
  const [activeTab, setActiveTab] = useState<"single" | "recurring">("recurring");
  const [receiptQuery, setReceiptQuery] = useState(initialPublicId || "");
  const [donorEmailOrSub, setDonorEmailOrSub] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [searched, setSearched] = useState(false);

  // Cancellation State
  const [cancelModalSub, setCancelModalSub] = useState<SubscriptionRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleLookupSubscriptions = async (e: FormEvent) => {
    e.preventDefault();
    const q = donorEmailOrSub.trim();
    if (!q) {
      setError("Please enter your donor email address or subscription reference ID.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const isMail = isEmail(q.toLowerCase());
      const queryParam = isMail ? `email=${encodeURIComponent(q.toLowerCase())}` : `publicId=${encodeURIComponent(q)}`;
      const res = await fetch(`/api/subscriptions/status?${queryParam}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lookup failed.");
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      setError(err.message);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalSub) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: cancelModalSub.publicId,
          reason: cancelReason || "Cancelled by donor via My Impact dashboard",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed.");

      // Update state locally
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.publicId === cancelModalSub.publicId
            ? { ...s, status: "cancelled", mandateStatus: "cancelled", cancelledAt: new Date().toISOString() }
            : s,
        ),
      );
      setCancelModalSub(null);
      setCancelReason("");
    } catch (err: any) {
      alert("Could not cancel auto-pay: " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-teal-900/10 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("recurring")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "recurring"
              ? "bg-teal-900 text-white shadow-sm"
              : "text-teal-950/70 hover:bg-cream"
          }`}
        >
          <span>🔁 Monthly Auto-Pay Mandates</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("single")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "single"
              ? "bg-teal-900 text-white shadow-sm"
              : "text-teal-950/70 hover:bg-cream"
          }`}
        >
          <span>🧾 One-Time Receipt Lookup</span>
        </button>
      </div>

      {/* TAB 1: RECURRING SUBSCRIPTION MANAGEMENT */}
      {activeTab === "recurring" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-teal-900/10 shadow-sm">
            <h2 className="font-display text-xl font-bold text-teal-950">
              Manage Your Monthly Support &amp; Receipts
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-teal-950/70">
              Enter your registered donor email or subscription reference to view active auto-pay mandates, track debit history, and download official 80G receipts.
            </p>

            <form onSubmit={handleLookupSubscriptions} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={donorEmailOrSub}
                onChange={(e) => setDonorEmailOrSub(e.target.value)}
                placeholder="Enter email e.g. donor@example.com or sub_..."
                className="flex-1 rounded-2xl border border-teal-900/15 px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-saffron px-6 py-3 text-sm font-bold text-white transition hover:bg-saffron-dark disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Searching…" : "View My Mandates →"}
              </button>
            </form>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-xs text-red-800 border border-red-200">
                {error}
              </div>
            )}
          </div>

          {/* RESULTS LIST */}
          {searched && subscriptions.length === 0 && !loading && (
            <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-teal-900/10">
              <div className="text-3xl">🕊️</div>
              <h3 className="mt-2 font-display text-lg font-bold text-teal-950">No Recurring Mandates Found</h3>
              <p className="mt-1 text-xs text-teal-950/65 max-w-md mx-auto">
                No active or past monthly auto-pay subscriptions matched this entry. Please verify your email or contact our support team.
              </p>
              <Link
                href="/recurring-giving"
                className="mt-4 inline-block rounded-xl bg-teal-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-950"
              >
                + Start Monthly Giving (₹100+)
              </Link>
            </div>
          )}

          {subscriptions.map((sub) => {
            const isActive = sub.status === "active";
            const isCancelled = sub.status === "cancelled";
            const isHalted = sub.status === "halted";

            return (
              <div key={sub.publicId} className="rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-teal-900/10 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-900/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : isCancelled
                            ? "bg-gray-100 text-gray-700"
                            : isHalted
                            ? "bg-amber-100 text-amber-800"
                            : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        ● {sub.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-teal-950/60">{sub.publicId}</span>
                    </div>
                    <h3 className="mt-1 font-display text-xl font-bold text-teal-950">
                      {formatINR(sub.amount)} / month
                    </h3>
                    <p className="text-xs text-teal-950/70">
                      Donor: <strong>{sub.donorName}</strong> ({sub.donorEmail})
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 text-xs">
                    {sub.nextChargeAt && isActive && (
                      <span className="font-semibold text-emerald-800">
                        Next Scheduled Debit:{" "}
                        <strong>{new Date(sub.nextChargeAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</strong>
                      </span>
                    )}
                    <span className="text-teal-950/70">
                      Completed Debits: <strong>{sub.chargeCount} cycles</strong>
                    </span>
                    {isActive && (
                      <button
                        type="button"
                        onClick={() => setCancelModalSub(sub)}
                        className="mt-1 text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                      >
                        Cancel Auto-Pay Mandate ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Monthly Payment Receipts */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900/80 mb-2">
                    Official 80G Tax Receipts ({sub.payments.length})
                  </h4>

                  {sub.payments.length === 0 ? (
                    <p className="text-xs text-teal-950/60 italic bg-cream/50 p-3 rounded-xl">
                      First monthly deduction is being processed. Official 80G receipt will appear here right after confirmation.
                    </p>
                  ) : (
                    <div className="divide-y divide-teal-900/10 border border-teal-900/10 rounded-2xl overflow-hidden">
                      {sub.payments.map((p) => (
                        <div key={p.publicId} className="p-3 sm:p-4 bg-white flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-teal-950 font-mono">
                              {p.receiptNo || "Receipt Pending"}
                            </span>
                            <span className="block text-[11px] text-teal-950/60 mt-0.5">
                              Cycle #{p.recurringCycle || 1} · {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "Processed"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-display font-bold text-sm text-teal-950">
                              {formatINR(p.amount)}
                            </span>
                            <Link
                              href={`/receipt/${p.publicId}`}
                              className="rounded-xl bg-teal-900/10 px-3 py-1.5 font-bold text-teal-900 hover:bg-teal-900 hover:text-white transition"
                            >
                              Download 80G PDF ↓
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SINGLE CONTRIBUTION LOOKUP */}
      {activeTab === "single" && (
        <div className="rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-teal-900/10 shadow-sm">
          <h2 className="font-display text-xl font-bold text-teal-950">
            One-Time Donation Receipt Lookup
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-teal-950/70">
            Enter your public reference ID (e.g. from SMS, WhatsApp, or confirmation email) to view your verified 80G certificate.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (receiptQuery.trim()) {
                window.location.href = `/receipt/${encodeURIComponent(receiptQuery.trim())}`;
              }
            }}
            className="mt-4 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={receiptQuery}
              onChange={(e) => setReceiptQuery(e.target.value)}
              placeholder="e.g. rec_abc123 or donation public reference"
              className="flex-1 rounded-2xl border border-teal-900/15 px-4 py-3 text-sm font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
              required
            />
            <button
              type="submit"
              className="rounded-2xl bg-teal-900 px-6 py-3 text-sm font-bold text-white hover:bg-teal-950 transition cursor-pointer"
            >
              Open Receipt →
            </button>
          </form>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/15 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <span>⚠️</span>
              <span>Cancel Monthly Auto-Pay</span>
            </div>
            <h3 className="font-display text-lg font-bold text-teal-950">
              Are you sure you want to stop your monthly support of {formatINR(cancelModalSub.amount)}?
            </h3>
            <p className="text-xs text-teal-950/75 leading-relaxed">
              Your recurring debit mandate with Razorpay will be cancelled immediately. No further deductions will take place. All past receipts remain safely archived.
            </p>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Temporary financial pause, changing card, etc."
                className="w-full rounded-xl border border-teal-900/15 p-2.5 text-xs text-teal-950 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalSub(null)}
                disabled={cancelling}
                className="rounded-xl px-4 py-2 text-xs font-bold text-teal-900 hover:bg-cream"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Yes, Cancel Mandate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
