"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePan,
  validateFutureDate,
  validateAmount,
  sanitizeNumeric,
  sanitizePan,
} from "@/lib/validation";
import { ValidationErrorModal } from "@/components/ValidationErrorModal";
import { BusinessPlanModal } from "@/components/BusinessPlanModal";
import { CURATED_GALLERY, type GalleryItem } from "@/data/ashrama-curated-gallery";
import type { TodayMealStatusItem } from "@/lib/site-content";

type Tab = "analytics" | "crm" | "marketing" | "celebrations" | "content" | "media" | "catalogs" | "documents" | "community" | "team";

interface AdminDashboardProps {
  initialSession: {
    user: {
      id?: number;
      displayName: string;
      email: string;
      role: string;
    };
  };
}

const CATEGORIES = [
  "Official Tiers",
  "Annadana",
  "Vidya",
  "Arogya",
  "Ashraya",
  "Celebrations",
  "Annadana (Food)",
  "Vidya (Education)",
  "Arogya (Health)",
  "Essentials & Shelter",
  "Recreation & Sports",
  "Celebrations & Birthday",
  "Infrastructure & Care",
];

const ROLES_INFO: { role: string; label: string; desc: string }[] = [
  { role: "SUPER_ADMIN", label: "Super Admin", desc: "Full root access — manage employee accounts, database, and all settings." },
  { role: "STAFF_ADMIN", label: "Staff Admin", desc: "Operations manager — access CRM, Celebrations, Content, and Volunteers." },
  { role: "FINANCE", label: "Finance Officer", desc: "CRM, donation verification, 80G tax receipts, offline entries & CSV exports." },
  { role: "CONTENT_ADMIN", label: "Content Editor", desc: "Manage website hero text, stories, blog updates, and announcements." },
  { role: "DONATION_ADMIN", label: "Donation Admin", desc: "Monitor donations, manage donor contacts and transaction receipts." },
  { role: "CAMPAIGN_ADMIN", label: "Campaign Admin", desc: "Edit fundraising causes, target amounts, and impact catalog items." },
  { role: "VOLUNTEER_ADMIN", label: "Volunteer Admin", desc: "Review and approve Janaseva Crew applications and community outreach." },
  { role: "MEDIA_REVIEWER", label: "Media Reviewer", desc: "Manage Ashrama gallery photos, video reels, and media showcase." },
  { role: "CSR_ADMIN", label: "CSR Admin", desc: "Manage corporate CSR proposals, grants, and partnership inquiries." },
  { role: "PARTNER_ADMIN", label: "Partner Admin", desc: "Coordinate institutional collaborations and organizational partnerships." },
];

