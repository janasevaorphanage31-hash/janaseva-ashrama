"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";
import { track } from "@/lib/track";

export interface CommunityMemberRow {
  id: number | string;
  role: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  handleOrOrg: string | null;
  reach: string | null;
  skills: string | null;
  message: string | null;
  whatsappOptIn: boolean | null;
  status: string;
  adminNotes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LegacyGroup {
  title: string;
  rows: string[];
}

interface CommunityAdminClientProps {
  initialMembers: CommunityMemberRow[];
  legacyGroups: LegacyGroup[];
}

const ROLE_BADGES: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  VOLUNTEER: { label: "Volunteer", icon: "🤝", bg: "bg-emerald-100", text: "text-emerald-900" },
  INFLUENCER: { label: "Creator / Influencer", icon: "📸", bg: "bg-purple-100", text: "text-purple-900" },
  COMPANY_CSR: { label: "Corporate CSR", icon: "🏢", bg: "bg-blue-100", text: "text-blue-900" },
  WHATSAPP_AMBASSADOR: { label: "WhatsApp Network", icon: "💬", bg: "bg-amber-100", text: "text-amber-900" },
};

const STATUS_OPTIONS = ["NEW", "CONTACTED", "APPROVED", "ARCHIVED"];

export function CommunityAdminClient({ initialMembers, legacyGroups }: CommunityAdminClientProps) {
  const [members, setMembers] = useState<CommunityMemberRow[]>(initialMembers);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);

  // Filtered members
  const filtered = members.filter((m) => {
    if (selectedRole !== "ALL" && selectedRole !== "LEGACY" && m.role !== selectedRole) return false;
    if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.city && m.city.toLowerCase().includes(q)) ||
        (m.handleOrOrg && m.handleOrOrg.toLowerCase().includes(q)) ||
        (m.skills && m.skills.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Role Counts
  const counts = {
    all: members.length,
    volunteer: members.filter((m) => m.role === "VOLUNTEER").length,
    influencer: members.filter((m) => m.role === "INFLUENCER").length,
    csr: members.filter((m) => m.role === "COMPANY_CSR").length,
    whatsapp: members.filter((m) => m.role === "WHATSAPP_AMBASSADOR").length,
  };

  const handleStatusChange = async (id: number | string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
        track("admin_community_status_change", { id, status: newStatus });
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Network error updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (id: number | string) => {
    const notes = activeNotes[id] ?? "";
    setUpdatingId(id);
    try {
      const res = await fetch("/api/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminNotes: notes }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, adminNotes: notes } : m)));
        alert("Notes saved successfully!");
      } else {
        alert(data.error || "Failed to save notes");
      }
    } catch {
      alert("Network error saving notes");
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCSV = () => {
    const headers = ["Role", "Name", "Phone", "Email", "City", "Org/Handle", "Reach", "Skills", "Status", "Created At"];
    const rows = filtered.map((m) => [
      m.role,
      `"${m.name.replace(/"/g, '""')}"`,
      m.phone,
      m.email,
      `"${(m.city || "").replace(/"/g, '""')}"`,
      `"${(m.handleOrOrg || "").replace(/"/g, '""')}"`,
      `"${(m.reach || "").replace(/"/g, '""')}"`,
      `"${(m.skills || "").replace(/"/g, '""')}"`,
      m.status,
      new Date(m.createdAt).toISOString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `janaseva_community_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── METRIC STAT SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => setSelectedRole("ALL")}
          className={`rounded-2xl p-4 text-left transition border ${
            selectedRole === "ALL"
              ? "bg-teal-900 text-white border-teal-900 shadow-sm"
              : "bg-white text-teal-950 border-teal-900/10 hover:border-teal-900/30"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider opacity-75">Total Filings</div>
          <div className="mt-1 text-2xl font-black">{counts.all}</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole("VOLUNTEER")}
          className={`rounded-2xl p-4 text-left transition border ${
            selectedRole === "VOLUNTEER"
              ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
              : "bg-white text-teal-950 border-emerald-900/10 hover:border-emerald-800/30"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider opacity-75">🤝 Volunteers</div>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{counts.volunteer}</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole("INFLUENCER")}
          className={`rounded-2xl p-4 text-left transition border ${
            selectedRole === "INFLUENCER"
              ? "bg-purple-800 text-white border-purple-800 shadow-sm"
              : "bg-white text-teal-950 border-purple-900/10 hover:border-purple-800/30"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider opacity-75">📸 Creators</div>
          <div className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">{counts.influencer}</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole("COMPANY_CSR")}
          className={`rounded-2xl p-4 text-left transition border ${
            selectedRole === "COMPANY_CSR"
              ? "bg-blue-800 text-white border-blue-800 shadow-sm"
              : "bg-white text-teal-950 border-blue-900/10 hover:border-blue-800/30"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider opacity-75">🏢 Corporate CSR</div>
          <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">{counts.csr}</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole("WHATSAPP_AMBASSADOR")}
          className={`rounded-2xl p-4 text-left transition border col-span-2 sm:col-span-1 ${
            selectedRole === "WHATSAPP_AMBASSADOR"
              ? "bg-amber-800 text-white border-amber-800 shadow-sm"
              : "bg-white text-teal-950 border-amber-900/10 hover:border-amber-800/30"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider opacity-75">💬 WhatsApp</div>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{counts.whatsapp}</div>
        </button>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-teal-900/10 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, handle, college, or city..."
            className="w-full rounded-xl border border-teal-900/20 bg-cream/50 px-4 py-2.5 text-xs text-teal-950 placeholder:text-teal-950/40 focus:border-teal-900 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-teal-950/50 hover:text-teal-950"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-teal-950/70">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-bold text-teal-900 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
          >
            <span>📥 Export CSV</span>
          </button>

          {/* Legacy view toggle */}
          <button
            type="button"
            onClick={() => setSelectedRole(selectedRole === "LEGACY" ? "ALL" : "LEGACY")}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition border ${
              selectedRole === "LEGACY"
                ? "bg-saffron text-teal-950 border-saffron shadow-xs"
                : "bg-cream text-teal-900/80 border-teal-900/15 hover:bg-sand"
            }`}
          >
            Legacy Records
          </button>
        </div>
      </div>

      {/* ── LEGACY GROUPS VIEW (IF SELECTED) ── */}
      {selectedRole === "LEGACY" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {legacyGroups.map(([title, rows]: any) => (
            <section key={title} className="rounded-3xl bg-white p-5 ring-1 ring-teal-900/10">
              <h2 className="font-display text-xl font-bold text-teal-900">{title}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {rows.length ? (
                  rows.map((r: string, i: number) => (
                    <li key={i} className="rounded-xl bg-cream px-3 py-2 text-xs font-medium text-teal-950">
                      {r}
                    </li>
                  ))
                ) : (
                  <li className="text-teal-950/50 text-xs">No records found.</li>
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* ── COMMUNITY MEMBERS RECORD LIST ── */}
      {selectedRole !== "LEGACY" && (
        <div className="space-y-3.5">
          {filtered.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center border border-teal-900/10">
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="font-display text-lg font-bold text-teal-900">No community filings match your filters</h3>
              <p className="mt-1 text-xs text-teal-950/60">Try clearing your search query or selecting &quot;All Filings&quot;.</p>
            </div>
          ) : (
            filtered.map((member) => {
              const roleMeta = ROLE_BADGES[member.role] || {
                label: member.role,
                icon: "🤝",
                bg: "bg-teal-100",
                text: "text-teal-900",
              };
              const dateStr = new Date(member.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const cleanPhone = member.phone.replace(/[^0-9]/g, "");
              const waText = encodeURIComponent(
                `Namaste ${member.name}! This is Janaseva Ashrama regarding your ${roleMeta.label} application. How are you doing?`
              );
              const waLink = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${waText}`;

              return (
                <div
                  key={member.id}
                  className="rounded-3xl bg-white p-5 border border-teal-900/10 shadow-xs hover:border-teal-900/25 transition space-y-4"
                >
                  {/* Card Header: Role badge, Status, Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-teal-900/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${roleMeta.bg} ${roleMeta.text}`}
                      >
                        <span>{roleMeta.icon}</span>
                        <span>{roleMeta.label}</span>
                      </span>
                      {member.handleOrOrg && (
                        <span className="text-xs font-bold text-teal-900/70 bg-sand/60 px-2.5 py-0.5 rounded-lg">
                          {member.handleOrOrg}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-teal-950/50">{dateStr}</span>
                      <select
                        disabled={updatingId === member.id}
                        value={member.status}
                        onChange={(e) => handleStatusChange(member.id, e.target.value)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-black border transition ${
                          member.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : member.status === "CONTACTED"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : member.status === "ARCHIVED"
                            ? "bg-gray-100 text-gray-700 border-gray-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Body Details Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-teal-950/50">Applicant Name</div>
                      <div className="text-sm font-bold text-teal-950">{member.name}</div>
                      {member.city && <div className="text-teal-950/60 font-medium">📍 {member.city}</div>}
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-teal-950/50">Contact Numbers</div>
                      <div className="font-bold text-teal-900">{member.phone}</div>
                      <div className="text-teal-950/60 text-[11px] truncate">{member.email}</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-teal-950/50">Organization / Reach</div>
                      <div className="font-semibold text-teal-950 truncate">
                        {member.handleOrOrg || "Individual Sevak"}
                      </div>
                      {member.reach && (
                        <div className="text-purple-700 font-bold text-[11px]">Audience: {member.reach}</div>
                      )}
                    </div>

                    {/* Direct Contact CTAs */}
                    <div className="flex items-center gap-2 sm:justify-end">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs transition"
                      >
                        <span>💬 WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-900/20 bg-cream px-3 py-2 text-xs font-bold text-teal-900 hover:bg-sand transition"
                      >
                        <span>📞 Call</span>
                      </a>
                    </div>
                  </div>

                  {/* Skills / Interests Badges */}
                  {member.skills && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-950/50 mr-1">
                        Skills / Focus:
                      </span>
                      {member.skills.split(",").map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-teal-900/5 border border-teal-900/10 px-2 py-0.5 text-[11px] font-semibold text-teal-900"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message / Motivation Note */}
                  {member.message && (
                    <div className="rounded-xl bg-cream/70 p-3 text-xs text-teal-950/80 border border-teal-900/5">
                      <span className="font-bold text-teal-900">Message: </span>
                      &ldquo;{member.message}&rdquo;
                    </div>
                  )}

                  {/* Admin Notes Section */}
                  <div className="pt-2 border-t border-teal-900/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder={member.adminNotes ? `Notes: ${member.adminNotes}` : "Add internal admin note..."}
                      value={activeNotes[member.id] ?? (member.adminNotes || "")}
                      onChange={(e) => setActiveNotes({ ...activeNotes, [member.id]: e.target.value })}
                      className="flex-1 rounded-xl border border-teal-900/15 bg-white px-3 py-1.5 text-xs text-teal-950 placeholder:text-teal-950/40 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      disabled={updatingId === member.id}
                      onClick={() => handleSaveNotes(member.id)}
                      className="rounded-xl bg-teal-900/10 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-900/20 transition shrink-0"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
