"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";

type Subscription = {
  id: number;
  publicId: string;
  status: string;
  mode: string;
  amount: number;
  currency: string;
  frequency: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string | null;
  donorPan: string | null;
  mandateStatus: string;
  currentCycle: number;
  totalCycles: number;
  chargeCount: number;
  nextChargeAt: string | null;
  lastPaymentId: string | null;
  lastPaymentAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
};

type RecurringCharge = {
  id: number;
  publicId: string;
  receiptNo: string | null;
  amount: number;
  donorName: string;
  donorEmail: string;
  subscriptionId: number;
  recurringCycle: number | null;
  razorpayPaymentId: string | null;
  paidAt: string | null;
};

type Metrics = {
  total: number;
  active: number;
  pending: number;
  halted: number;
  cancelled: number;
  mrr: number;
  recentChargesCount: number;
};

export function AdminSubscriptionsTab() {
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    active: 0,
    pending: 0,
    halted: 0,
    cancelled: 0,
    mrr: 0,
    recentChargesCount: 0,
  });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [charges, setCharges] = useState<RecurringCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSubView, setActiveSubView] = useState<Subscription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const q = encodeURIComponent(searchQuery.trim());
      const res = await fetch(`/api/admin/subscriptions?status=${filterStatus}&q=${q}`);
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics || {});
        setSubscriptions(data.subscriptions || []);
        setCharges(data.recentCharges || []);
      }
    } catch (e) {
      console.error("Failed to load subscriptions", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchQuery]);

  async function handleCancelSubscription(sub: Subscription) {
    if (!confirm(`Are you sure you want to cancel the recurring auto-pay mandate for ${sub.donorName} (${formatINR(sub.amount)}/month)?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", publicId: sub.publicId }),
      });
      if (res.ok) {
        await loadData();
        if (activeSubView?.publicId === sub.publicId) {
          setActiveSubView(null);
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to cancel subscription");
      }
    } catch {
      alert("Network error cancelling subscription");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-saffron/20 px-2.5 py-0.5 text-xs font-bold text-saffron-dark uppercase tracking-wider mb-1">
            <span>FinTech Recurring Giving Hub</span>
          </div>
          <h3 className="font-display text-xl font-bold text-teal-950">
            Razorpay Monthly Auto-Pay &amp; Mandate Subscriptions
          </h3>
          <p className="text-xs text-teal-950/65">
            Monitor monthly recurring donors, recurring revenue (MRR), gateway collection statuses, and individual 80G tax receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="rounded-xl border border-teal-900/15 bg-white px-3.5 py-2 text-xs font-bold text-teal-900 hover:bg-cream transition flex items-center gap-1.5 self-start cursor-pointer"
        >
          <span>🔄</span>
          <span>{loading ? "Refreshing..." : "Refresh Subscriptions"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950 to-teal-900 p-4 text-white shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
            Monthly Recurring Revenue (MRR)
          </span>
          <div className="mt-1 font-display text-2xl font-black text-white">
            {formatINR(metrics.mrr || 0)}
          </div>
          <span className="text-[10px] text-white/70 block mt-0.5">
            Predictable continuous monthly care
          </span>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-950/60">
            Active Mandates
          </span>
          <div className="mt-1 font-display text-2xl font-bold text-emerald-700">
            {metrics.active || 0}
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
            Recurring monthly debits live
          </span>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-950/60">
            Pending Mandates
          </span>
          <div className="mt-1 font-display text-2xl font-bold text-amber-600">
            {metrics.pending || 0}
          </div>
          <span className="text-[10px] text-amber-800 block mt-0.5">
            Awaiting bank mandate authorization
          </span>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-950/60">
            Halted / Failed
          </span>
          <div className="mt-1 font-display text-2xl font-bold text-red-600">
            {metrics.halted || 0}
          </div>
          <span className="text-[10px] text-red-700 block mt-0.5">
            Card expired / insufficient funds
          </span>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-950/60">
            Cancelled
          </span>
          <div className="mt-1 font-display text-2xl font-bold text-gray-700">
            {metrics.cancelled || 0}
          </div>
          <span className="text-[10px] text-gray-500 block mt-0.5">
            Donor requested stop
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl ring-1 ring-teal-900/10 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Mandates" },
            { id: "active", label: "Active (Live)" },
            { id: "pending", label: "Pending Setup" },
            { id: "halted", label: "Halted / Retrying" },
            { id: "cancelled", label: "Cancelled" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilterStatus(st.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterStatus === st.id
                  ? "bg-teal-900 text-white shadow-2xs"
                  : "bg-cream text-teal-950 hover:bg-sand"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search donor, email, ID..."
            className="w-full rounded-xl border border-teal-900/15 bg-cream/50 px-3 py-1.5 text-xs font-medium text-teal-950 outline-none focus:ring-2 focus:ring-saffron"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-teal-950/40 hover:text-teal-950"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-teal-900/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-base font-bold text-teal-950">
            Registered Recurring Mandates ({subscriptions.length})
          </h4>
          <span className="text-xs text-teal-950/60">
            Real-time webhook and gateway synchronized
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-teal-950/60">
            Loading subscription mandates…
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-12 text-center text-xs text-teal-950/60">
            No subscription mandates found matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-teal-900/10 text-teal-950/60 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Donor Name</th>
                  <th className="py-2.5">Monthly Amount</th>
                  <th className="py-2.5">Contact / Email</th>
                  <th className="py-2.5">Debits</th>
                  <th className="py-2.5">Next Charge</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {subscriptions.map((sub) => {
                  const isActive = sub.status === "active";
                  const isCancelled = sub.status === "cancelled";
                  const isHalted = sub.status === "halted";

                  return (
                    <tr key={sub.id} className="hover:bg-cream/40">
                      <td className="py-3 text-teal-950/70 font-mono text-[11px]">
                        {new Date(sub.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-teal-950 block">{sub.donorName}</span>
                        {sub.donorPan && (
                          <span className="font-mono text-[10px] text-teal-800 font-bold">
                            PAN: {sub.donorPan}
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-bold text-teal-900 text-sm">
                        <div>{formatINR(sub.amount)} / mo</div>
                        <span className="rounded bg-teal-900/10 px-1 py-0.2 text-[9px] font-mono text-teal-950 uppercase font-semibold">
                          {sub.mode}
                        </span>
                      </td>
                      <td className="py-3 text-teal-950/70">
                        <span className="block truncate max-w-[160px]">{sub.donorEmail}</span>
                        {sub.donorPhone && <span className="text-[11px] font-mono">{sub.donorPhone}</span>}
                      </td>
                      <td className="py-3 text-teal-950 font-bold">
                        {sub.chargeCount} / {sub.totalCycles} cycles
                      </td>
                      <td className="py-3 text-teal-950/70 font-mono text-[11px]">
                        {sub.nextChargeAt
                          ? new Date(sub.nextChargeAt).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : isCancelled
                              ? "bg-gray-100 text-gray-700"
                              : isHalted
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveSubView(sub)}
                          className="rounded-lg bg-teal-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-800 transition cursor-pointer"
                        >
                          Details
                        </button>
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleCancelSubscription(sub)}
                            disabled={actionLoading}
                            className="rounded-lg bg-red-600/15 border border-red-500/25 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-600/25 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Recurring Debits / 80G Receipts Audit Table */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-teal-900/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display text-base font-bold text-teal-950">
              Recent Monthly Auto-Pay Debits &amp; 80G Receipts
            </h4>
            <p className="text-xs text-teal-950/65">
              Each monthly debit generates an atomic donation record and Section 80G tax receipt number.
            </p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            ✓ Automated 80G Issuance
          </span>
        </div>

        {charges.length === 0 ? (
          <div className="py-8 text-center text-xs text-teal-950/60">
            No monthly debits recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-teal-900/10 text-teal-950/60 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Debit Date</th>
                  <th className="py-2.5">80G Receipt No</th>
                  <th className="py-2.5">Donor Name</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Cycle</th>
                  <th className="py-2.5">Gateway Payment ID</th>
                  <th className="py-2.5 text-right">View 80G Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {charges.map((c) => (
                  <tr key={c.id} className="hover:bg-cream/40">
                    <td className="py-3 text-teal-950/70 font-mono text-[11px]">
                      {c.paidAt ? new Date(c.paidAt).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="py-3 font-mono font-bold text-teal-950">
                      {c.receiptNo || c.publicId}
                    </td>
                    <td className="py-3 font-medium text-teal-950">
                      {c.donorName}
                    </td>
                    <td className="py-3 font-bold text-teal-900 font-display">
                      {formatINR(c.amount)}
                    </td>
                    <td className="py-3 font-mono font-semibold text-teal-950">
                      Cycle #{c.recurringCycle || 1}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-teal-950/60">
                      {c.razorpayPaymentId || "-"}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/receipt/${c.publicId}`}
                        target="_blank"
                        className="rounded-lg bg-teal-900/10 px-2.5 py-1 text-[11px] font-bold text-teal-900 hover:bg-teal-900 hover:text-white transition inline-block"
                      >
                        Receipt PDF &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Details Modal */}
      {activeSubView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div>
                <h4 className="font-display text-lg font-bold text-teal-950">
                  Mandate #{activeSubView.id} Details
                </h4>
                <p className="font-mono text-xs text-teal-900/60">{activeSubView.publicId}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubView(null)}
                className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-cream/50 p-3 rounded-2xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-900/60">Donor Name</span>
                  <p className="font-bold text-teal-950">{activeSubView.donorName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-900/60">Monthly Amount</span>
                  <p className="font-bold text-teal-950 font-display text-sm">{formatINR(activeSubView.amount)} / mo</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-900/60">Email</span>
                  <p className="font-medium text-teal-950 truncate">{activeSubView.donorEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-900/60">Phone</span>
                  <p className="font-medium text-teal-950">{activeSubView.donorPhone || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-900/60">PAN (80G)</span>
                  <p className="font-mono font-bold text-teal-950">{activeSubView.donorPan || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-900/60">Mandate Status</span>
                  <p className="font-bold text-emerald-800">{activeSubView.mandateStatus.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-900/60">Debits Completed</span>
                  <p className="font-bold text-teal-950">{activeSubView.chargeCount} / {activeSubView.totalCycles}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-900/60">Next Charge Date</span>
                  <p className="font-medium text-teal-950">
                    {activeSubView.nextChargeAt ? new Date(activeSubView.nextChargeAt).toLocaleDateString("en-IN") : "-"}
                  </p>
                </div>
              </div>

              {activeSubView.cancelReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900">
                  <span className="font-bold block">Cancellation Note:</span>
                  <p>{activeSubView.cancelReason}</p>
                  <p className="text-[10px] text-red-700 mt-1">
                    Cancelled on: {activeSubView.cancelledAt ? new Date(activeSubView.cancelledAt).toLocaleString("en-IN") : "-"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-teal-900/10">
              {activeSubView.status === "active" && (
                <button
                  type="button"
                  onClick={() => handleCancelSubscription(activeSubView)}
                  disabled={actionLoading}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                >
                  Cancel Auto-Pay Mandate
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveSubView(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