export default function AdminDashboardClient({ initialSession }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [notification, setNotification] = useState("");
  const [valModalOpen, setValModalOpen] = useState(false);
  const [valModalMsg, setValModalMsg] = useState("");

  // Business Plan & Strategy State
  const [businessPlanOpen, setBusinessPlanOpen] = useState(false);

  // Today Daily Moments & Photo Upload State
  const [dailyPhotoModalOpen, setDailyPhotoModalOpen] = useState(false);
  const [dailyPhotoFile, setDailyPhotoFile] = useState<File | null>(null);
  const [dailyPhotoPreview, setDailyPhotoPreview] = useState("");
  const [dailyPhotoTitle, setDailyPhotoTitle] = useState("");
  const [dailyPhotoBody, setDailyPhotoBody] = useState("");
  const [dailyPhotoCategory, setDailyPhotoCategory] = useState("Kitchen & Annadana");
  const [dailyPhotoUploading, setDailyPhotoUploading] = useState(false);

  // CRM state
  const [donations, setDonations] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmSearch, setCrmSearch] = useState("");
  const [crmStatus, setCrmStatus] = useState("all");
  const [crmTotals, setCrmTotals] = useState({ totalRaised: 0, paidCount: 0, totalCount: 0 });
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [offlineDonationModalOpen, setOfflineDonationModalOpen] = useState(false);
  const [offlineSubmitting, setOfflineSubmitting] = useState(false);

  // Celebrations state
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [celebLoading, setCelebLoading] = useState(false);
  const [celebSearch, setCelebSearch] = useState("");
  const [celebStatus, setCelebStatus] = useState("all");
  const [celebOccasion, setCelebOccasion] = useState("all");
  const [celebCounts, setCelebCounts] = useState({
    total: 0,
    totalAmount: 0,
    todayCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    celebratedCount: 0,
  });
  const [newCelebModalOpen, setNewCelebModalOpen] = useState(false);
  const [proofModalCeleb, setProofModalCeleb] = useState<any | null>(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Site Content CMS state
  const [contentForm, setContentForm] = useState<any | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);

  // Media Manager state
  const [selectedVideoPreview, setSelectedVideoPreview] = useState<string | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<{
    url: string;
    title: string;
    kannada?: string;
    desc?: string;
  } | null>(null);
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState("all");

  // Catalogs state
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<any | null>(null);
  const [newCatalogOpen, setNewCatalogOpen] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);

  // FinTech CRM payment mode filter
  const [crmMode, setCrmMode] = useState("all");

  // Marketing & Campaigns state
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [newCampaignModalOpen, setNewCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState("shagun");
  const [whatsappCustomMsg, setWhatsappCustomMsg] = useState("");

  // Today Updates list state
  const [todayUpdatesList, setTodayUpdatesList] = useState<any[]>([]);
  const [todayUpdatesLoading, setTodayUpdatesLoading] = useState(false);
  const [editingTodayUpdate, setEditingTodayUpdate] = useState<any | null>(null);

  // Content CMS subtab
  const [contentSubtab, setContentSubtab] = useState<"hero" | "meals" | "tiers" | "quotes" | "faqs" | "about_contact">("hero");

  // Volunteers state
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);

  // Team & Employees State
  interface TeamUser {
    id: number;
    email: string;
    displayName: string;
    role: string;
    active: boolean;
    createdAt: string;
  }
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(initialSession.user.id || null);
  const [newMemberModalOpen, setNewMemberModalOpen] = useState(false);
  const [newMemberSubmitting, setNewMemberSubmitting] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "STAFF_ADMIN",
  });
  const [resetPassModalUser, setResetPassModalUser] = useState<TeamUser | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // File Uploader state
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState("images");

  // Handle direct file upload to /api/admin/upload
  async function handleFileUpload(file: File, category = "images"): Promise<string | null> {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setNotification(`Uploaded successfully: ${data.originalName} (${data.url})`);
        setUploadedUrl(data.url);
        return data.url;
      } else {
        setNotification(data.error || "File upload failed.");
        return null;
      }
    } catch {
      setNotification("Network error uploading file.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  // Handle publishing a new daily photo / moment for "Today at Janaseva"
  async function handlePublishDailyPhoto(e: FormEvent) {
    e.preventDefault();
    if (!dailyPhotoTitle.trim()) {
      setNotification("Please enter a title for today's moment.");
      return;
    }
    setDailyPhotoUploading(true);
    try {
      let finalImageUrl = dailyPhotoPreview;

      if (dailyPhotoFile) {
        const uploaded = await handleFileUpload(dailyPhotoFile, "images");
        if (uploaded) {
          finalImageUrl = uploaded;
        }
      }

      const res = await fetch("/api/admin/today-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: dailyPhotoTitle.trim(),
          body: dailyPhotoBody.trim() || dailyPhotoTitle.trim(),
          category: dailyPhotoCategory,
          imageUrl: finalImageUrl || null,
          status: "published",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification("✨ Today's photo published live! It is now the #1 featured moment on the website.");
        setDailyPhotoModalOpen(false);
        setDailyPhotoFile(null);
        setDailyPhotoPreview("");
        setDailyPhotoTitle("");
        setDailyPhotoBody("");
      } else {
        setNotification(data.error || "Failed to publish today update.");
      }
    } catch {
      setNotification("Network error publishing today update.");
    } finally {
      setDailyPhotoUploading(false);
    }
  }

  // Load CRM data
  async function loadCrmData() {
    setCrmLoading(true);
    try {
      const q = encodeURIComponent(crmSearch.trim());
      const s = encodeURIComponent(crmStatus);
      const m = encodeURIComponent(crmMode);
      const res = await fetch(`/api/admin/crm/donations?q=${q}&status=${s}&mode=${m}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setDonations(data.items || []);
        setCrmTotals(
          data.totals || {
            totalRaised: 0,
            paidCount: 0,
            totalCount: 0,
            onlineRaised: 0,
            wireRaised: 0,
            offlineRaised: 0,
            panClaimedCount: 0,
          },
        );
      } else {
        setNotification(data.error || "Failed to load donations.");
      }
    } catch {
      setNotification("Network error loading CRM data.");
    }
    setCrmLoading(false);
  }

  // Delete CRM donation
  async function handleDeleteDonation(id: number) {
    if (!confirm("Are you sure you want to delete this donation transaction? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/crm/donations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setNotification("Donation transaction deleted successfully.");
        await loadCrmData();
      } else {
        setNotification(data.error || "Failed to delete donation.");
      }
    } catch {
      setNotification("Network error deleting donation.");
    }
  }

  // Load Marketing Campaigns
  async function loadCampaigns() {
    setCampaignsLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setCampaignsList(data.campaigns || []);
      else setNotification(data.error || "Failed to load campaigns.");
    } catch {
      setNotification("Network error loading campaigns.");
    } finally {
      setCampaignsLoading(false);
    }
  }

  // Create Campaign
  async function handleCreateCampaign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title"),
      slug: fd.get("slug"),
      occasion: fd.get("occasion"),
      campaignType: fd.get("campaignType"),
      story: fd.get("story"),
      goalAmount: Number(fd.get("goalAmount")),
      coverImage: fd.get("coverImage"),
      endDate: fd.get("endDate"),
      status: "approved",
    };
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("✨ Campaign created and approved live!");
        setNewCampaignModalOpen(false);
        await loadCampaigns();
      } else {
        setNotification(data.error || "Failed to create campaign.");
      }
    } catch {
      setNotification("Network error creating campaign.");
    }
  }

  // Patch Campaign
  async function handlePatchCampaign(id: number, patch: any) {
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("Campaign updated successfully.");
        setEditingCampaign(null);
        await loadCampaigns();
      } else {
        setNotification(data.error || "Failed to update campaign.");
      }
    } catch {
      setNotification("Network error updating campaign.");
    }
  }

  // Delete Campaign
  async function handleDeleteCampaign(id: number) {
    if (!confirm("Are you sure you want to delete this fundraising campaign? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/campaigns?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setNotification("Campaign deleted successfully.");
        await loadCampaigns();
      } else {
        setNotification(data.error || "Failed to delete campaign.");
      }
    } catch {
      setNotification("Network error deleting campaign.");
    }
  }

  // Load Today Updates List
  async function loadTodayUpdatesList() {
    setTodayUpdatesLoading(true);
    try {
      const res = await fetch("/api/admin/today-updates", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setTodayUpdatesList(data.updates || []);
    } catch {
      // silent
    } finally {
      setTodayUpdatesLoading(false);
    }
  }

  // Patch Today Update
  async function handlePatchTodayUpdate(id: number, patch: any) {
    try {
      const res = await fetch("/api/admin/today-updates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("Today's moment updated successfully.");
        setEditingTodayUpdate(null);
        await loadTodayUpdatesList();
      } else {
        setNotification(data.error || "Failed to update moment.");
      }
    } catch {
      setNotification("Network error updating moment.");
    }
  }

  // Delete Today Update
  async function handleDeleteTodayUpdate(id: number) {
    if (!confirm("Are you sure you want to delete this daily moment from the website?")) return;
    try {
      const res = await fetch(`/api/admin/today-updates?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setNotification("Moment deleted from live website.");
        await loadTodayUpdatesList();
      } else {
        setNotification(data.error || "Failed to delete moment.");
      }
    } catch {
      setNotification("Network error deleting moment.");
    }
  }

  // Patch Legal Document
  async function handlePatchDocument(id: number, patch: any) {
    try {
      const res = await fetch("/api/admin/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("Document updated successfully.");
        setEditingDocument(null);
        await loadDocuments();
      } else {
        setNotification(data.error || "Failed to update document.");
      }
    } catch {
      setNotification("Network error updating document.");
    }
  }

  // Delete Legal Document
  async function handleDeleteDocument(id: number) {
    if (!confirm("Are you sure you want to delete this document from the website?")) return;
    try {
      const res = await fetch(`/api/admin/documents?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setNotification("Document deleted successfully.");
        await loadDocuments();
      } else {
        setNotification(data.error || "Failed to delete document.");
      }
    } catch {
      setNotification("Network error deleting document.");
    }
  }

  // Documentary Chapter handlers
  function handleAddChapter() {
    const nextNum = (contentForm?.docChapters?.length || 0) + 1;
    const newChap = {
      id: `chapter_${Date.now()}`,
      number: nextNum < 10 ? `0${nextNum}` : `${nextNum}`,
      title: "New Video Chapter",
      subtitle: "Authentic Life at Janaseva",
      duration: "0:45",
      videoSrc: "/media/ashrama_video.mp4",
      posterSrc: "/media/poster.jpg",
      associatedSlug: "meal",
      associatedItemName: "Child Welfare Support",
      associatedPrice: 100,
      description: "Every boy receives love, care, nutritious food, and dignified opportunity.",
    };
    setContentForm({
      ...contentForm,
      docChapters: [...(contentForm?.docChapters || []), newChap],
    });
  }

  function handleDeleteChapter(index: number) {
    if (!confirm("Are you sure you want to remove this video chapter?")) return;
    const updated = [...(contentForm?.docChapters || [])];
    updated.splice(index, 1);
    setContentForm({ ...contentForm, docChapters: updated });
  }

  // Today Live Meals Tracker handlers
  function handleToggleMealStatus(index: number) {
    const updated = [...(contentForm?.todayMealsStatus || [])];
    const current = updated[index];
    const nextStatus = current.status === "served" ? "open" : "served";
    updated[index] = { ...current, status: nextStatus };
    setContentForm({ ...contentForm, todayMealsStatus: updated });
  }

  function handleUpdateMeal(index: number, patch: Partial<TodayMealStatusItem>) {
    const updated = [...(contentForm?.todayMealsStatus || [])];
    updated[index] = { ...updated[index], ...patch };
    setContentForm({ ...contentForm, todayMealsStatus: updated });
  }

  function handleAddMeal() {
    const newMeal: TodayMealStatusItem = {
      id: `meal_${Date.now()}`,
      name: "Evening Milk & Fruit",
      time: "5:30 PM",
      menu: "Fresh Milk & Seasonal Fruits",
      status: "open",
      sponsorName: "",
      amount: 1500,
      ctaText: "Sponsor Seva",
    };
    setContentForm({
      ...contentForm,
      todayMealsStatus: [...(contentForm?.todayMealsStatus || []), newMeal],
    });
  }

  function handleDeleteMeal(index: number) {
    if (!confirm("Are you sure you want to remove this meal slot?")) return;
    const updated = [...(contentForm?.todayMealsStatus || [])];
    updated.splice(index, 1);
    setContentForm({ ...contentForm, todayMealsStatus: updated });
  }

  // Caregiver Voices & Quotes handlers
  function handleAddQuote() {
    const newQuote = {
      quote: "Every child deserves a warm plate and a tomorrow they can believe in.",
      author: "Ashrama Caregiver",
      role: "Staff Elder",
      context: "Daily Seva Reflection",
      tag: "Dignity",
    };
    setContentForm({
      ...contentForm,
      quotes: [...(contentForm?.quotes || []), newQuote],
    });
  }

  function handleUpdateQuote(index: number, patch: any) {
    const updated = [...(contentForm?.quotes || [])];
    updated[index] = { ...updated[index], ...patch };
    setContentForm({ ...contentForm, quotes: updated });
  }

  function handleDeleteQuote(index: number) {
    if (!confirm("Are you sure you want to remove this quote?")) return;
    const updated = [...(contentForm?.quotes || [])];
    updated.splice(index, 1);
    setContentForm({ ...contentForm, quotes: updated });
  }

  // FAQs handlers
  function handleAddFaq() {
    const newFaq = {
      question: "New Frequently Asked Question?",
      answer: "Detailed answer explaining Janaseva Ashrama's operations.",
      category: "general",
    };
    setContentForm({
      ...contentForm,
      faqs: [...(contentForm?.faqs || []), newFaq],
    });
  }

  function handleUpdateFaq(index: number, patch: any) {
    const updated = [...(contentForm?.faqs || [])];
    updated[index] = { ...updated[index], ...patch };
    setContentForm({ ...contentForm, faqs: updated });
  }

  function handleDeleteFaq(index: number) {
    if (!confirm("Are you sure you want to remove this FAQ?")) return;
    const updated = [...(contentForm?.faqs || [])];
    updated.splice(index, 1);
    setContentForm({ ...contentForm, faqs: updated });
  }

  // Official Support Tiers handlers
  function handleUpdateTier(tierIndex: number, patch: any) {
    const updated = [...(contentForm?.supportTiers || [])];
    updated[tierIndex] = { ...updated[tierIndex], ...patch };
    setContentForm({ ...contentForm, supportTiers: updated });
  }

  function handleUpdateTierOption(tierIndex: number, optIndex: number, patch: any) {
    const updated = [...(contentForm?.supportTiers || [])];
    const options = [...(updated[tierIndex]?.options || [])];
    options[optIndex] = { ...options[optIndex], ...patch };
    updated[tierIndex] = { ...updated[tierIndex], options };
    setContentForm({ ...contentForm, supportTiers: updated });
  }

  function handleAddTierOption(tierIndex: number) {
    const updated = [...(contentForm?.supportTiers || [])];
    const options = [...(updated[tierIndex]?.options || [])];
    options.push({
      id: `opt_${Date.now()}`,
      label: "Custom Support Option",
      subLabel: "Direct child care",
      amount: 2500,
      isPopular: false,
    });
    updated[tierIndex] = { ...updated[tierIndex], options };
    setContentForm({ ...contentForm, supportTiers: updated });
  }

  function handleDeleteTierOption(tierIndex: number, optIndex: number) {
    if (!confirm("Are you sure you want to remove this pricing option?")) return;
    const updated = [...(contentForm?.supportTiers || [])];
    const options = [...(updated[tierIndex]?.options || [])];
    options.splice(optIndex, 1);
    updated[tierIndex] = { ...updated[tierIndex], options };
    setContentForm({ ...contentForm, supportTiers: updated });
  }

  // Load Analytics data
  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setAnalyticsData(data);
    } catch {
      // silent
    }
    setAnalyticsLoading(false);
  }

  // Load Site Content CMS data
  async function loadSiteContent() {
    setContentLoading(true);
    try {
      const res = await fetch("/api/admin/site-content", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.content) setContentForm(data.content);
    } catch {
      // silent
    }
    setContentLoading(false);
  }

  // Load Catalogs data
  async function loadCatalogs() {
    setCatalogsLoading(true);
    try {
      const res = await fetch("/api/admin/impact-items", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setCatalogs(data.items || []);
    } catch {
      // silent
    }
    setCatalogsLoading(false);
  }

  // Load Documents data
  async function loadDocuments() {
    setDocsLoading(true);
    try {
      const res = await fetch("/api/admin/documents", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setDocuments(data.documents || []);
    } catch {
      // silent
    }
    setDocsLoading(false);
  }

  // Load Volunteers data
  async function loadVolunteers() {
    setVolunteersLoading(true);
    try {
      const res = await fetch("/api/admin/volunteers", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setVolunteers(data.volunteers || []);
    } catch {
      // silent
    }
    setVolunteersLoading(false);
  }

  // Save Site Content CMS data
  async function handleSaveContent(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!contentForm) return;
    setContentSaving(true);
    setNotification("");
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentForm),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("Site content and settings saved successfully. Changes are live on the website.");
        setContentForm(data.content);
      } else {
        setNotification(data.error || "Failed to save content.");
      }
    } catch {
      setNotification("Network error saving content.");
    }
    setContentSaving(false);
  }

  // Update Donation status
  async function updateDonationStatus(id: number, nextStatus: string) {
    try {
      const res = await fetch("/api/admin/crm/donations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        setNotification(`Donation #${id} status updated to ${nextStatus}.`);
        if (selectedDonation && selectedDonation.id === id) {
          setSelectedDonation({ ...selectedDonation, status: nextStatus });
        }
        await loadCrmData();
      }
    } catch {
      setNotification("Failed to update donation status.");
    }
  }

  // Patch catalog item
  async function patchCatalogItem(id: number, patch: Record<string, unknown>) {
    try {
      const res = await fetch("/api/admin/impact-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) {
        setNotification("Impact need updated successfully.");
        await loadCatalogs();
        setEditingCatalog(null);
      }
    } catch {
      setNotification("Failed to update item.");
    }
  }

  // Create new catalog item
  async function createCatalogItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      description: fd.get("description"),
      category: fd.get("category"),
      unitPrice: Number(fd.get("unitPrice")),
      unitLabel: fd.get("unitLabel"),
      imageUrl: fd.get("imageUrl") || "/media/food.jpg",
      gallery: fd.get("gallery") || null,
      schemes: fd.get("schemes") || null,
      todayNeed: fd.get("todayNeed") === "on",
      featured: fd.get("featured") === "on",
      financeApproval: "approved",
    };

    try {
      const res = await fetch("/api/admin/impact-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setNotification("New impact need created successfully.");
        setNewCatalogOpen(false);
        await loadCatalogs();
      }
    } catch {
      setNotification("Failed to create impact need.");
    }
  }

  // Create new document
  async function createDocument(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title"),
      category: fd.get("category") || "Governance",
      fileUrl: fd.get("fileUrl"),
      version: fd.get("version") || "AY 2024-25",
      status: "published",
    };

    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setNotification("Document published successfully.");
        setNewDocOpen(false);
        await loadDocuments();
      }
    } catch {
      setNotification("Failed to create document.");
    }
  }

  // Update volunteer status
  async function updateVolunteerStatus(id: number, status: string) {
    try {
      const res = await fetch("/api/admin/volunteers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setNotification(`Volunteer #${id} status updated to ${status}.`);
        await loadVolunteers();
      }
    } catch {
      setNotification("Failed to update volunteer.");
    }
  }

  // Load Celebrations data
  async function loadCelebrations() {
    setCelebLoading(true);
    try {
      const q = encodeURIComponent(celebSearch.trim());
      const s = encodeURIComponent(celebStatus);
      const occ = encodeURIComponent(celebOccasion);
      const res = await fetch(`/api/admin/celebrations?q=${q}&status=${s}&occasion=${occ}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setCelebrations(data.items || []);
        setCelebCounts(data.counts || {
          total: 0,
          totalAmount: 0,
          todayCount: 0,
          pendingCount: 0,
          confirmedCount: 0,
          celebratedCount: 0,
        });
      } else {
        setNotification(data.error || "Failed to load celebrations.");
      }
    } catch {
      setNotification("Network error loading celebrations.");
    }
    setCelebLoading(false);
  }

  // Update celebration status
  async function updateCelebrationStatus(id: number, status: string) {
    try {
      const res = await fetch("/api/admin/celebrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, celebrationStatus: status }),
      });
      if (res.ok) {
        setNotification(`Celebration #${id} status updated to ${status}.`);
        await loadCelebrations();
      }
    } catch {
      setNotification("Failed to update celebration.");
    }
  }

  // Save proof photos / videos for celebration
  async function handleSaveProof(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!proofModalCeleb) return;
    const fd = new FormData(e.currentTarget);
    const photoProofUrl = fd.get("photoProofUrl");
    const videoProofUrl = fd.get("videoProofUrl");
    const wishVideoUrl = fd.get("wishVideoUrl");
    const staffNotes = fd.get("staffNotes");

    try {
      const res = await fetch("/api/admin/celebrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: proofModalCeleb.id,
          photoProofUrl,
          videoProofUrl,
          wishVideoUrl,
          staffNotes,
          celebrationStatus: "CELEBRATED",
        }),
      });
      if (res.ok) {
        setNotification("Celebration proof saved successfully!");
        setProofModalCeleb(null);
        await loadCelebrations();
      }
    } catch {
      setNotification("Failed to save proof.");
    }
  }

  // Create walk-in celebration booking
  async function handleCreateWalkInCelebration(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const celebrantName = String(fd.get("celebrantName") || "").trim();
    const celebrationDate = String(fd.get("celebrationDate") || "").trim();
    const donorName = String(fd.get("donorName") || "").trim();
    const donorPhone = String(fd.get("donorPhone") || "").trim();
    const donorEmail = String(fd.get("donorEmail") || "").trim();
    const donorPan = String(fd.get("donorPan") || "").trim().toUpperCase();
    const amount = Number(fd.get("amount")) || 3500;

    const celCheck = validateName(celebrantName, "Celebrant name");
    if (!celCheck.valid) {
      setValModalMsg(celCheck.error!);
      setValModalOpen(true);
      return;
    }
    const dateCheck = validateFutureDate(celebrationDate, "Celebration date");
    if (!dateCheck.valid) {
      setValModalMsg(dateCheck.error!);
      setValModalOpen(true);
      return;
    }
    const donorCheck = validateName(donorName, "Coordinator / Donor name");
    if (!donorCheck.valid) {
      setValModalMsg(donorCheck.error!);
      setValModalOpen(true);
      return;
    }
    const phoneCheck = validatePhone(donorPhone, true, "Mobile number");
    if (!phoneCheck.valid) {
      setValModalMsg(phoneCheck.error!);
      setValModalOpen(true);
      return;
    }
    if (donorEmail) {
      const emailCheck = validateEmail(donorEmail, false);
      if (!emailCheck.valid) {
        setValModalMsg(emailCheck.error!);
        setValModalOpen(true);
        return;
      }
    }
    if (donorPan) {
      const panCheck = validatePan(donorPan, false);
      if (!panCheck.valid) {
        setValModalMsg(panCheck.error!);
        setValModalOpen(true);
        return;
      }
    }
    const amtCheck = validateAmount(amount, 100);
    if (!amtCheck.valid) {
      setValModalMsg(amtCheck.error!);
      setValModalOpen(true);
      return;
    }

    const payload = {
      celebrantName,
      occasion: fd.get("occasion") || "Birthday",
      celebrationDate,
      packageName: fd.get("packageName") || "Special Feast",
      amount,
      visitMode: fd.get("visitMode") || "in_person",
      timeSlot: fd.get("timeSlot") || "morning",
      guestCount: fd.get("guestCount") || "2-4",
      blessingMessage: fd.get("blessingMessage") || "",
      donorName,
      donorPhone,
      donorEmail,
      donorPan,
      paymentStatus: fd.get("paymentStatus") || "paid",
      staffNotes: fd.get("staffNotes") || "Walk-in booking recorded by staff.",
    };

    try {
      const res = await fetch("/api/admin/celebrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Celebration booked successfully! Ref: ${data.booking?.reference}`);
        setNewCelebModalOpen(false);
        await loadCelebrations();
      } else {
        setNotification(data.error || "Failed to book celebration.");
        setValModalMsg(data.error || "Failed to book celebration.");
        setValModalOpen(true);
      }
    } catch {
      setNotification("Network error recording celebration.");
    }
  }

  // Record Offline / Gate Donation
  async function handleRecordOfflineDonation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const donorName = String(fd.get("donorName") || "").trim();
    const donorPhone = String(fd.get("donorPhone") || "").trim();
    const donorEmail = String(fd.get("donorEmail") || "").trim();
    const donorPan = String(fd.get("donorPan") || "").trim().toUpperCase();
    const amount = Number(fd.get("amount")) || 0;

    const nameCheck = validateName(donorName, "Donor name");
    if (!nameCheck.valid) {
      setValModalMsg(nameCheck.error!);
      setValModalOpen(true);
      return;
    }
    const phoneCheck = validatePhone(donorPhone, true, "Mobile number");
    if (!phoneCheck.valid) {
      setValModalMsg(phoneCheck.error!);
      setValModalOpen(true);
      return;
    }
    if (donorEmail) {
      const emailCheck = validateEmail(donorEmail, false);
      if (!emailCheck.valid) {
        setValModalMsg(emailCheck.error!);
        setValModalOpen(true);
        return;
      }
    }
    if (donorPan) {
      const panCheck = validatePan(donorPan, false);
      if (!panCheck.valid) {
        setValModalMsg(panCheck.error!);
        setValModalOpen(true);
        return;
      }
    }
    const amtCheck = validateAmount(amount, 10);
    if (!amtCheck.valid) {
      setValModalMsg(amtCheck.error!);
      setValModalOpen(true);
      return;
    }

    setOfflineSubmitting(true);
    const payload = {
      donorName,
      donorPhone,
      donorEmail,
      donorPan,
      amount,
      paymentMode: fd.get("paymentMode") || "cash",
      purpose: fd.get("purpose") || "General Ashrama Seva",
      notes: fd.get("notes") || "",
    };

    try {
      const res = await fetch("/api/admin/crm/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Offline donation recorded! Receipt No: ${data.donation?.receiptNo}`);
        setOfflineDonationModalOpen(false);
        await loadCrmData();
      } else {
        setNotification(data.error || "Failed to record donation.");
        setValModalMsg(data.error || "Failed to record donation.");
        setValModalOpen(true);
      }
    } catch {
      setNotification("Failed to record offline donation.");
    }
    setOfflineSubmitting(false);
  }

  // Load Team Members
  async function loadTeamMembers() {
    setTeamLoading(true);
    try {
      const res = await fetch("/api/admin/team", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setTeamMembers(data.users || []);
        if (data.currentUserId) setCurrentAdminId(data.currentUserId);
      } else {
        setNotification(data.error || "Failed to load team members.");
      }
    } catch {
      setNotification("Network error loading team members.");
    } finally {
      setTeamLoading(false);
    }
  }

  // Create Employee Account
  async function handleCreateTeamMember(e: FormEvent) {
    e.preventDefault();
    const nameCheck = validateName(newMemberForm.displayName, "Employee full name");
    if (!nameCheck.valid) {
      setValModalMsg(nameCheck.error!);
      setValModalOpen(true);
      return;
    }
    const emailCheck = validateEmail(newMemberForm.email, true);
    if (!emailCheck.valid) {
      setValModalMsg(emailCheck.error!);
      setValModalOpen(true);
      return;
    }
    if (!newMemberForm.password || newMemberForm.password.length < 8) {
      setValModalMsg("Temporary password must be at least 8 characters long for employee account security.");
      setValModalOpen(true);
      return;
    }

    setNewMemberSubmitting(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemberForm),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Team member "${data.user?.displayName}" created successfully!`);
        setNewMemberModalOpen(false);
        setNewMemberForm({ displayName: "", email: "", password: "", role: "STAFF_ADMIN" });
        await loadTeamMembers();
      } else {
        setNotification(data.error || "Failed to create team member.");
        setValModalMsg(data.error || "Failed to create team member.");
        setValModalOpen(true);
      }
    } catch {
      setNotification("Network error creating team member.");
    } finally {
      setNewMemberSubmitting(false);
    }
  }

  // Update Employee Role
  async function handleUpdateRole(id: number, role: string) {
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification("Employee role updated successfully.");
        await loadTeamMembers();
      } else {
        setNotification(data.error || "Failed to update role.");
        setValModalMsg(data.error || "Failed to update role.");
        setValModalOpen(true);
      }
    } catch {
      setNotification("Network error updating role.");
    }
  }

  // Toggle Employee Active Status
  async function handleToggleActive(id: number, active: boolean) {
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(active ? "Account activated." : "Account deactivated and sessions revoked.");
        await loadTeamMembers();
      } else {
        setNotification(data.error || "Failed to update account status.");
        setValModalMsg(data.error || "Failed to update account status.");
        setValModalOpen(true);
      }
    } catch {
      setNotification("Network error updating status.");
    }
  }

  // Reset Employee Password
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetPassModalUser) return;
    if (!resetPasswordInput || resetPasswordInput.length < 8) {
      setValModalMsg("New password must be at least 8 characters long.");
      setValModalOpen(true);
      return;
    }
    setResetSubmitting(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetPassModalUser.id, newPassword: resetPasswordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Password reset successfully for ${resetPassModalUser.displayName}. Existing sessions revoked.`);
        setResetPassModalUser(null);
        setResetPasswordInput("");
      } else {
        setNotification(data.error || "Failed to reset password.");
        setValModalMsg(data.error || "Failed to reset password.");
        setValModalOpen(true);
      }
    } catch {
      setNotification("Network error resetting password.");
    } finally {
      setResetSubmitting(false);
    }
  }

  // Delete Employee Account
  async function handleDeleteMember(id: number, name: string) {
    if (!window.confirm(`Are you sure you want to permanently delete the employee account for "${name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setNotification(`Employee "${name}" deleted.`);
        await loadTeamMembers();
      } else {
        setNotification(data.error || "Failed to delete employee.");
      }
    } catch {
      setNotification("Network error deleting employee.");
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeTab === "crm") void loadCrmData();
      else if (activeTab === "marketing") void loadCampaigns();
      else if (activeTab === "celebrations") void loadCelebrations();
      else if (activeTab === "analytics") void loadAnalytics();
      else if (activeTab === "content" || activeTab === "media") {
        void loadSiteContent();
        if (activeTab === "media") void loadTodayUpdatesList();
      }
      else if (activeTab === "catalogs") void loadCatalogs();
      else if (activeTab === "documents") void loadDocuments();
      else if (activeTab === "community") void loadVolunteers();
      else if (activeTab === "team") void loadTeamMembers();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="rounded-2xl bg-teal-950 p-4 text-white shadow-sm ring-1 ring-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-saffron flex items-center justify-center font-display font-bold text-teal-950 text-xl">
              JA
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Janaseva Ashrama Management Suite</h2>
              <p className="text-xs text-white/70">
                Logged in: <strong className="text-white">{initialSession.user.displayName}</strong> ({initialSession.user.role})
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDailyPhotoModalOpen(true)}
              className="rounded-xl bg-saffron text-white px-3.5 py-2 text-xs font-bold hover:bg-saffron-dark transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <span>📸</span>
              <span>+ Post Today&apos;s Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setBusinessPlanOpen(true)}
              className="rounded-xl bg-gold/90 text-teal-950 px-3.5 py-2 text-xs font-bold hover:bg-gold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <span>📊</span>
              <span>Strategy &amp; Business Plan</span>
            </button>
            <Link
              href="/"
              target="_blank"
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition flex items-center gap-1.5"
            >
              <span>Live Site</span>
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z" />
              </svg>
            </Link>
            <form
              action={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
            >
              <button
                type="submit"
                className="rounded-xl bg-red-600/20 text-red-200 border border-red-500/30 px-3 py-2 text-xs font-bold hover:bg-red-600/30 transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Tab Controller */}
      <div className="flex flex-wrap gap-2 border-b border-teal-900/10 pb-2">
        {[
          { id: "analytics", label: "📊 Analytics & KPIs" },
          { id: "crm", label: "💳 Donor CRM & FinTech" },
          { id: "marketing", label: "📢 Marketing & Campaigns" },
          { id: "celebrations", label: "🎂 Celebrations & Wishes" },
          { id: "content", label: "📝 Website Content CMS" },
          { id: "media", label: "🎥 Media & Today Updates" },
          { id: "catalogs", label: "🛍️ Giving Basket Catalogs" },
          { id: "documents", label: "📜 Legal 80G Documents" },
          { id: "community", label: "🤝 Volunteers & Pipeline" },
          ...(initialSession.user.role === "SUPER_ADMIN"
            ? [{ id: "team", label: "👥 Team & Employee Roles" }]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as Tab);
              setNotification("");
            }}
            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === tab.id
                ? "bg-teal-950 text-white shadow"
                : "bg-white text-teal-950 ring-1 ring-teal-900/10 hover:bg-cream"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="rounded-xl bg-teal-900/10 border border-teal-900/20 p-3.5 text-xs sm:text-sm font-semibold text-teal-900 flex items-center justify-between">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification("")}
            className="text-xs underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ==================== 1. EXECUTIVE ANALYTICS TAB ==================== */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <p className="text-sm font-semibold text-teal-900/70">Loading executive analytics...</p>
          ) : analyticsData ? (
            <>
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Total Verified Raised</p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-teal-950">
                    {formatINR(analyticsData?.kpis?.totalRaised ?? 0)}
                  </p>
                  <p className="mt-1 text-[11px] text-teal-900/70">100% audited child welfare funds</p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Verified Donors</p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-teal-950">
                    {analyticsData?.kpis?.paidDonors ?? 0}
                  </p>
                  <p className="mt-1 text-[11px] text-teal-900/70">Completed contributions</p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Average Ticket Size</p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-teal-950">
                    {formatINR(analyticsData?.kpis?.averageDonation ?? 0)}
                  </p>
                  <p className="mt-1 text-[11px] text-teal-900/70">Per donor transaction</p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Today Collections</p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-teal-950">
                    {formatINR(analyticsData?.kpis?.todayRaised ?? 0)}
                  </p>
                  <p className="mt-1 text-[11px] text-teal-900/70">{analyticsData?.kpis?.todayDonations ?? 0} donations today</p>
                </div>
              </div>

              {/* Conversion Funnel & Category Breakdown */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
                  <h3 className="font-display text-base font-bold text-teal-900 mb-3">Donor Conversion Funnel</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-teal-900 mb-1">
                        <span>1. Total Unique Visits</span>
                        <span>{analyticsData?.funnel?.visits ?? 0}</span>
                      </div>
                      <div className="h-2 rounded bg-sand/60 overflow-hidden">
                        <div className="h-full bg-teal-900" style={{ width: "100%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-teal-900 mb-1">
                        <span>2. Viewed Impact Needs</span>
                        <span>{analyticsData?.funnel?.needViews ?? 0}</span>
                      </div>
                      <div className="h-2 rounded bg-sand/60 overflow-hidden">
                        <div
                          className="h-full bg-saffron"
                          style={{
                            width: `${Math.min(
                              100,
                              (analyticsData?.funnel?.visits ?? 0) > 0
                                ? ((analyticsData?.funnel?.needViews ?? 0) / (analyticsData?.funnel?.visits ?? 1)) * 100
                                : 0,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-teal-900 mb-1">
                        <span>3. Started Checkout Basket</span>
                        <span>{analyticsData?.funnel?.checkouts ?? 0}</span>
                      </div>
                      <div className="h-2 rounded bg-sand/60 overflow-hidden">
                        <div
                          className="h-full bg-teal-800"
                          style={{
                            width: `${Math.min(
                              100,
                              (analyticsData?.funnel?.visits ?? 0) > 0
                                ? ((analyticsData?.funnel?.checkouts ?? 0) / (analyticsData?.funnel?.visits ?? 1)) * 100
                                : 0,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-teal-900 mb-1">
                        <span>4. Completed Paid Donations</span>
                        <span className="font-bold text-teal-950">{analyticsData?.funnel?.conversions ?? 0}</span>
                      </div>
                      <div className="h-2 rounded bg-sand/60 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600"
                          style={{
                            width: `${Math.min(
                              100,
                              (analyticsData?.funnel?.visits ?? 0) > 0
                                ? ((analyticsData?.funnel?.conversions ?? 0) / (analyticsData?.funnel?.visits ?? 1)) * 100
                                : 0,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
                  <h3 className="font-display text-base font-bold text-teal-900 mb-3">Top Impact Needs Supported</h3>
                  {analyticsData.categoryBreakdown?.length > 0 ? (
                    <div className="space-y-2">
                      {analyticsData.categoryBreakdown.map((cat: any, i: number) => (
                        <div key={i} className="flex items-center justify-between rounded-xl bg-cream p-2.5 text-xs">
                          <span className="font-semibold text-teal-950">{cat.label}</span>
                          <div className="text-right">
                            <span className="font-bold text-teal-900">{formatINR(cat.totalAmount)}</span>
                            <span className="text-[11px] text-teal-950/60 ml-2">({cat.totalQty} units)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-teal-950/60 py-4 text-center">No paid transactions recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Recent Transaction Log */}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-base font-bold text-teal-900">Recent Contribution Activity</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("crm")}
                    className="text-xs font-bold text-saffron-dark hover:underline"
                  >
                    View Full CRM Ledger &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-teal-900/10 text-teal-900/70">
                        <th className="py-2">Receipt / ID</th>
                        <th className="py-2">Donor</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-900/5">
                      {analyticsData.recentTransactions?.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-cream/50">
                          <td className="py-2.5 font-mono text-teal-950/70">{tx.receiptNo || tx.publicId}</td>
                          <td className="py-2.5 font-semibold text-teal-950">{tx.donorName}</td>
                          <td className="py-2.5 font-bold text-teal-900">{formatINR(tx.amount)}</td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold ${
                                tx.status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : tx.status === "demo"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {tx.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 text-teal-950/60">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-IN") : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-teal-900/70">Failed to load analytics.</p>
          )}
        </div>
      )}

      {/* ==================== 2. DONOR CRM & TRANSACTIONS TAB ==================== */}
      {activeTab === "crm" && (
        <div className="space-y-5">
          {/* Summary Metric Counters (FinTech Reconciliation Ledger) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <p className="text-[10px] font-bold text-teal-900/60 uppercase">Verified Total</p>
              <p className="mt-1 font-display text-xl font-bold text-emerald-800">{formatINR(crmTotals.totalRaised)}</p>
              <p className="text-[10px] text-teal-950/60 mt-0.5">{crmTotals.paidCount} paid donors</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <p className="text-[10px] font-bold text-teal-900/60 uppercase">Gateway Online</p>
              <p className="mt-1 font-display text-xl font-bold text-teal-950">{formatINR((crmTotals as any).onlineRaised || 0)}</p>
              <p className="text-[10px] text-teal-950/60 mt-0.5">Razorpay instant</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <p className="text-[10px] font-bold text-teal-900/60 uppercase">Axis Bank Wire</p>
              <p className="mt-1 font-display text-xl font-bold text-teal-950">{formatINR((crmTotals as any).wireRaised || 0)}</p>
              <p className="text-[10px] text-teal-950/60 mt-0.5">NEFT / IMPS direct</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <p className="text-[10px] font-bold text-teal-900/60 uppercase">Cash / Walk-in</p>
              <p className="mt-1 font-display text-xl font-bold text-teal-950">{formatINR((crmTotals as any).offlineRaised || 0)}</p>
              <p className="text-[10px] text-teal-950/60 mt-0.5">Physical receipt</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <p className="text-[10px] font-bold text-teal-900/60 uppercase">80G Tax Claims</p>
              <p className="mt-1 font-display text-xl font-bold text-saffron-dark">{(crmTotals as any).panClaimedCount || 0}</p>
              <p className="text-[10px] text-teal-950/60 mt-0.5">Valid PAN on file</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10 flex flex-col justify-between gap-1">
              <p className="text-[10px] font-bold text-teal-900/60 uppercase">Tax Compliance</p>
              <div className="flex flex-col gap-1">
                <a
                  href="/api/admin/crm/export?format=form10bd"
                  download
                  className="rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition text-center"
                  title="Indian CBDT Form 10BD Statement of Donation CSV"
                >
                  Form 10BD CSV
                </a>
                <a
                  href="/api/admin/crm/export"
                  download
                  className="rounded-lg bg-teal-900/15 border border-teal-900/20 px-2.5 py-1 text-[11px] font-bold text-teal-900 hover:bg-teal-900/25 transition text-center"
                >
                  Full Ledger CSV
                </a>
              </div>
            </div>
          </div>

          {/* CRM Search & Filters */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadCrmData();
                }}
                placeholder="Search donors by name, email, phone, receipt number, or PAN card..."
                className="w-full rounded-xl border border-teal-900/15 px-3.5 py-2 text-xs sm:text-sm text-teal-950 focus:border-teal-900 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={crmStatus}
                onChange={(e) => {
                  setCrmStatus(e.target.value);
                  setTimeout(() => void loadCrmData(), 50);
                }}
                className="rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-bold text-teal-950 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid (Verified)</option>
                <option value="created">Created / Pending</option>
                <option value="demo">Demo Test</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={crmMode}
                onChange={(e) => {
                  setCrmMode(e.target.value);
                  setTimeout(() => void loadCrmData(), 50);
                }}
                className="rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-bold text-teal-950 bg-white"
              >
                <option value="all">All Payment Modes</option>
                <option value="razorpay">Razorpay Online</option>
                <option value="bank_wire">Axis Bank Wire</option>
                <option value="cash">Cash / Walk-in</option>
                <option value="upi">Direct UPI</option>
              </select>
              <button
                type="button"
                onClick={() => void loadCrmData()}
                className="rounded-xl bg-teal-950 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900 transition cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setOfflineDonationModalOpen(true)}
                className="rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition shadow-sm whitespace-nowrap cursor-pointer"
              >
                + Record Walk-In Donation
              </button>
            </div>
          </div>

          {/* CRM Data Table */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
            <h3 className="font-display text-base font-bold text-teal-900 mb-3">Donor Directory & Payment Ledger</h3>
            {crmLoading ? (
              <p className="text-xs font-semibold text-teal-900/60 py-4">Filtering donor records...</p>
            ) : donations.length === 0 ? (
              <p className="text-xs text-teal-900/60 py-6 text-center">No donations match the current filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-teal-900/10 text-teal-900/70 font-semibold">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Receipt / Ref</th>
                      <th className="py-2.5">Donor Name</th>
                      <th className="py-2.5">Contact</th>
                      <th className="py-2.5">Amount &amp; Mode</th>
                      <th className="py-2.5">Dedication</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/5">
                    {donations.map((d) => {
                      const meta = d.meta || {};
                      const dedication = meta.dedication || {};
                      return (
                        <tr key={d.id} className="hover:bg-cream/40">
                          <td className="py-3 text-teal-950/70">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "-"}
                          </td>
                          <td className="py-3 font-mono font-bold text-teal-950">
                            {d.receiptNo || d.publicId}
                          </td>
                          <td className="py-3">
                            <span className="font-bold text-teal-950 block">{d.donorName}</span>
                            {meta.pan && (
                              <span className="font-mono text-[10px] text-teal-800 font-bold">PAN: {meta.pan}</span>
                            )}
                          </td>
                          <td className="py-3 text-teal-950/70">
                            <span className="block">{d.donorEmail}</span>
                            {d.donorPhone && <span className="text-[11px]">{d.donorPhone}</span>}
                          </td>
                          <td className="py-3 font-bold text-teal-900 text-sm">
                            <div>{formatINR(d.amount)}</div>
                            <span className="rounded bg-teal-900/10 px-1.5 py-0.2 text-[9px] font-mono text-teal-950 uppercase font-semibold">
                              {d.mode || "razorpay"}
                            </span>
                          </td>
                          <td className="py-3 text-teal-950/70 max-w-[140px] truncate">
                            {dedication.occasion || "Direct Seva"}
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold ${
                                d.status === "paid"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : d.status === "demo"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {d.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedDonation(d)}
                              className="rounded-lg bg-teal-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-800 transition cursor-pointer"
                            >
                              Details
                            </button>
                            {d.status !== "paid" && (
                              <button
                                type="button"
                                onClick={() => updateDonationStatus(d.id, "paid")}
                                className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDonation(d.id)}
                              className="rounded-lg bg-red-600/15 border border-red-500/25 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-600/25 transition cursor-pointer"
                              title="Delete record"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Donor Detail Modal */}
          {selectedDonation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10">
                <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
                  <div>
                    <h4 className="font-display text-lg font-bold text-teal-950">
                      Donation #{selectedDonation.id} Details
                    </h4>
                    <p className="font-mono text-xs text-teal-900/60">{selectedDonation.publicId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDonation(null)}
                    className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4">
                    <div>
                      <p className="font-semibold text-teal-900/60 uppercase text-[10px]">Donor Name</p>
                      <p className="font-bold text-teal-950 text-sm mt-0.5">{selectedDonation.donorName}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-teal-900/60 uppercase text-[10px]">Amount</p>
                      <p className="font-bold text-emerald-800 text-sm mt-0.5">
                        {formatINR(selectedDonation.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-teal-900/60 uppercase text-[10px]">Email</p>
                      <p className="text-teal-950 mt-0.5">{selectedDonation.donorEmail}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-teal-900/60 uppercase text-[10px]">Phone</p>
                      <p className="text-teal-950 mt-0.5">{selectedDonation.donorPhone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-teal-900/60 uppercase text-[10px]">PAN (80G Tax)</p>
                      <p className="font-mono text-teal-950 mt-0.5">
                        {selectedDonation.meta?.pan || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-teal-900/60 uppercase text-[10px]">Payment Status</p>
                      <p className="font-bold uppercase text-teal-950 mt-0.5">{selectedDonation.status}</p>
                    </div>
                  </div>

                  {/* Impact Items Breakdown */}
                  {selectedDonation.lines?.length > 0 && (
                    <div>
                      <p className="font-bold text-teal-900 mb-2">Supported Impact Needs</p>
                      <div className="space-y-1.5">
                        {selectedDonation.lines.map((l: any, i: number) => (
                          <div key={i} className="flex justify-between rounded-xl bg-sand/30 p-2 text-xs">
                            <span className="font-semibold text-teal-950">
                              {l.label} <span className="text-teal-900/60">x {l.qty}</span>
                            </span>
                            <span className="font-bold text-teal-900">
                              {formatINR(l.unitPrice * l.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dedication info */}
                  {selectedDonation.meta?.dedication && (
                    <div className="rounded-2xl border border-teal-900/10 p-3 bg-white">
                      <p className="font-bold text-teal-900 mb-1">Occasion / Dedication</p>
                      <p className="text-teal-950">
                        Occasion: <strong>{selectedDonation.meta.dedication.occasion || "Direct Impact"}</strong>
                      </p>
                      {selectedDonation.meta.dedication.honoreeName && (
                        <p className="text-teal-950 mt-1">
                          In Honour Of: <strong>{selectedDonation.meta.dedication.honoreeName}</strong>
                        </p>
                      )}
                      {selectedDonation.meta.dedication.message && (
                        <p className="text-teal-950/80 italic mt-1 bg-cream p-2 rounded-lg">
                          &ldquo;{selectedDonation.meta.dedication.message}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Receipt Link */}
                  {selectedDonation.status === "paid" && (
                    <div className="pt-2 flex justify-between items-center">
                      <Link
                        href={`/receipt/${selectedDonation.publicId}`}
                        target="_blank"
                        className="rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition inline-block"
                      >
                        View Official 80G Receipt &rarr;
                      </Link>
                      <span className="text-[11px] text-teal-900/60 font-mono">
                        Receipt No: {selectedDonation.receiptNo}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Offline Donation Modal */}
          {offlineDonationModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-teal-950">
                      Record Walk-In / Offline Donation
                    </h3>
                    <p className="text-xs text-teal-900/60">
                      Instantly records cash, UPI QR, or cheque donations with an official 80G receipt.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOfflineDonationModalOpen(false)}
                    className="rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-teal-950 hover:bg-sand"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleRecordOfflineDonation} className="mt-4 space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Donor Name *</label>
                      <input
                        type="text"
                        name="donorName"
                        required
                        placeholder="Full Name (Letters only)"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z\s.'-]/g, "");
                        }}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        name="donorPhone"
                        required
                        inputMode="numeric"
                        maxLength={15}
                        placeholder="10-digit mobile"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
                        }}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Email Address</label>
                      <input
                        type="email"
                        name="donorEmail"
                        placeholder="For 80G PDF receipt"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">PAN Number (80G Tax Exemption)</label>
                      <input
                        type="text"
                        name="donorPan"
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        }}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Amount (INR) *</label>
                      <input
                        type="number"
                        name="amount"
                        required
                        min="10"
                        step="10"
                        placeholder="5000"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-bold text-teal-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Payment Mode</label>
                      <select
                        name="paymentMode"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-bold bg-white"
                      >
                        <option value="cash">Cash (Received at Ashrama)</option>
                        <option value="upi">UPI QR (PhonePe / GPay / Paytm)</option>
                        <option value="cheque">Bank Cheque / DD</option>
                        <option value="bank_transfer">Direct NEFT / IMPS Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Seva Purpose / Category</label>
                    <select
                      name="purpose"
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold bg-white"
                    >
                      <option value="Annadana Daily Meals">Annadana Daily Meals</option>
                      <option value="Special Day Birthday Feast">Special Day Birthday Feast</option>
                      <option value="Vidya & Child Education Kit">Vidya &amp; Child Education Kit</option>
                      <option value="Arogya Healthcare & Medicines">Arogya Healthcare &amp; Medicines</option>
                      <option value="Monthly Pantry Staples">Monthly Pantry Staples</option>
                      <option value="General Public Charitable Trust">General Public Charitable Trust</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Staff Remarks / Receipt Note</label>
                    <textarea
                      name="notes"
                      rows={2}
                      placeholder="e.g. Received at Ashrama gate from visitor family."
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setOfflineDonationModalOpen(false)}
                      className="rounded-xl border border-teal-900/20 px-4 py-2 text-xs font-bold text-teal-900 hover:bg-cream"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={offlineSubmitting}
                      className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition disabled:opacity-50"
                    >
                      {offlineSubmitting ? "Generating Receipt..." : "Record & Issue Official Receipt"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== MARKETING & CAMPAIGNS HUB TAB ==================== */}
      {activeTab === "marketing" && (
        <div className="space-y-6">
          {/* Header Banner & KPIs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-saffron/20 px-2.5 py-0.5 text-xs font-bold text-saffron-dark uppercase tracking-wider mb-1">
                <span>Growth &amp; Fintech Marketing Suite</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-teal-900">
                Marketing Campaigns &amp; 1-Click WhatsApp Broadcast
              </h3>
              <p className="text-xs text-teal-950/65">
                Launch targeted cause campaigns, track UTM performance, and generate psychological donor appeal broadcasts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewCampaignModalOpen(true)}
              className="rounded-xl bg-saffron px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-saffron-dark transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <span>+ Create New Campaign</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900/60">Total Campaigns</span>
              <p className="mt-1 font-display text-xl font-bold text-teal-950">{campaignsList.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Live &amp; Active</span>
              <p className="mt-1 font-display text-xl font-bold text-emerald-800">
                {campaignsList.filter((c) => c.status === "approved").length}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900/60">Total Goal Target</span>
              <p className="mt-1 font-display text-xl font-bold text-teal-900">
                {formatINR(campaignsList.reduce((acc, c) => acc + (c.goalAmount || 0), 0))}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-dark">Avg Campaign Goal</span>
              <p className="mt-1 font-display text-xl font-bold text-teal-950">
                {campaignsList.length > 0
                  ? formatINR(Math.round(campaignsList.reduce((acc, c) => acc + (c.goalAmount || 0), 0) / campaignsList.length))
                  : "₹0"}
              </p>
            </div>
          </div>

          {/* 1-CLICK WHATSAPP BROADCAST GENERATOR */}
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
              <span className="text-xs text-gold font-bold">
                ✓ Auto UTM Tracking Tags Included
              </span>
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
                      onClick={() => setWhatsappTemplate(tpl.id)}
                      className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                        whatsappTemplate === tpl.id
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
                  if (whatsappTemplate === "shagun") {
                    utmCampaign = "shagun_annadana";
                    defaultCopy = `🙏 *Namaskara from Janaseva Ashrama, Bengaluru*\n\nToday, 25 young orphan boys are chanting morning shlokas and studying hard in our Turahalli home. You can sponsor hot wholesome meals with sacred Shagun giving starting from just *₹11, ₹51, or ₹101*.\n\n✨ Every rupee goes directly to fresh groceries & milk.\n🛡️ 100% Tax Deductible under Section 80G.\n\n👉 *Click here to give with 1 tap (Google Pay / PhonePe / Cards):*\nhttps://www.janasevaashrama.org/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=${utmCampaign}\n\nMay your kindness bring immense blessings to you and your family! 🌸`;
                  } else if (whatsappTemplate === "birthday") {
                    utmCampaign = "birthday_celebration";
                    defaultCopy = `🎂 *Celebrate Your Birthday with 25 Radiant Boys!*\n\nTurn your special milestone into pure joy at Janaseva Ashrama. Sponsor a special sweet feast (Payasam & Pooris) and the 25 boys will record a heartfelt *Personalized Video Birthday Blessing Song* sent directly to your WhatsApp!\n\n✨ Direct booking on our verified website:\nhttps://www.janasevaashrama.org/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=${utmCampaign}#celebrate\n\nCelebrate with meaning and pure smiles! 🎉`;
                  } else if (whatsappTemplate === "vidya") {
                    utmCampaign = "vidya_education";
                    defaultCopy = `📚 *Empower a Child's Tomorrow with Vidya*\n\n25 bright young boys at Janaseva Ashrama, Bengaluru dream of becoming engineers, teachers, and officers. Sponsor school uniforms, notebooks, textbooks, and tuition classes under our Juvenile Justice Act registered home.\n\n🎓 *Sponsor Schooling Kit:* https://www.janasevaashrama.org/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=${utmCampaign}#tiers\n\nThank you for educating the world! 🌟`;
                  } else {
                    utmCampaign = "tax_exemption_80g";
                    defaultCopy = `🛡️ *Save 50% Income Tax with Meaningful Impact*\n\nJanaseva Ashrama holds official Form 10AC Provisional 80G Approval (PAN: AABTJ7431M, URN: AABTJ7431MF20231). All contributions are eligible for 50% deduction under Section 80G of the Indian Income Tax Act.\n\n📄 Instant verified 80G tax receipt generated immediately upon payment.\n👉 Donate online: https://www.janasevaashrama.org/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=${utmCampaign}\n\n100% direct allocation to child care!`;
                  }

                  const activeMsg = whatsappCustomMsg || defaultCopy;
                  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(activeMsg)}`;

                  return (
                    <div className="space-y-3">
                      <textarea
                        rows={6}
                        value={activeMsg}
                        onChange={(e) => setWhatsappCustomMsg(e.target.value)}
                        className="w-full rounded-2xl bg-white/10 border border-white/20 p-3.5 text-xs text-white font-mono leading-relaxed focus:bg-white/15 focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText(activeMsg);
                              setNotification("✓ Copied WhatsApp message to clipboard!");
                            }
                          }}
                          className="rounded-xl bg-gold text-teal-950 px-4 py-2 text-xs font-bold hover:bg-gold-light transition cursor-pointer shadow-xs"
                        >
                          📋 Copy Message &amp; Link
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
                          onClick={() => setWhatsappCustomMsg("")}
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

          {/* FUNDRAISING CAMPAIGNS DIRECTORY */}
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
              <p className="text-xs font-semibold text-teal-900/60 py-4">Loading fundraising campaigns...</p>
            ) : campaignsList.length === 0 ? (
              <div className="rounded-2xl bg-cream/40 p-8 text-center border border-teal-900/10 space-y-2">
                <p className="text-sm font-bold text-teal-950">No crowd fundraising campaigns created yet.</p>
                <p className="text-xs text-teal-950/60">
                  Click &ldquo;+ Create New Campaign&rdquo; above to launch a festival or student support campaign.
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

          {/* CREATE CAMPAIGN MODAL */}
          {newCampaignModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h4 className="font-display text-base font-bold text-teal-950">
                    + Launch New Fundraising Campaign
                  </h4>
                  <button
                    type="button"
                    onClick={() => setNewCampaignModalOpen(false)}
                    className="font-bold text-gray-500 hover:text-black cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCampaign} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">
                      Campaign Title *
                    </label>
                    <input
                      name="title"
                      required
                      placeholder="e.g. Deepavali Sweets & New Clothes for 25 Boys"
                      className="w-full rounded-xl border p-2.5 text-xs font-semibold text-teal-950"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">
                        Occasion / Theme:
                      </label>
                      <input
                        name="occasion"
                        defaultValue="Festival Celebration"
                        className="w-full rounded-xl border p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">
                        Campaign Type:
                      </label>
                      <select name="campaignType" className="w-full rounded-xl border p-2 text-xs">
                        <option value="annadana">Annadana (Food & Feasts)</option>
                        <option value="education">Vidya (Education & Schooling)</option>
                        <option value="clothes">Cloth Sets & Essentials</option>
                        <option value="medical">Arogya (Healthcare)</option>
                        <option value="birthday">Birthday Milestone</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">
                        Goal Amount (₹) *
                      </label>
                      <input
                        name="goalAmount"
                        type="number"
                        defaultValue={25000}
                        required
                        className="w-full rounded-xl border p-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">
                        Custom URL Slug (optional):
                      </label>
                      <input
                        name="slug"
                        placeholder="e.g. deepavali-sweets-2026"
                        className="w-full rounded-xl border p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">
                      Cover Image URL:
                    </label>
                    <input
                      name="coverImage"
                      defaultValue="/media/annadana-hall-hd.jpg"
                      className="w-full rounded-xl border p-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">
                      Story &amp; Purpose Appeal *
                    </label>
                    <textarea
                      name="story"
                      rows={4}
                      required
                      placeholder="Explain why this support matters to our 25 resident boys..."
                      className="w-full rounded-xl border p-2.5 text-xs text-teal-950"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCampaignModalOpen(false)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white hover:bg-saffron-dark cursor-pointer transition"
                    >
                      Publish Campaign Live
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT CAMPAIGN MODAL */}
          {editingCampaign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h4 className="font-display text-base font-bold text-teal-950">
                    Edit: {editingCampaign.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingCampaign(null)}
                    className="font-bold text-gray-500 hover:text-black cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    void handlePatchCampaign(editingCampaign.id, {
                      title: fd.get("title"),
                      occasion: fd.get("occasion"),
                      goalAmount: Number(fd.get("goalAmount")),
                      coverImage: fd.get("coverImage"),
                      story: fd.get("story"),
                      status: fd.get("status"),
                    });
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Title:</label>
                    <input
                      name="title"
                      defaultValue={editingCampaign.title}
                      required
                      className="w-full rounded-xl border p-2 text-xs font-bold text-teal-950"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Occasion:</label>
                      <input
                        name="occasion"
                        defaultValue={editingCampaign.occasion}
                        className="w-full rounded-xl border p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Goal Amount (₹):</label>
                      <input
                        name="goalAmount"
                        type="number"
                        defaultValue={editingCampaign.goalAmount}
                        required
                        className="w-full rounded-xl border p-2 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Status:</label>
                      <select name="status" defaultValue={editingCampaign.status} className="w-full rounded-xl border p-2 text-xs">
                        <option value="approved">Approved &amp; Live</option>
                        <option value="paused">Paused</option>
                        <option value="archived">Archived</option>
                        <option value="pending">Pending Review</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Cover Image URL:</label>
                      <input
                        name="coverImage"
                        defaultValue={editingCampaign.coverImage}
                        className="w-full rounded-xl border p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Story / Content:</label>
                    <textarea
                      name="story"
                      rows={4}
                      defaultValue={editingCampaign.story}
                      className="w-full rounded-xl border p-2 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCampaign(null)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white hover:bg-saffron-dark cursor-pointer transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SPECIAL DAY CELEBRATIONS TAB ==================== */}
      {activeTab === "celebrations" && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Total Celebrations</p>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-teal-950">{celebCounts.total}</p>
              <p className="mt-1 text-[11px] text-teal-900/70">Sponsored special feasts</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Scheduled Today</p>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-teal-950">{celebCounts.todayCount}</p>
              <p className="mt-1 text-[11px] text-teal-900/70">Celebrations today</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Upcoming Confirmed</p>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-teal-950">{celebCounts.confirmedCount}</p>
              <p className="mt-1 text-[11px] text-teal-900/70">Ready for kitchen prep</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Total Seva Value</p>
              <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-teal-950">{formatINR(celebCounts.totalAmount)}</p>
              <p className="mt-1 text-[11px] text-teal-900/70">Direct feast sponsorships</p>
            </div>
          </div>

          {/* Search, Filter & Walk-in Action Bar */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={celebSearch}
                onChange={(e) => setCelebSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadCelebrations();
                }}
                placeholder="Search celebrations by celebrant name, donor, mobile, or reference..."
                className="w-full rounded-xl border border-teal-900/15 px-3.5 py-2 text-xs sm:text-sm text-teal-950 focus:border-teal-900 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={celebStatus}
                onChange={(e) => {
                  setCelebStatus(e.target.value);
                  setTimeout(() => void loadCelebrations(), 50);
                }}
                className="rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-bold text-teal-950 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="FOOD_PREPARED">FOOD PREPARED</option>
                <option value="CELEBRATED">CELEBRATED</option>
                <option value="PHOTOS_SENT">PHOTOS SENT</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <select
                value={celebOccasion}
                onChange={(e) => {
                  setCelebOccasion(e.target.value);
                  setTimeout(() => void loadCelebrations(), 50);
                }}
                className="rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-bold text-teal-950 bg-white"
              >
                <option value="all">All Occasions</option>
                <option value="Birthday">Birthday</option>
                <option value="Wedding Anniversary">Anniversary</option>
                <option value="Memorial">Memorial</option>
                <option value="Milestone">Milestone</option>
                <option value="Festival">Festival</option>
              </select>

              <button
                type="button"
                onClick={() => void loadCelebrations()}
                className="rounded-xl bg-teal-950 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900 transition"
              >
                Filter
              </button>

              <button
                type="button"
                onClick={() => setNewCelebModalOpen(true)}
                className="rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition shadow-sm whitespace-nowrap"
              >
                + New Celebration Booking
              </button>
            </div>
          </div>

          {/* Celebrations Table */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
            <h3 className="font-display text-base font-bold text-teal-900 mb-3">Celebration Bookings &amp; Kitchen Schedule</h3>
            {celebLoading ? (
              <p className="text-xs font-semibold text-teal-900/60 py-4">Filtering celebrations...</p>
            ) : celebrations.length === 0 ? (
              <p className="text-xs text-teal-900/60 py-6 text-center">No celebration bookings match this filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-teal-900/10 text-teal-900/70 font-semibold">
                      <th className="py-2.5">Date &amp; Ref</th>
                      <th className="py-2.5">Celebrant &amp; Occasion</th>
                      <th className="py-2.5">Package &amp; Amount</th>
                      <th className="py-2.5">Attendance Mode</th>
                      <th className="py-2.5">Donor / WhatsApp</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/5">
                    {celebrations.map((c) => (
                      <tr key={c.id} className="hover:bg-cream/40">
                        <td className="py-3">
                          <span className="font-bold text-teal-950 block">{c.celebrationDate}</span>
                          <span className="font-mono text-[10px] text-teal-900/60">{c.reference}</span>
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-teal-950 block">{c.celebrantName}</span>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-teal-950 inline-block">
                              {c.occasion}
                            </span>
                            {c.wishVideoUrl ? (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 inline-block">
                                🎥 Wish Video Attached
                              </span>
                            ) : (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 inline-block">
                                ⏳ Wish Video Pending
                              </span>
                            )}
                          </div>
                          {c.blessingMessage && (
                            <p className="text-[10px] text-teal-950/60 mt-0.5 max-w-xs truncate italic">
                              &ldquo;{c.blessingMessage}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-teal-900 block">{formatINR(c.amount)}</span>
                          <span className="text-[11px] text-teal-950/70">{c.packageName}</span>
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-teal-950 block">
                            {c.visitMode === "in_person" ? "In-Person Visit" : "Remote Seva"}
                          </span>
                          {c.visitMode === "in_person" && (
                            <span className="text-[10px] text-teal-950/60">
                              {c.timeSlot === "morning" ? "Morning (11:30 AM)" : c.timeSlot === "evening" ? "Evening (4:30 PM)" : c.timeSlot} &bull; {c.guestCount} guests
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-teal-950 block">{c.donorName}</span>
                          <a
                            href={`https://wa.me/91${c.donorPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Namaste ${c.donorName}! Regarding your celebration booking for ${c.celebrantName} at Janaseva Ashrama on ${c.celebrationDate}...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[11px] text-emerald-700 hover:underline inline-flex items-center gap-1 font-bold"
                          >
                            <span>WhatsApp: {c.donorPhone}</span>
                          </a>
                        </td>
                        <td className="py-3">
                          <select
                            value={c.celebrationStatus}
                            onChange={(e) => updateCelebrationStatus(c.id, e.target.value)}
                            className="rounded-lg border border-teal-900/15 bg-cream px-2 py-1 text-[11px] font-bold text-teal-950"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="FOOD_PREPARED">FOOD PREPARED</option>
                            <option value="CELEBRATED">CELEBRATED</option>
                            <option value="PHOTOS_SENT">PHOTOS SENT</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => setProofModalCeleb(c)}
                            className="rounded-lg bg-teal-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-800 transition"
                          >
                            {c.photoProofUrl ? "View/Edit Proof" : "Attach Proof"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* New Walk-In Celebration Modal */}
          {newCelebModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-teal-950">
                      Record Walk-In / Phone Celebration Booking
                    </h3>
                    <p className="text-xs text-teal-900/60">
                      Adds an offline celebration directly to the Ashrama schedule.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewCelebModalOpen(false)}
                    className="rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-teal-950 hover:bg-sand"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleCreateWalkInCelebration} className="mt-4 space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Celebrant Name *</label>
                      <input
                        type="text"
                        name="celebrantName"
                        required
                        placeholder="e.g. Master Anish (Letters only)"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z\s.'-]/g, "");
                        }}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Occasion</label>
                      <select
                        name="occasion"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold bg-white"
                      >
                        <option value="Birthday">Birthday</option>
                        <option value="Wedding Anniversary">Wedding Anniversary</option>
                        <option value="Memorial (Shraddha)">Memorial (Shraddha)</option>
                        <option value="Academic Milestone">Academic Milestone</option>
                        <option value="Festival Seva">Festival Seva</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Celebration Date *</label>
                      <input
                        type="date"
                        name="celebrationDate"
                        required
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Package Name</label>
                      <select
                        name="packageName"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold bg-white"
                      >
                        <option value="Festive Special Lunch with Payasam">Festive Special Lunch (₹3,500)</option>
                        <option value="Grand Birthday Feast & Cake Cutting">Grand Birthday Feast &amp; Cake (₹5,500)</option>
                        <option value="Evening Celebration & Fruit Basket">Evening Snacks &amp; Fruits (₹2,500)</option>
                        <option value="Morning Energy Breakfast">Morning Energy Breakfast (₹1,500)</option>
                        <option value="Grand Full-Day Nourishment & Care">Full-Day Ashrama Care (₹8,500)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Amount (INR) *</label>
                      <input
                        type="number"
                        name="amount"
                        defaultValue={3500}
                        required
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-bold text-teal-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Attendance Mode</label>
                      <select
                        name="visitMode"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold bg-white"
                      >
                        <option value="in_person">In-Person Visit</option>
                        <option value="remote">Remote Seva (Receive Photos)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Time Slot</label>
                      <select
                        name="timeSlot"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs bg-white"
                      >
                        <option value="morning">Morning (11:30 AM - 1:30 PM)</option>
                        <option value="evening">Evening (4:30 PM - 6:30 PM)</option>
                        <option value="full_day">Full Day Attendance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Family Members Attending</label>
                      <select
                        name="guestCount"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs bg-white"
                      >
                        <option value="1-2">1 to 2 persons</option>
                        <option value="2-4">2 to 4 family members</option>
                        <option value="5-10">5 to 10 persons</option>
                        <option value="10+">10+ persons</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Donor Name *</label>
                      <input
                        type="text"
                        name="donorName"
                        required
                        placeholder="Contact person (Letters only)"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z\s.'-]/g, "");
                        }}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Donor WhatsApp Phone *</label>
                      <input
                        type="tel"
                        name="donorPhone"
                        required
                        inputMode="numeric"
                        maxLength={15}
                        placeholder="10-digit mobile"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
                        }}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Donor Email</label>
                      <input
                        type="email"
                        name="donorEmail"
                        placeholder="For 80G receipt"
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Donor PAN</label>
                      <input
                        type="text"
                        name="donorPan"
                        maxLength={10}
                        placeholder="Optional"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        }}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Staff Notes / Message</label>
                    <input
                      type="text"
                      name="staffNotes"
                      placeholder="e.g. Bringing eggless chocolate cake. Wants to serve payasam."
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCelebModalOpen(false)}
                      className="rounded-xl border border-teal-900/20 px-4 py-2 text-xs font-bold text-teal-900 hover:bg-cream"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition"
                    >
                      Save Celebration Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Attach / View Proof Modal */}
          {proofModalCeleb && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10">
                <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-teal-950">
                      Attach Celebration Proof: {proofModalCeleb.celebrantName}
                    </h3>
                    <p className="text-xs text-teal-900/60 font-mono">
                      Ref: {proofModalCeleb.reference} &bull; Date: {proofModalCeleb.celebrationDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProofModalCeleb(null)}
                    className="rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-teal-950 hover:bg-sand"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleSaveProof} className="mt-4 space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-teal-900/70">Photo Proof URL:</label>
                      <label className="cursor-pointer text-[11px] font-bold text-teal-800 hover:text-saffron transition underline">
                        <span>📁 Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const url = await handleFileUpload(f, "celebrations");
                              if (url) setProofModalCeleb({ ...proofModalCeleb, photoProofUrl: url });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      name="photoProofUrl"
                      value={proofModalCeleb.photoProofUrl || ""}
                      onChange={(e) => setProofModalCeleb({ ...proofModalCeleb, photoProofUrl: e.target.value })}
                      placeholder="e.g. /uploads/celebrations/cake.jpg"
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-teal-900/70">Video Proof URL:</label>
                      <label className="cursor-pointer text-[11px] font-bold text-teal-800 hover:text-saffron transition underline">
                        <span>📁 Upload Video</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const url = await handleFileUpload(f, "celebrations");
                              if (url) setProofModalCeleb({ ...proofModalCeleb, videoProofUrl: url });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      name="videoProofUrl"
                      value={proofModalCeleb.videoProofUrl || ""}
                      onChange={(e) => setProofModalCeleb({ ...proofModalCeleb, videoProofUrl: e.target.value })}
                      placeholder="e.g. /uploads/celebrations/ashrama_video.mp4"
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-teal-900/70">
                        Personalized Child Wish Video URL (Delivered to Donor):
                      </label>
                      <label className="cursor-pointer text-[11px] font-bold text-teal-800 hover:text-saffron transition underline">
                        <span>📁 Upload Wish Video</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const url = await handleFileUpload(f, "celebrations");
                              if (url) setProofModalCeleb({ ...proofModalCeleb, wishVideoUrl: url });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      name="wishVideoUrl"
                      value={proofModalCeleb.wishVideoUrl || ""}
                      onChange={(e) => setProofModalCeleb({ ...proofModalCeleb, wishVideoUrl: e.target.value })}
                      placeholder="e.g. /uploads/celebrations/greeting_video.mp4"
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono"
                    />
                    <p className="mt-0.5 text-[11px] text-teal-900/60">
                      Link or uploaded video greeting recorded by the 25 children for this celebrant.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Staff Note on Celebration:</label>
                    <textarea
                      name="staffNotes"
                      defaultValue={proofModalCeleb.staffNotes || ""}
                      rows={2}
                      placeholder="e.g. Cake cut at 5:00 PM with all children. Payasam distributed."
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-1.5 text-xs"
                    />
                  </div>

                  {proofModalCeleb.photoProofUrl && (
                    <div className="rounded-xl overflow-hidden border border-teal-900/10 max-h-40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proofModalCeleb.photoProofUrl} alt="Proof preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`https://wa.me/91${proofModalCeleb.donorPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Namaste ${proofModalCeleb.donorName}! Here are the photos & video blessings from today's celebration for ${proofModalCeleb.celebrantName} at Janaseva Ashrama! Thank you for nourishing 25 children.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        WhatsApp Photos
                      </a>

                      {proofModalCeleb.wishVideoUrl && (
                        <a
                          href={`https://wa.me/91${proofModalCeleb.donorPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Namaste ${proofModalCeleb.donorName}! Here is the heartfelt Wish Video recorded by the children of Janaseva Ashrama for ${proofModalCeleb.celebrantName}! Watch here: ${proofModalCeleb.wishVideoUrl} Wishing you joy and blessings!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-teal-900 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
                        >
                          WhatsApp Wish Video
                        </a>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setProofModalCeleb(null)}
                        className="rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-bold text-teal-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition"
                      >
                        Save Proof &amp; Mark Celebrated
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 3. WEBSITE CONTENT & TEXT CMS TAB ==================== */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Subtab Navigator */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl ring-1 ring-teal-900/10 shadow-2xs">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "hero", label: "🌟 Hero & Headlines" },
                { id: "meals", label: "🍲 Today Live Meals Tracker" },
                { id: "tiers", label: "🏷️ 5 Official Support Tiers" },
                { id: "quotes", label: "💬 Caregiver Voices & Quotes" },
                { id: "faqs", label: "❓ FAQs Manager" },
                { id: "about_contact", label: "🏛️ Mission & Contact Info" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setContentSubtab(st.id as any)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    contentSubtab === st.id
                      ? "bg-teal-950 text-white shadow-xs"
                      : "bg-cream/40 text-teal-950/70 hover:bg-cream border border-teal-900/10"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={contentSaving || !contentForm}
              onClick={() => void handleSaveContent()}
              className="rounded-xl bg-saffron px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-saffron-dark transition disabled:opacity-50 cursor-pointer"
            >
              {contentSaving ? "Saving Live..." : "💾 Quick Save Changes"}
            </button>
          </div>

          {contentLoading || !contentForm ? (
            <p className="text-sm font-semibold text-teal-900/70">Loading website content...</p>
          ) : (
            <form onSubmit={handleSaveContent} className="space-y-6">
              {/* SUBTAB 1: HERO COPY */}
              {contentSubtab === "hero" && (
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-teal-900">
                      Hero Section Copy & Calls-To-Action
                    </h3>
                    <p className="text-xs text-teal-950/60">
                      Directly controls the main opening headline and buttons shown to all visitors.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">
                        Main Hero Headline:
                      </label>
                      <input
                        type="text"
                        required
                        value={contentForm.heroHeadline || ""}
                        onChange={(e) => setContentForm({ ...contentForm, heroHeadline: e.target.value })}
                        className="w-full rounded-xl border border-teal-900/15 px-3.5 py-2.5 text-sm font-bold text-teal-950"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">
                        Supporting Subtitle / Paragraph:
                      </label>
                      <textarea
                        rows={2}
                        value={contentForm.heroSubheadline || ""}
                        onChange={(e) => setContentForm({ ...contentForm, heroSubheadline: e.target.value })}
                        className="w-full rounded-xl border border-teal-900/15 px-3.5 py-2.5 text-xs text-teal-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">
                        Primary Button Text (Make an Impact):
                      </label>
                      <input
                        type="text"
                        value={contentForm.heroPrimaryCta || ""}
                        onChange={(e) => setContentForm({ ...contentForm, heroPrimaryCta: e.target.value })}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold text-teal-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">
                        Secondary Button Text (See Today):
                      </label>
                      <input
                        type="text"
                        value={contentForm.heroSecondaryCta || ""}
                        onChange={(e) => setContentForm({ ...contentForm, heroSecondaryCta: e.target.value })}
                        className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold text-teal-950"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: LIVE MEALS STATUS TRACKER */}
              {contentSubtab === "meals" && (
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-teal-900/10 pb-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-teal-900">
                        Today Live Meals Status Tracker
                      </h3>
                      <p className="text-xs text-teal-950/60">
                        Control real-time daily Annadana meal cards shown on homepage &amp; /today. Toggle between &ldquo;Served ✓&rdquo; and &ldquo;Open for Seva ⏳&rdquo;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMeal}
                      className="rounded-xl bg-teal-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer shrink-0"
                    >
                      + Add Meal Slot
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {(contentForm.todayMealsStatus || []).map((meal: TodayMealStatusItem, idx: number) => {
                      const isServed = meal.status === "served";
                      return (
                        <div
                          key={meal.id || idx}
                          className={`rounded-2xl border p-4 transition space-y-3 ${
                            isServed
                              ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200"
                              : "bg-amber-50/60 border-amber-300 ring-1 ring-amber-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold uppercase text-teal-900">
                              Slot {idx + 1} &bull; {meal.time || "Scheduled"}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleMealStatus(idx)}
                                className={`rounded-full px-3 py-1 text-xs font-black uppercase transition cursor-pointer shadow-2xs ${
                                  isServed
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-saffron text-white hover:bg-saffron-dark animate-pulse"
                                }`}
                              >
                                {isServed ? "Served ✓" : "Open for Seva ⏳"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMeal(idx)}
                                className="rounded-lg bg-red-100 p-1 text-red-600 hover:bg-red-200 transition cursor-pointer"
                                title="Delete meal slot"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Meal Name</label>
                              <input
                                type="text"
                                value={meal.name || ""}
                                onChange={(e) => handleUpdateMeal(idx, { name: e.target.value })}
                                className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs font-bold text-teal-950"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Time</label>
                              <input
                                type="text"
                                value={meal.time || ""}
                                onChange={(e) => handleUpdateMeal(idx, { time: e.target.value })}
                                className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs font-medium text-teal-950"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Today Menu</label>
                            <input
                              type="text"
                              value={meal.menu || ""}
                              onChange={(e) => handleUpdateMeal(idx, { menu: e.target.value })}
                              placeholder="e.g. Idli, Sambar, Coconut Chutney & Hot Milk"
                              className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs text-teal-950"
                            />
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">
                                Sponsor Name (if served)
                              </label>
                              <input
                                type="text"
                                value={meal.sponsorName || ""}
                                onChange={(e) => handleUpdateMeal(idx, { sponsorName: e.target.value })}
                                placeholder="e.g. Smt. Shailaja & Family"
                                className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs text-teal-950"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">
                                Shagun Amount (₹)
                              </label>
                              <input
                                type="number"
                                value={meal.amount || 0}
                                onChange={(e) => handleUpdateMeal(idx, { amount: Number(e.target.value) })}
                                className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs font-bold font-mono text-teal-950"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: 5 OFFICIAL SUPPORT TIERS & PRICING */}
              {contentSubtab === "tiers" && (
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-5">
                  <div className="border-b border-teal-900/10 pb-3">
                    <h3 className="font-display text-base font-bold text-teal-900">
                      Exact 5 Official Support Tiers &amp; Pricing Schemes
                    </h3>
                    <p className="text-xs text-teal-950/60">
                      Customize titles, Kannada subtitles, descriptions, and preset pricing options for Annadana, Vidya, Cloth, Health, and Shelter.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {(contentForm.supportTiers || []).map((tier: any, tierIdx: number) => (
                      <div
                        key={tier.id || tierIdx}
                        className="rounded-2xl border border-teal-900/15 bg-cream/30 p-4 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/10 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{tier.icon || "🌟"}</span>
                            <span className="font-display text-xs font-bold uppercase tracking-wider text-saffron-dark">
                              Tier {tierIdx + 1}: {tier.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddTierOption(tierIdx)}
                            className="rounded-lg bg-teal-900/10 px-2.5 py-1 text-[11px] font-bold text-teal-900 hover:bg-teal-900/20 transition cursor-pointer"
                          >
                            + Add Option
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Tier Title (English)</label>
                            <input
                              type="text"
                              value={tier.title || ""}
                              onChange={(e) => handleUpdateTier(tierIdx, { title: e.target.value })}
                              className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs font-bold text-teal-950"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Kannada Title</label>
                            <input
                              type="text"
                              value={tier.kannadaTitle || ""}
                              onChange={(e) => handleUpdateTier(tierIdx, { kannadaTitle: e.target.value })}
                              className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs font-bold text-teal-950 font-kannada"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Impact Description</label>
                            <textarea
                              rows={2}
                              value={tier.desc || ""}
                              onChange={(e) => handleUpdateTier(tierIdx, { desc: e.target.value })}
                              className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs text-teal-950"
                            />
                          </div>
                        </div>

                        {/* Pricing Options */}
                        <div className="space-y-2 pt-2 border-t border-teal-900/10">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-teal-900/60">
                            Preset Donation Options:
                          </span>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {(tier.options || []).map((opt: any, optIdx: number) => (
                              <div
                                key={opt.id || optIdx}
                                className="rounded-xl border border-teal-900/10 bg-white p-2.5 space-y-1.5 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center gap-1 text-[10px] font-bold text-teal-900">
                                    <input
                                      type="checkbox"
                                      checked={!!opt.isPopular}
                                      onChange={(e) => handleUpdateTierOption(tierIdx, optIdx, { isPopular: e.target.checked })}
                                      className="rounded"
                                    />
                                    Popular
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTierOption(tierIdx, optIdx)}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                                    title="Delete option"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={opt.label || ""}
                                  placeholder="Option Label"
                                  onChange={(e) => handleUpdateTierOption(tierIdx, optIdx, { label: e.target.value })}
                                  className="w-full rounded-lg border px-2 py-1 text-xs font-semibold"
                                />
                                <input
                                  type="text"
                                  value={opt.subLabel || ""}
                                  placeholder="Sub-label description"
                                  onChange={(e) => handleUpdateTierOption(tierIdx, optIdx, { subLabel: e.target.value })}
                                  className="w-full rounded-lg border px-2 py-1 text-[11px]"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-teal-900">₹</span>
                                  <input
                                    type="number"
                                    value={opt.amount || 0}
                                    onChange={(e) => handleUpdateTierOption(tierIdx, optIdx, { amount: Number(e.target.value) })}
                                    className="w-full rounded-lg border px-2 py-1 font-mono font-bold text-xs"
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

              {/* SUBTAB 4: CAREGIVER VOICES & QUOTES */}
              {contentSubtab === "quotes" && (
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-teal-900/10 pb-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-teal-900">
                        Caregiver Voices &amp; Emotional Quotes
                      </h3>
                      <p className="text-xs text-teal-950/60">
                        Quotes rendered in the horizontal marquee loop that move donors emotionally with authenticity.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddQuote}
                      className="rounded-xl bg-teal-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer shrink-0"
                    >
                      + Add New Quote
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(contentForm.quotes || []).map((q: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-teal-900/10 bg-cream/40 p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold uppercase text-saffron-dark">
                            Quote #{idx + 1} &bull; Tag: {q.tag || "Care"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuote(idx)}
                            className="rounded-lg bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 hover:bg-red-200 transition cursor-pointer"
                          >
                            Delete Quote
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Quote Text (English)</label>
                          <textarea
                            rows={2}
                            value={q.quote || ""}
                            onChange={(e) => handleUpdateQuote(idx, { quote: e.target.value })}
                            className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs text-teal-950 font-medium italic"
                          />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <div>
                            <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Author</label>
                            <input
                              type="text"
                              value={q.author || ""}
                              onChange={(e) => handleUpdateQuote(idx, { author: e.target.value })}
                              className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1 text-xs font-semibold text-teal-950"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Role / Title</label>
                            <input
                              type="text"
                              value={q.role || ""}
                              onChange={(e) => handleUpdateQuote(idx, { role: e.target.value })}
                              className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1 text-xs text-teal-950"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Theme Tag</label>
                            <input
                              type="text"
                              value={q.tag || ""}
                              onChange={(e) => handleUpdateQuote(idx, { tag: e.target.value })}
                              className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1 text-xs text-teal-950"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 5: FAQS MANAGER */}
              {contentSubtab === "faqs" && (
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-teal-900/10 pb-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-teal-900">
                        Frequently Asked Questions (FAQ) Manager
                      </h3>
                      <p className="text-xs text-teal-950/60">
                        Address donor objections, explain 80G tax claims, visiting protocols, and accountability.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="rounded-xl bg-teal-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer shrink-0"
                    >
                      + Add New FAQ
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(contentForm.faqs || []).map((faq: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-teal-900/10 bg-cream/40 p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold uppercase text-teal-900">
                            FAQ #{idx + 1} &bull; Category: {faq.category || "general"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteFaq(idx)}
                            className="rounded-lg bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 hover:bg-red-200 transition cursor-pointer"
                          >
                            Delete FAQ
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Question</label>
                          <input
                            type="text"
                            value={faq.question || ""}
                            onChange={(e) => handleUpdateFaq(idx, { question: e.target.value })}
                            className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs font-bold text-teal-950"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-teal-900/70 mb-0.5">Answer</label>
                          <textarea
                            rows={3}
                            value={faq.answer || ""}
                            onChange={(e) => handleUpdateFaq(idx, { answer: e.target.value })}
                            className="w-full rounded-xl border border-teal-900/15 bg-white px-2.5 py-1.5 text-xs text-teal-950 leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 6: MISSION & CONTACT INFO */}
              {contentSubtab === "about_contact" && (
                <div className="space-y-6">
                  {/* ASHRAMA STORY & MISSION */}
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                    <div>
                      <h3 className="font-display text-base font-bold text-teal-900">
                        Ashrama Organization & Mission Details
                      </h3>
                      <p className="text-xs text-teal-950/60">
                        Verified legal entity and childhood protection metrics.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">
                          Trust Legal Name:
                        </label>
                        <input
                          type="text"
                          value={contentForm.aboutTitle || ""}
                          onChange={(e) => setContentForm({ ...contentForm, aboutTitle: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs text-teal-950 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">
                          Resident Children Metric:
                        </label>
                        <input
                          type="text"
                          value={contentForm.residentCount || ""}
                          onChange={(e) => setContentForm({ ...contentForm, residentCount: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs text-teal-950 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">
                          About Story / Mission Statement:
                        </label>
                        <textarea
                          rows={3}
                          value={contentForm.aboutStory || ""}
                          onChange={(e) => setContentForm({ ...contentForm, aboutStory: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3.5 py-2.5 text-xs text-teal-950"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CONTACT DETAILS & ADDRESS */}
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                    <div>
                      <h3 className="font-display text-base font-bold text-teal-900">
                        Contact, Visiting & Location Information
                      </h3>
                      <p className="text-xs text-teal-950/60">
                        Displayed in header, footer, contact section, and maps.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">
                          Contact Phone Number:
                        </label>
                        <input
                          type="text"
                          value={contentForm.contactPhone || ""}
                          onChange={(e) => setContentForm({ ...contentForm, contactPhone: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs text-teal-950 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">
                          Official Ashrama Email:
                        </label>
                        <input
                          type="email"
                          value={contentForm.contactEmail || ""}
                          onChange={(e) => setContentForm({ ...contentForm, contactEmail: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs text-teal-950 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">
                          Physical Address:
                        </label>
                        <input
                          type="text"
                          value={contentForm.contactAddress || ""}
                          onChange={(e) => setContentForm({ ...contentForm, contactAddress: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs text-teal-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">
                          Visiting Hours:
                        </label>
                        <input
                          type="text"
                          value={contentForm.contactHours || ""}
                          onChange={(e) => setContentForm({ ...contentForm, contactHours: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs text-teal-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">
                          Google Maps Link:
                        </label>
                        <input
                          type="text"
                          value={contentForm.googleMapsUrl || ""}
                          onChange={(e) => setContentForm({ ...contentForm, googleMapsUrl: e.target.value })}
                          placeholder="https://maps.app.goo.gl/FMaM6eLKk3nNJmth8"
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs text-teal-950 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SOCIAL MEDIA LINKS */}
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                    <div>
                      <h3 className="font-display text-base font-bold text-teal-900">
                        Social Media Channels
                      </h3>
                      <p className="text-xs text-teal-950/60">
                        Displayed in floating quick action buttons and footer.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">WhatsApp URL:</label>
                        <input
                          type="text"
                          value={contentForm.socialWhatsapp || ""}
                          onChange={(e) => setContentForm({ ...contentForm, socialWhatsapp: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">Instagram URL:</label>
                        <input
                          type="text"
                          value={contentForm.socialInstagram || ""}
                          onChange={(e) => setContentForm({ ...contentForm, socialInstagram: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">Facebook URL:</label>
                        <input
                          type="text"
                          value={contentForm.socialFacebook || ""}
                          onChange={(e) => setContentForm({ ...contentForm, socialFacebook: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">X (Twitter) URL:</label>
                        <input
                          type="text"
                          value={contentForm.socialX || ""}
                          onChange={(e) => setContentForm({ ...contentForm, socialX: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-teal-900/70 mb-1">LinkedIn URL:</label>
                        <input
                          type="text"
                          value={contentForm.socialLinkedin || ""}
                          onChange={(e) => setContentForm({ ...contentForm, socialLinkedin: e.target.value })}
                          className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SAVE BUTTON AT BOTTOM */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={contentSaving}
                  className="rounded-xl bg-saffron px-6 py-3 font-bold text-white shadow-sm hover:bg-saffron-dark transition text-sm disabled:opacity-50 cursor-pointer"
                >
                  {contentSaving ? "Saving Live Changes..." : "Save All Site Content"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ==================== 4. MEDIA & VIDEO MANAGER TAB ==================== */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {contentLoading || !contentForm ? (
            <p className="text-sm font-semibold text-teal-900/70">Loading media settings...</p>
          ) : (
            <div className="space-y-6">
              {/* UNIVERSAL FILE & MEDIA UPLOADER WIDGET */}
              <div className="rounded-3xl bg-teal-950 p-6 text-white shadow-md ring-1 ring-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-md bg-gold/20 px-2.5 py-1 text-xs font-bold text-gold uppercase tracking-wider mb-1">
                      <span>Instant File &amp; Media Uploader</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">
                      Upload Images, Videos &amp; Documents to Server
                    </h3>
                    <p className="text-xs text-teal-100/70">
                      Upload any local file to generate permanent URLs for website sections, catalogues, celebration proofs, or audit documents.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                    >
                      <option value="images" className="text-teal-950">Images (/uploads/images)</option>
                      <option value="videos" className="text-teal-950">Videos (/uploads/videos)</option>
                      <option value="documents" className="text-teal-950">Documents (/uploads/documents)</option>
                      <option value="celebrations" className="text-teal-950">Celebration Proofs (/uploads/celebrations)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 items-center">
                  <div>
                    <label className="block text-xs font-bold text-teal-200 mb-1.5">
                      Choose File from Your Device (Images, Videos &bull; up to 50MB):
                    </label>
                    <input
                      type="file"
                      disabled={uploading}
                      accept={
                        uploadCategory === "videos"
                          ? "video/mp4,video/webm,video/quicktime"
                          : uploadCategory === "documents"
                          ? ".pdf,.doc,.docx,.xls,.xlsx,.csv"
                          : "image/*"
                      }
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleFileUpload(file, uploadCategory);
                        }
                      }}
                      className="block w-full text-xs text-teal-100 file:mr-3 file:rounded-xl file:border-0 file:bg-saffron file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white hover:file:bg-saffron-dark file:cursor-pointer"
                    />
                    <p className="mt-1 text-[11px] text-teal-100/60">
                      {uploading ? "Uploading file..." : "Supported: JPG, PNG, WEBP, MP4, WEBM, PDF, DOC, CSV"}
                    </p>
                  </div>

                  {uploadedUrl && (
                    <div className="rounded-2xl bg-white/10 p-3.5 border border-white/15 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400">✓ Upload Successful!</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText(uploadedUrl);
                              setNotification("Copied uploaded file URL to clipboard!");
                            }
                          }}
                          className="rounded-lg bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-white/30"
                        >
                          Copy URL
                        </button>
                      </div>
                      <p className="font-mono text-xs text-gold break-all select-all">
                        {uploadedUrl}
                      </p>
                      {uploadedUrl.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i) && (
                        <div className="h-20 w-32 rounded-xl overflow-hidden border border-white/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={uploadedUrl} alt="Upload preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                      {uploadedUrl.match(/\.(mp4|webm|mov)$/i) && (
                        <div className="h-24 w-40 rounded-xl overflow-hidden border border-white/20">
                          <video src={uploadedUrl} controls className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* HERO CINEMATIC VIDEO & POSTER */}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-teal-900">
                      Hero Video & Poster Configuration
                    </h3>
                    <p className="text-xs text-teal-950/60">
                      Controls the cinematic opening background video and fallback poster.
                    </p>
                  </div>
                  {contentForm.heroVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedVideoPreview(contentForm.heroVideoUrl)}
                      className="rounded-xl bg-teal-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                    >
                      Preview Hero Video
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-teal-900/70">
                        Hero Video URL (.mp4):
                      </label>
                      <label className="cursor-pointer text-[11px] font-bold text-teal-800 hover:text-saffron transition underline">
                        <span>📁 Upload MP4</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const url = await handleFileUpload(f, "videos");
                              if (url) setContentForm({ ...contentForm, heroVideoUrl: url });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={contentForm.heroVideoUrl || ""}
                      onChange={(e) => setContentForm({ ...contentForm, heroVideoUrl: e.target.value })}
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono text-teal-950"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-teal-900/70">
                        Hero Video Poster Image URL:
                      </label>
                      <label className="cursor-pointer text-[11px] font-bold text-teal-800 hover:text-saffron transition underline">
                        <span>📁 Upload Poster</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const url = await handleFileUpload(f, "images");
                              if (url) setContentForm({ ...contentForm, heroPosterUrl: url });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={contentForm.heroPosterUrl || ""}
                      onChange={(e) => setContentForm({ ...contentForm, heroPosterUrl: e.target.value })}
                      className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-mono text-teal-950"
                    />
                  </div>
                </div>
              </div>

              {/* DOCUMENTARY VIDEO CHAPTERS */}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-teal-900/10 pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-teal-900">
                      Documentary Video Chapters (Life in Motion)
                    </h3>
                    <p className="text-xs text-teal-950/60">
                      Manage authentic video chapters shown in the documentary reel on the homepage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="rounded-xl bg-teal-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer shrink-0"
                  >
                    + Add New Chapter
                  </button>
                </div>

                <div className="space-y-4">
                  {(contentForm.docChapters || []).map((chap: any, idx: number) => (
                    <div
                      key={chap.id || idx}
                      className="rounded-2xl border border-teal-900/10 bg-cream/40 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs font-bold text-saffron-dark uppercase">
                          Chapter {chap.number || `0${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVideoPreview(chap.videoSrc)}
                            className="rounded-lg bg-teal-900/10 px-2.5 py-1 text-[11px] font-bold text-teal-900 hover:bg-teal-900/20"
                          >
                            Play Video
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(idx)}
                            className="rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-teal-900/70 mb-0.5">
                            Chapter Title:
                          </label>
                          <input
                            type="text"
                            value={chap.title || ""}
                            onChange={(e) => {
                              const updated = [...contentForm.docChapters];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setContentForm({ ...contentForm, docChapters: updated });
                            }}
                            className="w-full rounded-xl border border-teal-900/15 px-3 py-1.5 text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-teal-900/70 mb-0.5">
                            Video File URL (.mp4):
                          </label>
                          <input
                            type="text"
                            value={chap.videoSrc || ""}
                            onChange={(e) => {
                              const updated = [...contentForm.docChapters];
                              updated[idx] = { ...updated[idx], videoSrc: e.target.value };
                              setContentForm({ ...contentForm, docChapters: updated });
                            }}
                            className="w-full rounded-xl border border-teal-900/15 px-3 py-1.5 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-teal-900/70 mb-0.5">
                            Poster Image URL:
                          </label>
                          <input
                            type="text"
                            value={chap.posterSrc || ""}
                            onChange={(e) => {
                              const updated = [...contentForm.docChapters];
                              updated[idx] = { ...updated[idx], posterSrc: e.target.value };
                              setContentForm({ ...contentForm, docChapters: updated });
                            }}
                            className="w-full rounded-xl border border-teal-900/15 px-3 py-1.5 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-teal-900/70 mb-0.5">
                            Subtitle / Theme:
                          </label>
                          <input
                            type="text"
                            value={chap.subtitle || ""}
                            onChange={(e) => {
                              const updated = [...contentForm.docChapters];
                              updated[idx] = { ...updated[idx], subtitle: e.target.value };
                              setContentForm({ ...contentForm, docChapters: updated });
                            }}
                            className="w-full rounded-xl border border-teal-900/15 px-3 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveContent()}
                    className="rounded-xl bg-saffron px-6 py-2.5 font-bold text-white hover:bg-saffron-dark transition text-xs cursor-pointer shadow-xs"
                  >
                    Save All Video Changes
                  </button>
                </div>
              </div>

              {/* TODAY AT JANASEVA UPDATES & MOMENTS MANAGER */}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-teal-900/10 pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-teal-900">
                      Today at Janaseva Daily Moments ({todayUpdatesList.length} Published)
                    </h3>
                    <p className="text-xs text-teal-950/60">
                      Manage all daily photos and updates published to the live &ldquo;Today&rdquo; section and home ticker.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void loadTodayUpdatesList()}
                      className="rounded-xl bg-cream px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-sand transition cursor-pointer"
                    >
                      Refresh List
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailyPhotoModalOpen(true)}
                      className="rounded-xl bg-saffron px-3.5 py-1.5 text-xs font-bold text-white hover:bg-saffron-dark transition cursor-pointer"
                    >
                      + Post Today&apos;s Photo
                    </button>
                  </div>
                </div>

                {todayUpdatesLoading ? (
                  <p className="text-xs text-teal-900/60 py-4 font-semibold">Loading moments...</p>
                ) : todayUpdatesList.length === 0 ? (
                  <p className="text-xs text-teal-950/60 py-4 text-center">No daily moments published yet. Click &ldquo;+ Post Today&apos;s Photo&rdquo; to create the first one.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {todayUpdatesList.map((u) => (
                      <div
                        key={u.id}
                        className="rounded-2xl border border-teal-900/10 p-3.5 bg-cream/20 hover:bg-cream/50 transition flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-teal-900/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={u.imageUrl || "/media/poster.jpg"}
                              alt={u.title}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute top-2 left-2 rounded-md bg-teal-950/80 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                              {u.category}
                            </span>
                            <span className={`absolute top-2 right-2 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              u.status === "published" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                            }`}>
                              {u.status}
                            </span>
                          </div>

                          <h5 className="font-display text-xs font-bold text-teal-950 line-clamp-1">
                            {u.title}
                          </h5>
                          <p className="text-[11px] text-teal-900/70 line-clamp-2 leading-relaxed">
                            {u.body}
                          </p>
                          <p className="text-[10px] text-teal-900/50 font-mono">
                            {u.publishedAt ? new Date(u.publishedAt).toLocaleString("en-IN") : ""}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-teal-900/10 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTodayUpdate(u)}
                            className="rounded-xl bg-teal-900/10 px-3 py-1 text-xs font-bold text-teal-900 hover:bg-teal-900/20 transition cursor-pointer"
                          >
                            Edit Moment
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTodayUpdate(u.id)}
                            className="rounded-xl bg-red-100 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-200 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LOCAL MEDIA REPOSITORY GALLERY */}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-teal-900">
                      Ashrama Media Gallery &amp; Video Library ({CURATED_GALLERY.length} Authentic Assets)
                    </h3>
                    <p className="text-xs text-teal-950/60">
                      All verified photos and videos of our 25 resident boys in Thurahalli, Bangalore. Click any item to preview or copy its public URL.
                    </p>
                  </div>
                  <div className="w-full md:w-72">
                    <input
                      type="text"
                      placeholder="Search by filename, title, kannada..."
                      value={mediaSearchQuery}
                      onChange={(e) => setMediaSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-teal-900/20 bg-cream/30 px-3.5 py-2 text-xs font-medium text-teal-950 placeholder:text-teal-950/40 focus:outline-none focus:ring-2 focus:ring-teal-900"
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { id: "all", label: "🌟 All Assets" },
                    { id: "Annadana & Meals", label: "🍲 Annadana" },
                    { id: "Vidya & Education", label: "📚 Vidya" },
                    { id: "Birthdays & Celebrations", label: "🎂 Birthdays" },
                    { id: "Patriotic & National", label: "🇮🇳 Patriotic" },
                    { id: "Festivals & Spiritual", label: "🪔 Festivals" },
                    { id: "Yoga & Health", label: "🧘 Yoga & Health" },
                    { id: "Sports & Play", label: "🏏 Sports" },
                    { id: "Our 25 Boys", label: "👦 Our 25 Boys" },
                    { id: "Live Videos", label: "▶ Live Videos" },
                  ].map((cat) => {
                    const isSelected = mediaCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMediaCategoryFilter(cat.id)}
                        className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                          isSelected
                            ? "bg-teal-900 text-white"
                            : "bg-cream/40 text-teal-950/70 border border-teal-900/10 hover:bg-cream"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {CURATED_GALLERY.filter((item) => {
                    const matchCat = mediaCategoryFilter === "all" || item.category === mediaCategoryFilter;
                    const q = mediaSearchQuery.toLowerCase().trim();
                    const matchSearch =
                      !q ||
                      item.semanticName.toLowerCase().includes(q) ||
                      item.title.toLowerCase().includes(q) ||
                      item.kannada.toLowerCase().includes(q) ||
                      item.category.toLowerCase().includes(q);
                    return matchCat && matchSearch;
                  }).map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-teal-900/10 p-2.5 text-center bg-cream/20 hover:bg-cream/60 transition flex flex-col justify-between"
                    >
                      <div>
                        <div
                          className="aspect-video w-full rounded-lg bg-teal-950/10 flex items-center justify-center overflow-hidden mb-1.5 relative cursor-pointer"
                          onClick={() => {
                            if (item.type === "video") setSelectedVideoPreview(item.url);
                            else setSelectedImagePreview({ url: item.url, title: item.title, kannada: item.kannada, desc: item.description });
                          }}
                        >
                          {item.type === "video" ? (
                            <>
                              <video src={item.url} preload="metadata" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron text-white shadow">
                                  <svg className="h-3.5 w-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </span>
                              </div>
                            </>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt={item.semanticName} className="h-full w-full object-cover group-hover:scale-105 transition duration-200" />
                          )}
                          <span className="absolute bottom-1 right-1 rounded-sm bg-teal-950/80 px-1 py-0.2 text-[8px] font-bold text-white uppercase">
                            {item.type === "video" ? "Video" : "Photo"}
                          </span>
                        </div>

                        <p className="font-mono text-[10px] text-teal-950 truncate font-bold text-left" title={item.semanticName}>
                          {item.semanticName}
                        </p>
                        <p className="text-[10px] text-teal-900/70 truncate text-left font-medium" title={item.title}>
                          {item.title}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-teal-900/10 flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(item.url);
                            setNotification(`Copied path: ${item.url}`);
                          }}
                          className="rounded-lg bg-white border border-teal-900/15 py-1 text-[10px] text-teal-900 font-bold hover:bg-cream transition"
                        >
                          Copy Path
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.type === "video") setSelectedVideoPreview(item.url);
                            else setSelectedImagePreview({ url: item.url, title: item.title, kannada: item.kannada, desc: item.description });
                          }}
                          className="rounded-lg bg-teal-900 text-white py-1 text-[10px] font-bold hover:bg-teal-950 transition"
                        >
                          {item.type === "video" ? "▶ Play Video" : "🔍 Preview"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Embedded Video Preview Modal */}
          {selectedVideoPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-teal-950 p-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 text-white border-b border-white/10">
                  <p className="font-mono text-xs font-bold text-gold truncate">
                    Preview: {selectedVideoPreview}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedVideoPreview(null)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-white/20"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-black">
                  <video
                    src={selectedVideoPreview}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Embedded Image Preview Modal */}
          {selectedImagePreview && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
              onClick={() => setSelectedImagePreview(null)}
            >
              <div
                className="w-full max-w-2xl overflow-hidden rounded-3xl bg-teal-950 p-4 shadow-2xl ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 text-white border-b border-white/10">
                  <div className="min-w-0 pr-2">
                    <p className="font-display text-sm font-bold text-white truncate">
                      {selectedImagePreview.title}
                    </p>
                    {selectedImagePreview.kannada && (
                      <p className="text-xs text-gold truncate">{selectedImagePreview.kannada}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImagePreview(null)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-white/20 shrink-0"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 max-h-[60vh] w-full overflow-hidden rounded-2xl bg-black/50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImagePreview.url}
                    alt={selectedImagePreview.title}
                    className="max-h-[60vh] w-full object-contain"
                  />
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <code className="text-white/70 font-mono text-[11px] truncate">{selectedImagePreview.url}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(selectedImagePreview.url);
                      setNotification(`Copied path: ${selectedImagePreview.url}`);
                    }}
                    className="rounded-lg bg-gold px-3 py-1 font-bold text-teal-950 hover:bg-gold/90 shrink-0"
                  >
                    Copy Path
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 5. IMPACT CATALOGS (E-COM) ==================== */}
      {activeTab === "catalogs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-teal-900">
                Impact Need Catalogs & Schemes Management
              </h3>
              <p className="text-xs text-teal-950/60">
                Add, edit, and control donation products, prices, marketing tiers, and photos/videos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewCatalogOpen(!newCatalogOpen)}
              className="rounded-xl bg-teal-900 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
            >
              {newCatalogOpen ? "Cancel" : "+ Add New Need"}
            </button>
          </div>

          {/* New Catalog Form */}
          {newCatalogOpen && (
            <form onSubmit={createCatalogItem} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-4">
              <h4 className="font-display text-sm font-bold text-teal-950 border-b pb-2">New Impact Product</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Title / Name:</label>
                  <input name="name" required placeholder="e.g. Special Holiday Annadana Meal" className="w-full rounded-xl border p-2 text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Category:</label>
                  <select name="category" className="w-full rounded-xl border p-2 text-xs">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Unit Price (₹):</label>
                  <input name="unitPrice" type="number" required placeholder="100" className="w-full rounded-xl border p-2 text-xs font-bold font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Unit Label:</label>
                  <input name="unitLabel" placeholder="meal / kit / month" className="w-full rounded-xl border p-2 text-xs" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Description:</label>
                  <textarea name="description" rows={2} required placeholder="Detailed emotional and operational description..." className="w-full rounded-xl border p-2 text-xs" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-teal-900/70">Primary Image:</label>
                    <label className="cursor-pointer text-[11px] font-bold text-teal-800 hover:text-saffron transition underline">
                      <span>📁 Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const url = await handleFileUpload(f, "images");
                            if (url) {
                              const input = document.getElementById("newCatalogImageUrl") as HTMLInputElement;
                              if (input) input.value = url;
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input id="newCatalogImageUrl" name="imageUrl" placeholder="/uploads/images/food.jpg" className="w-full rounded-xl border p-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Gallery Media URLs (comma-separated):</label>
                  <input name="gallery" placeholder="/media/meals.jpg, /media/fruits.jpg" className="w-full rounded-xl border p-2 text-xs font-mono" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-teal-950">
                    <input type="checkbox" name="todayNeed" className="rounded" /> Today Need (Urgent Flag)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-teal-950">
                    <input type="checkbox" name="featured" className="rounded" /> Featured Product
                  </label>
                </div>
              </div>
              <button type="submit" className="rounded-xl bg-saffron px-5 py-2.5 text-xs font-bold text-white hover:bg-saffron-dark transition">
                Create Impact Need
              </button>
            </form>
          )}

          {/* Catalog Items Listing */}
          {catalogsLoading ? (
            <p className="text-xs font-semibold text-teal-900/60 py-4">Loading impact catalogue items...</p>
          ) : (
            <div className="space-y-3">
              {catalogs.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-teal-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl || "/media/poster.jpg"} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-teal-950 text-sm truncate">{item.name}</strong>
                        {item.todayNeed && <span className="rounded bg-saffron/15 px-1.5 py-0.5 text-[10px] font-bold text-saffron-dark">Today Need</span>}
                      </div>
                      <p className="text-xs text-teal-950/60 mt-0.5">
                        {formatINR(item.unitPrice)} / {item.unitLabel || "unit"} · {item.category} · Status:{" "}
                        <span className={item.active ? "text-emerald-700 font-bold" : "text-red-600"}>
                          {item.active ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingCatalog(item)}
                      className="rounded-xl border border-teal-900/20 bg-cream px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-sand transition"
                    >
                      Edit Details &amp; Schemes
                    </button>
                    <button
                      type="button"
                      onClick={() => patchCatalogItem(item.id, { todayNeed: !item.todayNeed })}
                      className="rounded-xl bg-saffron px-3 py-1.5 text-xs font-bold text-white hover:bg-saffron-dark transition"
                    >
                      {item.todayNeed ? "Unmark Need" : "Mark Today"}
                    </button>
                    <button
                      type="button"
                      onClick={() => patchCatalogItem(item.id, { active: !item.active })}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold text-white transition ${
                        item.active ? "bg-teal-950 hover:bg-teal-900" : "bg-emerald-700 hover:bg-emerald-800"
                      }`}
                    >
                      {item.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Catalog Modal */}
          {editingCatalog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h4 className="font-display text-base font-bold text-teal-950">
                    Edit: {editingCatalog.name}
                  </h4>
                  <button type="button" onClick={() => setEditingCatalog(null)} className="font-bold text-gray-500 hover:text-black">
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    void patchCatalogItem(editingCatalog.id, {
                      name: fd.get("name"),
                      description: fd.get("description"),
                      category: fd.get("category"),
                      unitPrice: Number(fd.get("unitPrice")),
                      unitLabel: fd.get("unitLabel"),
                      imageUrl: fd.get("imageUrl"),
                      gallery: fd.get("gallery") || null,
                      schemes: fd.get("schemes") || null,
                    });
                  }}
                  className="space-y-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Title:</label>
                      <input name="name" defaultValue={editingCatalog.name} required className="w-full rounded-xl border p-2 text-xs font-semibold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Category:</label>
                      <select name="category" defaultValue={editingCatalog.category} className="w-full rounded-xl border p-2 text-xs">
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Unit Price (₹):</label>
                      <input name="unitPrice" type="number" defaultValue={editingCatalog.unitPrice} required className="w-full rounded-xl border p-2 text-xs font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Unit Label:</label>
                      <input name="unitLabel" defaultValue={editingCatalog.unitLabel || "unit"} className="w-full rounded-xl border p-2 text-xs" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Description:</label>
                      <textarea name="description" rows={3} defaultValue={editingCatalog.description} className="w-full rounded-xl border p-2 text-xs" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-teal-900/70">Main Image URL:</label>
                        <label className="cursor-pointer text-[11px] font-bold text-teal-800 hover:text-saffron transition underline">
                          <span>📁 Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const url = await handleFileUpload(f, "images");
                                if (url) setEditingCatalog({ ...editingCatalog, imageUrl: url });
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        name="imageUrl"
                        value={editingCatalog.imageUrl || ""}
                        onChange={(e) => setEditingCatalog({ ...editingCatalog, imageUrl: e.target.value })}
                        className="w-full rounded-xl border p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Gallery Media URLs:</label>
                      <input name="gallery" defaultValue={editingCatalog.gallery || ""} placeholder="/media/meals.jpg, /media/fruits.jpg" className="w-full rounded-xl border p-2 text-xs font-mono" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-teal-900/70 mb-1">Marketing Schemes JSON / Tiers:</label>
                      <textarea
                        name="schemes"
                        rows={3}
                        defaultValue={editingCatalog.schemes || ""}
                        placeholder='[{"label":"Single Child","qty":1,"amount":100},{"label":"Group of 5","qty":5,"amount":500}]'
                        className="w-full rounded-xl border p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingCatalog(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100">
                      Cancel
                    </button>
                    <button type="submit" className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white hover:bg-saffron-dark">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 6. DOCUMENTS & 80G AUDITS ==================== */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-teal-900">
                Governance, 80G Tax Exemption & Audit Documents
              </h3>
              <p className="text-xs text-teal-950/60">
                Manage all official trust documents, 80G certificates, and annual audits.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewDocOpen(!newDocOpen)}
              className="rounded-xl bg-teal-900 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
            >
              {newDocOpen ? "Cancel" : "+ Add Document"}
            </button>
          </div>

          {newDocOpen && (
            <form onSubmit={createDocument} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 space-y-3">
              <h4 className="font-display text-sm font-bold text-teal-950 border-b pb-2">Publish New Audit PDF / Document</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Document Title:</label>
                  <input name="title" required placeholder="e.g. Form 10AC Provisional 80G Order" className="w-full rounded-xl border p-2 text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Category:</label>
                  <input name="category" defaultValue="Tax & Governance" className="w-full rounded-xl border p-2 text-xs" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-teal-900/70">PDF File URL:</label>
                    <label className="cursor-pointer text-[11px] font-bold text-teal-800 hover:text-saffron transition underline">
                      <span>📁 Upload PDF Document</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const url = await handleFileUpload(f, "documents");
                            if (url) {
                              const input = document.getElementById("newDocFileUrl") as HTMLInputElement;
                              if (input) input.value = url;
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input id="newDocFileUrl" name="fileUrl" required placeholder="/uploads/documents/form10ac_80g.pdf" className="w-full rounded-xl border p-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-900/70 mb-1">Version / Assessment Year:</label>
                  <input name="version" defaultValue="AY 2024-25 to 2026-27" className="w-full rounded-xl border p-2 text-xs" />
                </div>
              </div>
              <button type="submit" className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition">
                Publish Document
              </button>
            </form>
          )}

          {docsLoading ? (
            <p className="text-xs font-semibold text-teal-900/60 py-4">Loading documents...</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <strong className="text-teal-950 text-sm">{doc.title}</strong>
                    <p className="text-xs text-teal-950/60 mt-0.5">
                      {doc.category} · {doc.version} · <span className="font-mono">{doc.fileUrl}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-teal-900/20 bg-cream px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-sand transition"
                    >
                      View &rarr;
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditingDocument(doc)}
                      className="rounded-xl bg-teal-900/10 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-900/20 transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-200 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Document Modal */}
          {editingDocument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10 space-y-4">
                <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
                  <h4 className="font-display text-sm font-bold text-teal-950">
                    Edit Audit / Legal Document #{editingDocument.id}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingDocument(null)}
                    className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    await handlePatchDocument(editingDocument.id, {
                      title: fd.get("title"),
                      category: fd.get("category"),
                      version: fd.get("version"),
                      fileUrl: fd.get("fileUrl"),
                    });
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Document Title:</label>
                    <input
                      name="title"
                      defaultValue={editingDocument.title}
                      required
                      className="w-full rounded-xl border p-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Category:</label>
                    <input
                      name="category"
                      defaultValue={editingDocument.category || "Tax & Governance"}
                      className="w-full rounded-xl border p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">File URL:</label>
                    <input
                      name="fileUrl"
                      defaultValue={editingDocument.fileUrl}
                      required
                      className="w-full rounded-xl border p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-teal-900/70 mb-1">Version / Assessment Year:</label>
                    <input
                      name="version"
                      defaultValue={editingDocument.version || ""}
                      className="w-full rounded-xl border p-2 text-xs"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingDocument(null)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 7. COMMUNITY, VOLUNTEERS & INFLUENCERS ==================== */}
      {activeTab === "community" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-teal-900">
                Volunteers &amp; Influencer Creator Pipeline
              </h3>
              <p className="text-xs text-teal-950/60">
                Manage on-ground teaching volunteers and social media influencer collaboration requests with photos &amp; video reels.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900 ring-1 ring-teal-900/15">
                Volunteers: {volunteers.length}
              </span>
              <span className="rounded-xl bg-saffron/15 px-3 py-1.5 text-xs font-bold text-saffron-dark ring-1 ring-saffron/25">
                Creators &amp; Reels Active
              </span>
            </div>
          </div>

          {/* Pipeline Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-cream p-4 border border-teal-900/10">
              <div className="flex items-center gap-2 mb-2 text-teal-900 font-bold text-xs">
                <span>🤝 On-Ground Seva Volunteers</span>
              </div>
              <p className="text-xs text-teal-950/70">
                Weekly weekend teaching, sports coaching, kitchen seva, and health camps at our Turahalli home.
              </p>
              <div className="mt-2 text-[11px] text-teal-900/60">
                Photo &amp; Video showcase: <code className="bg-white px-1.5 py-0.5 rounded text-teal-950 font-mono">/media/volunteers.jpg</code> &bull; <code className="bg-white px-1.5 py-0.5 rounded text-teal-950 font-mono">/media/ashrama_video.mp4</code>
              </div>
            </div>

            <div className="rounded-2xl bg-cream p-4 border border-teal-900/10">
              <div className="flex items-center gap-2 mb-2 text-teal-900 font-bold text-xs">
                <span>📱 Social Media Creators &amp; Influencer Reels</span>
              </div>
              <p className="text-xs text-teal-950/70">
                Instagram and YouTube creators visiting the Ashrama to record authentic reels and amplify children&apos;s educational needs to their followers.
              </p>
              <div className="mt-2 text-[11px] text-teal-900/60">
                Creator Reels &amp; Showcase: <code className="bg-white px-1.5 py-0.5 rounded text-teal-950 font-mono">/media/community.jpg</code> &bull; <code className="bg-white px-1.5 py-0.5 rounded text-teal-950 font-mono">/media/ashrama_journey.mp4</code>
              </div>
            </div>
          </div>

          {/* Volunteer & Creator Applications List */}
          {volunteersLoading ? (
            <p className="text-xs font-semibold text-teal-900/60 py-4">Loading volunteer applications...</p>
          ) : volunteers.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-teal-900/10">
              <p className="text-xs text-teal-950/60">No volunteer or creator applications recorded yet.</p>
              <p className="text-[11px] text-teal-900/50 mt-1">Applications submitted on /janaseva-crew appear here in real time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {volunteers.map((vol) => (
                <div key={vol.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-teal-950 text-sm">{vol.name}</strong>
                      <span className="rounded-md bg-cream px-2 py-0.5 text-[10px] font-bold text-teal-900 border border-teal-900/10">
                        {vol.interestArea || "Volunteer Seva"}
                      </span>
                    </div>
                    <p className="text-xs text-teal-950/60 mt-0.5">
                      {vol.email} &bull; {vol.phone || "No phone provided"}
                    </p>
                    {vol.message && (
                      <p className="text-xs italic text-teal-950/70 mt-1 bg-cream/70 p-2 rounded-xl">
                        &ldquo;{vol.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={vol.status}
                      onChange={(e) => updateVolunteerStatus(vol.id, e.target.value)}
                      className="rounded-xl border border-teal-900/15 p-1.5 text-xs font-bold text-teal-950 bg-white"
                    >
                      <option value="NEW">NEW</option>
                      <option value="REVIEWING">REVIEWING</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== 8. TEAM & ROLE-BASED ACCESS CONTROL (RBAC) ==================== */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-teal-900">
                Team &amp; Employee Role-Based Access Control (RBAC)
              </h3>
              <p className="text-xs text-teal-950/60">
                Manage staff logins, assign specific job permissions, reset passwords, or deactivate employee access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewMemberModalOpen(true)}
              className="rounded-xl bg-teal-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-900 transition flex items-center gap-2"
            >
              <span>+ Add New Employee</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900/60">Total Staff</span>
              <p className="mt-1 font-display text-xl font-bold text-teal-950">{teamMembers.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active Accounts</span>
              <p className="mt-1 font-display text-xl font-bold text-emerald-800">
                {teamMembers.filter((m) => m.active).length}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Deactivated</span>
              <p className="mt-1 font-display text-xl font-bold text-rose-800">
                {teamMembers.filter((m) => !m.active).length}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 ring-1 ring-teal-900/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-dark">Super Admins</span>
              <p className="mt-1 font-display text-xl font-bold text-teal-950">
                {teamMembers.filter((m) => m.role === "SUPER_ADMIN").length}
              </p>
            </div>
          </div>

          {/* Role Permissions Reference */}
          <div className="rounded-2xl bg-cream p-4 border border-teal-900/10">
            <h4 className="text-xs font-bold text-teal-950 mb-2">📋 Available Job Roles &amp; Permissions Guide</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px]">
              {ROLES_INFO.map((r) => (
                <div key={r.role} className="rounded-xl bg-white p-2.5 ring-1 ring-teal-900/10">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900">
                    <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-950 border border-teal-900/10">
                      {r.label}
                    </span>
                    <span className="text-[10px] font-mono text-teal-900/50">({r.role})</span>
                  </div>
                  <p className="mt-1 text-teal-950/70 text-[11px] leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members List */}
          {teamLoading ? (
            <p className="text-xs font-semibold text-teal-900/60 py-4">Loading employee accounts...</p>
          ) : teamMembers.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-teal-900/10">
              <p className="text-xs text-teal-950/70">No database-registered employee accounts found.</p>
              <p className="text-[11px] text-teal-900/50 mt-1">
                Click &ldquo;+ Add New Employee&rdquo; above to create employee logins for your team.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-teal-900/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand/40 border-b border-teal-900/10 text-[11px] font-bold text-teal-950">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Assigned Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/5">
                    {teamMembers.map((member) => {
                      const isSelf = member.id === currentAdminId;
                      return (
                        <tr key={member.id} className="hover:bg-sand/20 transition">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-teal-900 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {member.displayName.slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <strong className="text-teal-950 font-bold">{member.displayName}</strong>
                                  {isSelf && (
                                    <span className="rounded-md bg-saffron/20 px-1.5 py-0.5 text-[9px] font-bold text-saffron-dark border border-saffron/40">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-teal-900/60 block">{member.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              className="rounded-xl border border-teal-900/15 bg-white px-2.5 py-1 text-xs font-bold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
                            >
                              {ROLES_INFO.map((r) => (
                                <option key={r.role} value={r.role}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(member.id, !member.active)}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                                member.active
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                              }`}
                            >
                              {member.active ? "● Active" : "○ Deactivated"}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-teal-900/60 text-[11px]">
                            {new Date(member.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setResetPassModalUser(member);
                                  setResetPasswordInput("");
                                }}
                                className="rounded-lg bg-cream px-2.5 py-1 text-[11px] font-bold text-teal-900 hover:bg-sand transition"
                              >
                                🔑 Reset Pass
                              </button>
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(member.id, member.displayName)}
                                  className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                                  title="Delete Employee Account"
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== ADD EMPLOYEE MODAL ==================== */}
      {newMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/15">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-teal-950">Add New Employee Account</h3>
                <p className="text-xs text-teal-900/60">Create an authenticated team member with a dedicated job role.</p>
              </div>
              <button
                type="button"
                onClick={() => setNewMemberModalOpen(false)}
                className="rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-teal-950 hover:bg-sand"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeamMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal-900/80 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.displayName}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, displayName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/80 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  placeholder="e.g. ramesh@janaseva.org"
                  className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/80 mb-1">Password (min 8 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newMemberForm.password}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                  placeholder="Temporary secure password"
                  className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
                />
                <p className="text-[11px] text-teal-900/50 mt-1">Hashed securely using scrypt with unique cryptographic salt.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-900/80 mb-1">Job Role &amp; Permissions *</label>
                <select
                  value={newMemberForm.role}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-bold text-teal-950 bg-white focus:outline-none focus:ring-2 focus:ring-saffron"
                >
                  {ROLES_INFO.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} ({r.role})
                    </option>
                  ))}
                </select>
                <div className="mt-2 rounded-xl bg-cream p-3 border border-teal-900/10">
                  <p className="text-[11px] text-teal-950 font-semibold">
                    <strong>Role Permission: </strong>
                    {ROLES_INFO.find((r) => r.role === newMemberForm.role)?.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => setNewMemberModalOpen(false)}
                  className="rounded-xl bg-cream px-4 py-2 text-xs font-bold text-teal-900 hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newMemberSubmitting}
                  className="rounded-xl bg-teal-950 px-5 py-2 text-xs font-bold text-white hover:bg-teal-900 disabled:opacity-50"
                >
                  {newMemberSubmitting ? "Creating Account..." : "Create Employee Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== RESET PASSWORD MODAL ==================== */}
      {resetPassModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/15">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-teal-950">Reset Employee Password</h3>
                <p className="text-xs text-teal-900/60">
                  Account: <strong>{resetPassModalUser.displayName}</strong> ({resetPassModalUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetPassModalUser(null);
                  setResetPasswordInput("");
                }}
                className="rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-teal-950 hover:bg-sand"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal-900/80 mb-1">New Password (min 8 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-xs font-semibold text-teal-950 focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200">
                <p className="text-[11px] text-amber-900 font-medium">
                  ⚠️ <strong>Security Notice:</strong> Setting a new password will immediately revoke and terminate any existing active sessions for this user. They must sign in again with the new password.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => {
                    setResetPassModalUser(null);
                    setResetPasswordInput("");
                  }}
                  className="rounded-xl bg-cream px-4 py-2 text-xs font-bold text-teal-900 hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="rounded-xl bg-teal-950 px-5 py-2 text-xs font-bold text-white hover:bg-teal-900 disabled:opacity-50"
                >
                  {resetSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TODAY DAILY PHOTO UPLOAD MODAL ==================== */}
      {dailyPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/15">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron text-white text-xl">
                  📸
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-teal-950">
                    Post Today&apos;s Ashrama Photo &amp; Moment
                  </h3>
                  <p className="text-xs text-teal-900/60">
                    Upload today&apos;s ground photo to immediately feature on the homepage.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDailyPhotoModalOpen(false)}
                className="rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-teal-950 hover:bg-sand cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishDailyPhoto} className="mt-4 space-y-4">
              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-bold text-teal-900 mb-1.5">
                  Select Photo (Camera or File) *
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="focus-ring w-full sm:w-auto shrink-0 cursor-pointer rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-950 transition flex items-center justify-center gap-2 shadow-xs">
                    <span>📷 Pick Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setDailyPhotoFile(file);
                        const reader = new FileReader();
                        reader.onload = () => {
                          setDailyPhotoPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-teal-900/60">or enter image path below</span>
                </div>

                {dailyPhotoPreview && (
                  <div className="mt-3 relative aspect-[16/10] w-full rounded-2xl bg-teal-950/10 overflow-hidden border border-teal-900/15">
                    <img
                      src={dailyPhotoPreview}
                      alt="Today preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setDailyPhotoFile(null);
                        setDailyPhotoPreview("");
                      }}
                      className="absolute top-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-white hover:bg-black/80 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {!dailyPhotoPreview && (
                  <input
                    value={dailyPhotoPreview}
                    onChange={(e) => setDailyPhotoPreview(e.target.value)}
                    placeholder="Image URL (e.g. /media/food.jpg or paste link)"
                    className="mt-2 w-full rounded-xl border p-2.5 text-xs font-mono text-teal-900"
                  />
                )}
              </div>

              {/* Moment Title */}
              <div>
                <label className="block text-xs font-bold text-teal-900 mb-1">
                  Moment Headline / Title *
                </label>
                <input
                  required
                  value={dailyPhotoTitle}
                  onChange={(e) => setDailyPhotoTitle(e.target.value)}
                  placeholder="e.g. Morning Hot Annadana Breakfast Cooked Fresh"
                  className="w-full rounded-xl border p-2.5 text-xs font-semibold text-teal-900"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-teal-900 mb-1">Category</label>
                <select
                  value={dailyPhotoCategory}
                  onChange={(e) => setDailyPhotoCategory(e.target.value)}
                  className="w-full rounded-xl border p-2.5 text-xs font-semibold text-teal-900 bg-white"
                >
                  <option value="Daily Kitchen & Food">Daily Kitchen &amp; Food (Annadana)</option>
                  <option value="Education & Study Hour">Education &amp; Study Hour (Vidya)</option>
                  <option value="Outdoor Play & Childhood">Outdoor Play &amp; Childhood</option>
                  <option value="Health Check & Wellness">Health Check &amp; Wellness (Arogya)</option>
                  <option value="Volunteers at Work">Volunteers &amp; Seva Community</option>
                  <option value="Ashrama Celebrations">Ashrama Celebrations &amp; Feasts</option>
                </select>
              </div>

              {/* Story / Description */}
              <div>
                <label className="block text-xs font-bold text-teal-900 mb-1">
                  Story / What happened today?
                </label>
                <textarea
                  rows={3}
                  value={dailyPhotoBody}
                  onChange={(e) => setDailyPhotoBody(e.target.value)}
                  placeholder="e.g. 25 children sat together for warm steaming rice, nutritious dal, and bananas before morning school bells."
                  className="w-full rounded-xl border p-2.5 text-xs text-teal-900"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => setDailyPhotoModalOpen(false)}
                  className="rounded-xl bg-cream px-4 py-2.5 text-xs font-bold text-teal-900 hover:bg-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dailyPhotoUploading || (!dailyPhotoPreview && !dailyPhotoFile)}
                  className="focus-ring rounded-xl bg-saffron px-5 py-2.5 text-xs font-bold text-white hover:bg-saffron-dark disabled:opacity-50 transition shadow-xs cursor-pointer"
                >
                  {dailyPhotoUploading ? "Publishing Photo..." : "🚀 Publish Live to Website"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT TODAY MOMENT MODAL ==================== */}
      {editingTodayUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-teal-900/10 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <h4 className="font-display text-sm font-bold text-teal-950">
                Edit Today Moment #{editingTodayUpdate.id}
              </h4>
              <button
                type="button"
                onClick={() => setEditingTodayUpdate(null)}
                className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await handlePatchTodayUpdate(editingTodayUpdate.id, {
                  title: fd.get("title"),
                  body: fd.get("body"),
                  category: fd.get("category"),
                  imageUrl: fd.get("imageUrl"),
                  status: fd.get("status"),
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Moment Title:</label>
                <input
                  name="title"
                  defaultValue={editingTodayUpdate.title}
                  required
                  className="w-full rounded-xl border p-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Category:</label>
                <select
                  name="category"
                  defaultValue={editingTodayUpdate.category || "Daily Kitchen & Food"}
                  className="w-full rounded-xl border p-2 text-xs bg-white"
                >
                  <option value="Daily Kitchen & Food">Daily Kitchen &amp; Food (Annadana)</option>
                  <option value="Education & Study Hour">Education &amp; Study Hour (Vidya)</option>
                  <option value="Outdoor Play & Childhood">Outdoor Play &amp; Childhood</option>
                  <option value="Health Check & Wellness">Health Check &amp; Wellness (Arogya)</option>
                  <option value="Volunteers at Work">Volunteers &amp; Seva Community</option>
                  <option value="Ashrama Celebrations">Ashrama Celebrations &amp; Feasts</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Image URL:</label>
                <input
                  name="imageUrl"
                  defaultValue={editingTodayUpdate.imageUrl || ""}
                  className="w-full rounded-xl border p-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Status:</label>
                <select
                  name="status"
                  defaultValue={editingTodayUpdate.status || "published"}
                  className="w-full rounded-xl border p-2 text-xs bg-white"
                >
                  <option value="published">Published (Live)</option>
                  <option value="review">Review</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900/70 mb-1">Story / Description:</label>
                <textarea
                  name="body"
                  defaultValue={editingTodayUpdate.body || ""}
                  rows={3}
                  className="w-full rounded-xl border p-2 text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTodayUpdate(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white hover:bg-saffron-dark transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== STRATEGY & BUSINESS PLAN MODAL ==================== */}
      <BusinessPlanModal
        isOpen={businessPlanOpen}
        onClose={() => setBusinessPlanOpen(false)}
      />

      <ValidationErrorModal
        isOpen={valModalOpen}
        title="Invalid Entry"
        message={valModalMsg}
        onClose={() => setValModalOpen(false)}
      />
    </div>
  );
}
