import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { db } from "@/db";
import { whatsAppConversations, whatsAppContacts, whatsAppMessages, adminUsers } from "@/db/schema";
import { eq, desc, sql, and, or, like } from "drizzle-orm";
import { upsertWhatsAppContact, getOrCreateConversation } from "@/lib/whatsapp-contacts";

export const dynamic = "force-dynamic";

/**
 * GET: List Conversations for Team Inbox with search, filter, and unread counts
 */
export async function GET(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "all"; // all | unread | mine | unassigned
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const offset = (page - 1) * limit;

  try {
    let baseQuery = db
      .select({
        conversation: whatsAppConversations,
        contact: whatsAppContacts,
        assignedUser: {
          id: adminUsers.id,
          displayName: adminUsers.displayName,
          email: adminUsers.email,
        },
      })
      .from(whatsAppConversations)
      .innerJoin(whatsAppContacts, eq(whatsAppConversations.contactId, whatsAppContacts.id))
      .leftJoin(adminUsers, eq(whatsAppConversations.assignedUserId, adminUsers.id));

    const conditions = [];

    if (status !== "all") {
      conditions.push(eq(whatsAppConversations.status, status.toUpperCase()));
    }

    if (filter === "unread") {
      conditions.push(sql`${whatsAppConversations.unreadCount} > 0`);
    } else if (filter === "unassigned") {
      conditions.push(sql`${whatsAppConversations.assignedUserId} IS NULL`);
    } else if (filter === "mine" && session.user.id) {
      conditions.push(eq(whatsAppConversations.assignedUserId, session.user.id));
    }

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(
        or(
          like(whatsAppContacts.displayName, s),
          like(whatsAppContacts.normalizedPhone, s),
          like(whatsAppContacts.email, s)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        conversation: whatsAppConversations,
        contact: whatsAppContacts,
        assignedUser: {
          id: adminUsers.id,
          displayName: adminUsers.displayName,
          email: adminUsers.email,
        },
      })
      .from(whatsAppConversations)
      .innerJoin(whatsAppContacts, eq(whatsAppConversations.contactId, whatsAppContacts.id))
      .leftJoin(adminUsers, eq(whatsAppConversations.assignedUserId, adminUsers.id))
      .where(whereClause)
      .orderBy(desc(whatsAppConversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    // Get latest message snippet for each conversation
    const conversationIds = rows.map((r) => r.conversation.id);
    let latestMessagesMap = new Map<number, any>();

    if (conversationIds.length > 0) {
      const msgs = await db
        .select()
        .from(whatsAppMessages)
        .where(sql`${whatsAppMessages.conversationId} IN ${conversationIds}`)
        .orderBy(desc(whatsAppMessages.createdAt));

      for (const m of msgs) {
        if (!latestMessagesMap.has(m.conversationId)) {
          latestMessagesMap.set(m.conversationId, m);
        }
      }
    }

    const conversations = rows.map((r) => ({
      ...r.conversation,
      contact: r.contact,
      assignedUser: r.assignedUser,
      lastMessage: latestMessagesMap.get(r.conversation.id) || null,
    }));

    return NextResponse.json({
      conversations,
      page,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch conversations" }, { status: 500 });
  }
}

/**
 * POST: Create a new conversation with a contact (or open existing)
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phone, displayName, email } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const contact = await upsertWhatsAppContact({
      phone,
      displayName,
      email,
      source: "ADMIN_MANUAL",
    });

    const conv = await getOrCreateConversation(contact.id);

    return NextResponse.json({
      success: true,
      conversationId: conv.id,
      contact,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create conversation" }, { status: 500 });
  }
}
