import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { db } from "@/db";
import {
  whatsAppConversations,
  whatsAppContacts,
  whatsAppMessages,
  adminUsers,
  donations,
} from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET: Full conversation timeline & donor 360 profile
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const convId = parseInt(id, 10);
  if (isNaN(convId)) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  try {
    const [convRow] = await db
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
      .where(eq(whatsAppConversations.id, convId))
      .limit(1);

    if (!convRow) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Reset unread count
    if (convRow.conversation.unreadCount > 0) {
      await db
        .update(whatsAppConversations)
        .set({ unreadCount: 0 })
        .where(eq(whatsAppConversations.id, convId));
    }

    // Fetch message history
    const messages = await db
      .select()
      .from(whatsAppMessages)
      .where(eq(whatsAppMessages.conversationId, convId))
      .orderBy(asc(whatsAppMessages.createdAt));

    // Fetch donor recent transactions if donorId or phone matches
    let donorHistory: any[] = [];
    if (convRow.contact.donorId) {
      donorHistory = await db
        .select()
        .from(donations)
        .where(eq(donations.id, convRow.contact.donorId))
        .limit(5);
    } else if (convRow.contact.normalizedPhone) {
      const rawDigits = convRow.contact.normalizedPhone.slice(-10);
      donorHistory = await db
        .select()
        .from(donations)
        .where(eq(donations.donorPhone, rawDigits))
        .orderBy(desc(donations.createdAt))
        .limit(5);
    }

    return NextResponse.json({
      conversation: {
        ...convRow.conversation,
        unreadCount: 0,
      },
      contact: convRow.contact,
      assignedUser: convRow.assignedUser,
      messages,
      donorHistory,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load conversation" }, { status: 500 });
  }
}

/**
 * PATCH: Update conversation status, toggle AI bot, or assign staff
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const convId = parseInt(id, 10);
  if (isNaN(convId)) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updates: Partial<typeof whatsAppConversations.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) {
      updates.status = body.status;
    }
    if (body.aiEnabled !== undefined) {
      updates.aiEnabled = Boolean(body.aiEnabled);
    }
    if (body.assignedUserId !== undefined) {
      updates.assignedUserId = body.assignedUserId ? Number(body.assignedUserId) : null;
    }

    const [updated] = await db
      .update(whatsAppConversations)
      .set(updates)
      .where(eq(whatsAppConversations.id, convId))
      .returning();

    return NextResponse.json({ success: true, conversation: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update conversation" }, { status: 500 });
  }
}
