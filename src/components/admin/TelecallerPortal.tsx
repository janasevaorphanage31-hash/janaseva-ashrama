"use client";

import { useEffect, useState, useMemo } from "react";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";

interface CallerProfile {
  callerId: string;
  name: string;
  whatsappNumber: string;
  email: string;
  dailyQuota?: number;
}

export function TelecallerPortal({ initialCallerId }: { initialCallerId?: string }) {
  // Session & Auth state
  const [authChecking, setAuthChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [callerProfile, setCallerProfile] = useState<CallerProfile | null>(null);

  // Login Form state
  const [loginIdentifier, setLoginIdentifier] = useState(initialCallerId || "TC01");
  const [loginPassword, setLoginPassword] = useState("ashrama@123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Change Password Modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // Leads & Data state
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [toastMsg, setToastMsg] = useState("");

  // Notes & Callback Modal state
  const [activeNotesLead, setActiveNotesLead] = useState<any | null>(null);
  const [notesText, setNotesText] = useState("");
  const [callbackDateTime, setCallbackDateTime] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalAssigned: 0,
    contactedCount: 0,
    convertedCount: 0,
    totalRevenue: 0,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4500);
  };

  const computeStats = async (leadItems: any[], cid: string) => {
    let contacted = 0;
    let converted = 0;
    leadItems.forEach((l) => {
      if (l.status && l.status !== "Pending") contacted++;
      if (l.status === "Donated") converted++;
    });

    try {
      const adminRes = await fetch("/api/v1/admin/telecallers");
      const adminData = await adminRes.json();
      const myStat = adminData.callers?.find((c: any) => c.callerId === cid);
      setStats({
        totalAssigned: leadItems.length,
        contactedCount: contacted,
        convertedCount: converted,
        totalRevenue: myStat?.totalDonationAmount || 0,
      });
    } catch {
      setStats({
        totalAssigned: leadItems.length,
        contactedCount: contacted,
        convertedCount: converted,
        totalRevenue: 0,
      });
    }
  };

  const loadCallerLeads = async (cid: string) => {
    setLoadingLeads(true);
    try {
      const res = await fetch(`/api/v1/leads/assigned?callerId=${encodeURIComponent(cid)}`);
      const data = await res.json();
      if (data.success) {
        const leadItems = data.leads || [];
        setLeads(leadItems);
        await computeStats(leadItems, cid);
      }
    } catch (err: any) {
      showToast("Error loading leads: " + err.message);
    } finally {
      setLoadingLeads(false);
    }
  };

  const checkCurrentSession = async () => {
    setAuthChecking(true);
    try {
      const res = await fetch("/api/v1/auth/login");
      const data = await res.json();
      if (data.authenticated && data.caller) {
        setCallerProfile(data.caller);
        setIsLoggedIn(true);
        await loadCallerLeads(data.caller.callerId);
      } else {
        setIsLoggedIn(false);
        setCallerProfile(null);
      }
    } catch {
      setIsLoggedIn(false);
    } finally {
      setAuthChecking(false);
    }
  };

  // 1. Initial Session Check on Mount
  useEffect(() => {
    queueMicrotask(() => {
      void checkCurrentSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Handle Telecaller Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Authentication failed. Check your Caller ID/Email and password.");
      }
      setCallerProfile(data.caller);
      setIsLoggedIn(true);
      showToast(`Welcome back, ${data.caller.name}! (${data.caller.callerId})`);
      await loadCallerLeads(data.caller.callerId);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginSubmitting(false);
    }
  };

  // 4. Handle Telecaller Sign Out
  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}
    setIsLoggedIn(false);
    setCallerProfile(null);
    setLeads([]);
    showToast("Signed out successfully.");
  };

  // 5. Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (!callerProfile) return;

    if (pwdNew !== pwdConfirm) {
      setPwdError("New password and confirm password do not match.");
      return;
    }
    if (pwdNew.length < 4) {
      setPwdError("New password must be at least 4 characters.");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          callerId: callerProfile.callerId,
          currentPassword: pwdCurrent,
          newPassword: pwdNew,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update password.");
      }
      showToast("✓ Password updated successfully!");
      setIsChangePasswordOpen(false);
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    } catch (err: any) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  // 6. 1-Tap WhatsApp Tracking Link
  const handleOpenWhatsApp = async (leadId: number) => {
    if (!callerProfile) return;
    try {
      const res = await fetch(
        `/api/v1/telecaller/whatsapp-link/${leadId}?callerId=${encodeURIComponent(callerProfile.callerId)}`
      );
      const data = await res.json();
      if (data.success && data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
        showToast(`✓ Opened WhatsApp message for ${data.leadName} with referral token: ${callerProfile.callerId}`);
      } else {
        alert("Failed to create WhatsApp link: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("WhatsApp link generation error: " + err.message);
    }
  };

  // 7. Update Call Disposition
  const handleUpdateDisposition = async (leadId: number, disposition: string, notes?: string, callbackTime?: string) => {
    if (!callerProfile) return;
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: callerProfile.callerId,
          disposition,
          notes: notes || "Updated from telecaller dashboard",
          callbackTime: callbackTime || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedList = leads.map((l) => (l.leadId === leadId ? { ...l, status: disposition } : l));
        setLeads(updatedList);
        showToast(`✓ Status updated to ${disposition}`);
        computeStats(updatedList, callerProfile.callerId);
      }
    } catch (err: any) {
      showToast("Error updating disposition: " + err.message);
    }
  };

  // 8. Save Notes / Callback Modal
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotesLead || !callerProfile) return;
    setSavingNotes(true);
    try {
      const newStatus = callbackDateTime ? "Reschedule" : activeNotesLead.status;
      await handleUpdateDisposition(activeNotesLead.leadId, newStatus, notesText, callbackDateTime);
      setActiveNotesLead(null);
      setNotesText("");
      setCallbackDateTime("");
    } finally {
      setSavingNotes(false);
    }
  };

  // 9. Simulate Payment Conversion Test
  const handleSimulatePayment = async (leadId: number) => {
    if (!callerProfile) return;
    try {
      const res = await fetch("/api/v1/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate_donation",
          callerRefId: callerProfile.callerId,
          leadId,
          amount: 1000,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        showToast(`🎉 ₹1,000 Donation attributed to you (${callerProfile.callerId})! Lead marked as Donated.`);
        await loadCallerLeads(callerProfile.callerId);
      }
    } catch (err: any) {
      showToast("Attribution test failed: " + err.message);
    }
  };

  // 10. Copy Referral Link
  const handleCopyReferralLink = () => {
    if (!callerProfile) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.janasevaorphanage.org";
    const refLink = `${origin}/#official-tiers?ref=${callerProfile.callerId}`;
    navigator.clipboard.writeText(refLink);
    showToast("✓ Referral link copied to clipboard: " + refLink);
  };

  // Filter & Search Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesFilter = filter === "ALL" ? true : l.status === filter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        String(l.leadId).includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [leads, filter, searchQuery]);

  // Loading Session Screen
  if (authChecking) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
        <LogoMark size={64} className="ring-4 ring-amber-400/30 animate-pulse mb-4" />
        <h2 className="font-display text-xl font-bold text-teal-950">
          Janaseva Ashrama Telecaller Portal
        </h2>
        <p className="text-xs text-teal-950/60 mt-1">Verifying your secure caller session...</p>
      </div>
    );
  }

  // ── UNATHENTICATED STATE: DEDICATED TELECALLER LOGIN SCREEN ──
  if (!isLoggedIn || !callerProfile) {
    return (
      <div className="max-w-md mx-auto my-10 px-4 animate-fadeIn">
        {toastMsg && (
          <div className="mb-4 rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2">✕</button>
          </div>
        )}

        <div className="rounded-3xl bg-white p-7 sm:p-9 shadow-xl border border-teal-900/10 text-teal-950">
          {/* Logo & Portal Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-teal-950 text-gold mb-3 shadow-md">
              <LogoMark size={48} />
            </div>
            <h1 className="font-display text-2xl font-black text-teal-950">
              Telecaller Portal Login
            </h1>
            <p className="text-xs text-teal-950/70 mt-1 max-w-xs mx-auto">
              Sign in with your assigned Caller ID or Email to access your daily birthday lead queue and tracking link.
            </p>
          </div>

          {/* Login Error Notification */}
          {loginError && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-semibold flex items-start gap-2">
              <span className="text-rose-600 font-black">⚠️</span>
              <p className="leading-relaxed">{loginError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-teal-950/80 mb-1">
                Caller ID or Registered Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. TC01 or tc01@janaseva.org"
                  className="w-full rounded-xl border border-teal-900/20 px-3.5 py-2.5 text-xs font-semibold text-teal-950 placeholder:text-teal-950/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-teal-950/80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your advisor password"
                  className="w-full rounded-xl border border-teal-900/20 px-3.5 py-2.5 text-xs font-semibold text-teal-950 placeholder:text-teal-950/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full mt-2 focus-ring tap-scale rounded-xl bg-teal-950 hover:bg-teal-900 text-gold py-3 text-xs font-black shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loginSubmitting ? (
                <>
                  <span className="animate-spin text-base">⏳</span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>🔐 Access My Caller Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="mt-6 pt-5 border-t border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/50 text-center tracking-wider mb-2">
              Quick Test Accounts (Default Pwd: <code className="text-amber-900 font-mono">ashrama@123</code>)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {["TC01", "TC02", "TC03", "TC04", "TC05", "TC06"].map((cid) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => {
                    setLoginIdentifier(cid);
                    setLoginPassword("ashrama@123");
                  }}
                  className="rounded-lg bg-sand/60 hover:bg-amber-100/70 border border-teal-900/10 py-1 px-2 text-[11px] font-bold text-teal-950 transition text-center cursor-pointer"
                >
                  {cid}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-teal-950/60 text-center mt-3">
              Need password assistance? Contact the Super Admin at <span className="font-bold">admin@janaseva.org</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHENTICATED STATE: DEDICATED TELECALLER WORKSPACE ──
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMsg && (
        <div className="rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── TOP TELECALLER HEADER & STATS BAR ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-900/10 pb-5">
          <div className="flex items-center gap-3">
            <LogoMark size={48} className="ring-2 ring-amber-400/30" />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-950 text-gold font-display font-black text-lg shadow-sm">
              {callerProfile.callerId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-teal-950">
                  {callerProfile.name}
                </h1>
                <span className="rounded-full bg-emerald-500/15 text-emerald-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                  Active Advisor
                </span>
              </div>
              <p className="text-xs text-teal-950/60 mt-0.5 flex flex-wrap items-center gap-2">
                <span>📱 +91 {callerProfile.whatsappNumber}</span>
                <span>·</span>
                <span>✉️ {callerProfile.email || `${callerProfile.callerId.toLowerCase()}@janaseva.org`}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReferralLink}
              title="Copy your personal donation tracking link"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-sand hover:bg-amber-100/80 border border-teal-900/15 text-teal-950 px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              <span>🔗 Link: ?ref={callerProfile.callerId}</span>
              <span className="text-[10px] bg-white rounded px-1.5 py-0.5 font-bold shadow-2xs">Copy</span>
            </button>

            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-sand border border-teal-900/20 text-teal-950 px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              <span>🔑 Change Password</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              <span>🚪 Sign Out</span>
            </button>
          </div>
        </div>

        {/* Real-Time Telecaller Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
              Assigned Leads
            </p>
            <p className="font-display text-2xl font-black text-teal-950 mt-1">
              {stats.totalAssigned}
            </p>
            <p className="text-[10px] text-teal-950/60 mt-0.5">
              Daily quota: {callerProfile.dailyQuota || 50}
            </p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
              Calls Completed
            </p>
            <p className="font-display text-2xl font-black text-teal-950 mt-1">
              {stats.contactedCount}
            </p>
            <p className="text-[10px] text-teal-950/60 mt-0.5">Logged dispositions</p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
              Conversions
            </p>
            <p className="font-display text-2xl font-black text-emerald-700 mt-1">
              {stats.convertedCount}
            </p>
            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
              {stats.totalAssigned > 0 ? ((stats.convertedCount / stats.totalAssigned) * 100).toFixed(1) : 0}% success rate
            </p>
          </div>

          <div className="rounded-2xl bg-teal-950 p-4 text-white shadow-sm border border-teal-900">
            <p className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
              Total Revenue Attributed
            </p>
            <p className="font-display text-2xl font-black text-gold mt-1">
              {formatINR(stats.totalRevenue)}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">via ref={callerProfile.callerId}</p>
          </div>
        </div>
      </div>

      {/* ── ASSIGNED LEADS QUEUE TABLE ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-teal-900/10">
        {/* 90% Main Campaign Guidance Banner for Telecallers */}
        <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider">
              <span>🏛️</span>
              <span>90% NGO Telecaller Focus: &apos;Sponsor 25 Boys&apos; Official Tiers</span>
            </div>
            <p className="text-xs text-teal-950/80 font-medium leading-relaxed">
              When speaking with well-wishers, prioritize offering the Form 28 registered sponsorship tiers:
              <strong> ₹4,500 Full Day Food (All 25 Boys)</strong> · <strong>₹6,000 Monthly Ration</strong> · <strong>₹4,800 Clothes</strong> · <strong>₹9,600 Education</strong> (or starter ₹1,800 - ₹2,500).
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyReferralLink}
            className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-teal-950 font-black px-3.5 py-2 text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📋 Copy Official Tiers Link</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-teal-950">
              Birthday Call Queue ({filteredLeads.length})
            </h2>
            <p className="text-xs text-teal-950/60">
              Call lead, wish them happy birthday on behalf of Janaseva Ashrama, and deliver tracking link via WhatsApp.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search donor name or phone..."
              className="rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs bg-white text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none w-48 sm:w-56"
            />

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {["ALL", "Pending", "Interested", "Reschedule", "Donated", "Rejected"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilter(st)}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    filter === st
                      ? "bg-teal-950 text-gold shadow-sm"
                      : "bg-cream text-teal-950/70 hover:bg-sand"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream text-teal-950 font-bold border-b border-teal-900/10">
              <tr>
                <th className="p-3">Lead Donor</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Birthday</th>
                <th className="p-3">Status / Disposition</th>
                <th className="p-3">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {loadingLeads ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-teal-950/60">
                    Loading your assigned queue...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-teal-950/60">
                    No leads found matching current filter or search.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.leadId} className="hover:bg-sand/30 transition">
                    <td className="p-3">
                      <p className="font-bold text-teal-950 text-sm">{lead.name}</p>
                      <p className="text-[10px] text-teal-950/60">Lead #{lead.leadId}</p>
                    </td>
                    <td className="p-3">
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-mono font-bold text-teal-900 hover:underline flex items-center gap-1"
                      >
                        <span>📞</span> {lead.phone}
                      </a>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-900 font-bold px-2 py-0.5 text-[11px]">
                        🎂 Day {lead.dobDay} / Month {lead.dobMonth}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={lead.status || "Pending"}
                        onChange={(e) => handleUpdateDisposition(lead.leadId, e.target.value)}
                        className={`rounded-xl border px-2.5 py-1 text-xs font-bold shadow-2xs outline-none cursor-pointer ${
                          lead.status === "Donated"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : lead.status === "Interested"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : lead.status === "Reschedule"
                            ? "bg-blue-100 text-blue-900 border-blue-300"
                            : lead.status === "Rejected"
                            ? "bg-rose-100 text-rose-900 border-rose-300"
                            : "bg-white text-teal-950 border-teal-900/20"
                        }`}
                      >
                        <option value="Pending">Pending (Not Called)</option>
                        <option value="Interested">Interested (Warm)</option>
                        <option value="Reschedule">Reschedule (Callback)</option>
                        <option value="No_Answer">No Answer / Busy</option>
                        <option value="Rejected">Not Interested</option>
                        <option value="Donated">Donated (Paid)</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1-Tap WhatsApp Tracking Sender */}
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(lead.leadId)}
                          className="focus-ring tap-scale inline-flex items-center gap-1 rounded-xl bg-[#25D366] hover:brightness-105 text-white px-2.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <span>💬</span> WhatsApp
                        </button>

                        {/* Notes / Callback Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNotesLead(lead);
                            setNotesText("");
                            setCallbackDateTime("");
                          }}
                          className="rounded-xl bg-white border border-teal-900/20 text-teal-950 hover:bg-sand px-2 py-1.5 text-[11px] font-bold transition cursor-pointer"
                        >
                          📝 Notes
                        </button>

                        {/* Test Payment Attribution */}
                        <button
                          type="button"
                          onClick={() => handleSimulatePayment(lead.leadId)}
                          title="Simulate ₹1,000 payment attribution to you via webhook"
                          className="rounded-xl bg-teal-900/10 hover:bg-teal-900/20 text-teal-900 px-2 py-1.5 text-[11px] font-bold transition cursor-pointer"
                        >
                          +₹1k Test
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/10 text-teal-950">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3 mb-4">
              <h3 className="font-display text-base font-bold text-teal-950 flex items-center gap-2">
                <span>🔑</span> Change Portal Password
              </h3>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-teal-950/50 hover:text-teal-950 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {pwdError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold">
                ⚠️ {pwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  placeholder="Enter current password (default: ashrama@123)"
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-semibold text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-semibold text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-semibold text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2 text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {pwdLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NOTES & RESCHEDULE CALLBACK MODAL ── */}
      {activeNotesLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/10 text-teal-950">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3 mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-teal-950">
                  Call Notes: {activeNotesLead.name}
                </h3>
                <p className="text-[11px] text-teal-950/60">Phone: {activeNotesLead.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotesLead(null)}
                className="text-teal-950/50 hover:text-teal-950 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  Call Notes &amp; Donor Feedback
                </label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="e.g. Wished happy birthday, donor agreed to donate ₹2,000 after 6 PM..."
                  className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  Callback Date &amp; Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={callbackDateTime}
                  onChange={(e) => setCallbackDateTime(e.target.value)}
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs text-teal-950 focus:border-amber-500 outline-none"
                />
                <p className="text-[10px] text-teal-950/60 mt-1">
                  Setting a callback time automatically marks this lead status as Reschedule.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveNotesLead(null)}
                  className="rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2 text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingNotes ? "Saving..." : "Save Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
