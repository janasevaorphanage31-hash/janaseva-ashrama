"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";
import {
  generateAntiBanMessage,
  CURATED_OUTREACH_MEDIA,
  type MediaAsset,
} from "@/lib/whatsapp-antiban";

interface Contact {
  id: number;
  displayName: string | null;
  normalizedPhone: string;
  email: string | null;
  tags: string[] | null;
  optInStatus: boolean;
  lastDonationAmount: number | null;
  lastSevaType: string | null;
  lastDonationAt: string | null;
  preferredLanguage: string;
}

interface Message {
  id: number;
  wamId: string | null;
  direction: "INBOUND" | "OUTBOUND";
  messageType: string;
  content: string | null;
  mediaUrl: string | null;
  status: string;
  createdAt: string;
}

interface ConversationItem {
  id: number;
  status: string;
  unreadCount: number;
  aiEnabled: boolean;
  lastMessageAt: string;
  contact: Contact;
  assignedUser: { id: number; displayName: string; email: string } | null;
  lastMessage: Message | null;
}

const CANNED_RESPONSES = [
  {
    label: "🍲 Annadana Meals (₹4,500)",
    text: "Namaste Ji 🙏 Sponsoring full-day meals for our 25 resident boys at Janaseva Ashrama is ₹4,500 (Breakfast, Afternoon banana-leaf lunch with sweet, Evening milk & snacks, and Dinner). 50% Tax Exemption under 80G Form 10AC: AAATJ5578EF20214. Donate: https://www.janasevaashrama.org/donate",
  },
  {
    label: "📜 80G Receipt Info",
    text: "Namaste Ji! All donations to Janaseva Ashrama are 50% tax exempt under Section 80G of the Income Tax Act (Form 10AC Registration: AAATJ5578EF20214). Official digital receipts are issued instantly upon contribution with our trust seal.",
  },
  {
    label: "🎂 Birthday Seva Feast (₹5,000)",
    text: "Namaste Ji! You can celebrate your birthday or family anniversary with our 25 resident boys by sponsoring a special celebration feast for ₹5,000. We also record and share a personalized blessing video directly to your WhatsApp! Book: https://www.janasevaashrama.org/celebrate",
  },
  {
    label: "🏡 Visiting Hours & Campus",
    text: "Janaseva Ashrama is located in Bengaluru, Karnataka. Visiting hours are 9:00 AM to 6:30 PM daily. Prior appointment is recommended so our staff can welcome you and arrange meal serving with the 25 boys. Helpline: +91 99803 59595.",
  },
];

