"use client";

import { useEffect, useState, useMemo } from "react";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import { AntiBanWhatsAppModal } from "@/components/admin/AntiBanWhatsAppModal";

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

  // Anti-Ban WhatsApp Modal state
  const [isAntiBanModalOpen, setIsAntiBanModalOpen] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<any | null>(null);

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

  useEffect(() => {
    queueMicrotask(() => {
      void checkCurrentSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Telecaller Sign In
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

  // Handle Telecaller Sign Out
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

  // Handle Change Password
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

  // Anti-Ban WhatsApp Modal Trigger
  const handleOpenWhatsAppModal = (lead: any) => {
    setSelectedLeadForWhatsApp(lead);
    setIsAntiBanModalOpen(true);
  };

  const handleDispositionLoggedFromModal = (leadId: number, disp: string) => {
    const updatedList = leads.map((l) => (l.leadId === leadId ? { ...l, status: disp } : l));
    setLeads(updatedList);
    if (callerProfile) {
      computeStats(updatedList, callerProfile.callerId);
    }
    showToast(`✓ Marked lead #${leadId} as ${disp}`);
  };

  // Update Call Disposition
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

  // 1-Tap Inline Disposition Handlers
  const handleInlineDisposition = async (leadId: number, disposition: string) => {
    await handleUpdateDisposition(leadId, disposition);
  };

  // Auto-Mark Attended on Phone Call Launch
  const handleCallLead = (lead: any) => {
    if (!lead.status || lead.status === "Pending") {
      void handleUpdateDisposition(lead.leadId, "Contacted", "Auto-marked attended on call click");
    }
    const cleanPhone = lead.phone.replace(/\D/g, "");
    window.location.href = `tel:${cleanPhone}`;
  };

  // Auto-Mark Attended on WhatsApp Dispatch Launch
  const handleWhatsAppLead = (lead: any) => {
    if (!lead.status || lead.status === "Pending") {
      void handleUpdateDisposition(lead.leadId, "Contacted", "Auto-marked attended on WhatsApp dispatch");
    }
    handleOpenWhatsAppModal(lead);
  };

  // Save Notes / Callback Modal
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotesLead || !callerProfile) return;
    setSavingNotes(true);
    try {
      const newStatus = callbackDateTime ? "Reschedule" : activeNotesLead.status || "Contacted";
      await handleUpdateDisposition(activeNotesLead.leadId, newStatus, notesText, callbackDateTime);
      setActiveNotesLead(null);
      setNotesText("");
      setCallbackDateTime("");
    } finally {
      setSavingNotes(false);
    }
  };

  // Simulate Payment Conversion Test
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

  // Copy Referral Link
  const handleCopyReferralLink = () => {
    if (!callerProfile) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.janasevaorphanage.org";
    const refLink = `${origin}/#official-tiers?ref=${callerProfile.callerId}`;
    navigator.clipboard.writeText(refLink);
    showToast("✓ Referral link copied: " + refLink);
  };

  // Dynamic filter counter computation
  const counts = useMemo(() => {
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;

    let pending = 0;
    let attended = 0;
    let birthdays = 0;
    let interested = 0;
    let reschedule = 0;
    let donated = 0;

    leads.forEach((l) => {
      const isAttended = l.status && l.status !== "Pending";
      if (!isAttended) pending++;
      else attended++;

      if (l.dobDay === curDay && l.dobMonth === curMonth) birthdays++;
      if (l.status === "Interested") interested++;
      if (l.status === "Reschedule") reschedule++;
      if (l.status === "Donated") donated++;
    });

    return {
      all: leads.length,
      pending,
      attended,
      birthdays,
      interested,
      reschedule,
      donated,
    };
  }, [leads]);

  // Filter & Search Leads
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;

    return leads.filter((l) => {
      let matchesFilter = true;
      if (filter === "Today_Birthday") {
        matchesFilter = l.dobDay === curDay && l.dobMonth === curMonth;
      } else if (filter === "Pending") {
        matchesFilter = !l.status || l.status === "Pending";
      } else if (filter === "Attended") {
        matchesFilter = l.status && l.status !== "Pending";
      } else if (filter !== "ALL") {
        matchesFilter = l.status === filter;
      }

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

  // ── UNAUTHENTICATED STATE: DEDICATED TELECALLER LOGIN SCREEN ──
  if (!isLoggedIn || !callerProfile) {
    return (
      <div className="max-w-md mx-auto my-10 px-4 animate-fadeIn">
        {toastMsg && (
          <div className="mb-4 rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2 cursor-pointer">✕</button>
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
              Sign in with your assigned Caller ID or Email to access your daily birthday lead queue and anti-ban dispatch tools.
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

  // Daily target for high-volume telecaller (user indicated 300 to 500 dispatches)
  const dailyTarget = callerProfile.dailyQuota && callerProfile.dailyQuota >= 100 ? callerProfile.dailyQuota : 400;
  const progressPercent = Math.min(100, Math.round((stats.contactedCount / dailyTarget) * 100));

  // ── AUTHENTICATED STATE: DEDICATED TELECALLER WORKSPACE ──
  return (
    <div className="space-y-5 animate-fadeIn max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between sticky top-3 z-30 animate-fadeIn">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── TOP TELECALLER HEADER & STATS BAR ── */}
      <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-900/10 pb-4">
          <div className="flex items-center gap-3">
            <LogoMark size={44} className="ring-2 ring-amber-400/30 shrink-0" />
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-950 text-gold font-display font-black text-base shadow-sm shrink-0">
              {callerProfile.callerId}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-lg sm:text-xl font-bold text-teal-950 truncate">
                  {callerProfile.name}
                </h1>
                <span className="rounded-full bg-emerald-500/15 text-emerald-800 px-2 py-0.5 text-[10px] font-black uppercase">
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
              <span>🔑 Password</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-4">
          <div className="rounded-2xl bg-cream/70 p-3 sm:p-4 border border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
              Assigned Queue
            </p>
            <p className="font-display text-xl sm:text-2xl font-black text-teal-950 mt-1">
              {stats.totalAssigned}
            </p>
            <p className="text-[10px] text-teal-950/60 mt-0.5">
              Pending: {counts.pending}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50/70 p-3 sm:p-4 border border-emerald-200">
            <p className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
              Attended Today
            </p>
            <p className="font-display text-xl sm:text-2xl font-black text-emerald-800 mt-1">
              {stats.contactedCount}
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              {progressPercent}% of {dailyTarget} goal
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50/70 p-3 sm:p-4 border border-amber-200">
            <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
              Conversions
            </p>
            <p className="font-display text-xl sm:text-2xl font-black text-amber-800 mt-1">
              {stats.convertedCount}
            </p>
            <p className="text-[10px] text-amber-800 font-bold mt-0.5">
              {stats.totalAssigned > 0 ? ((stats.convertedCount / stats.totalAssigned) * 100).toFixed(1) : 0}% success rate
            </p>
          </div>

          <div className="rounded-2xl bg-teal-950 p-3 sm:p-4 text-white shadow-sm border border-teal-900">
            <p className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
              Attributed Revenue
            </p>
            <p className="font-display text-xl sm:text-2xl font-black text-gold mt-1">
              {formatINR(stats.totalRevenue)}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">via ref={callerProfile.callerId}</p>
          </div>
        </div>

        {/* ── HIGH-VOLUME DAILY OUTREACH PACING & PROGRESS TRACKER (300-500 TARGET) ── */}
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-cream/90 via-sand/50 to-cream/90 p-3.5 sm:p-4 border border-teal-900/15 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-teal-950">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span>Daily High-Volume Goal:</span>
              <span className="font-mono text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 text-xs font-bold">
                {stats.contactedCount} / {dailyTarget} Dispatched ({progressPercent}%)
              </span>
            </div>
            <span className="text-[11px] text-teal-950/70 font-semibold">
              Target: 300 to 500 contacts/day per advisor
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-teal-950/10 rounded-full h-3 overflow-hidden border border-teal-900/10">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-700 to-teal-950 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{
                width: `${Math.min(100, Math.max(3, progressPercent))}%`,
              }}
            />
          </div>

          {/* High-Volume Anti-Ban Shield Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-teal-950/70 border-t border-teal-900/10">
            <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <span>🛡️</span>
              <span>7-Layer Anti-Ban Protected (50,000+ Permutations · Zero-Width Cryptographic Salt · Bangalore Proof)</span>
            </span>
            <span className="text-teal-950/60 font-medium">
              💡 Tip: Maintain a natural 15-20s interval between dispatches
            </span>
          </div>
        </div>
      </div>

      {/* ── ASSIGNED LEADS WORKSPACE & QUEUE ── */}
      <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-teal-900/10 space-y-4">
        {/* Campaign Guidance Banner */}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider">
              <span>🏛️</span>
              <span>Janaseva Calling Pitch: &apos;Sponsor 25 Boys&apos; Official Tiers</span>
            </div>
            <p className="text-xs text-teal-950/80 font-medium leading-relaxed">
              When speaking with well-wishers, highlight:
              <strong> ₹4,500 Full Day Food (All 25 Boys)</strong> · <strong>₹6,000 Monthly Ration</strong> · <strong>₹2,500 Special Feast</strong> · <strong>₹501 Starter</strong>.
              All gifts receive Form 10AC 80G tax exemption.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyReferralLink}
            className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-teal-950 font-black px-3.5 py-2 text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📋 Copy Link (?ref={callerProfile.callerId})</span>
          </button>
        </div>

        {/* Filter Tabs & Search Header */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-teal-950 flex items-center gap-2">
                <span>📋 Lead Calling Queue</span>
                <span className="text-xs font-mono bg-cream px-2.5 py-0.5 rounded-full border border-teal-900/15 font-bold">
                  {filteredLeads.length} visible
                </span>
              </h2>
              <p className="text-xs text-teal-950/60 mt-0.5">
                Tap 📞 Call or 💬 WhatsApp to automatically mark as Attended, or tap any quick disposition pill below.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search donor name or phone..."
                className="w-full sm:w-64 rounded-xl border border-teal-900/20 px-3 py-2 text-xs bg-white text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-teal-950/40 hover:text-teal-950 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills with Live Counter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "Pending", label: "⏳ Unattended", count: counts.pending, color: "text-amber-900 bg-amber-100" },
              { id: "Attended", label: "✓ Attended", count: counts.attended, color: "text-emerald-900 bg-emerald-100" },
              { id: "Today_Birthday", label: "🎂 Today's Birthdays", count: counts.birthdays, color: "text-purple-900 bg-purple-100" },
              { id: "Interested", label: "👍 Interested", count: counts.interested, color: "text-emerald-900 bg-emerald-100" },
              { id: "Reschedule", label: "📅 Callbacks", count: counts.reschedule, color: "text-blue-900 bg-blue-100" },
              { id: "Donated", label: "🎉 Donated", count: counts.donated, color: "text-amber-900 bg-amber-100" },
              { id: "ALL", label: "All Queue", count: counts.all, color: "text-teal-950/60 bg-white" },
            ].map((st) => {
              const isActive = filter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFilter(st.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? "bg-teal-950 text-white shadow-sm"
                      : "bg-cream text-teal-950/80 hover:bg-sand border border-teal-900/10"
                  }`}
                >
                  <span>{st.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                      isActive ? "bg-white/20 text-white" : st.color
                    }`}
                  >
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MOBILE VIEW: TOUCH CARDS FEED (Optimized for Telecallers on Phones) ── */}
        <div className="md:hidden space-y-3">
          {loadingLeads ? (
            <div className="p-8 text-center text-teal-950/60 text-xs">
              Loading your assigned queue...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-teal-950/60 text-xs bg-cream/30 rounded-2xl border border-teal-900/10">
              No leads found matching current filter or search query.
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const now = new Date();
              const isTodayBirthday = lead.dobDay === now.getDate() && lead.dobMonth === now.getMonth() + 1;
              const isAttended = lead.status && lead.status !== "Pending";

              return (
                <div
                  key={lead.leadId}
                  className={`rounded-2xl p-4 bg-white border transition shadow-xs space-y-3 ${
                    isTodayBirthday
                      ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20"
                      : isAttended
                      ? "border-emerald-500/30 bg-white"
                      : "border-teal-900/10"
                  }`}
                >
                  {/* Top Header: Donor Name, Attended Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-display font-black text-sm text-teal-950 truncate">
                          {lead.name}
                        </h3>
                        <span className="text-[10px] font-mono text-teal-950/50">
                          #{lead.leadId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-teal-900">
                          +91 {lead.phone.replace(/\D/g, "").slice(-10)}
                        </span>
                        {isTodayBirthday && (
                          <span className="rounded-full bg-amber-500 text-teal-950 px-2 py-0.5 text-[10px] font-black uppercase shadow-xs animate-pulse">
                            🎂 Today&apos;s Birthday!
                          </span>
                        )}
                        {!isTodayBirthday && lead.dobDay && lead.dobMonth && (
                          <span className="rounded-md bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[10px] font-bold">
                            🎂 {lead.dobDay}/{lead.dobMonth}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attended / Status Badge */}
                    <div className="shrink-0 text-right">
                      {lead.status === "Donated" ? (
                        <span className="inline-block rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-black shadow-xs">
                          🎉 Donated
                        </span>
                      ) : lead.status === "Interested" ? (
                        <span className="inline-block rounded-full bg-amber-500 text-teal-950 px-2.5 py-1 text-[11px] font-black shadow-xs">
                          ✓ Interested 👍
                        </span>
                      ) : lead.status === "Reschedule" ? (
                        <span className="inline-block rounded-full bg-blue-600 text-white px-2.5 py-1 text-[11px] font-black shadow-xs">
                          ✓ Callback 📅
                        </span>
                      ) : lead.status === "Contacted" ? (
                        <span className="inline-block rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold shadow-2xs">
                          ✓ Attended Today
                        </span>
                      ) : lead.status === "No_Answer" ? (
                        <span className="inline-block rounded-full bg-gray-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs">
                          ⏳ No Answer
                        </span>
                      ) : lead.status === "Rejected" ? (
                        <span className="inline-block rounded-full bg-rose-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs">
                          ✕ Not Interested
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 text-[11px] font-bold shadow-2xs">
                          ⏳ Unattended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Tap Inline Disposition Pills */}
                  <div className="pt-2 border-t border-teal-900/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
                        1-Tap Mark Disposition:
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      <button
                        type="button"
                        onClick={() => handleInlineDisposition(lead.leadId, "Interested")}
                        className={`min-h-[34px] rounded-xl text-[10px] font-black transition flex items-center justify-center active:scale-95 cursor-pointer ${
                          lead.status === "Interested"
                            ? "bg-amber-500 text-teal-950 shadow-xs"
                            : "bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100"
                        }`}
                        title="Mark Interested"
                      >
                        👍 Warm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNotesLead(lead);
                          setNotesText(lead.notes || "");
                          setCallbackDateTime("");
                        }}
                        className={`min-h-[34px] rounded-xl text-[10px] font-black transition flex items-center justify-center active:scale-95 cursor-pointer ${
                          lead.status === "Reschedule"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-blue-50 text-blue-950 border border-blue-200 hover:bg-blue-100"
                        }`}
                        title="Callback Later"
                      >
                        📅 Later
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInlineDisposition(lead.leadId, "No_Answer")}
                        className={`min-h-[34px] rounded-xl text-[10px] font-black transition flex items-center justify-center active:scale-95 cursor-pointer ${
                          lead.status === "No_Answer"
                            ? "bg-gray-700 text-white shadow-xs"
                            : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
                        }`}
                        title="No Answer / Busy"
                      >
                        ⏳ Busy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInlineDisposition(lead.leadId, "Donated")}
                        className={`min-h-[34px] rounded-xl text-[10px] font-black transition flex items-center justify-center active:scale-95 cursor-pointer ${
                          lead.status === "Donated"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-emerald-50 text-emerald-950 border border-emerald-300 hover:bg-emerald-100"
                        }`}
                        title="Donated"
                      >
                        🎉 Paid
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInlineDisposition(lead.leadId, "Rejected")}
                        className={`min-h-[34px] rounded-xl text-[10px] font-black transition flex items-center justify-center active:scale-95 cursor-pointer ${
                          lead.status === "Rejected"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-rose-50 text-rose-950 border border-rose-200 hover:bg-rose-100"
                        }`}
                        title="Not Interested"
                      >
                        ✕ No
                      </button>
                    </div>
                  </div>

                  {/* Primary Touch Actions Row: Call, WhatsApp, Notes */}
                  <div className="grid grid-cols-12 gap-2 pt-1 border-t border-teal-900/10">
                    <button
                      type="button"
                      onClick={() => handleCallLead(lead)}
                      className="col-span-5 min-h-[44px] flex items-center justify-center gap-1.5 rounded-2xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <span className="text-base">📞</span>
                      <span>Call Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWhatsAppLead(lead)}
                      className="col-span-5 min-h-[44px] flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] hover:brightness-105 active:scale-95 text-white text-xs font-black shadow-xs transition cursor-pointer"
                    >
                      <span className="text-base">💬</span>
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveNotesLead(lead);
                        setNotesText(lead.notes || "");
                        setCallbackDateTime("");
                      }}
                      className="col-span-2 min-h-[44px] flex items-center justify-center rounded-2xl bg-cream border border-teal-900/20 text-teal-950 text-xs font-bold hover:bg-sand active:scale-95 transition cursor-pointer"
                      title="Add call notes"
                    >
                      <span className="text-base">📝</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP VIEW TABLE ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream text-teal-950 font-bold border-b border-teal-900/10">
              <tr>
                <th className="p-3">Lead Donor</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Birthday</th>
                <th className="p-3">Attended State</th>
                <th className="p-3">1-Tap Disposition</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {loadingLeads ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-teal-950/60">
                    Loading your assigned queue...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-teal-950/60">
                    No leads found matching current filter or search.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const now = new Date();
                  const isTodayBirthday = lead.dobDay === now.getDate() && lead.dobMonth === now.getMonth() + 1;
                  const isAttended = lead.status && lead.status !== "Pending";

                  return (
                    <tr key={lead.leadId} className={`hover:bg-sand/30 transition ${isTodayBirthday ? "bg-amber-50/40" : ""}`}>
                      <td className="p-3">
                        <p className="font-bold text-teal-950 text-sm">{lead.name}</p>
                        <p className="text-[10px] text-teal-950/60">Lead #{lead.leadId}</p>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleCallLead(lead)}
                          className="font-mono font-bold text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>📞</span> {lead.phone}
                        </button>
                      </td>
                      <td className="p-3">
                        {isTodayBirthday ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-teal-950 font-black px-2.5 py-0.5 text-[11px] animate-pulse">
                            🎂 Today!
                          </span>
                        ) : lead.dobDay && lead.dobMonth ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-900 font-bold px-2 py-0.5 text-[11px]">
                            🎂 {lead.dobDay}/{lead.dobMonth}
                          </span>
                        ) : (
                          <span className="text-teal-950/40">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isAttended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 text-[11px] border border-emerald-300">
                            ✓ {lead.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 font-bold px-2.5 py-0.5 text-[11px]">
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleInlineDisposition(lead.leadId, "Interested")}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              lead.status === "Interested" ? "bg-amber-500 text-teal-950 font-black" : "bg-cream hover:bg-sand text-teal-950"
                            }`}
                          >
                            👍 Interested
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveNotesLead(lead);
                              setNotesText(lead.notes || "");
                              setCallbackDateTime("");
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              lead.status === "Reschedule" ? "bg-blue-600 text-white" : "bg-cream hover:bg-sand text-teal-950"
                            }`}
                          >
                            📅 Callback
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInlineDisposition(lead.leadId, "Donated")}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              lead.status === "Donated" ? "bg-emerald-600 text-white font-black" : "bg-cream hover:bg-sand text-teal-950"
                            }`}
                          >
                            🎉 Donated
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleWhatsAppLead(lead)}
                            className="focus-ring tap-scale inline-flex items-center gap-1 rounded-xl bg-[#25D366] hover:brightness-105 text-white px-2.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <span>💬</span> WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCallLead(lead)}
                            className="inline-flex items-center gap-1 rounded-xl bg-teal-950 hover:bg-teal-900 text-white px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                          >
                            <span>📞</span> Call
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveNotesLead(lead);
                              setNotesText(lead.notes || "");
                              setCallbackDateTime("");
                            }}
                            className="rounded-xl bg-white border border-teal-900/20 text-teal-950 hover:bg-sand px-2 py-1.5 text-[11px] font-bold transition cursor-pointer"
                            title="Notes"
                          >
                            📝
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                  placeholder="e.g. Wished happy birthday, donor agreed to donate ₹2,500 after 6 PM..."
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

      {/* ── ANTI-BAN WHATSAPP OUTREACH MODAL ── */}
      {selectedLeadForWhatsApp && callerProfile && (
        <AntiBanWhatsAppModal
          isOpen={isAntiBanModalOpen}
          onClose={() => {
            setIsAntiBanModalOpen(false);
            setSelectedLeadForWhatsApp(null);
          }}
          lead={selectedLeadForWhatsApp}
          callerId={callerProfile.callerId}
          callerName={callerProfile.name}
          callerWhatsAppNumber={callerProfile.whatsappNumber}
          onDispositionLogged={(leadId, disp) => {
            handleDispositionLoggedFromModal(leadId, disp);
          }}
        />
      )}
    </div>
  );
}
