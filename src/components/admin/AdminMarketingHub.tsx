"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";
import type {
  MarketingConfig,
  GeneratedCampaign,
} from "@/lib/marketing-agent";

interface AdminMarketingHubProps {
  campaignsList: any[];
  campaignsLoading: boolean;
  loadCampaigns: () => Promise<void>;
  handlePatchCampaign: (id: number, data: any) => Promise<void>;
  handleDeleteCampaign: (id: number) => Promise<void>;
  setEditingCampaign: (c: any) => void;
  setNewCampaignModalOpen: (open: boolean) => void;
  setNotification: (msg: string) => void;
}

type MarketingSubtab =
  | "generator"
  | "meta"
  | "google"
  | "geo_aeo"
  | "apis"
  | "whatsapp"
  | "campaigns";

export function AdminMarketingHub({
  campaignsList,
  campaignsLoading,
  loadCampaigns,
  handlePatchCampaign,
  handleDeleteCampaign,
  setEditingCampaign,
  setNewCampaignModalOpen,
  setNotification,
}: AdminMarketingHubProps) {
  const [subtab, setSubtab] = useState<MarketingSubtab>("generator");
  const [config, setConfig] = useState<MarketingConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // AI Campaign Generator State
  const [selectedAngle, setSelectedAngle] = useState<
    "birthday" | "annadana" | "shagun" | "tax80g" | "education" | "festival"
  >("birthday");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatingCampaign, setGeneratingCampaign] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<GeneratedCampaign | null>(null);

  // Meta CAPI Testing State
  const [testingCapi, setTestingCapi] = useState(false);
  const [capiResult, setCapiResult] = useState<any | null>(null);

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // WhatsApp Broadcast State
  const [waTemplate, setWaTemplate] = useState("shagun");
  const [waCustomMsg, setWaCustomMsg] = useState("");

  // ROAS Interactive Calculator State
  const [calcMonthlySpend, setCalcMonthlySpend] = useState<number>(15000);
  const [calcAvgDonation, setCalcAvgDonation] = useState<number>(3500);
  const [calcEstimatedDonors, setCalcEstimatedDonors] = useState<number>(18);

  // Load config on mount
  useEffect(() => {
    void fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/admin/marketing");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        if (data.config?.savedCampaigns?.length > 0 && !activeCampaign) {
          setActiveCampaign(data.config.savedCampaigns[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load marketing config:", e);
    } finally {
      setLoadingConfig(false);
    }
  }

  async function handleSaveConfig() {
    if (!config) return;
    setSavingConfig(true);
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_config",
          config,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setNotification("✓ Marketing API keys and configuration saved successfully!");
      } else {
        setNotification("✕ Failed to save configuration. Please try again.");
      }
    } catch {
      setNotification("✕ Error saving configuration.");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleGenerateCampaign() {
    setGeneratingCampaign(true);
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_campaign",
          angle: selectedAngle,
          customPrompt,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCampaign(data.campaign);
        if (config) {
          setConfig({
            ...config,
            savedCampaigns: [data.campaign, ...(config.savedCampaigns || [])],
          });
        }
        setNotification("✓ Campaign generated successfully with copy, targeting & visuals!");
      } else {
        setNotification("✕ Failed to generate campaign.");
      }
    } catch {
      setNotification("✕ Error during campaign generation.");
    } finally {
      setGeneratingCampaign(false);
    }
  }

  async function handleDeleteSavedCampaign(campId: string) {
    if (!confirm("Remove this campaign blueprint from history?")) return;
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_campaign",
          campaignId: campId,
        }),
      });
      if (res.ok) {
        if (config) {
          setConfig({
            ...config,
            savedCampaigns: config.savedCampaigns.filter((c) => c.id !== campId),
          });
        }
        if (activeCampaign?.id === campId) {
          setActiveCampaign(config?.savedCampaigns?.[0] || null);
        }
        setNotification("✓ Campaign removed.");
      }
    } catch {
      setNotification("✕ Failed to delete campaign.");
    }
  }

  async function handleTestCapi() {
    setTestingCapi(true);
    setCapiResult(null);
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_capi",
        }),
      });
      const data = await res.json();
      setCapiResult(data);
      if (data.ok) {
        setNotification("✓ Meta CAPI test executed! Verified standard 'Donate' event.");
      } else {
        setNotification("⚠️ Meta CAPI responded with notice: " + (data.error || "Check payload"));
      }
    } catch (e: any) {
      setCapiResult({ ok: false, error: e?.message || "Network test failed" });
      setNotification("✕ CAPI test failed.");
    } finally {
      setTestingCapi(false);
    }
  }

  function copyToClipboard(text: string, key: string, label: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setNotification(`✓ Copied ${label} to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  }

  // ROAS calculations
  const totalProjectedDonations = calcAvgDonation * calcEstimatedDonors;
  const computedRoas =
    calcMonthlySpend > 0 ? (totalProjectedDonations / calcMonthlySpend).toFixed(2) : "0.00";
  const netRaised = totalProjectedDonations - calcMonthlySpend;

  return (
    <div className="space-y-6">
      {/* ================= HEADER & KPI OVERVIEW ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-saffron/20 px-2.5 py-0.5 text-xs font-bold text-saffron-dark uppercase tracking-wider mb-1">
            <span>Autonomous AI Growth Engine</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
            Marketing Agent &amp; FinTech Ad Operations Hub
          </h3>
          <p className="text-xs text-teal-950/70 max-w-3xl mt-0.5">
            Full nonprofit advertising suite powered by{" "}
            <a
              href="https://meta-ads.si/how-do-meta-ads-work-for-nonprofits/"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 underline font-semibold hover:text-emerald-900"
            >
              Meta Ads for Nonprofits Strategy
            </a>
            , Google $10K/mo Ad Grants, Local Bangalore GEO citations, AEO Engine Optimization, and
            automated CAPI server-to-server tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNewCampaignModalOpen(true)}
            className="rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-saffron-dark transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ New Crowd Campaign</span>
          </button>
        </div>
      </div>

      {/* ================= SUBTAB NAVIGATION ================= */}
      <div className="flex items-center gap-1 border-b border-teal-900/10 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "generator", label: "🤖 AI Campaign Generator", badge: "Live" },
          { id: "meta", label: "📘 Meta Ads Playbook & ROAS", badge: "meta-ads.si" },
          { id: "google", label: "🎯 Google Ads & $10K Grants", badge: "Free Grant" },
          { id: "geo_aeo", label: "🌐 Local Bangalore GEO & AEO", badge: "Perplexity/AI" },
          { id: "apis", label: "⚙️ Ad APIs & CAPI Tracking", badge: "Meta & Google" },
          { id: "whatsapp", label: "💬 1-Click WhatsApp Hub", badge: "Instant" },
          { id: "campaigns", label: `📁 Crowd Campaigns (${campaignsList.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubtab(tab.id as MarketingSubtab)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              subtab === tab.id
                ? "bg-teal-900 text-white shadow-sm"
                : "text-teal-900/70 hover:bg-teal-900/10 hover:text-teal-950"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider ${
                  subtab === tab.id ? "bg-white/20 text-gold" : "bg-teal-900/10 text-teal-900"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ================= 1. AI CAMPAIGN GENERATOR ================= */}
      {subtab === "generator" && (
        <div className="space-y-6">
          {/* Generator Controls */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-teal-900/10 pb-3">
              <div>
                <h4 className="font-display text-base font-bold text-teal-950">
                  Select Cause Angle &amp; Generate Omnichannel Ad Blueprint
                </h4>
                <p className="text-xs text-teal-950/65">
                  Generates psychological ad copies, 15 Google RSA headlines, targeted Bangalore
                  audiences, Midjourney/Flux visual creative prompts, and real Ashrama matching
                  media.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ⚡ 1-Click Multi-Channel Generation
              </span>
            </div>

            {/* Angle Selection Chips */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-2">
                Choose Campaign Angle:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {[
                  {
                    id: "birthday",
                    label: "🎂 Birthday Feast & Video Blessing",
                    desc: "₹2k - ₹5.5k lunch with video greeting",
                  },
                  {
                    id: "shagun",
                    label: "🍛 Sacred Shagun Annadana",
                    desc: "₹11 milk, ₹51 breakfast, ₹101 lunch",
                  },
                  {
                    id: "tax80g",
                    label: "🛡️ Section 80G Tax Deductions",
                    desc: "50% tax off, Form 10AC verified",
                  },
                  {
                    id: "education",
                    label: "📚 Vidya Kits & Schooling",
                    desc: "₹251 notebooks, uniforms & tuition",
                  },
                  {
                    id: "annadana",
                    label: "🍚 Monthly Ration & Groceries",
                    desc: "Sona Masoori rice, pulses & ghee",
                  },
                  {
                    id: "festival",
                    label: "🎉 Festival Sweets & Special Meals",
                    desc: "Ugadi, Diwali, Deepotsava celebrations",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAngle(item.id as any)}
                    className={`rounded-2xl p-3 text-left transition cursor-pointer border ${
                      selectedAngle === item.id
                        ? "bg-teal-900 text-white border-teal-900 shadow-sm"
                        : "bg-cream/30 text-teal-950 border-teal-900/10 hover:bg-cream/60"
                    }`}
                  >
                    <p className="text-xs font-bold leading-snug">{item.label}</p>
                    <p
                      className={`text-[10px] mt-0.5 line-clamp-1 ${
                        selectedAngle === item.id ? "text-gold" : "text-teal-950/60"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Directives */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Custom Directives / Specific Instructions (Optional):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Highlight upcoming Ugadi festival, emphasize South Bangalore donors near Banashankari, mention hot Payasam..."
                  className="w-full rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs text-teal-950 placeholder:text-teal-950/40 focus:border-teal-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateCampaign}
                  disabled={generatingCampaign}
                  className="rounded-xl bg-teal-900 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5"
                >
                  {generatingCampaign ? (
                    <span>Generating...</span>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Generate Omnichannel Blueprint</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Render Active Generated Campaign */}
          {activeCampaign ? (
            <div className="space-y-6">
              {/* Campaign Summary Bar */}
              <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-950 to-teal-900 p-5 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold">
                      {activeCampaign.angleLabel}
                    </span>
                    <span className="text-xs text-white/70">
                      Target ROAS:{" "}
                      <strong className="text-emerald-300">{activeCampaign.targetRoas}x</strong>
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-bold text-white">
                    {activeCampaign.campaignName}
                  </h4>
                  <p className="text-xs text-white/75 mt-0.5">
                    Objective: {activeCampaign.objective} · Recommended Budget: ₹
                    {activeCampaign.metaStrategy.budget.dailyInr}/day
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(activeCampaign, null, 2),
                        "all_json",
                        "Complete Campaign Blueprint JSON",
                      )
                    }
                    className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition cursor-pointer"
                  >
                    {copiedKey === "all_json" ? "✓ Copied!" : "📋 Copy Full Blueprint"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedCampaign(activeCampaign.id)}
                    className="rounded-xl bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Grid: Meta Ads Copy & Google RSA Copy */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* META ADS STRATEGY */}
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-900/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
                        f
                      </span>
                      <h5 className="font-display text-sm font-bold text-teal-950">
                        Meta Ads (Instagram &amp; Facebook)
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      CTA: {activeCampaign.metaStrategy.callToAction}
                    </span>
                  </div>

                  {/* Primary Texts */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-teal-950">
                      Primary Ad Texts (3 Variations):
                    </label>
                    {activeCampaign.metaStrategy.primaryTexts.map((txt, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-cream/30 p-3 border border-teal-900/10 text-xs text-teal-950 relative group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[10px] text-teal-900/60 uppercase">
                            Variation {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(txt, `primary_${idx}`, `Primary Text ${idx + 1}`)
                            }
                            className="text-[10px] font-bold text-teal-900 hover:text-saffron-dark cursor-pointer"
                          >
                            {copiedKey === `primary_${idx}` ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">{txt}</p>
                      </div>
                    ))}
                  </div>

                  {/* Headlines */}
                  <div>
                    <label className="block text-xs font-bold text-teal-950 mb-1.5">
                      Ad Headlines (High CTR Hooks):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCampaign.metaStrategy.headlines.map((hl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => copyToClipboard(hl, `hl_${idx}`, `Headline "${hl}"`)}
                          className="rounded-lg bg-teal-900/5 px-2.5 py-1 text-xs text-teal-950 font-semibold hover:bg-teal-900/10 transition cursor-pointer border border-teal-900/10 flex items-center gap-1"
                        >
                          <span>{hl}</span>
                          <span className="text-[9px] text-teal-900/40">
                            {copiedKey === `hl_${idx}` ? "✓" : "📋"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audience Targeting */}
                  <div className="rounded-2xl bg-teal-950 p-4 text-white text-xs space-y-2">
                    <h6 className="font-bold text-gold text-[11px] uppercase tracking-wider">
                      🎯 Meta Audience Parameters:
                    </h6>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-white/60">Ages:</span>{" "}
                        <strong className="text-white">
                          {activeCampaign.metaStrategy.targeting.ageRange}
                        </strong>
                      </div>
                      <div>
                        <span className="text-white/60">Gender:</span>{" "}
                        <strong className="text-white">
                          {activeCampaign.metaStrategy.targeting.gender}
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-white/60">Locations:</span>
                      <p className="font-semibold text-white/90 mt-0.5">
                        {activeCampaign.metaStrategy.targeting.locations.join(" · ")}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60">Interests:</span>
                      <p className="font-semibold text-emerald-300 mt-0.5">
                        {activeCampaign.metaStrategy.targeting.interests.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* GOOGLE ADS STRATEGY */}
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-900/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-xs font-black text-white">
                        G
                      </span>
                      <h5 className="font-display text-sm font-bold text-teal-950">
                        Google Ads &amp; Ad Grants (Search RSAs)
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                      Search Network
                    </span>
                  </div>

                  {/* RSA Headlines */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-teal-950">
                        15 RSA Headlines (Click to Copy):
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            activeCampaign.googleStrategy.rsaHeadlines.join("\n"),
                            "all_rsa_hl",
                            "All RSA Headlines",
                          )
                        }
                        className="text-[10px] font-bold text-teal-900 hover:text-saffron-dark cursor-pointer"
                      >
                        {copiedKey === "all_rsa_hl" ? "✓ Copied All" : "Copy All 15"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {activeCampaign.googleStrategy.rsaHeadlines.map((hl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => copyToClipboard(hl, `rsa_hl_${idx}`, `Headline "${hl}"`)}
                          className="rounded-lg bg-cream/30 p-2 text-left text-xs font-semibold text-teal-950 hover:bg-cream/60 transition cursor-pointer border border-teal-900/10 flex items-center justify-between"
                        >
                          <span className="truncate">{hl}</span>
                          <span className="text-[9px] text-teal-900/40 ml-1">
                            {copiedKey === `rsa_hl_${idx}` ? "✓" : `${hl.length}c`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RSA Descriptions */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-teal-950">
                      RSA Descriptions (4 Variations):
                    </label>
                    {activeCampaign.googleStrategy.rsaDescriptions.map((desc, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-cream/30 p-2.5 text-xs text-teal-950 border border-teal-900/10 relative"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-bold text-teal-900/60">
                            Description {idx + 1} ({desc.length} chars)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(desc, `rsa_desc_${idx}`, `Description ${idx + 1}`)
                            }
                            className="text-[10px] font-bold text-teal-900 cursor-pointer"
                          >
                            {copiedKey === `rsa_desc_${idx}` ? "✓" : "Copy"}
                          </button>
                        </div>
                        <p>{desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* High Intent Keywords */}
                  <div className="rounded-2xl bg-amber-950/5 border border-amber-900/20 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950">
                        High-Intent Keyword Match:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            [
                              ...activeCampaign.googleStrategy.keywords.phrase,
                              ...activeCampaign.googleStrategy.keywords.exact,
                            ].join("\n"),
                            "keywords",
                            "Google Keywords",
                          )
                        }
                        className="text-[10px] font-bold text-amber-900 underline cursor-pointer"
                      >
                        {copiedKey === "keywords" ? "✓ Copied" : "Copy Keywords"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeCampaign.googleStrategy.keywords.phrase.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-white px-2 py-0.5 text-[11px] font-mono text-teal-950 border border-amber-900/10 shadow-2xs"
                        >
                          {kw}
                        </span>
                      ))}
                      {activeCampaign.googleStrategy.keywords.exact.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-white px-2 py-0.5 text-[11px] font-mono text-emerald-900 border border-emerald-900/20 shadow-2xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Creative Directives & Real Ashrama Assets */}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                <div className="border-b border-teal-900/10 pb-2">
                  <h5 className="font-display text-sm font-bold text-teal-950">
                    🎨 Visual Creative Directives &amp; Real Media Gallery Matches
                  </h5>
                  <p className="text-xs text-teal-950/65">
                    Recommended photos from our live gallery plus AI generation prompts for Midjourney /
                    Flux / DALL-E to maintain dignified, authentic Indian ashrama imagery.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {activeCampaign.creativeDirectives.recommendedSiteImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-teal-900/15 overflow-hidden bg-cream/20 flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-teal-950/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.path}
                          alt={img.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="p-3 space-y-1">
                        <span className="text-[10px] font-bold text-saffron-dark uppercase tracking-wider">
                          Recommended Ashrama Asset
                        </span>
                        <h6 className="text-xs font-bold text-teal-950">{img.title}</h6>
                        <p className="text-[11px] text-teal-950/70">{img.rationale}</p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(img.path, `img_path_${idx}`, "Image Path")}
                          className="mt-2 text-[10px] font-bold text-teal-900 underline block cursor-pointer"
                        >
                          {copiedKey === `img_path_${idx}` ? "✓ Copied Path" : `Copy: ${img.path}`}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Generation Prompts */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-teal-950">
                    AI Photorealistic Image Prompts (Midjourney v6 / Flux):
                  </label>
                  {activeCampaign.creativeDirectives.aiImagePrompts.map((p, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-teal-950/5 p-3 border border-teal-900/15 text-xs text-teal-950 font-mono"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans font-bold text-[10px] text-teal-900/60 uppercase">
                          Prompt {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p, `ai_prompt_${idx}`, `AI Prompt ${idx + 1}`)}
                          className="font-sans text-[10px] font-bold text-teal-900 underline cursor-pointer"
                        >
                          {copiedKey === `ai_prompt_${idx}` ? "✓ Copied" : "Copy Prompt"}
                        </button>
                      </div>
                      <p className="leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>

                {/* Video Hook Concept */}
                <div className="rounded-2xl bg-emerald-950 p-4 text-white text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    🎬 3-Second Video Hook Storyboard Concept
                  </span>
                  <p className="leading-relaxed text-white/90">
                    {activeCampaign.creativeDirectives.videoHookConcept}
                  </p>
                </div>
              </div>

              {/* UTM Campaign URL & Tracking */}
              <div className="rounded-3xl bg-cream/40 p-5 border border-teal-900/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-display text-sm font-bold text-teal-950">
                      🔗 Live Campaign Destination URL with UTM Tags
                    </h5>
                    <p className="text-xs text-teal-950/65">
                      Paste this URL into Meta Ads Manager or Google Ads destination field.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        activeCampaign.tracking.destinationUrl,
                        "dest_url",
                        "Destination URL",
                      )
                    }
                    className="rounded-xl bg-teal-900 text-white px-3 py-1.5 text-xs font-bold hover:bg-teal-800 transition cursor-pointer"
                  >
                    {copiedKey === "dest_url" ? "✓ Copied" : "Copy URL"}
                  </button>
                </div>
                <div className="rounded-xl bg-white p-3 font-mono text-xs text-teal-950 border border-teal-900/20 break-all select-all">
                  {activeCampaign.tracking.destinationUrl}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-cream/30 p-8 text-center border border-teal-900/10 space-y-2">
              <p className="text-sm font-bold text-teal-950">No campaign generated yet.</p>
              <p className="text-xs text-teal-950/60 max-w-md mx-auto">
                Select an angle above (such as Birthday Feast or Sacred Shagun) and click &ldquo;Generate
                Omnichannel Blueprint&rdquo; to launch complete ads, copy, and visuals.
              </p>
            </div>
          )}

          {/* Saved Campaigns History */}
          {config?.savedCampaigns && config.savedCampaigns.length > 0 && (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-3">
              <h5 className="font-display text-sm font-bold text-teal-950">
                Recent Saved Campaign Blueprints ({config.savedCampaigns.length})
              </h5>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {config.savedCampaigns.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => setActiveCampaign(sc)}
                    className={`rounded-2xl p-3 border transition cursor-pointer flex flex-col justify-between ${
                      activeCampaign?.id === sc.id
                        ? "bg-teal-900/5 border-teal-900 shadow-xs"
                        : "bg-cream/20 border-teal-900/10 hover:bg-cream/40"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-saffron-dark uppercase">
                        {sc.angleLabel}
                      </span>
                      <h6 className="text-xs font-bold text-teal-950 line-clamp-1 mt-0.5">
                        {sc.campaignName}
                      </h6>
                      <p className="text-[11px] text-teal-950/60 mt-1 line-clamp-1">
                        Budget: ₹{sc.metaStrategy.budget.dailyInr}/day · ROAS: {sc.targetRoas}x
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-teal-900/10 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-teal-900">Click to View Blueprint →</span>
                      <span className="text-teal-900/40">{new Date(sc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. META ADS PLAYBOOK & ROAS ================= */}
      {subtab === "meta" && (
        <div className="space-y-6">
          {/* Executive Strategy Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-950 via-teal-950 to-blue-950 p-6 text-white shadow-lg border border-blue-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="inline-block rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300 mb-1">
                  Reference: meta-ads.si · How Meta Ads Work for Nonprofits
                </span>
                <h4 className="font-display text-lg sm:text-xl font-bold text-white">
                  Nonprofit Architecture: Donate Standard Event, CAPI &amp; Policy Armor
                </h4>
              </div>
              <a
                href="https://meta-ads.si/how-do-meta-ads-work-for-nonprofits/"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-gold underline hover:text-white"
              >
                Read Original Article ↗
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-2">
                <h5 className="text-xs font-bold text-gold uppercase tracking-wider">
                  1. The Standard 'Donate' Event + ROAS
                </h5>
                <p className="text-xs text-white/80 leading-relaxed">
                  Most NGOs make the mistake of optimizing for link clicks or generic page views.
                  Meta’s machine learning needs the standard <strong>Donate</strong> event fired with
                  explicit monetary values:
                  <code className="block mt-1.5 rounded-lg bg-black/40 p-2 font-mono text-[11px] text-emerald-300">
                    fbq(&apos;track&apos;, &apos;Donate&apos;, &#123; value: 3500.0, currency: &apos;INR&apos; &#125;);
                  </code>
                  This calculates real-time <strong>Donation ROAS</strong> (Total Rupee Raised ÷ Ad
                  Spend). Target benchmark: <strong>3.0x to 4.5x</strong>.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-2">
                <h5 className="text-xs font-bold text-gold uppercase tracking-wider">
                  2. Evading the 'Social Issues / Politics' Restriction
                </h5>
                <p className="text-xs text-white/80 leading-relaxed">
                  Ads categorized under &ldquo;Social Issues, Elections or Politics&rdquo; face intense
                  bureaucracy: national ID verifications, mandatory &ldquo;Paid for by&rdquo;
                  disclaimers, public archiving in Meta’s Ad Library for 7 years, and EU restrictions.
                  <strong> The Solution:</strong> Frame all Janaseva Ashrama campaigns around
                  <strong> Birthday Celebrations</strong>, joyful Annadana feasts, and student
                  school supplies rather than political poverty advocacy.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-2">
                <h5 className="text-xs font-bold text-gold uppercase tracking-wider">
                  3. The Conversions API (CAPI) Necessity
                </h5>
                <p className="text-xs text-white/80 leading-relaxed">
                  With iOS 14+ App Tracking Transparency and modern browser ad blockers, 30% to 40% of
                  donations fail to reach the Meta Pixel. CAPI fires server-to-server with hashed donor
                  email, phone number, and IP address, eliminating tracking blackouts.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-2">
                <h5 className="text-xs font-bold text-gold uppercase tracking-wider">
                  4. The 3-Tier Donor Journey Funnel
                </h5>
                <p className="text-xs text-white/80 leading-relaxed">
                  • <strong>TOF (Cold):</strong> Video view campaigns targeting Bangalore families.
                  <br />• <strong>MOF (Warm):</strong> Retarget 30-day website visitors with 80G tax
                  exemption proof and dining hall menus.
                  <br />• <strong>BOF (Hot):</strong> Lookalikes of past donors for recurring monthly
                  sponsorships.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive ROAS & Budget Calculator */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 space-y-4">
            <div className="border-b border-teal-900/10 pb-3">
              <h4 className="font-display text-base font-bold text-teal-950">
                🧮 Interactive Donation ROAS &amp; Scale Calculator
              </h4>
              <p className="text-xs text-teal-950/65">
                Simulate how Meta Ad spend translates into meals and educational funding for Janaseva
                Ashrama based on real-world Indian non-profit conversion benchmarks.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Sliders / Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    Monthly Ad Budget (INR):
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="100000"
                    step="2500"
                    value={calcMonthlySpend}
                    onChange={(e) => setCalcMonthlySpend(Number(e.target.value))}
                    className="w-full accent-teal-900"
                  />
                  <div className="flex justify-between text-xs font-bold text-teal-900 mt-1">
                    <span>{formatINR(calcMonthlySpend)}</span>
                    <span className="text-teal-950/40">₹1,00,000 max</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    Average Contribution Amount (INR):
                  </label>
                  <select
                    value={calcAvgDonation}
                    onChange={(e) => setCalcAvgDonation(Number(e.target.value))}
                    className="w-full rounded-xl border border-teal-900/20 p-2 text-xs font-bold text-teal-950"
                  >
                    <option value={101}>₹101 (Micro Shagun Seva)</option>
                    <option value={500}>₹500 (Arogya / Health Checkup)</option>
                    <option value={1500}>₹1,500 (Monthly Tuition Support)</option>
                    <option value={2000}>₹2,000 (Breakfast for 25 Boys)</option>
                    <option value={3500}>₹3,500 (Festive Birthday Lunch)</option>
                    <option value={5500}>₹5,500 (Grand Birthday + Cake Cutting)</option>
                    <option value={8500}>₹8,500 (Full-Day Total Care)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    Estimated Monthly Donors Acquired:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={calcEstimatedDonors}
                    onChange={(e) => setCalcEstimatedDonors(Number(e.target.value))}
                    className="w-full rounded-xl border border-teal-900/20 p-2 text-xs font-bold text-teal-950"
                  />
                  <p className="text-[10px] text-teal-950/60 mt-1">
                    Cost per Donor: {formatINR(Math.round(calcMonthlySpend / (calcEstimatedDonors || 1)))}
                  </p>
                </div>
              </div>

              {/* KPI Results Card */}
              <div className="md:col-span-2 rounded-2xl bg-cream/40 p-5 border border-teal-900/15 flex flex-col justify-between space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white p-3 shadow-2xs border border-teal-900/10">
                    <span className="text-[10px] font-bold uppercase text-teal-900/60">
                      Total Donations Raised
                    </span>
                    <p className="font-display text-xl font-bold text-teal-950 mt-1">
                      {formatINR(totalProjectedDonations)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-2xs border border-teal-900/10">
                    <span className="text-[10px] font-bold uppercase text-emerald-700">
                      Projected ROAS
                    </span>
                    <p className="font-display text-xl font-bold text-emerald-800 mt-1">
                      {computedRoas}x
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-2xs border border-teal-900/10 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-saffron-dark">
                      Net Funds for 25 Boys
                    </span>
                    <p className="font-display text-xl font-bold text-teal-900 mt-1">
                      {formatINR(netRaised)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-teal-900 p-3.5 text-white text-xs leading-relaxed">
                  <span className="font-bold text-gold">💡 Optimization Recommendation:</span>
                  <p className="text-white/85 mt-0.5">
                    {Number(computedRoas) >= 3.5
                      ? "Healthy growth phase! At this ROAS, Janaseva Ashrama can scale daily ad spend profitably while building a sustainable recurring donor base in Bengaluru."
                      : "Testing phase. Focus ad creative on Birthday Celebrations (₹3,500 average order value) to immediately raise ROAS above 3.5x."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. GOOGLE ADS & $10K GRANTS ================= */}
      {subtab === "google" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-amber-950 text-white p-6 shadow-md border border-amber-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1">
                  Google for Nonprofits · TechSoup India Validation
                </span>
                <h4 className="font-display text-lg sm:text-xl font-bold text-white">
                  Google Ad Grants: $10,000 USD / Month (~₹8,30,000) Free Search Ads
                </h4>
              </div>
              <span className="rounded-xl bg-gold text-teal-950 px-3 py-1.5 text-xs font-bold">
                100% Free for 80G Registered Trusts
              </span>
            </div>

            <p className="text-xs text-white/80 leading-relaxed max-w-3xl">
              As an Indian registered charitable trust holding Form 10AC Section 80G and 12A approvals,
              Janaseva Ashrama is eligible to apply for Google for Nonprofits via TechSoup India
              (BigTech). Google gives <strong>$329 USD daily ($10,000 monthly)</strong> in free Google
              Search ad budget forever to capture high-intent Bangalore donors searching for orphanages,
              food sponsorship, and tax exemptions.
            </p>

            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <span className="text-[10px] font-bold text-gold uppercase">Step 1: TechSoup Token</span>
                <p className="text-xs text-white/80 mt-1">
                  Register at <strong>bigtech.in</strong> with Trust Deed &amp; 80G Certificate to
                  receive validation token.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <span className="text-[10px] font-bold text-gold uppercase">Step 2: Google Nonprofits</span>
                <p className="text-xs text-white/80 mt-1">
                  Apply at <strong>google.com/nonprofits</strong> with token and link your Google Ads
                  Customer ID.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
                <span className="text-[10px] font-bold text-gold uppercase">Step 3: Deploy RSAs</span>
                <p className="text-xs text-white/80 mt-1">
                  Copy our pre-approved 15 RSA headlines below to maintain the mandatory 5%+ account
                  CTR.
                </p>
              </div>
            </div>
          </div>

          {/* Keyword Clusters */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 space-y-4">
            <h4 className="font-display text-base font-bold text-teal-950">
              4 Pre-Built High Intent Google Ads Keyword Clusters
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  cluster: "1. South Bangalore Orphanage & Giving",
                  keywords: [
                    '"orphanage donation bangalore"',
                    '"donate to orphanage south bangalore"',
                    '"verified ngo bangalore"',
                    '"janaseva ashrama turahalli"',
                    '"orphan children home kanakapura road"',
                  ],
                },
                {
                  cluster: "2. Birthday Celebration & Annadana",
                  keywords: [
                    '"sponsor food for orphanage on birthday bangalore"',
                    '"celebrate birthday with orphan kids bangalore"',
                    '"annadana donation bangalore"',
                    '"feed orphan children on special day"',
                    '"birthday celebration in orphanage bangalore"',
                  ],
                },
                {
                  cluster: "3. Section 80G Tax Exemption (High Value)",
                  keywords: [
                    '"80g tax exemption donation bangalore"',
                    '"donate to ngo save income tax 80g"',
                    '"form 10ac approved trust donation"',
                    '"tax saving charitable donation bangalore"',
                  ],
                },
                {
                  cluster: "4. Child Education & Vidya Kits",
                  keywords: [
                    '"sponsor education for orphan child bangalore"',
                    '"school stationery donation orphanage"',
                    '"donate books and bags to orphanage"',
                    '"orphan schooling support trust"',
                  ],
                },
              ].map((grp, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-cream/30 p-4 border border-teal-900/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-teal-950">{grp.cluster}</h5>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          grp.keywords.join("\n"),
                          `kw_grp_${i}`,
                          `Cluster "${grp.cluster}"`,
                        )
                      }
                      className="text-[10px] font-bold text-teal-900 underline cursor-pointer"
                    >
                      {copiedKey === `kw_grp_${i}` ? "✓ Copied" : "Copy Cluster"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {grp.keywords.map((kw, ki) => (
                      <span
                        key={ki}
                        className="rounded-lg bg-white px-2 py-1 font-mono text-[11px] text-teal-950 border border-teal-900/10 shadow-2xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Mandatory Negative Keywords */}
            <div className="rounded-2xl bg-red-950/5 border border-red-900/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-950">
                  ⚠️ Mandatory Negative Keywords (Prevents Wasted Clicks):
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      [
                        "jobs in orphanage",
                        "orphanage salary",
                        "adoption bangalore",
                        "orphanage movie",
                        "free food scheme",
                        "food delivery",
                      ].join("\n"),
                      "neg_kws",
                      "Negative Keywords",
                    )
                  }
                  className="text-[10px] font-bold text-red-900 underline cursor-pointer"
                >
                  {copiedKey === "neg_kws" ? "✓ Copied" : "Copy Negative List"}
                </button>
              </div>
              <p className="text-xs text-red-950/80">
                jobs in orphanage, volunteer salary, adoption application, orphanage movie, free
                hostel room, food delivery, catering vacancy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. LOCAL GEO & AEO ENGINE ================= */}
      {subtab === "geo_aeo" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-teal-950 text-white p-6 shadow-md border border-teal-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="inline-block rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-300 mb-1">
                  Local GEO (Bengaluru) &amp; AEO (AI Engine Optimization)
                </span>
                <h4 className="font-display text-lg sm:text-xl font-bold text-white">
                  Position Janaseva Ashrama as the #1 Verified Child Care Trust in AI Answers
                </h4>
              </div>
              <span className="text-xs text-gold font-bold">
                ✓ Optimized for Perplexity, ChatGPT &amp; Gemini
              </span>
            </div>

            <p className="text-xs text-white/80 leading-relaxed max-w-3xl">
              When users ask AI engines like Perplexity, ChatGPT, or Gemini queries such as{" "}
              <em>&ldquo;Where can I sponsor food for orphan children on my birthday in South Bangalore?&rdquo;</em>,
              the AI parses structured entity citations and FAQ schema markup. Here is the verified
              knowledge graph identity configured for Janaseva Ashrama.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Local NAP Citations */}
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-3">
              <h5 className="font-display text-sm font-bold text-teal-950">
                📍 Canonical Local NAP (Name, Address, Phone)
              </h5>
              <div className="rounded-2xl bg-cream/30 p-3.5 border border-teal-900/10 text-xs text-teal-950 space-y-1.5 font-mono">
                <p>
                  <strong>Entity:</strong> Janaseva Ashrama (Sri Manjunatha Seva Samithi)
                </p>
                <p>
                  <strong>Address:</strong> Survey No. 42/1, Turahalli, Uttarahalli Hobli, Bengaluru,
                  Karnataka 560061
                </p>
                <p>
                  <strong>Landmarks:</strong> Near Turahalli Forest Reserve, Off Kanakapura Road,
                  Banashankari 6th Stage
                </p>
                <p>
                  <strong>Phone:</strong> +91 94480 52367
                </p>
                <p>
                  <strong>Trust PAN:</strong> AABTJ7431M
                </p>
                <p>
                  <strong>80G URN:</strong> AABTJ7431MF20231
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    "Janaseva Ashrama, Survey No. 42/1, Turahalli, Uttarahalli Hobli, Bengaluru, Karnataka 560061. Phone: +91 94480 52367. PAN: AABTJ7431M, 80G URN: AABTJ7431MF20231",
                    "nap",
                    "Canonical NAP",
                  )
                }
                className="w-full rounded-xl bg-teal-900 text-white py-2 text-xs font-bold hover:bg-teal-800 transition cursor-pointer"
              >
                {copiedKey === "nap" ? "✓ Copied Canonical NAP" : "📋 Copy NAP Citation for Google Maps"}
              </button>
            </div>

            {/* AI Answer Prompt Injection */}
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-3">
              <h5 className="font-display text-sm font-bold text-teal-950">
                🤖 AI Answer Engine Knowledge Fact Snippet
              </h5>
              <p className="text-xs text-teal-950/65">
                Fact-dense summary ingested into AI search index datasets and press releases.
              </p>
              <div className="rounded-2xl bg-cream/30 p-3.5 border border-teal-900/10 text-xs text-teal-950 leading-relaxed">
                &ldquo;Janaseva Ashrama is an authentic non-profit orphanage and child care trust
                founded in 2000 in Turahalli, Bengaluru, Karnataka. It provides shelter, satvik
                nutrition, and formal schooling to 25 resident boys. Donors can celebrate birthdays,
                anniversaries, or offer sacred Shagun Annadana online starting from ₹11 up to full-day
                feasts (₹8,500), with 100% Section 80G tax deductibility (Form 10AC approved) and
                personalized video song blessings delivered to WhatsApp.&rdquo;
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    "Janaseva Ashrama is an authentic non-profit orphanage and child care trust founded in 2000 in Turahalli, Bengaluru, Karnataka. It provides shelter, satvik nutrition, and formal schooling to 25 resident boys. Donors can celebrate birthdays, anniversaries, or offer sacred Shagun Annadana online starting from ₹11 up to full-day feasts (₹8,500), with 100% Section 80G tax deductibility (Form 10AC approved) and personalized video song blessings delivered to WhatsApp.",
                    "aeo_fact",
                    "AEO Fact Snippet",
                  )
                }
                className="w-full rounded-xl bg-teal-900 text-white py-2 text-xs font-bold hover:bg-teal-800 transition cursor-pointer"
              >
                {copiedKey === "aeo_fact" ? "✓ Copied Fact Snippet" : "📋 Copy AEO Fact Snippet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. AD APIS & CAPI CONFIG ================= */}
      {subtab === "apis" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-teal-900/10 pb-3">
              <div>
                <h4 className="font-display text-base font-bold text-teal-950">
                  Ad Account APIs, Tracking Tokens &amp; AI Engine Configuration
                </h4>
                <p className="text-xs text-teal-950/65">
                  Store your Meta Pixel ID, Meta Conversions API (CAPI) Access Token, Google Ads ID, and
                  AI API Key securely in PostgreSQL.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig || loadingConfig}
                className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                {savingConfig ? "Saving Changes..." : "💾 Save API Configuration"}
              </button>
            </div>

            {loadingConfig ? (
              <p className="text-xs font-semibold text-teal-900/60 py-4">Loading configuration...</p>
            ) : config ? (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Meta Pixel & CAPI */}
                <div className="rounded-2xl bg-cream/30 p-4 border border-teal-900/10 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                    Meta Ads (Facebook &amp; Instagram)
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-teal-950 mb-1">
                      Meta Pixel ID:
                    </label>
                    <input
                      type="text"
                      value={config.metaPixelId}
                      onChange={(e) => setConfig({ ...config, metaPixelId: e.target.value })}
                      placeholder="e.g. 123456789012345"
                      className="w-full rounded-xl border border-teal-900/20 bg-white p-2.5 text-xs font-mono text-teal-950 focus:border-teal-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950 mb-1">
                      Meta Conversions API (CAPI) System User Token:
                    </label>
                    <input
                      type="password"
                      value={config.metaCapiToken}
                      onChange={(e) => setConfig({ ...config, metaCapiToken: e.target.value })}
                      placeholder="EAA..."
                      className="w-full rounded-xl border border-teal-900/20 bg-white p-2.5 text-xs font-mono text-teal-950 focus:border-teal-900 focus:outline-none"
                    />
                    <span className="text-[10px] text-teal-950/60 mt-0.5 block">
                      Generated from Meta Events Manager &gt; Settings &gt; Generate Access Token.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950 mb-1">
                      Test Event Code (Optional for Live Testing):
                    </label>
                    <input
                      type="text"
                      value={config.metaCapiTestEventCode}
                      onChange={(e) =>
                        setConfig({ ...config, metaCapiTestEventCode: e.target.value })
                      }
                      placeholder="e.g. TEST12345"
                      className="w-full rounded-xl border border-teal-900/20 bg-white p-2.5 text-xs font-mono text-teal-950 focus:border-teal-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Google Ads & Tag Manager */}
                <div className="rounded-2xl bg-cream/30 p-4 border border-teal-900/10 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                    Google Ads &amp; Tag Manager
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-teal-950 mb-1">
                      Google Ads Customer ID (CID):
                    </label>
                    <input
                      type="text"
                      value={config.googleAdsCustomerId}
                      onChange={(e) =>
                        setConfig({ ...config, googleAdsCustomerId: e.target.value })
                      }
                      placeholder="e.g. 123-456-7890"
                      className="w-full rounded-xl border border-teal-900/20 bg-white p-2.5 text-xs font-mono text-teal-950 focus:border-teal-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950 mb-1">
                      Google Tag Manager (GTM) Container ID:
                    </label>
                    <input
                      type="text"
                      value={config.googleTagManagerId}
                      onChange={(e) =>
                        setConfig({ ...config, googleTagManagerId: e.target.value })
                      }
                      placeholder="e.g. GTM-XXXXXXX"
                      className="w-full rounded-xl border border-teal-900/20 bg-white p-2.5 text-xs font-mono text-teal-950 focus:border-teal-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950 mb-1">
                      AI Engine API Key (Gemini / OpenAI):
                    </label>
                    <input
                      type="password"
                      value={config.aiApiKey}
                      onChange={(e) => setConfig({ ...config, aiApiKey: e.target.value })}
                      placeholder="AIzaSy... or sk-..."
                      className="w-full rounded-xl border border-teal-900/20 bg-white p-2.5 text-xs font-mono text-teal-950 focus:border-teal-900 focus:outline-none"
                    />
                    <span className="text-[10px] text-teal-950/60 mt-0.5 block">
                      Enables real-time dynamic ad copy &amp; image generation.
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Test Meta CAPI Section */}
          <div className="rounded-3xl bg-teal-950 p-6 text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h5 className="font-display text-base font-bold text-white">
                  ⚡ Meta Conversions API (CAPI) Live Test Dispatcher
                </h5>
                <p className="text-xs text-white/70">
                  Sends a test standard &lsquo;Donate&rsquo; event with currency INR and ₹3,500 value to verify
                  server-to-server delivery.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestCapi}
                disabled={testingCapi}
                className="rounded-xl bg-gold text-teal-950 px-4 py-2 text-xs font-bold hover:bg-gold-light transition disabled:opacity-50 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                {testingCapi ? "Sending Test Event..." : "🚀 Test CAPI 'Donate' Event"}
              </button>
            </div>

            {capiResult && (
              <div className="rounded-2xl bg-black/40 p-4 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto space-y-2">
                <div className="flex items-center justify-between text-white/80">
                  <span>
                    Mode: <strong>{capiResult.mode}</strong> · Status:{" "}
                    <strong>{capiResult.ok ? "SUCCESS (200)" : "ERROR"}</strong>
                  </span>
                  <span className="text-[10px] text-white/50">{new Date().toLocaleTimeString()}</span>
                </div>
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(capiResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 6. 1-CLICK WHATSAPP BROADCAST ================= */}
      {subtab === "whatsapp" && (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-950 p-6 text-white shadow-lg border border-emerald-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <span className="inline-block rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 mb-1">
                Psychological FinTech Tool · 1-Click Viral Broadcast
              </span>
              <h4 className="font-display text-base sm:text-lg font-bold text-white">
                WhatsApp Blast Link &amp; Appeal Message Generator
              </h4>
            </div>
            <span className="text-xs text-gold font-bold">✓ Auto UTM Tracking Tags Included</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1.5">
                Select Emotional Campaign Angle:
              </label>
              <div className="space-y-2">
                {[
                  { id: "shagun", label: "🍛 Auspicious Shagun Annadana (₹11 / ₹51 / ₹101)" },
                  { id: "birthday", label: "🎂 Birthday Feast with Video Song Blessing" },
                  { id: "vidya", label: "📚 Vidya & Schooling Kits for 25 Boys" },
                  { id: "tax80g", label: "🛡️ Section 80G Tax-Exempt Giving (50% Off)" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setWaTemplate(tpl.id)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                      waTemplate === tpl.id
                        ? "bg-white text-teal-950 font-bold shadow-xs"
                        : "bg-white/10 text-white/80 hover:bg-white/15"
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Generated WhatsApp Message (Ready to Copy or Send):
              </label>
              {(() => {
                let defaultCopy = "";
                let utmCampaign = "annadana_seva";
                if (waTemplate === "shagun") {
                  utmCampaign = "shagun_annadana";
                  defaultCopy = `🙏 *Namaskara from Janaseva Ashrama, Bengaluru*\n\nToday, 25 young orphan boys are chanting morning shlokas and studying hard in our Turahalli home. You can sponsor hot wholesome meals with sacred Shagun giving starting from just *₹11, ₹51, or ₹101*.\n\n✨ Every rupee goes directly to fresh groceries & milk.\n🛡️ 100% Tax Deductible under Section 80G.\n\n👉 *Click here to give with 1 tap (Google Pay / PhonePe / Cards):*\nhttps://www.janasevaorphanage.org/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=${utmCampaign}\n\nMay your kindness bring immense blessings to you and your family! 🌸`;
                } else if (waTemplate === "birthday") {
                  utmCampaign = "birthday_celebration";
                  defaultCopy = `🎂 *Celebrate Your Birthday with 25 Radiant Boys!*\n\nTurn your special milestone into pure joy at Janaseva Ashrama. Sponsor a special sweet feast (Payasam & Pooris) and the 25 boys will record a heartfelt *Personalized Video Birthday Blessing Song* sent directly to your WhatsApp!\n\n✨ Direct booking on our verified website:\nhttps://www.janasevaorphanage.org/celebrate-birthday?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=${utmCampaign}\n\nCelebrate with meaning and pure smiles! 🎉`;
                } else if (waTemplate === "vidya") {
                  utmCampaign = "vidya_education";
                  defaultCopy = `📚 *Empower a Child's Tomorrow with Vidya*\n\n25 bright young boys at Janaseva Ashrama, Bengaluru dream of becoming engineers, teachers, and officers. Sponsor school uniforms, notebooks, textbooks, and tuition classes under our Juvenile Justice Act registered home.\n\n🎓 *Sponsor Schooling Kit:* https://www.janasevaorphanage.org/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=${utmCampaign}#tiers\n\nThank you for educating the world! 🌟`;
                } else {
                  utmCampaign = "tax_exemption_80g";
                  defaultCopy = `🛡️ *Save 50% Income Tax with Meaningful Impact*\n\nJanaseva Ashrama holds official Form 10AC Provisional 80G Approval (PAN: AABTJ7431M, URN: AABTJ7431MF20231). All contributions are eligible for 50% deduction under Section 80G of the Indian Income Tax Act.\n\n📄 Instant verified 80G tax receipt generated immediately upon payment.\n👉 Donate online: https://www.janasevaorphanage.org/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=${utmCampaign}\n\n100% direct allocation to child care!`;
                }

                const activeMsg = waCustomMsg || defaultCopy;
                const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(activeMsg)}`;

                return (
                  <div className="space-y-3">
                    <textarea
                      rows={6}
                      value={activeMsg}
                      onChange={(e) => setWaCustomMsg(e.target.value)}
                      className="w-full rounded-2xl bg-white/10 border border-white/20 p-3.5 text-xs text-white font-mono leading-relaxed focus:bg-white/15 focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeMsg, "wa_msg", "WhatsApp Message")}
                        className="rounded-xl bg-gold text-teal-950 px-4 py-2 text-xs font-bold hover:bg-gold-light transition cursor-pointer shadow-xs"
                      >
                        {copiedKey === "wa_msg" ? "✓ Copied!" : "📋 Copy Message & Link"}
                      </button>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-500 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <span>💬 Open in WhatsApp Broadcast</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setWaCustomMsg("")}
                        className="rounded-xl bg-white/10 text-white/70 px-3 py-2 text-xs font-semibold hover:bg-white/20 transition cursor-pointer"
                      >
                        Reset Template
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. CROWD CAMPAIGNS DIRECTORY ================= */}
      {subtab === "campaigns" && (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display text-base font-bold text-teal-900">
                Fundraising Campaigns Directory ({campaignsList.length})
              </h4>
              <p className="text-xs text-teal-950/60">
                Manage individual crowd-giving causes, birthday fundraisers, and festival appeals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadCampaigns()}
              className="rounded-xl bg-teal-900/10 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-900/20 transition cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {campaignsLoading ? (
            <p className="text-xs font-semibold text-teal-900/60 py-4">
              Loading fundraising campaigns...
            </p>
          ) : campaignsList.length === 0 ? (
            <div className="rounded-2xl bg-cream/40 p-8 text-center border border-teal-900/10 space-y-2">
              <p className="text-sm font-bold text-teal-950">
                No crowd fundraising campaigns created yet.
              </p>
              <p className="text-xs text-teal-950/60">
                Click &ldquo;+ Create New Campaign&rdquo; above to launch a festival or student
                support campaign.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaignsList.map((c) => {
                const isApproved = c.status === "approved";
                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-teal-900/15 p-4 bg-white shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : c.status === "paused"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-teal-900">
                          Goal: {formatINR(c.goalAmount)}
                        </span>
                      </div>

                      <h5 className="font-display text-sm font-bold text-teal-950 line-clamp-1">
                        {c.title}
                      </h5>
                      <p className="text-[11px] font-semibold text-saffron-dark mt-0.5">
                        {c.occasion || "General Seva"} · {c.campaignType}
                      </p>
                      <p className="mt-2 text-xs text-teal-950/70 line-clamp-2 leading-relaxed">
                        {c.story}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-teal-900/10 flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/c/${c.slug}`}
                        target="_blank"
                        className="text-xs font-bold text-teal-900 hover:text-saffron-dark underline"
                      >
                        View Live Page →
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handlePatchCampaign(c.id, {
                              status: isApproved ? "paused" : "approved",
                            })
                          }
                          className={`rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                            isApproved
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          }`}
                        >
                          {isApproved ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCampaign(c)}
                          className="rounded-lg bg-teal-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-800 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(c.id)}
                          className="rounded-lg bg-red-600/15 border border-red-500/25 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-600/25 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
