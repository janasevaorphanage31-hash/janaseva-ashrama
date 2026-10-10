"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { SiteContentMap } from "@/lib/site-content";

export function SiteContentManager({
  onMessage,
}: {
  onMessage: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState<
    "hero" | "tiers" | "chapters" | "contact" | "quotes_faq"
  >("hero");
  const [content, setContent] = useState<SiteContentMap | null>(null);

  // File upload state
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/site-content", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.content) {
        setContent(data.content);
      } else {
        onMessage(data.error || "Failed to load site content settings.");
      }
    } catch {
      onMessage("Network error loading site content settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!content) return;
    setSaving(true);
    onMessage("Saving site content and revalidating public website…");
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (res.ok) {
        setContent(data.content);
        onMessage("✅ Saved successfully! Hero video, support tiers, and media links are now LIVE on the website.");
      } else {
        onMessage(data.error || "Save failed.");
      }
    } catch {
      onMessage("Network error saving site content.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(
    file: File,
    targetField: keyof SiteContentMap | string,
    category: string = "images"
  ) {
    setUploadingField(targetField);
    onMessage(`Uploading ${file.name}…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        if (targetField.includes(".")) {
          // Nested field like "docChapters.0.videoSrc"
          const parts = targetField.split(".");
          setContent((prev) => {
            if (!prev) return prev;
            const copy = JSON.parse(JSON.stringify(prev));
            let curr: any = copy;
            for (let i = 0; i < parts.length - 1; i++) {
              curr = curr[parts[i]];
            }
            curr[parts[parts.length - 1]] = data.url;
            return copy;
          });
        } else {
          setContent((prev) => (prev ? { ...prev, [targetField]: data.url } : prev));
        }
        onMessage(`✅ Uploaded: ${data.url}`);
      } else {
        onMessage(data.error || "Upload failed.");
      }
    } catch {
      onMessage("Network error during file upload.");
    } finally {
      setUploadingField(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-teal-900/60 ring-1 ring-teal-900/10">
        Loading site content, media links, and support tiers…
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-red-600 ring-1 ring-red-200">
        Unable to load site content map. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Save */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-teal-950 p-5 text-white shadow-md border border-amber-400/20">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <span>🌐</span> Website Media &amp; Content Management
          </h2>
          <p className="text-xs text-teal-100/70 mt-0.5">
            Update top hero video, 5 support tiers, documentary chapters, phone, WhatsApp &amp; social links live.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="focus-ring tap-scale inline-flex items-center gap-2 rounded-xl bg-saffron px-5 py-2.5 text-xs font-black text-white hover:bg-saffron-dark transition shadow-md disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Publishing…" : "💾 Save & Publish Live"}
        </button>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-teal-900/10 pb-3">
        {[
          { id: "hero", label: "🎬 Top Hero Video & Visuals" },
          { id: "tiers", label: "🏛️ 5 Support Tiers & Pricing" },
          { id: "chapters", label: "📽️ Documentary Chapters (1–5)" },
          { id: "contact", label: "📞 Contact & Social Channels" },
          { id: "quotes_faq", label: "💬 Caregiver Quotes & FAQs" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id as any)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              subTab === t.id
                ? "bg-teal-900 text-white shadow"
                : "bg-white text-teal-900/70 hover:bg-cream ring-1 ring-teal-900/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 1. HERO TAB ── */}
      {subTab === "hero" && (
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-teal-900/10 space-y-5">
          <div className="border-b border-teal-900/10 pb-3">
            <h3 className="font-display text-sm font-bold text-teal-900">
              Top Cinematic Hero Section (Main Page Top)
            </h3>
            <p className="text-xs text-teal-900/60 mt-0.5">
              The first thing donors see. Video autoplays muted in prayer hall view with sound and fit toggles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Hero Video URL */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-teal-900/80">
                Hero Video MP4 URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={content.heroVideoUrl || ""}
                  onChange={(e) => setContent({ ...content, heroVideoUrl: e.target.value })}
                  placeholder="/media/video-chant-prayer.mp4 or https://..."
                  className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
                />
                <label className="shrink-0 cursor-pointer rounded-xl bg-teal-900 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 transition flex items-center shadow-xs">
                  {uploadingField === "heroVideoUrl" ? "Uploading…" : "Upload MP4"}
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    disabled={uploadingField === "heroVideoUrl"}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFileUpload(f, "heroVideoUrl", "videos");
                    }}
                  />
                </label>
              </div>

              {/* Video Preview */}
              {content.heroVideoUrl && (
                <div className="mt-2 rounded-xl bg-black overflow-hidden p-1 max-h-48 flex items-center justify-center">
                  <video
                    key={content.heroVideoUrl}
                    src={content.heroVideoUrl}
                    controls
                    className="max-h-44 w-auto rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Hero Poster URL */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-teal-900/80">
                Hero Poster Image URL (Initial LCP &amp; Thumbnail):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={content.heroPosterUrl || ""}
                  onChange={(e) => setContent({ ...content, heroPosterUrl: e.target.value })}
                  placeholder="/media/poster-desktop.jpg or https://..."
                  className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
                />
                <label className="shrink-0 cursor-pointer rounded-xl bg-teal-900 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 transition flex items-center shadow-xs">
                  {uploadingField === "heroPosterUrl" ? "Uploading…" : "Upload Poster"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingField === "heroPosterUrl"}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFileUpload(f, "heroPosterUrl", "images");
                    }}
                  />
                </label>
              </div>

              {/* Poster Preview */}
              {content.heroPosterUrl && (
                <div className="mt-2 rounded-xl bg-black overflow-hidden p-1 max-h-48 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={content.heroPosterUrl}
                    src={content.heroPosterUrl}
                    alt="Hero Poster Preview"
                    className="max-h-44 w-auto rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-teal-900/10">
            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                Hero Headline Text:
              </label>
              <input
                type="text"
                value={content.heroHeadline || ""}
                onChange={(e) => setContent({ ...content, heroHeadline: e.target.value })}
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                Hero Subheadline Text:
              </label>
              <input
                type="text"
                value={content.heroSubheadline || ""}
                onChange={(e) => setContent({ ...content, heroSubheadline: e.target.value })}
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 2. 5 SUPPORT TIERS TAB ── */}
      {subTab === "tiers" && (
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-teal-900/10 space-y-5">
          <div className="border-b border-teal-900/10 pb-3">
            <h3 className="font-display text-sm font-bold text-teal-900">
              5 Official Support Tiers &amp; Pricing (Form 28 JJ Act Registered)
            </h3>
            <p className="text-xs text-teal-900/60 mt-0.5">
              Edit the official donation tiers displayed on the homepage and supporter forms.
            </p>
          </div>

          <div className="space-y-4">
            {(content.supportTiers || []).map((tier, idx) => (
              <div
                key={tier.id || idx}
                className="rounded-xl border border-teal-900/15 p-4 bg-sand/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-900">
                    Tier {idx + 1}: {tier.title}
                  </span>
                  <span className="text-[11px] font-mono text-teal-900/60">ID: {tier.id}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-teal-900/70 mb-1">
                      Tier Title:
                    </label>
                    <input
                      type="text"
                      value={tier.title || ""}
                      onChange={(e) => {
                        const next = [...(content.supportTiers || [])];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setContent({ ...content, supportTiers: next });
                      }}
                      className="w-full rounded-lg border border-teal-900/20 p-2 text-xs text-teal-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-teal-900/70 mb-1">
                      Description / Meaning:
                    </label>
                    <input
                      type="text"
                      value={tier.desc || ""}
                      onChange={(e) => {
                        const next = [...(content.supportTiers || [])];
                        next[idx] = { ...next[idx], desc: e.target.value };
                        setContent({ ...content, supportTiers: next });
                      }}
                      className="w-full rounded-lg border border-teal-900/20 p-2 text-xs text-teal-900"
                    />
                  </div>
                </div>

                {/* Options inside this tier */}
                <div className="mt-2 space-y-2 border-t border-teal-900/10 pt-2">
                  <span className="text-[10px] font-black uppercase text-teal-900/60">
                    Pricing Options:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(tier.options || []).map((opt, oIdx) => (
                      <div key={opt.id || oIdx} className="rounded-lg bg-white p-2.5 border border-teal-900/10 shadow-2xs">
                        <span className="block text-[10px] font-bold text-teal-900 truncate">
                          {opt.label}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[11px] font-black text-saffron-dark">₹</span>
                          <input
                            type="number"
                            value={opt.amount || 0}
                            onChange={(e) => {
                              const nextTiers = [...(content.supportTiers || [])];
                              const nextOpts = [...(nextTiers[idx].options || [])];
                              nextOpts[oIdx] = { ...nextOpts[oIdx], amount: Number(e.target.value) || 0 };
                              nextTiers[idx] = { ...nextTiers[idx], options: nextOpts };
                              setContent({ ...content, supportTiers: nextTiers });
                            }}
                            className="w-full rounded border border-teal-900/20 p-1 text-xs font-bold text-teal-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. DOCUMENTARY CHAPTERS TAB ── */}
      {subTab === "chapters" && (
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-teal-900/10 space-y-5">
          <div className="border-b border-teal-900/10 pb-3">
            <h3 className="font-display text-sm font-bold text-teal-900">
              Documentary Video Chapters 1–5
            </h3>
            <p className="text-xs text-teal-900/60 mt-0.5">
              5 authentic chapters showcasing morning prayers, the ashrama kitchen, classrooms, sports, and night satsang.
            </p>
          </div>

          <div className="space-y-5">
            {(content.docChapters || []).map((ch, idx) => (
              <div
                key={ch.id || idx}
                className="rounded-xl border border-teal-900/15 p-4 bg-sand/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-teal-900">
                    Chapter {ch.number || `0${idx + 1}`}: {ch.title}
                  </span>
                  <span className="text-[11px] font-mono text-teal-900/60">{ch.duration || "0:45"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-teal-900/70 mb-1">
                      Chapter Title:
                    </label>
                    <input
                      type="text"
                      value={ch.title || ""}
                      onChange={(e) => {
                        const next = [...(content.docChapters || [])];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setContent({ ...content, docChapters: next });
                      }}
                      className="w-full rounded-lg border border-teal-900/20 p-2 text-xs font-bold text-teal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-teal-900/70 mb-1">
                      Chapter Subtitle:
                    </label>
                    <input
                      type="text"
                      value={ch.subtitle || ""}
                      onChange={(e) => {
                        const next = [...(content.docChapters || [])];
                        next[idx] = { ...next[idx], subtitle: e.target.value };
                        setContent({ ...content, docChapters: next });
                      }}
                      className="w-full rounded-lg border border-teal-900/20 p-2 text-xs text-teal-900"
                    />
                  </div>
                </div>

                {/* Video & Poster URLs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-teal-900/70 mb-1">
                      Video MP4 URL:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={ch.videoSrc || ""}
                        onChange={(e) => {
                          const next = [...(content.docChapters || [])];
                          next[idx] = { ...next[idx], videoSrc: e.target.value };
                          setContent({ ...content, docChapters: next });
                        }}
                        className="w-full rounded-lg border border-teal-900/20 p-1.5 text-xs font-mono text-teal-900"
                      />
                      <label className="shrink-0 cursor-pointer rounded-lg bg-teal-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-teal-800 transition flex items-center">
                        Upload
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleFileUpload(f, `docChapters.${idx}.videoSrc`, "videos");
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-teal-900/70 mb-1">
                      Poster Image URL:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={ch.posterSrc || ""}
                        onChange={(e) => {
                          const next = [...(content.docChapters || [])];
                          next[idx] = { ...next[idx], posterSrc: e.target.value };
                          setContent({ ...content, docChapters: next });
                        }}
                        className="w-full rounded-lg border border-teal-900/20 p-1.5 text-xs font-mono text-teal-900"
                      />
                      <label className="shrink-0 cursor-pointer rounded-lg bg-teal-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-teal-800 transition flex items-center">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleFileUpload(f, `docChapters.${idx}.posterSrc`, "images");
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-teal-900/70 mb-1">
                    Description:
                  </label>
                  <textarea
                    rows={2}
                    value={ch.description || ""}
                    onChange={(e) => {
                      const next = [...(content.docChapters || [])];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setContent({ ...content, docChapters: next });
                    }}
                    className="w-full rounded-lg border border-teal-900/20 p-2 text-xs text-teal-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. CONTACT & SOCIAL CHANNELS TAB ── */}
      {subTab === "contact" && (
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-teal-900/10 space-y-5">
          <div className="border-b border-teal-900/10 pb-3">
            <h3 className="font-display text-sm font-bold text-teal-900">
              Ashrama Contact Info &amp; Official Social Channels
            </h3>
            <p className="text-xs text-teal-900/60 mt-0.5">
              These links are used in floating connect buttons, headers, footers, and direct calling actions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                📞 Caretaker Phone Number (with country code):
              </label>
              <input
                type="text"
                value={content.contactPhone || ""}
                onChange={(e) => setContent({ ...content, contactPhone: e.target.value })}
                placeholder="+91 9980359595"
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                💬 Official WhatsApp (Direct Chat Link or Number):
              </label>
              <input
                type="text"
                value={content.socialWhatsapp || ""}
                onChange={(e) => setContent({ ...content, socialWhatsapp: e.target.value })}
                placeholder="https://wa.me/919980359595"
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                ✉️ Caretaker Email:
              </label>
              <input
                type="text"
                value={content.contactEmail || ""}
                onChange={(e) => setContent({ ...content, contactEmail: e.target.value })}
                placeholder="info@janasevaashrama.org"
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                📍 Google Maps Direct Place URL:
              </label>
              <input
                type="text"
                value={content.googleMapsUrl || ""}
                onChange={(e) => setContent({ ...content, googleMapsUrl: e.target.value })}
                placeholder="https://www.google.com/maps/place/jana+seva+ashrama/..."
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                🗺️ Google Maps Embed Iframe URL:
              </label>
              <input
                type="text"
                value={content.googleMapsEmbedUrl || ""}
                onChange={(e) => setContent({ ...content, googleMapsEmbedUrl: e.target.value })}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                🏠 Physical Address (Turahalli Campus):
              </label>
              <input
                type="text"
                value={content.contactAddress || ""}
                onChange={(e) => setContent({ ...content, contactAddress: e.target.value })}
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                📸 Instagram Page URL:
              </label>
              <input
                type="text"
                value={content.socialInstagram || ""}
                onChange={(e) => setContent({ ...content, socialInstagram: e.target.value })}
                placeholder="https://www.instagram.com/janaseva_ashrama?cplk=MWQxOXF6bWxoaXd3eA=="
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                📘 Facebook Page URL:
              </label>
              <input
                type="text"
                value={content.socialFacebook || ""}
                onChange={(e) => setContent({ ...content, socialFacebook: e.target.value })}
                placeholder="https://www.facebook.com/share/19joh5EZuQ/"
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                ✖️ X (Twitter) URL:
              </label>
              <input
                type="text"
                value={content.socialX || ""}
                onChange={(e) => setContent({ ...content, socialX: e.target.value })}
                placeholder="https://x.com/janasevaashrama"
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900/80 mb-1">
                💼 LinkedIn Page URL:
              </label>
              <input
                type="text"
                value={content.socialLinkedin || ""}
                onChange={(e) => setContent({ ...content, socialLinkedin: e.target.value })}
                placeholder="https://linkedin.com/company/janaseva-ashrama"
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs font-mono text-teal-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 5. CAREGIVER QUOTES & FAQS TAB ── */}
      {subTab === "quotes_faq" && (
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-teal-900/10 space-y-5">
          <div className="border-b border-teal-900/10 pb-3">
            <h3 className="font-display text-sm font-bold text-teal-900">
              Caregiver Voices &amp; Frequently Asked Questions
            </h3>
            <p className="text-xs text-teal-900/60 mt-0.5">
              Reflections from teachers and trustees, plus the transparent answers on Section 80G tax benefits and visits.
            </p>
          </div>

          {/* Quotes */}
          <div className="space-y-3">
            <span className="block text-xs font-black uppercase text-teal-900">
              Caregiver Quotes ({content.quotes?.length || 0}):
            </span>
            {(content.quotes || []).map((q, qIdx) => (
              <div key={qIdx} className="rounded-xl border border-teal-900/15 p-3.5 bg-sand/20 space-y-2">
                <textarea
                  rows={2}
                  value={q.quote || ""}
                  onChange={(e) => {
                    const next = [...(content.quotes || [])];
                    next[qIdx] = { ...next[qIdx], quote: e.target.value };
                    setContent({ ...content, quotes: next });
                  }}
                  className="w-full rounded-lg border border-teal-900/20 p-2 text-xs text-teal-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={q.author || ""}
                    placeholder="Author"
                    onChange={(e) => {
                      const next = [...(content.quotes || [])];
                      next[qIdx] = { ...next[qIdx], author: e.target.value };
                      setContent({ ...content, quotes: next });
                    }}
                    className="rounded-lg border border-teal-900/20 p-1.5 text-xs text-teal-900 font-bold"
                  />
                  <input
                    type="text"
                    value={q.role || ""}
                    placeholder="Role"
                    onChange={(e) => {
                      const next = [...(content.quotes || [])];
                      next[qIdx] = { ...next[qIdx], role: e.target.value };
                      setContent({ ...content, quotes: next });
                    }}
                    className="rounded-lg border border-teal-900/20 p-1.5 text-xs text-teal-900"
                  />
                  <input
                    type="text"
                    value={q.tag || ""}
                    placeholder="Tag"
                    onChange={(e) => {
                      const next = [...(content.quotes || [])];
                      next[qIdx] = { ...next[qIdx], tag: e.target.value };
                      setContent({ ...content, quotes: next });
                    }}
                    className="rounded-lg border border-teal-900/20 p-1.5 text-xs text-teal-900"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className="space-y-3 pt-4 border-t border-teal-900/10">
            <span className="block text-xs font-black uppercase text-teal-900">
              Frequently Asked Questions ({content.faqs?.length || 0}):
            </span>
            {(content.faqs || []).map((faq, fIdx) => (
              <div key={fIdx} className="rounded-xl border border-teal-900/15 p-3.5 bg-sand/20 space-y-2">
                <input
                  type="text"
                  value={faq.question || ""}
                  placeholder="Question"
                  onChange={(e) => {
                    const next = [...(content.faqs || [])];
                    next[fIdx] = { ...next[fIdx], question: e.target.value };
                    setContent({ ...content, faqs: next });
                  }}
                  className="w-full rounded-lg border border-teal-900/20 p-2 text-xs font-bold text-teal-900"
                />
                <textarea
                  rows={2}
                  value={faq.answer || ""}
                  placeholder="Answer"
                  onChange={(e) => {
                    const next = [...(content.faqs || [])];
                    next[fIdx] = { ...next[fIdx], answer: e.target.value };
                    setContent({ ...content, faqs: next });
                  }}
                  className="w-full rounded-lg border border-teal-900/20 p-2 text-xs text-teal-900"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="focus-ring tap-scale inline-flex items-center gap-2 rounded-xl bg-saffron px-6 py-3 text-xs font-black text-white hover:bg-saffron-dark transition shadow-md disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Publishing to Website…" : "💾 Save Changes & Publish to Live Website"}
        </button>
      </div>
    </div>
  );
}
