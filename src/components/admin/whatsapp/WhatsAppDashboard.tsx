"use client";

import { useEffect, useState } from "react";
import { TeamInbox } from "./TeamInbox";
import { formatINR } from "@/lib/site";

type WhatsAppTab =
  | "inbox"
  | "contacts"
  | "templates"
  | "campaigns"
  | "automations"
  | "ai"
  | "copilot"
  | "settings";

interface WhatsAppDashboardProps {
  initialSession: {
    user: {
      id?: number;
      displayName: string;
      email: string;
      role: string;
    };
  };
  initialTab?: WhatsAppTab;
}

export function WhatsAppDashboard({ initialSession, initialTab = "inbox" }: WhatsAppDashboardProps) {
  const [activeTab, setActiveTab] = useState<WhatsAppTab>(initialTab);
  const [notification, setNotification] = useState("");

  // Health State
  const [health, setHealth] = useState<any>(null);

  // Contacts State
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [newContactModal, setNewContactModal] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newLang, setNewLang] = useState("en");

  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);

  // Campaigns State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [newCampaignModal, setNewCampaignModal] = useState(false);
  const [campName, setCampName] = useState("");
  const [campPurpose, setCampPurpose] = useState("ANNADANA_APPEAL");
  const [campSegment, setCampSegment] = useState("ALL");
  const [campText, setCampText] = useState("");
  const [campTemplateName, setCampTemplateName] = useState("");

  // Automations State
  const [automations, setAutomations] = useState<any[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);

  // Knowledge Base State
  const [knowledgeDocs, setKnowledgeDocs] = useState<any[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [newDocModal, setNewDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docType, setDocType] = useState("FAQ");

  // AI Copilot State
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotOccasion, setCopilotOccasion] = useState("annadana");
  const [copilotLanguage, setCopilotLanguage] = useState("en");
  const [copilotGenerated, setCopilotGenerated] = useState("");
  const [copilotGenerating, setCopilotGenerating] = useState(false);

  // Test Message State
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load Health
  async function loadHealth() {
    try {
      const res = await fetch("/api/admin/whatsapp/health");
      const data = await res.json();
      setHealth(data);
    } catch {}
  }

  // Load Contacts
  async function loadContacts() {
    setContactsLoading(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/contacts?search=${encodeURIComponent(contactSearch)}`);
      const data = await res.json();
      if (res.ok) setContacts(data.contacts || []);
    } catch {}
    finally { setContactsLoading(false); }
  }

  // Load Templates
  async function loadTemplates() {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/templates");
      const data = await res.json();
      if (res.ok) setTemplates(data.templates || []);
    } catch {}
    finally { setTemplatesLoading(false); }
  }

  // Sync Templates from Meta
  async function handleSyncTemplates() {
    setSyncingTemplates(true);
    try {
      const res = await fetch("/api/admin/whatsapp/templates", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotification(`✨ Synced ${data.syncedCount} templates successfully!`);
        await loadTemplates();
      }
    } catch {}
    finally { setSyncingTemplates(false); }
  }

  // Load Campaigns
  async function loadCampaigns() {
    setCampaignsLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/campaigns");
      const data = await res.json();
      if (res.ok) setCampaigns(data.campaigns || []);
    } catch {}
    finally { setCampaignsLoading(false); }
  }

  // Dispatch Campaign Batch
  async function handleDispatchCampaign(id: number) {
    try {
      const res = await fetch(`/api/admin/whatsapp/campaigns/${id}/dispatch`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Dispatched ${data.processed} messages (${data.successCount} sent, ${data.failCount} failed).`);
        await loadCampaigns();
      }
    } catch {}
  }

  // Create Campaign
  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!campName.trim()) return;

    try {
      const res = await fetch("/api/admin/whatsapp/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campName.trim(),
          purpose: campPurpose,
          templateName: campTemplateName.trim() || undefined,
          customText: campText.trim() || undefined,
          audienceCriteria: { segment: campSegment },
        }),
      });
      if (res.ok) {
        setNotification("✨ Campaign created and send queue initialized!");
        setNewCampaignModal(false);
        setCampName("");
        setCampText("");
        await loadCampaigns();
      }
    } catch {}
  }

  // Load Automations
  async function loadAutomations() {
    setAutomationsLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/automations");
      const data = await res.json();
      if (res.ok) setAutomations(data.automations || []);
    } catch {}
    finally { setAutomationsLoading(false); }
  }

  // Toggle Automation
  async function handleToggleAutomation(id: number, enabled: boolean) {
    try {
      const res = await fetch("/api/admin/whatsapp/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (res.ok) {
        setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
      }
    } catch {}
  }

  // Load Knowledge
  async function loadKnowledge() {
    setKnowledgeLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/knowledge");
      const data = await res.json();
      if (res.ok) setKnowledgeDocs(data.documents || []);
    } catch {}
    finally { setKnowledgeLoading(false); }
  }

  // Save Knowledge Doc
  async function handleSaveKnowledgeDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    try {
      const res = await fetch("/api/admin/whatsapp/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle.trim(),
          content: docContent.trim(),
          sourceType: docType,
        }),
      });
      if (res.ok) {
        setNotification("✨ Knowledge document published to AI RAG engine!");
        setNewDocModal(false);
        setDocTitle("");
        setDocContent("");
        await loadKnowledge();
      }
    } catch {}
  }

  // AI Copilot Generate
  async function handleGenerateCopy() {
    setCopilotGenerating(true);
    try {
      const res = await fetch("/api/admin/whatsapp/ai-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: copilotPrompt,
          occasion: copilotOccasion,
          language: copilotLanguage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.copy) {
        setCopilotGenerated(data.copy);
      }
    } catch {}
    finally { setCopilotGenerating(false); }
  }

  // Send Test Message
  async function handleSendTestMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(
          data.mockMode
            ? `✅ Simulated test dispatch to ${data.sentTo} (WAMID: ${data.wamId}). Set WHATSAPP_ACCESS_TOKEN for live Meta delivery.`
            : `🎉 Live Meta WhatsApp message dispatched to ${data.sentTo}! WAMID: ${data.wamId}`
        );
      } else {
        setTestResult(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Network error: ${err?.message}`);
    } finally {
      setTestSending(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (activeTab === "contacts") loadContacts();
    if (activeTab === "templates") loadTemplates();
    if (activeTab === "campaigns") loadCampaigns();
    if (activeTab === "automations") loadAutomations();
    if (activeTab === "ai") loadKnowledge();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Ribbon */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white text-xs">
                WA
              </span>
              <h1 className="text-xl md:text-2xl font-bold font-display">
                Janaseva AI WhatsApp CRM &amp; Broadcast Engine
              </h1>
            </div>
            <p className="mt-1 text-xs text-white/75">
              Direct Meta Cloud API v21.0 · Grounded Bilingual AI Chatbot (Kannada &amp; English) · Automated 80G Receipts · 25 Boys Care
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-1.5 backdrop-blur-xs">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold">
                {health?.status === "OK" ? "Meta Cloud API: Connected" : "Meta Gateway: Ready"}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {[
            { id: "inbox", label: "💬 Team Inbox" },
            { id: "contacts", label: "👥 Contacts & Opt-Ins" },
            { id: "templates", label: "📜 Meta Templates" },
            { id: "campaigns", label: "📢 Broadcast Campaigns" },
            { id: "automations", label: "⚡ Automations" },
            { id: "ai", label: "🧠 Grounded AI & Knowledge" },
            { id: "copilot", label: "✍️ AI Campaign Copilot" },
            { id: "settings", label: "⚙️ Integration & Test" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id as WhatsAppTab);
                setNotification("");
              }}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === t.id
                  ? "bg-white text-teal-950 shadow-md ring-2 ring-saffron/40"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm font-semibold text-emerald-900 flex items-center justify-between shadow-xs">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification("")}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TAB: TEAM INBOX */}
      {/* ========================================================================= */}
      {activeTab === "inbox" && (
        <TeamInbox currentUserId={initialSession.user.id} />
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: CONTACTS & OPT-INS */}
      {/* ========================================================================= */}
      {activeTab === "contacts" && (
        <div className="rounded-3xl border border-teal-900/10 bg-white p-6 shadow-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-base text-teal-950 font-display">WhatsApp Contacts &amp; Consent Registry</h3>
              <p className="text-xs text-teal-950/60">
                Manage donor identities, opt-in/opt-out status, and preferred communication language.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search phone or name..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadContacts()}
                className="rounded-xl border border-teal-900/15 bg-cream/30 px-3 py-1.5 text-xs text-teal-950 focus:border-teal-900 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={loadContacts}
                className="rounded-xl bg-teal-950 px-3 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-teal-950">
              <thead className="bg-cream/40 text-[11px] font-bold uppercase tracking-wider text-teal-950/70 border-y border-teal-900/10">
                <tr>
                  <th className="p-3">Donor Name</th>
                  <th className="p-3">Phone (E.164)</th>
                  <th className="p-3">Language</th>
                  <th className="p-3">Last Seva Contribution</th>
                  <th className="p-3">Opt-In Status</th>
                  <th className="p-3">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {contactsLoading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-teal-950/40">
                      Loading contacts...
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-teal-950/40">
                      No contacts found.
                    </td>
                  </tr>
                ) : (
                  contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-cream/20">
                      <td className="p-3 font-semibold">{c.displayName || "Supporter"}</td>
                      <td className="p-3 font-mono">{c.normalizedPhone}</td>
                      <td className="p-3 uppercase font-bold text-[10px]">
                        {c.preferredLanguage === "kn" ? "ಕನ್ನಡ (KN)" : "English (EN)"}
                      </td>
                      <td className="p-3">
                        {c.lastDonationAmount ? (
                          <span className="font-bold text-emerald-700">
                            {formatINR(c.lastDonationAmount)}
                          </span>
                        ) : (
                          <span className="text-teal-950/40">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.optInStatus
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {c.optInStatus ? "Consented ✓" : "Opted Out ✗"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(c.tags || []).map((t: string, i: number) => (
                            <span
                              key={i}
                              className="rounded-md bg-teal-900/10 px-1.5 py-0.2 text-[9px] font-bold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: META TEMPLATES */}
      {/* ========================================================================= */}
      {activeTab === "templates" && (
        <div className="rounded-3xl border border-teal-900/10 bg-white p-6 shadow-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-base text-teal-950 font-display">Meta Approved Message Templates</h3>
              <p className="text-xs text-teal-950/60">
                Official pre-approved templates for Annadana appeals, 80G receipts, and birthday seva wishes.
              </p>
            </div>
            <button
              type="button"
              disabled={syncingTemplates}
              onClick={handleSyncTemplates}
              className="rounded-2xl bg-teal-950 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-900 transition cursor-pointer"
            >
              {syncingTemplates ? "Syncing..." : "🔄 Sync from Meta"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {templatesLoading ? (
              <div className="col-span-2 p-6 text-center text-teal-950/40 text-xs">
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="col-span-2 p-6 text-center text-teal-950/40 text-xs">
                No templates synced yet. Click "Sync from Meta" to fetch approved templates.
              </div>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-teal-900/10 bg-cream/20 p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-950">{tpl.name}</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                      {tpl.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-teal-950/60">
                    <span className="font-semibold uppercase">{tpl.category}</span>
                    <span>·</span>
                    <span className="font-semibold uppercase">Lang: {tpl.language}</span>
                  </div>
                  <div className="mt-3 rounded-xl bg-white p-3 border border-teal-900/5 text-xs text-teal-950/80 leading-relaxed font-sans">
                    {tpl.components?.find((c: any) => c.type === "BODY")?.text || "Template structure ready."}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: BROADCAST CAMPAIGNS */}
      {/* ========================================================================= */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-3xl border border-teal-900/10 bg-white p-6 shadow-md">
            <div>
              <h3 className="font-bold text-base text-teal-950 font-display">Broadcast Seva Campaigns</h3>
              <p className="text-xs text-teal-950/60">
                Send targeted WhatsApp updates to consented donors with durable rate-limited queuing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewCampaignModal(true)}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
            >
              + Create Campaign
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {campaignsLoading ? (
              <div className="col-span-2 p-6 text-center text-teal-950/40 text-xs">
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="col-span-2 p-6 text-center text-teal-950/40 text-xs">
                No campaigns created yet. Click "+ Create Campaign" to launch a broadcast.
              </div>
            ) : (
              campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="rounded-3xl border border-teal-900/10 bg-white p-5 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-teal-950 font-display">{camp.name}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          camp.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : camp.status === "PROCESSING"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>
                    <p className="text-xs text-teal-950/60 mt-1">
                      Purpose: <span className="font-semibold">{camp.purpose}</span> · Template:{" "}
                      <span className="font-mono">{camp.templateName || "Custom Text"}</span>
                    </p>

                    {/* Progress Stat Bars */}
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-cream p-2">
                        <span className="block text-[10px] text-teal-950/60">Queued</span>
                        <span className="text-sm font-bold text-teal-950">{camp.queuedCount}</span>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-2">
                        <span className="block text-[10px] text-blue-700">Sent</span>
                        <span className="text-sm font-bold text-blue-900">{camp.sentCount}</span>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-2">
                        <span className="block text-[10px] text-emerald-700">Delivered</span>
                        <span className="text-sm font-bold text-emerald-900">{camp.deliveredCount}</span>
                      </div>
                      <div className="rounded-xl bg-red-50 p-2">
                        <span className="block text-[10px] text-red-700">Failed</span>
                        <span className="text-sm font-bold text-red-900">{camp.failedCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-teal-900/10 pt-3">
                    <span className="text-[10px] text-teal-950/50">
                      Total: {camp.totalRecipients} recipients
                    </span>
                    {camp.status !== "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => handleDispatchCampaign(camp.id)}
                        className="rounded-xl bg-teal-950 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-900 transition cursor-pointer"
                      >
                        🚀 Dispatch Batch (25)
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New Campaign Modal */}
          {newCampaignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                <h3 className="text-base font-bold text-teal-950 font-display">Create WhatsApp Broadcast</h3>
                <form onSubmit={handleCreateCampaign} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-teal-950">Campaign Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Navratri Annadana Appeal for 25 Boys"
                      value={campName}
                      onChange={(e) => setCampName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-teal-900/15 bg-cream/30 p-2 text-xs text-teal-950 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950">Target Segment</label>
                    <select
                      value={campSegment}
                      onChange={(e) => setCampSegment(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-teal-900/15 bg-white p-2 text-xs text-teal-950 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Consented Donors</option>
                      <option value="ANNADANA">Annadana &amp; Meal Donors</option>
                      <option value="SPONSOR_25_BOYS">Sponsor 25 Boys Supporters</option>
                      <option value="HIGH_VALUE">High-Value Donors (₹5,000+)</option>
                      <option value="MONTHLY_DONORS">Monthly Regular Donors</option>
                      <option value="INACTIVE_60_DAYS">Inactive (Last donation &gt; 60 days ago)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950">Approved Template (Optional)</label>
                    <select
                      value={campTemplateName}
                      onChange={(e) => setCampTemplateName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-teal-900/15 bg-white p-2 text-xs text-teal-950 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">None (Use Custom Message)</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.name}>
                          {tpl.name} ({tpl.language})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!campTemplateName && (
                    <div>
                      <label className="block text-xs font-bold text-teal-950">Custom Message Text</label>
                      <textarea
                        rows={4}
                        placeholder="Type message text..."
                        value={campText}
                        onChange={(e) => setCampText(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-teal-900/15 bg-cream/30 p-2 text-xs text-teal-950 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewCampaignModal(false)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-cream cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-teal-950 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-900 cursor-pointer"
                    >
                      Initialize Campaign
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: AUTOMATIONS */}
      {/* ========================================================================= */}
      {activeTab === "automations" && (
        <div className="rounded-3xl border border-teal-900/10 bg-white p-6 shadow-md">
          <h3 className="font-bold text-base text-teal-950 font-display">Workflow Rules &amp; Triggers</h3>
          <p className="text-xs text-teal-950/60 mt-0.5">
            Event-driven triggers that dispatch immediate WhatsApp communications on verified actions.
          </p>

          <div className="mt-6 space-y-4">
            {automationsLoading ? (
              <div className="p-6 text-center text-teal-950/40 text-xs">Loading automations...</div>
            ) : (
              automations.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-teal-900/10 bg-cream/20 p-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-950 text-white font-bold text-xs">
                        ⚡
                      </span>
                      <h4 className="font-bold text-sm text-teal-950">{a.name}</h4>
                    </div>
                    <p className="text-xs text-teal-950/60 mt-1">
                      Trigger Event: <span className="font-mono font-bold">{a.triggerType}</span>
                    </p>
                  </div>

                  <div className="mt-3 sm:mt-0 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleAutomation(a.id, !a.enabled)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                        a.enabled
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {a.enabled ? "Enabled ✓" : "Disabled"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: GROUNDED AI & KNOWLEDGE BASE */}
      {/* ========================================================================= */}
      {activeTab === "ai" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-3xl border border-teal-900/10 bg-white p-6 shadow-md">
            <div>
              <h3 className="font-bold text-base text-teal-950 font-display">Grounded AI Knowledge Base (RAG)</h3>
              <p className="text-xs text-teal-950/60">
                Verified facts about Janaseva Ashrama, legal registration, 80G tax approvals, and Annadana costs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewDocModal(true)}
              className="rounded-2xl bg-teal-950 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-900 transition cursor-pointer"
            >
              + Add Document
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {knowledgeLoading ? (
              <div className="col-span-2 p-6 text-center text-teal-950/40 text-xs">
                Loading knowledge documents...
              </div>
            ) : (
              knowledgeDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-teal-900/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-teal-950 font-display">{doc.title}</h4>
                    <span className="rounded-md bg-teal-900/10 text-teal-900 px-2 py-0.5 text-[9px] font-bold uppercase">
                      {doc.sourceType}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-teal-950/80 leading-relaxed font-sans whitespace-pre-wrap">
                    {doc.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add Doc Modal */}
          {newDocModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                <h3 className="text-base font-bold text-teal-950 font-display">Add Knowledge Document</h3>
                <form onSubmit={handleSaveKnowledgeDoc} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-teal-950">Document Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annadana Meal Timings & Menu"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-teal-900/15 bg-cream/30 p-2 text-xs text-teal-950 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950">Category</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-teal-900/15 bg-white p-2 text-xs text-teal-950 focus:outline-hidden cursor-pointer"
                    >
                      <option value="FAQ">FAQ</option>
                      <option value="LEGAL">Legal &amp; Compliance</option>
                      <option value="SEVA_CATALOG">Seva Catalog &amp; Tiers</option>
                      <option value="VISITING_HOURS">Visiting Hours &amp; Location</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950">Content Body *</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Write factual details..."
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-teal-900/15 bg-cream/30 p-2 text-xs text-teal-950 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewDocModal(false)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-cream cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-teal-950 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-900 cursor-pointer"
                    >
                      Publish to AI RAG
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB: AI CAMPAIGN COPILOT */}
      {/* ========================================================================= */}
      {activeTab === "copilot" && (
        <div className="rounded-3xl border border-teal-900/10 bg-white p-6 shadow-md">
          <h3 className="font-bold text-base text-teal-950 font-display">AI Campaign Copilot</h3>
          <p className="text-xs text-teal-950/60 mt-0.5">
            Generate high-converting, compliant WhatsApp broadcast copy in English and Kannada with verified organization facts.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal-950">Occasion / Seva Focus</label>
                <select
                  value={copilotOccasion}
                  onChange={(e) => setCopilotOccasion(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-teal-900/15 bg-white p-2.5 text-xs text-teal-950 focus:outline-hidden cursor-pointer"
                >
                  <option value="annadana">Daily Meals for 25 Boys (₹4,500)</option>
                  <option value="birthday">Birthday &amp; Special Day Seva Feast (₹5,000)</option>
                  <option value="ration">Monthly Ration Provision (₹6,000)</option>
                  <option value="festival">Festival Annadana Feast</option>
                  <option value="education">School Uniforms &amp; Books Kit (₹2,500)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950">Language</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCopilotLanguage("en")}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                      copilotLanguage === "en"
                        ? "bg-teal-950 text-white shadow-sm"
                        : "bg-cream text-teal-950/70 border border-teal-900/10"
                    }`}
                  >
                    English (EN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCopilotLanguage("kn")}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                      copilotLanguage === "kn"
                        ? "bg-teal-950 text-white shadow-sm"
                        : "bg-cream text-teal-950/70 border border-teal-900/10"
                    }`}
                  >
                    ಕನ್ನಡ (Kannada)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950">Custom Strategic Instructions (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Focus on Navratri festival, highlight Section 80G tax deduction..."
                  value={copilotPrompt}
                  onChange={(e) => setCopilotPrompt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-teal-900/15 bg-cream/30 p-2.5 text-xs text-teal-950 focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                disabled={copilotGenerating}
                onClick={handleGenerateCopy}
                className="w-full rounded-2xl bg-emerald-600 p-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copilotGenerating ? "✨ Generating AI Broadcast..." : "✨ Generate WhatsApp Copy"}
              </button>
            </div>

            <div className="flex flex-col">
              <label className="block text-xs font-bold text-teal-950 mb-1">Generated WhatsApp Broadcast Draft</label>
              <div className="flex-1 rounded-2xl border border-teal-900/10 bg-cream/20 p-4 text-xs font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
                {copilotGenerated || (
                  <span className="text-teal-950/40 italic">
                    Generated broadcast message with Meta WhatsApp tags will appear here. Click "Generate" to create.
                  </span>
                )}
              </div>
              {copilotGenerated && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(copilotGenerated);
                    setNotification("📋 Copied WhatsApp draft to clipboard!");
                  }}
                  className="mt-2 rounded-xl bg-teal-950 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-900 transition cursor-pointer"
                >
                  Copy to Clipboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB: INTEGRATION & TEST TOOL */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="rounded-3xl border border-teal-900/10 bg-white p-6 shadow-md space-y-6">
          <div>
            <h3 className="font-bold text-base text-teal-950 font-display">Meta WhatsApp Cloud API Configuration</h3>
            <p className="text-xs text-teal-950/60 mt-0.5">
              Secure official Meta Graph API v21.0 integration details.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-teal-900/10 bg-cream/20 p-4">
              <span className="text-xs font-bold text-teal-950 block">Webhook Ingestion Endpoint</span>
              <p className="mt-1 font-mono text-xs text-teal-900 bg-white p-2 rounded-xl border border-teal-900/10 select-all">
                https://www.janasevaashrama.org/api/webhook/whatsapp
              </p>
              <span className="text-[10px] text-teal-950/60 mt-1 block">
                Method: GET (Verification) &amp; POST (HMAC-SHA256 Inbound Messages &amp; Status Receipts)
              </span>
            </div>

            <div className="rounded-2xl border border-teal-900/10 bg-cream/20 p-4">
              <span className="text-xs font-bold text-teal-950 block">Registered Webhook Verify Token</span>
              <p className="mt-1 font-mono text-xs text-teal-900 bg-white p-2 rounded-xl border border-teal-900/10 select-all">
                janaseva_waba_webhook_verify_secure_token_2026
              </p>
              <span className="text-[10px] text-teal-950/60 mt-1 block">
                Configured via WHATSAPP_VERIFY_TOKEN in .env
              </span>
            </div>
          </div>

          {/* Test Sender Tool */}
          <div className="rounded-2xl border border-teal-900/15 bg-gradient-to-br from-teal-950 to-slate-900 p-5 text-white">
            <h4 className="font-bold text-sm font-display">🧪 Live WhatsApp Integration Tester</h4>
            <p className="text-xs text-white/70 mt-0.5">
              Send an instant verification WhatsApp message to your mobile phone to verify message throughput and delivery callbacks.
            </p>

            <form onSubmit={handleSendTestMessage} className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                required
                placeholder="Enter 10-digit mobile or +91XXXXXXXXXX"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={testSending}
                className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition disabled:opacity-50 cursor-pointer"
              >
                {testSending ? "Sending..." : "Dispatch Test WhatsApp"}
              </button>
            </form>

            {testResult && (
              <div className="mt-3 rounded-xl bg-white/10 p-3 text-xs leading-relaxed font-mono">
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
