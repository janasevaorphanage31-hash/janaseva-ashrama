"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { formatINR } from "@/lib/site";

type Tab =
  | "catalogs"
  | "celebrations"
  | "wishes"
  | "today"
  | "metrics"
  | "documents"
  | "campaigns"
  | "volunteers"
  | "media";

const CATEGORIES = [
  "Annadana (Food)",
  "Vidya (Education)",
  "Arogya (Health)",
  "Essentials & Shelter",
  "Recreation & Sports",
  "Celebrations & Birthday",
  "Infrastructure & Care",
];

export default function AdminContentClient() {
  const [tab, setTab] = useState<Tab>("catalogs");
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    setMessage("");

    if (tab === "wishes") {
      try {
        const r = await fetch("/api/admin/site-content", { cache: "no-store" });
        const j = await r.json();
        setRows(j.content?.wishVideos || []);
        if (!r.ok) setMessage(j.error || "Unable to load wish videos.");
      } catch {
        setMessage("Network error loading wish videos.");
      }
      setLoading(false);
      return;
    }

    const endpoint = {
      catalogs: "/api/admin/impact-items",
      celebrations: "/api/admin/celebrations",
      today: "/api/admin/today-updates",
      metrics: "/api/admin/metrics",
      documents: "/api/admin/documents",
      campaigns: "/api/admin/campaigns",
      volunteers: "/api/admin/volunteers",
      media: "/api/admin/media",
    }[tab as Exclude<Tab, "wishes">];

    try {
      const r = await fetch(endpoint, { cache: "no-store" });
      const j = await r.json();
      setRows(
        j.items ||
          j.celebrations ||
          j.updates ||
          j.metrics ||
          j.documents ||
          j.campaigns ||
          j.volunteers ||
          j.media ||
          []
      );
      if (!r.ok) setMessage(j.error || "Unable to load data.");
    } catch {
      setMessage("Network error loading admin records.");
    }
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setEditingItem(null);
      void load();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function patch(endpoint: string, body: Record<string, unknown>) {
    setMessage("");
    const r = await fetch(endpoint, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    setMessage(r.ok ? "Saved successfully." : j.error || "Save failed.");
    if (r.ok) {
      setEditingItem(null);
      await load();
    }
  }

  async function handleDeleteWish(id: string) {
    if (!window.confirm("Are you sure you want to remove this delivered wish video?")) return;
    setMessage("");
    try {
      const res = await fetch("/api/admin/site-content", { cache: "no-store" });
      const data = await res.json();
      const currentWishes = data.content?.wishVideos || [];
      const filtered = currentWishes.filter((w: any) => w.id !== id);
      const postRes = await fetch("/api/admin/site-content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wishVideos: filtered }),
      });
      if (postRes.ok) {
        setMessage("Wish video removed successfully.");
        await load();
      } else {
        setMessage("Failed to remove wish video.");
      }
    } catch {
      setMessage("Error communicating with server.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "catalogs", label: "Impact Catalogs (E-Com)" },
          { id: "celebrations", label: "Special Day Celebrations" },
          { id: "wishes", label: "WhatsApp Wish Videos" },
          { id: "today", label: "Today Moments & Photos" },
          { id: "metrics", label: "Section Numbers & Stats" },
          { id: "documents", label: "Audit Reports & PDFs" },
          { id: "campaigns", label: "Campaigns" },
          { id: "volunteers", label: "Volunteers" },
          { id: "media", label: "Media & Safeguarding" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as Tab)}
            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              tab === t.id
                ? "bg-teal-950 text-white shadow"
                : "bg-white text-teal-950 ring-1 ring-teal-900/10 hover:bg-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-xl bg-teal-900/10 border border-teal-900/20 p-3 text-xs sm:text-sm font-bold text-teal-900">
          {message}
        </div>
      )}

      {/* Editing Modal / Drawer */}
      {editingItem && (
        <EditModal
          tab={tab}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={patch}
          onMessage={setMessage}
        />
      )}

      {/* Creation Forms */}
      <CreatePanel tab={tab} onSaved={load} onMessage={setMessage} />

      {/* Record Listings */}
      {loading ? (
        <p className="text-sm font-semibold text-teal-900/70">Loading records…</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <RowCard
              key={row.id || row.key || row.slug}
              row={row}
              tab={tab}
              patch={patch}
              onEdit={() => setEditingItem(row)}
              onDeleteWish={handleDeleteWish}
            />
          ))}
          {rows.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-teal-900/60 ring-1 ring-teal-900/10">
              No records registered under {tab} yet. Use the form above to add one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Reusable File Upload Field with Direct Server Attachment */
function FileUploadField({
  label,
  value,
  onChange,
  category = "images",
  accept,
  onMessage,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  category?: string;
  accept?: string;
  onMessage: (msg: string) => void;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onMessage(`Uploading ${file.name}…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
        onMessage(`Uploaded successfully: ${data.originalName} (${data.url})`);
      } else {
        onMessage(data.error || "File upload failed.");
      }
    } catch {
      onMessage("Network error during file upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-bold text-teal-900/70 mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "/media/... or upload file"}
          className="w-full rounded-xl border p-2 text-xs font-mono text-teal-900"
        />
        <label className="shrink-0 cursor-pointer rounded-xl bg-teal-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition flex items-center gap-1 shadow-sm">
          {uploading ? "Uploading…" : "Upload File"}
          <input
            type="file"
            accept={accept}
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}

/** Component for Creating New Entries Across All Tabs */
function CreatePanel({
  tab,
  onSaved,
  onMessage,
}: {
  tab: Tab;
  onSaved: () => Promise<void>;
  onMessage: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Catalog Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [unitLabel, setUnitLabel] = useState("unit");
  const [imageUrl, setImageUrl] = useState("");
  const [gallery, setGallery] = useState("");
  const [schemes, setSchemes] = useState("");
  const [todayNeed, setTodayNeed] = useState(false);
  const [featured, setFeatured] = useState(false);

  // Wish Video Form Fields
  const [wishCelebrant, setWishCelebrant] = useState("");
  const [wishOccasion, setWishOccasion] = useState("7th Birthday");
  const [wishDonor, setWishDonor] = useState("");
  const [wishDate, setWishDate] = useState("");
  const [wishPkgTitle, setWishPkgTitle] = useState("Special Birthday Lunch with Payasam");
  const [wishPkgCost, setWishPkgCost] = useState("3500");
  const [wishVideoUrl, setWishVideoUrl] = useState("");
  const [wishThumbUrl, setWishThumbUrl] = useState("");
  const [wishQuote, setWishQuote] = useState("");

  // Today Moment Form Fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // Metric Form Fields
  const [metricKey, setMetricKey] = useState("");
  const [metricLabel, setMetricLabel] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [metricUnit, setMetricUnit] = useState("+");

  // Document Form Fields
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("Tax & Legal");
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docVersion, setDocVersion] = useState("AY 2024-25");

  // Media Form Fields
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [mediaConsent, setMediaConsent] = useState("CONSENTED");

  async function submit(e: FormEvent) {
    e.preventDefault();
    onMessage("");

    if (tab === "wishes") {
      try {
        const r = await fetch("/api/admin/site-content", { cache: "no-store" });
        const data = await r.json();
        const currentWishes = data.content?.wishVideos || [];
        const newWish = {
          id: "wish_" + Date.now(),
          celebrantName: wishCelebrant,
          occasion: wishOccasion,
          donorName: wishDonor,
          deliveredDate:
            wishDate ||
            `Delivered on WhatsApp • ${new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}`,
          packageTitle: wishPkgTitle,
          packageCost: Number(wishPkgCost) || 3500,
          videoUrl: wishVideoUrl || "/media/ashrama_video.mp4",
          thumbnailUrl: wishThumbUrl || "/media/meals.jpg",
          quote: wishQuote,
        };
        const saveRes = await fetch("/api/admin/site-content", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ wishVideos: [newWish, ...currentWishes] }),
        });
        const sj = await saveRes.json();
        onMessage(
          saveRes.ok
            ? "Delivered WhatsApp wish video registered successfully!"
            : sj.error || "Failed to save wish video."
        );
        if (saveRes.ok) {
          setOpen(false);
          setWishCelebrant("");
          setWishDonor("");
          setWishDate("");
          setWishVideoUrl("");
          setWishThumbUrl("");
          setWishQuote("");
          await onSaved();
        }
      } catch {
        onMessage("Network error saving wish video.");
      }
      return;
    }

    let endpoint = "";
    let payload: Record<string, unknown> = {};

    if (tab === "catalogs") {
      endpoint = "/api/admin/impact-items";
      payload = {
        name,
        description,
        category,
        unitPrice: Number(price),
        unitLabel,
        imageUrl: imageUrl || "/media/poster.jpg",
        gallery: gallery || null,
        schemes: schemes || null,
        todayNeed,
        featured,
        financeApproval: "approved",
      };
    } else if (tab === "today") {
      endpoint = "/api/admin/today-updates";
      payload = {
        title,
        body,
        category,
        imageUrl: imageUrl || "/media/learning.jpg",
        status: "published",
      };
    } else if (tab === "metrics") {
      endpoint = "/api/admin/metrics";
      payload = {
        key: metricKey,
        label: metricLabel,
        value: Number(metricValue),
        unit: metricUnit,
        published: true,
      };
    } else if (tab === "documents") {
      endpoint = "/api/admin/documents";
      payload = {
        title: docTitle,
        category: docCategory,
        fileUrl: docFileUrl,
        version: docVersion,
        publishedOn: new Date().toISOString().split("T")[0],
        status: "published",
      };
    } else if (tab === "media") {
      endpoint = "/api/admin/media";
      payload = {
        publicUrl: mediaUrl,
        altText: mediaAlt,
        kind: mediaUrl.endsWith(".mp4") ? "video" : "image",
        consentStatus: mediaConsent,
        status: "PUBLISHED",
      };
    } else {
      return;
    }

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    onMessage(r.ok ? `Created ${tab} entry successfully.` : j.error || "Failed to create.");
    if (r.ok) {
      setOpen(false);
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setGallery("");
      setSchemes("");
      setTitle("");
      setBody("");
      setMetricKey("");
      setMetricLabel("");
      setMetricValue("");
      setDocTitle("");
      setDocFileUrl("");
      setMediaUrl("");
      setMediaAlt("");
      await onSaved();
    }
  }

  if (tab === "campaigns" || tab === "volunteers" || tab === "celebrations") {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-teal-900">
            {tab === "catalogs"
              ? "Add New Impact Need / Product"
              : tab === "wishes"
              ? "Add Delivered WhatsApp Wish Video"
              : tab === "today"
              ? "Add Today Moment with Photo"
              : tab === "metrics"
              ? "Add Section Number / Metric"
              : tab === "documents"
              ? "Add Audit Report or PDF Link"
              : "Register Photo or Video"}
          </h3>
          <p className="text-xs text-teal-950/60 mt-0.5">
            Upload files directly or enter URLs to update the live platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-xl bg-teal-900 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer"
        >
          {open ? "Cancel" : "+ Add New"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 space-y-4 pt-4 border-t border-teal-900/10">
          {tab === "wishes" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">
                  Celebrant Name &amp; Milestone:
                </label>
                <input
                  required
                  value={wishCelebrant}
                  onChange={(e) => setWishCelebrant(e.target.value)}
                  placeholder="e.g. Little Ananya's 7th Birthday"
                  className="w-full rounded-xl border p-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Occasion Tag:</label>
                <input
                  required
                  value={wishOccasion}
                  onChange={(e) => setWishOccasion(e.target.value)}
                  placeholder="e.g. 7th Birthday, 25th Anniversary, First Salary"
                  className="w-full rounded-xl border p-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">
                  Donor Name &amp; Location:
                </label>
                <input
                  required
                  value={wishDonor}
                  onChange={(e) => setWishDonor(e.target.value)}
                  placeholder="e.g. Priya &amp; Rajesh (Bengaluru)"
                  className="w-full rounded-xl border p-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">
                  Delivered Date Badge Text:
                </label>
                <input
                  value={wishDate}
                  onChange={(e) => setWishDate(e.target.value)}
                  placeholder="e.g. Delivered on WhatsApp • 28 Sep 2026"
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Package Title:</label>
                <input
                  required
                  value={wishPkgTitle}
                  onChange={(e) => setWishPkgTitle(e.target.value)}
                  placeholder="e.g. Special Birthday Lunch with Payasam"
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Package Cost (₹):</label>
                <input
                  required
                  type="number"
                  min="500"
                  value={wishPkgCost}
                  onChange={(e) => setWishPkgCost(e.target.value)}
                  placeholder="3500"
                  className="w-full rounded-xl border p-2 text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  label="Wish Video File (MP4/WebM) or Direct Video URL:"
                  value={wishVideoUrl}
                  onChange={setWishVideoUrl}
                  category="videos"
                  accept="video/mp4,video/webm,video/quicktime"
                  onMessage={onMessage}
                  placeholder="/media/ashrama_video.mp4 or upload .mp4"
                />
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  label="Thumbnail / Poster Image or Direct Photo URL:"
                  value={wishThumbUrl}
                  onChange={setWishThumbUrl}
                  category="celebrations"
                  accept="image/*"
                  onMessage={onMessage}
                  placeholder="/media/meals.jpg or upload .jpg/.png"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-teal-900/70 mb-1">
                  Children&apos;s Blessing / Video Greeting Quote:
                </label>
                <textarea
                  required
                  rows={2}
                  value={wishQuote}
                  onChange={(e) => setWishQuote(e.target.value)}
                  placeholder='e.g. "Happy Birthday Ananya Didi! Thank you for the sweet payasam and pooris! All 48 of us chanted your name and prayed for your happiness!"'
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
            </div>
          )}

          {tab === "catalogs" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Catalog Name / Title:</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sponsor a Warm Meal (Annadana)"
                  className="w-full rounded-xl border p-2 text-xs text-teal-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Category / Section:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border p-2 text-xs text-teal-900 font-semibold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Base Unit Price (₹):</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-xl border p-2 text-xs text-teal-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Unit Label:</label>
                <input
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  placeholder="e.g. meal, kit, student/month"
                  className="w-full rounded-xl border p-2 text-xs text-teal-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Description:</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what this need provides to the children..."
                  className="w-full rounded-xl border p-2 text-xs text-teal-900"
                />
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  label="Primary Image URL / Upload File:"
                  value={imageUrl}
                  onChange={setImageUrl}
                  category="images"
                  accept="image/*"
                  onMessage={onMessage}
                  placeholder="/media/food.jpg or upload .jpg/.png"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-teal-900/70 mb-1">
                  Multi-Images &amp; Video URLs (Comma or newline separated):
                </label>
                <input
                  value={gallery}
                  onChange={(e) => setGallery(e.target.value)}
                  placeholder="/media/meals.jpg, /media/chapter2_breakfast.mp4"
                  className="w-full rounded-xl border p-2 text-xs font-mono text-teal-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-teal-900/70 mb-1">
                  Donation Schemes &amp; Marketing Tiers (JSON or leave blank for auto):
                </label>
                <textarea
                  rows={2}
                  value={schemes}
                  onChange={(e) => setSchemes(e.target.value)}
                  placeholder='[{"title":"1 Child Meal","qty":1},{"title":"Feast 48 Children","qty":48,"popular":true}]'
                  className="w-full rounded-xl border p-2 text-xs font-mono text-teal-900"
                />
              </div>

              <div className="flex items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                  <input
                    type="checkbox"
                    checked={todayNeed}
                    onChange={(e) => setTodayNeed(e.target.checked)}
                  />
                  <span>Mark as Today&apos;s Urgent Need</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <span>Feature in Highlights</span>
                </label>
              </div>
            </div>
          )}

          {tab === "today" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Moment Title:</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hot Breakfast at 7:30 AM"
                  className="w-full rounded-xl border p-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Category:</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Daily Kitchen"
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Story / Body:</label>
                <textarea
                  required
                  rows={2}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Short real moment description..."
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <FileUploadField
                  label="Moment Photo URL / Upload File:"
                  value={imageUrl}
                  onChange={setImageUrl}
                  category="images"
                  accept="image/*"
                  onMessage={onMessage}
                  placeholder="/media/learning.jpg or upload .jpg/.png"
                />
              </div>
            </div>
          )}

          {tab === "metrics" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Metric Key:</label>
                <input
                  required
                  value={metricKey}
                  onChange={(e) => setMetricKey(e.target.value)}
                  placeholder="e.g. children_count"
                  className="w-full rounded-xl border p-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Label Text:</label>
                <input
                  required
                  value={metricLabel}
                  onChange={(e) => setMetricLabel(e.target.value)}
                  placeholder="e.g. Resident Children in Full Care"
                  className="w-full rounded-xl border p-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Number / Value:</label>
                <input
                  required
                  type="number"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  placeholder="e.g. 48"
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Suffix Unit:</label>
                <input
                  value={metricUnit}
                  onChange={(e) => setMetricUnit(e.target.value)}
                  placeholder="e.g. + or % or meals"
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
            </div>
          )}

          {tab === "documents" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Document Title:</label>
                <input
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Annual Audited Financial Statement"
                  className="w-full rounded-xl border p-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Category:</label>
                <input
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  placeholder="e.g. Tax & Governance"
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <FileUploadField
                  label="PDF File URL / Upload PDF File:"
                  value={docFileUrl}
                  onChange={setDocFileUrl}
                  category="documents"
                  accept="application/pdf,.doc,.docx"
                  onMessage={onMessage}
                  placeholder="/reports/audit_2024.pdf or upload PDF"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Version / Period:</label>
                <input
                  value={docVersion}
                  onChange={(e) => setDocVersion(e.target.value)}
                  placeholder="AY 2024-25"
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
            </div>
          )}

          {tab === "media" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FileUploadField
                  label="Public Media URL / Upload Image or Video:"
                  value={mediaUrl}
                  onChange={setMediaUrl}
                  category="general"
                  accept="image/*,video/*"
                  onMessage={onMessage}
                  placeholder="/media/learning.jpg or upload file"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Alt Text:</label>
                <input
                  required
                  value={mediaAlt}
                  onChange={(e) => setMediaAlt(e.target.value)}
                  placeholder="Dignified description of photo/video"
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Safeguarding Consent:</label>
                <select
                  value={mediaConsent}
                  onChange={(e) => setMediaConsent(e.target.value)}
                  className="w-full rounded-xl border p-2 text-xs"
                >
                  <option value="CONSENTED">CONSENTED (Verified)</option>
                  <option value="PENDING">PENDING REVIEW</option>
                  <option value="REVOKED">REVOKED (Takedown)</option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-xl bg-saffron px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-saffron-dark transition cursor-pointer"
            >
              Save to Platform
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Individual Record Row with Inline Controls */
function RowCard({
  row,
  tab,
  patch,
  onEdit,
  onDeleteWish,
}: {
  row: any;
  tab: Tab;
  patch: (endpoint: string, body: Record<string, unknown>) => Promise<void>;
  onEdit: () => void;
  onDeleteWish?: (id: string) => Promise<void>;
}) {
  if (tab === "wishes") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="flex flex-col sm:flex-row gap-4 items-start min-w-0 flex-1">
          <div className="relative w-full sm:w-48 aspect-video shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-teal-900/10 shadow-sm">
            <video
              src={row.videoUrl}
              poster={row.thumbnailUrl}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-teal-900 text-sm">{row.celebrantName}</strong>
              <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-teal-950">
                {row.occasion}
              </span>
              <span className="text-[11px] text-teal-900/60 font-medium">
                {row.deliveredDate}
              </span>
            </div>
            <p className="text-xs text-teal-950/65 mt-1">
              Sponsored by <strong>{row.donorName}</strong> &bull; {row.packageTitle} ({formatINR(row.packageCost)})
            </p>
            {row.quote && (
              <p className="mt-2 text-xs italic text-teal-950/80 bg-cream/70 rounded-xl p-2.5 border border-teal-900/10">
                &ldquo;{row.quote}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-end md:self-start">
          <button
            type="button"
            onClick={() => void onDeleteWish?.(row.id)}
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer"
          >
            Delete Video
          </button>
        </div>
      </div>
    );
  }

  if (tab === "catalogs") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-teal-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.imageUrl || "/media/poster.jpg"}
              alt={row.name || "Impact Item"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <strong className="text-teal-900 text-sm truncate">{row.name}</strong>
              {row.todayNeed && (
                <span className="rounded bg-saffron/15 px-1.5 py-0.2 text-[10px] font-bold text-saffron-dark">
                  Today Need
                </span>
              )}
            </div>
            <p className="text-xs text-teal-950/60 mt-0.5">
              {formatINR(row.unitPrice)} / {row.unitLabel || "unit"} · {row.category} · Status:{" "}
              <span className={row.active ? "text-emerald-700 font-bold" : "text-red-600"}>
                {row.active ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-teal-900/20 bg-cream px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-sand transition cursor-pointer"
          >
            Edit Media &amp; Schemes
          </button>
          <button
            type="button"
            onClick={() => void patch("/api/admin/impact-items", { id: row.id, todayNeed: !row.todayNeed })}
            className="rounded-xl bg-saffron px-3 py-1.5 text-xs font-bold text-white hover:bg-saffron-dark transition cursor-pointer"
          >
            {row.todayNeed ? "Unmark Need" : "Mark Today"}
          </button>
          <button
            type="button"
            onClick={() => void patch("/api/admin/impact-items", { id: row.id, active: !row.active })}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer ${
              row.active ? "bg-teal-950 hover:bg-teal-900" : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {row.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    );
  }

  if (tab === "celebrations") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <strong className="text-teal-900 text-sm">{row.celebrantName}</strong>
            <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-teal-950">
              {row.occasion}
            </span>
            <span className="font-mono text-xs text-teal-900/60 font-semibold">{row.celebrationDate}</span>
          </div>
          <p className="text-xs text-teal-950/65 mt-1">
            {row.packageName} ({formatINR(row.amount)}) &bull; {row.visitMode === "in_person" ? "In-Person Visit" : "Remote Seva"} &bull; Contact: {row.donorName} ({row.donorPhone})
          </p>
          {row.blessingMessage && (
            <p className="text-[11px] text-teal-900/70 italic mt-0.5">&ldquo;{row.blessingMessage}&rdquo;</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={row.celebrationStatus}
            onChange={(e) => void patch("/api/admin/celebrations", { id: row.id, celebrationStatus: e.target.value })}
            className="rounded-xl border p-1.5 text-xs font-bold bg-cream text-teal-950"
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="FOOD_PREPARED">FOOD PREPARED</option>
            <option value="CELEBRATED">CELEBRATED</option>
            <option value="PHOTOS_SENT">PHOTOS SENT</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>
    );
  }

  if (tab === "today") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <strong className="text-teal-900 text-sm">{row.title}</strong>
          <p className="text-xs text-teal-950/60 mt-0.5">{row.category} · {row.body?.slice(0, 80)}...</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={row.status}
            onChange={(e) => void patch("/api/admin/today-updates", { id: row.id, status: e.target.value })}
            className="rounded-xl border p-1.5 text-xs font-semibold"
          >
            <option value="published">PUBLISHED</option>
            <option value="draft">DRAFT</option>
            <option value="archived">ARCHIVED</option>
          </select>
        </div>
      </div>
    );
  }

  if (tab === "metrics") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <strong className="text-teal-900 text-sm">{row.label}</strong>
          <p className="text-xs text-teal-950/60 font-mono mt-0.5">{row.key}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-teal-900 text-base">
            {row.value} {row.unit}
          </span>
          <button
            type="button"
            onClick={() => void patch("/api/admin/metrics", { id: row.id, published: !row.published })}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer ${
              row.published ? "bg-teal-900" : "bg-teal-950/50"
            }`}
          >
            {row.published ? "Live" : "Hidden"}
          </button>
        </div>
      </div>
    );
  }

  if (tab === "documents") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <strong className="text-teal-900 text-sm">{row.title}</strong>
          <p className="text-xs text-teal-950/60 mt-0.5">{row.category} · {row.version} · <span className="font-mono">{row.fileUrl}</span></p>
        </div>
        <a
          href={row.fileUrl}
          target="_blank"
          rel="noopener"
          className="rounded-xl border border-teal-900/20 bg-cream px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-sand transition"
        >
          View PDF →
        </a>
      </div>
    );
  }

  if (tab === "campaigns") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <strong className="text-teal-900 text-sm">{row.title}</strong>
          <p className="text-xs text-teal-950/60 mt-0.5">
            By {row.organizerName} · {row.occasion} · Goal: {formatINR(row.goalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void patch("/api/admin/campaigns", { id: row.id, status: "approved" })}
            className="rounded-xl bg-teal-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => void patch("/api/admin/campaigns", { id: row.id, status: "rejected" })}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 transition cursor-pointer"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  if (tab === "volunteers") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <strong className="text-teal-900 text-sm">{row.name}</strong>
          <p className="text-xs text-teal-950/60 mt-0.5">{row.interestArea} · {row.email} · {row.phone || "No phone"}</p>
        </div>
        <select
          value={row.status}
          onChange={(e) => void patch("/api/admin/volunteers", { id: row.id, status: e.target.value })}
          className="rounded-xl border p-1.5 text-xs font-semibold"
        >
          <option value="NEW">NEW</option>
          <option value="REVIEWING">REVIEWING</option>
          <option value="CONTACTED">CONTACTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>
    );
  }

  // Media
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
      <div>
        <strong className="text-teal-900 text-sm">{row.altText}</strong>
        <p className="text-xs text-teal-950/60 font-mono mt-0.5 break-all">{row.publicUrl}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void patch("/api/admin/media", { id: row.id, status: "TAKEDOWN", consentStatus: "REVOKED" })}
          className="rounded-xl bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800 transition cursor-pointer"
        >
          Immediate Takedown
        </button>
      </div>
    </div>
  );
}

