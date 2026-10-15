import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { db } from "@/db";
import { whatsAppContacts, whatsAppConsents } from "@/db/schema";
import { eq, desc, or, like, and, sql } from "drizzle-orm";
import { upsertWhatsAppContact } from "@/lib/whatsapp-contacts";

export const dynamic = "force-dynamic";

/**
 * GET: List & search WhatsApp contacts
 */
export async function GET(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const optInFilter = searchParams.get("optIn"); // true | false | all
  const tagFilter = searchParams.get("tag") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (optInFilter === "true") {
      conditions.push(eq(whatsAppContacts.optInStatus, true));
    } else if (optInFilter === "false") {
      conditions.push(eq(whatsAppContacts.optInStatus, false));
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

    const contacts = await db
      .select()
      .from(whatsAppContacts)
      .where(whereClause)
      .orderBy(desc(whatsAppContacts.createdAt))
      .limit(limit)
      .offset(offset);

    // Filter by tag in memory if requested
    const filtered = tagFilter
      ? contacts.filter((c) => Array.isArray(c.tags) && c.tags.includes(tagFilter))
      : contacts;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(whatsAppContacts)
      .where(whereClause);

    return NextResponse.json({
      contacts: filtered,
      total: Number(totalRow?.count || 0),
      page,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch contacts" }, { status: 500 });
  }
}

/**
 * POST: Add contact or bulk import
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check if bulk array
    if (Array.isArray(body.contacts)) {
      const results = [];
      for (const item of body.contacts) {
        if (!item.phone) continue;
        try {
          const contact = await upsertWhatsAppContact({
            phone: item.phone,
            displayName: item.name || item.displayName,
            email: item.email,
            source: "CSV_IMPORT",
            tags: item.tags || ["IMPORTED"],
          });
          results.push(contact);
        } catch {
          // ignore individual invalid numbers in batch
        }
      }
      return NextResponse.json({ success: true, count: results.length });
    }

    // Single contact
    const { phone, displayName, email, tags, preferredLanguage } = body;
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const contact = await upsertWhatsAppContact({
      phone,
      displayName,
      email,
      source: "ADMIN_ADD",
      tags: tags || ["MANUAL_ADD"],
    });

    if (preferredLanguage) {
      await db
        .update(whatsAppContacts)
        .set({ preferredLanguage })
        .where(eq(whatsAppContacts.id, contact.id));
    }

    return NextResponse.json({ success: true, contact });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to add contact" }, { status: 500 });
  }
}

/**
 * PATCH: Update tags, preferred language, or opt-in status
 */
export async function PATCH(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, tags, preferredLanguage, optInStatus } = body;

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    const updates: Partial<typeof whatsAppContacts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (tags !== undefined) updates.tags = tags;
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
    if (optInStatus !== undefined) {
      updates.optInStatus = Boolean(optInStatus);
      if (!optInStatus) {
        updates.optOutAt = new Date();
      } else {
        updates.optOutAt = null;
      }
    }

    const [updated] = await db
      .update(whatsAppContacts)
      .set(updates)
      .where(eq(whatsAppContacts.id, Number(id)))
      .returning();

    // Log consent change if opt-in changed
    if (optInStatus !== undefined) {
      await db.insert(whatsAppConsents).values({
        contactId: Number(id),
        purpose: "ALL",
        status: optInStatus ? "GRANTED" : "REVOKED",
        source: "ADMIN_UPDATE",
        evidenceReference: `Admin: ${session.user.displayName}`,
      });
    }

    return NextResponse.json({ success: true, contact: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update contact" }, { status: 500 });
  }
}