export function TeamInbox({ currentUserId }: { currentUserId?: number }) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [selectedConvData, setSelectedConvData] = useState<{
    conversation: ConversationItem;
    contact: Contact;
    assignedUser: any;
    messages: Message[];
    donorHistory: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "mine" | "unassigned">("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatName, setNewChatName] = useState("");

  // Media Attachment & Anti-Ban State
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  async function loadConversations() {
    try {
      const q = new URLSearchParams({
        filter: activeFilter,
        search,
      });
      const res = await fetch(`/api/admin/whatsapp/conversations?${q.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations || []);
        // Auto-select first if none selected
        if (!selectedConvId && data.conversations?.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  // Load active conversation thread
  async function loadConversationThread(id: number) {
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedConvData(data);
        // update unread count in conversations list
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    loadConversations();
  }, [activeFilter, search]);

  useEffect(() => {
    if (selectedConvId) {
      loadConversationThread(selectedConvId);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConvData?.messages]);

  // Handle Anti-Ban Spintax Spin
  const handleAntiBanAlter = () => {
    if (!selectedConvData) return;
    const donorName = selectedConvData.contact.displayName || "Noble Supporter";
    const generated = generateAntiBanMessage({
      donorName,
      callerId: "ADMIN",
      callerName: "Janaseva Ashrama",
      language: (selectedConvData.contact.preferredLanguage === "kn" ? "kn" : "en") as any,
      angle: "annadana",
      mediaId: selectedMedia?.id,
    });
    setReplyText(generated.messageText);
    if (!selectedMedia && generated.mediaAsset) {
      setSelectedMedia(generated.mediaAsset);
    }
  };

  // Handle Send Manual Message (Text, Image, Video, PDF Document, or Website Link)
  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if ((!replyText.trim() && !selectedMedia) || !selectedConvId || sending) return;

    setSending(true);
    try {
      const payload: any = {
        message: replyText.trim(),
      };
      if (selectedMedia) {
        payload.mediaUrl = selectedMedia.url;
        payload.messageType =
          selectedMedia.type === "document"
            ? "document"
            : selectedMedia.type === "video"
            ? "video"
            : selectedMedia.type === "image"
            ? "image"
            : "text";
        payload.caption = replyText.trim();
      }

      const res = await fetch(`/api/admin/whatsapp/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setSelectedConvData((prev) =>
          prev ? { ...prev, messages: [...prev.messages, data.message] } : null
        );
        setReplyText("");
        setSelectedMedia(null);
        setIsMediaDrawerOpen(false);
        loadConversations();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  // Toggle AI Active
  async function handleToggleAi(val: boolean) {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${selectedConvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled: val }),
      });
      if (res.ok) {
        setSelectedConvData((prev) =>
          prev
            ? {
                ...prev,
                conversation: { ...prev.conversation, aiEnabled: val },
              }
            : null
        );
      }
    } catch {}
  }

  // Toggle Status
  async function handleStatusChange(status: string) {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${selectedConvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSelectedConvData((prev) =>
          prev
            ? {
                ...prev,
                conversation: { ...prev.conversation, status },
              }
            : null
        );
        loadConversations();
      }
    } catch {}
  }

  // Start new conversation
  async function handleCreateNewChat(e: React.FormEvent) {
    e.preventDefault();
    if (!newChatPhone.trim()) return;

    try {
      const res = await fetch("/api/admin/whatsapp/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newChatPhone.trim(),
          displayName: newChatName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.conversationId) {
        setNewChatModalOpen(false);
        setNewChatPhone("");
        setNewChatName("");
        await loadConversations();
        setSelectedConvId(data.conversationId);
      }
    } catch {}
  }

  return (
    <div className="flex h-[750px] w-full flex-col rounded-3xl border border-teal-900/15 bg-white shadow-xl overflow-hidden md:flex-row">
      {/* ========================================================================= */}
      {/* 1. LEFT PANEL: Conversations List & Filters */}
      {/* ========================================================================= */}
      <div className="flex w-full flex-col border-b border-teal-900/10 bg-slate-50 md:w-80 md:border-b-0 md:border-r">
        {/* Header & New Chat Button */}
        <div className="flex items-center justify-between border-b border-teal-900/10 p-3.5 bg-white">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm">
              💬
            </span>
            <div>
              <h2 className="text-sm font-bold text-teal-950 font-display">Team Inbox</h2>
              <p className="text-[10px] text-teal-950/60 font-medium">Meta Cloud API Live</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewChatModalOpen(true)}
            className="rounded-xl bg-teal-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-900 transition shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-2.5 bg-white border-b border-teal-900/10">
          <input
            type="text"
            placeholder="Search donor name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-teal-900/15 bg-cream/40 px-3 py-1.5 text-xs text-teal-950 placeholder:text-teal-950/40 focus:border-teal-900 focus:outline-hidden"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-2 overflow-x-auto no-scrollbar border-b border-teal-900/10 bg-cream/30">
          {(
            [
              { id: "all", label: "All" },
              { id: "unread", label: "Unread" },
              { id: "mine", label: "My Chats" },
              { id: "unassigned", label: "Unassigned" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === f.id
                  ? "bg-teal-950 text-white shadow-xs"
                  : "bg-white text-teal-950/70 hover:bg-white/80 border border-teal-900/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-teal-900/5">
          {loading ? (
            <div className="p-6 text-center text-xs text-teal-950/50">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-teal-950/50">No conversations found.</div>
          ) : (
            conversations.map((c) => {
              const isSelected = c.id === selectedConvId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConvId(c.id)}
                  className={`w-full p-3 text-left transition flex items-start gap-2.5 cursor-pointer rounded-lg ${
                    isSelected ? "bg-amber-100/70 ring-1 ring-amber-400/50 shadow-xs" : "hover:bg-white"
                  }`}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-900/10 font-bold text-teal-950 text-xs">
                    {(c.contact?.displayName || "D")[0].toUpperCase()}
                    {c.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-xs">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-teal-950 truncate">
                        {c.contact?.displayName || c.contact?.normalizedPhone}
                      </span>
                      <span className="text-[10px] text-teal-950/50">
                        {new Date(c.lastMessageAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-950/70 truncate mt-0.5">
                      {c.lastMessage?.content || "No message history"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {c.aiEnabled ? (
                        <span className="rounded-full bg-purple-100 text-purple-700 px-1.5 py-0.2 text-[9px] font-bold">
                          🤖 AI
                        </span>
                      ) : (
                        <span className="rounded-full bg-teal-100 text-teal-800 px-1.5 py-0.2 text-[9px] font-bold">
                          👤 Human
                        </span>
                      )}
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                          c.status === "OPEN"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "WAITING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE PANEL: Active Chat Timeline & Composer */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col bg-cream/30 min-w-0">
        {selectedConvData ? (
          <>
            {/* Conversation Header */}
            <div className="flex items-center justify-between border-b border-teal-900/10 bg-white p-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron/20 font-bold text-saffron-dark text-sm">
                  {(selectedConvData.contact?.displayName || "D")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-teal-950 truncate">
                      {selectedConvData.contact?.displayName || "Donor"}
                    </h3>
                    <span className="text-xs text-teal-950/60 font-mono">
                      {selectedConvData.contact?.normalizedPhone}
                    </span>
                  </div>
                  <p className="text-[10px] text-teal-950/60">
                    {selectedConvData.contact?.lastDonationAmount
                      ? `Last Seva: ${formatINR(selectedConvData.contact.lastDonationAmount)} · ${
                          selectedConvData.contact.lastSevaType || "General Seva"
                        }`
                      : "Prospective Supporter"}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                {/* AI Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleAi(!selectedConvData.conversation.aiEnabled)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    selectedConvData.conversation.aiEnabled
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                  title="Toggle automated AI assistant replies"
                >
                  <span>{selectedConvData.conversation.aiEnabled ? "🤖 AI Bot: Active" : "👤 Human Staff Mode"}</span>
                </button>

                {/* Status Dropdown */}
                <select
                  value={selectedConvData.conversation.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded-xl border border-teal-900/15 bg-white px-2 py-1 text-xs font-semibold text-teal-950 focus:outline-hidden cursor-pointer"
                >
                  <option value="OPEN">Open</option>
                  <option value="WAITING">Waiting</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                {/* Direct Click-to-Chat Fallback */}
                <a
                  href={`https://wa.me/${selectedConvData.contact.normalizedPhone}?text=${encodeURIComponent(
                    replyText || "Namaskara Ji 🙏 Warm greetings from Janaseva Ashrama!"
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#25D366] hover:brightness-105 text-white px-2.5 py-1 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Open direct WhatsApp conversation on phone or WhatsApp Web"
                >
                  <span>💬</span>
                  <span className="hidden sm:inline">wa.me</span>
                </a>
              </div>
            </div>

            {/* Message Bubble Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedConvData.messages.map((m) => {
                const isInbound = m.direction === "INBOUND";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                        isInbound
                          ? "bg-white text-teal-950 ring-1 ring-teal-900/10 rounded-tl-xs"
                          : "bg-teal-950 text-white rounded-tr-xs"
                      }`}
                    >
                      {m.mediaUrl && (
                        <div className="mb-2 overflow-hidden rounded-xl bg-black/10">
                          {m.messageType === "image" ? (
                            <img
                              src={m.mediaUrl}
                              alt="WhatsApp attachment"
                              className="max-h-48 w-full object-cover"
                            />
                          ) : (
                            <a
                              href={m.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 text-xs font-bold underline"
                            >
                              📎 View Attached {m.messageType}
                            </a>
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isInbound ? "text-teal-950/50" : "text-white/60"
                        }`}
                      >
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {!isInbound && (
                          <span>
                            {m.status === "READ"
                              ? "✓✓"
                              : m.status === "DELIVERED"
                              ? "✓✓"
                              : m.status === "SENT"
                              ? "✓"
                              : "•"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Canned Quick Replies Drawer */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-2 bg-white/70 border-t border-teal-900/10">
              <span className="text-[10px] font-bold uppercase text-teal-950/50 shrink-0">Templates:</span>
              {CANNED_RESPONSES.map((cr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReplyText(cr.text)}
                  className="rounded-lg bg-cream px-2.5 py-1 text-[11px] font-semibold text-teal-950 hover:bg-cream-dark transition whitespace-nowrap border border-teal-900/10 cursor-pointer shrink-0"
                >
                  {cr.label}
                </button>
              ))}
            </div>

            {/* Media Asset Picker Drawer */}
            {isMediaDrawerOpen && (
              <div className="p-3 bg-amber-50/70 border-t border-amber-200/80 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-teal-950">
                  <span className="flex items-center gap-1.5">
                    <span>📎</span> Attach Verified Media Asset (Image, Video, PDF, or Link)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMediaDrawerOpen(false)}
                    className="text-teal-950/60 hover:text-teal-950 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(CURATED_OUTREACH_MEDIA).map((m) => {
                    const isSelected = selectedMedia?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMedia(m);
                          setIsMediaDrawerOpen(false);
                        }}
                        className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-amber-100 border-amber-400 ring-1 ring-amber-400"
                            : "bg-white border-teal-900/10 hover:bg-cream"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">
                            {m.type === "image"
                              ? "🖼️"
                              : m.type === "video"
                              ? "🎥"
                              : m.type === "document"
                              ? "📄"
                              : "🔗"}
                          </span>
                          <span className="font-bold text-[11px] text-teal-950 truncate">
                            {m.title}
                          </span>
                        </div>
                        <span
                          className={`self-start text-[9px] font-black uppercase rounded px-1.5 py-0.5 ${
                            m.type === "image"
                              ? "bg-blue-100 text-blue-800"
                              : m.type === "video"
                              ? "bg-purple-100 text-purple-800"
                              : m.type === "document"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {m.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Composer */}
            <form onSubmit={handleSendMessage} className="border-t border-teal-900/10 bg-white p-3 space-y-2">
              {/* Selected Media Chip */}
              {selectedMedia && (
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-1.5 border border-amber-300 text-xs animate-fadeIn">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>
                      {selectedMedia.type === "image"
                        ? "🖼️"
                        : selectedMedia.type === "video"
                        ? "🎥"
                        : selectedMedia.type === "document"
                        ? "📄"
                        : "🔗"}
                    </span>
                    <span className="font-bold text-teal-950 truncate">
                      {selectedMedia.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-teal-950/60 bg-white px-1.5 py-0.5 rounded border border-teal-900/10">
                      {selectedMedia.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMedia(null)}
                    className="text-teal-950/60 hover:text-rose-600 font-bold ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Media Attachment Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMediaDrawerOpen(!isMediaDrawerOpen)}
                  className={`rounded-2xl p-2.5 transition border cursor-pointer ${
                    isMediaDrawerOpen || selectedMedia
                      ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                      : "bg-cream/40 text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                  title="Attach Image, Video, 80G Certificate PDF, or Web Link"
                >
                  📎
                </button>

                {/* Anti-Ban Spintax Spin Button */}
                <button
                  type="button"
                  onClick={handleAntiBanAlter}
                  className="rounded-2xl px-3 py-2.5 bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  title="Generate or rewrite message with anti-ban variations and unique cryptographic token"
                >
                  <span>🛡️</span>
                  <span className="hidden sm:inline">Anti-Ban Spin</span>
                </button>

                <input
                  type="text"
                  placeholder="Type a verified message or caption to donor..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 rounded-2xl border border-teal-900/15 bg-cream/30 px-4 py-2.5 text-xs sm:text-sm text-teal-950 placeholder:text-teal-950/40 focus:border-teal-900 focus:outline-hidden"
                />

                <button
                  type="submit"
                  disabled={sending || (!replyText.trim() && !selectedMedia)}
                  className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {sending ? "Sending..." : "Send"}
                  <span>➤</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-teal-950/40 text-sm">
            Select a conversation on the left to start communicating with donors.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT PANEL: Donor Profile & 360 History */}
      {/* ========================================================================= */}
      {selectedConvData && (
        <div className="hidden lg:flex w-72 flex-col border-l border-teal-900/10 bg-white p-4 overflow-y-auto">
          <div className="text-center pb-3 border-b border-teal-900/10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-950 text-white font-bold text-xl shadow-md">
              {(selectedConvData.contact.displayName || "D")[0].toUpperCase()}
            </div>
            <h4 className="font-bold text-sm text-teal-950 mt-2 font-display">
              {selectedConvData.contact.displayName || "Noble Donor"}
            </h4>
            <p className="text-xs text-teal-950/60 font-mono mt-0.5">
              {selectedConvData.contact.normalizedPhone}
            </p>
            {selectedConvData.contact.email && (
              <p className="text-[11px] text-teal-950/60 truncate mt-0.5">
                {selectedConvData.contact.email}
              </p>
            )}
          </div>

          {/* Opt-In & Compliance Card */}
          <div className="mt-4 rounded-xl bg-cream p-3 border border-teal-900/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950">WhatsApp Opt-In</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selectedConvData.contact.optInStatus
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedConvData.contact.optInStatus ? "Consented ✓" : "Opted-Out ✗"}
              </span>
            </div>
            <p className="text-[10px] text-teal-950/60 mt-1">
              {selectedConvData.contact.optInStatus
                ? "Active permission for 80G receipts & seva updates."
                : "Excluded from marketing broadcasts."}
            </p>
          </div>

          {/* Cumulative Seva Summary */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs py-1 border-b border-teal-900/5">
              <span className="text-teal-950/60">Preferred Language:</span>
              <span className="font-bold uppercase text-teal-950">
                {selectedConvData.contact.preferredLanguage === "kn" ? "ಕನ್ನಡ (KN)" : "English (EN)"}
              </span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-teal-900/5">
              <span className="text-teal-950/60">Last Contribution:</span>
              <span className="font-bold text-emerald-700">
                {selectedConvData.contact.lastDonationAmount
                  ? formatINR(selectedConvData.contact.lastDonationAmount)
                  : "₹0"}
              </span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-teal-900/5">
              <span className="text-teal-950/60">Recent Seva:</span>
              <span className="font-bold text-teal-950 text-right truncate max-w-[120px]">
                {selectedConvData.contact.lastSevaType || "General Seva"}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <span className="text-xs font-bold text-teal-950 block mb-1.5">Donor Tags:</span>
            <div className="flex flex-wrap gap-1">
              {(selectedConvData.contact.tags || ["DONOR"]).map((t, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-teal-900/10 px-2 py-0.5 text-[10px] font-bold text-teal-900"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Past Donations & 80G Tax Receipts */}
          <div className="mt-5 flex-1">
            <span className="text-xs font-bold text-teal-950 block mb-2">
              Recent 80G Receipts:
            </span>
            {selectedConvData.donorHistory?.length > 0 ? (
              <div className="space-y-2">
                {selectedConvData.donorHistory.map((d: any) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-teal-900/10 bg-white p-2 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-emerald-700">{formatINR(d.amount)}</span>
                      <span className="text-[10px] text-teal-950/50">
                        {new Date(d.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    {d.receiptNo && (
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-teal-950/70 truncate max-w-[130px]">
                          {d.receiptNo}
                        </span>
                        <Link
                          href={`/receipt/${encodeURIComponent(d.receiptNo)}`}
                          target="_blank"
                          className="font-bold text-saffron-dark underline"
                        >
                          View 80G
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-teal-950/50 italic">
                No past verified receipts recorded yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-teal-950 font-display">Start WhatsApp Chat</h3>
            <p className="text-xs text-teal-950/60 mt-1">
              Enter donor phone number with or without country code.
            </p>

            <form onSubmit={handleCreateNewChat} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-teal-950">Donor Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 99803 59595"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-teal-900/15 bg-cream/30 p-2.5 text-xs text-teal-950 focus:border-teal-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950">Donor Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-teal-900/15 bg-cream/30 p-2.5 text-xs text-teal-950 focus:border-teal-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewChatModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-cream cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-950 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-900 cursor-pointer"
                >
                  Open Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