/** Full-Featured Edit Modal for Updating Catalog Media, Schemes, and Copy */
function EditModal({
  tab,
  item,
  onClose,
  onSave,
  onMessage,
}: {
  tab: Tab;
  item: any;
  onClose: () => void;
  onSave: (endpoint: string, body: Record<string, unknown>) => Promise<void>;
  onMessage: (msg: string) => void;
}) {
  const [name, setName] = useState(item.name || "");
  const [description, setDescription] = useState(item.description || "");
  const [category, setCategory] = useState(item.category || CATEGORIES[0]);
  const [price, setPrice] = useState(String(item.unitPrice || ""));
  const [unitLabel, setUnitLabel] = useState(item.unitLabel || "unit");
  const [imageUrl, setImageUrl] = useState(item.imageUrl || "");
  const [gallery, setGallery] = useState(item.gallery || "");
  const [schemes, setSchemes] = useState(item.schemes || "");

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    await onSave("/api/admin/impact-items", {
      id: item.id,
      name,
      description,
      category,
      unitPrice: Number(price),
      unitLabel,
      imageUrl,
      gallery,
      schemes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-display text-lg font-bold text-teal-900">
            Edit Catalog: {item.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-teal-900/60 hover:text-teal-900 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-teal-900/70 mb-1">Title / Name:</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-900/70 mb-1">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-900/70 mb-1">Unit Price (₹):</label>
              <input
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-900/70 mb-1">Unit Label:</label>
              <input
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/70 mb-1">Description:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border p-2 text-xs"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FileUploadField
                label="Primary Image URL / Upload:"
                value={imageUrl}
                onChange={setImageUrl}
                category="images"
                accept="image/*"
                onMessage={onMessage}
                placeholder="/media/food.jpg or upload .jpg/.png"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-900/70 mb-1">
                Multi-Images &amp; Video URLs (Comma or newline separated):
              </label>
              <input
                value={gallery}
                onChange={(e) => setGallery(e.target.value)}
                placeholder="/media/food.jpg, /media/chapter2_breakfast.mp4"
                className="w-full rounded-xl border p-2 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/70 mb-1">
              Custom Marketing Schemes &amp; Donation Tiers (JSON):
            </label>
            <textarea
              rows={3}
              value={schemes}
              onChange={(e) => setSchemes(e.target.value)}
              placeholder='[{"title":"1 Child Meal","qty":1},{"title":"Feast 48 Children","qty":48,"popular":true}]'
              className="w-full rounded-xl border p-2 text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-xs font-bold text-teal-900 hover:bg-cream cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white shadow hover:bg-saffron-dark cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
