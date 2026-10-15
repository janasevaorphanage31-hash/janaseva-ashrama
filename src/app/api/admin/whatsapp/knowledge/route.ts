import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { db } from "@/db";
import { whatsAppKnowledgeDocuments } from "@/db/schema";
import { VERIFIED_ASHRAMA_FACTS } from "@/lib/whatsapp-ai";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let docs = await db
      .select()
      .from(whatsAppKnowledgeDocuments)
      .orderBy(desc(whatsAppKnowledgeDocuments.createdAt));

    // Seed grounded organizational knowledge base if empty
    if (docs.length === 0) {
      const defaultDocs = [
        {
          title: "Legal Registration & Child Welfare Approval",
          content: `Janaseva Ashrama is registered and recognized under the Juvenile Justice (Care and Protection of Children) Act under Form 28 JJ Act Registration No: ${VERIFIED_ASHRAMA_FACTS.legalForm28JJAct}. The ashrama operates in Bengaluru, Karnataka, providing full residential care, nutrition, safety, and schooling for 25 boys.`,
          sourceType: "LEGAL",
          language: "en",
          status: "PUBLISHED",
        },
        {
          title: "80G Income Tax Exemption Status",
          content: `All donations made to Janaseva Ashrama are 50% tax exempt under Section 80G of the Indian Income Tax Act. The official Form 10AC Registration Number is ${VERIFIED_ASHRAMA_FACTS.tax80GForm10AC}. Digital 80G receipts are generated automatically with official trust seal.`,
          sourceType: "LEGAL",
          language: "en",
          status: "PUBLISHED",
        },
        {
          title: "Annadana & Daily Meals Seva Tiers",
          content: `Full Day Meals for 25 boys costs ₹4,500. This covers hot South Indian breakfast, afternoon banana-leaf lunch with rice/sambar/rasam/vegetable curry, evening hot milk & nutritious snacks, and wholesome dinner. Monthly grocery provisions cost ₹6,000.`,
          sourceType: "SEVA_CATALOG",
          language: "en",
          status: "PUBLISHED",
        },
        {
          title: "Birthday & Special Day Seva Celebrations",
          content: `Donors can celebrate their birthdays, anniversaries, or parents' memorial days by sponsoring a special feast for ₹5,000. Donors can visit the campus to serve the boys in person or receive verified video wish proofs recorded directly with the resident boys.`,
          sourceType: "SEVA_CATALOG",
          language: "en",
          status: "PUBLISHED",
        },
        {
          title: "Campus Visiting Hours & Contact Information",
          content: `Janaseva Ashrama is located in Bengaluru, Karnataka. Visiting hours are 9:00 AM to 6:30 PM daily. Prior appointment is recommended for meal serving. Phone: ${VERIFIED_ASHRAMA_FACTS.phone}. Email: ${VERIFIED_ASHRAMA_FACTS.email}. Website: ${VERIFIED_ASHRAMA_FACTS.websiteUrl}.`,
          sourceType: "VISITING_HOURS",
          language: "en",
          status: "PUBLISHED",
        },
      ];

      for (const d of defaultDocs) {
        await db.insert(whatsAppKnowledgeDocuments).values(d);
      }

      docs = await db
        .select()
        .from(whatsAppKnowledgeDocuments)
        .orderBy(desc(whatsAppKnowledgeDocuments.createdAt));
    }

    return NextResponse.json({ documents: docs });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch knowledge base" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, content, sourceType, language, status } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    if (id) {
      const [updated] = await db
        .update(whatsAppKnowledgeDocuments)
        .set({
          title,
          content,
          sourceType: sourceType || "FAQ",
          language: language || "en",
          status: status || "PUBLISHED",
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(whatsAppKnowledgeDocuments.id, Number(id)))
        .returning();

      return NextResponse.json({ success: true, document: updated });
    }

    const [created] = await db
      .insert(whatsAppKnowledgeDocuments)
      .values({
        title,
        content,
        sourceType: sourceType || "FAQ",
        language: language || "en",
        status: status || "PUBLISHED",
        updatedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ success: true, document: created });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save document" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "", 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    await db
      .delete(whatsAppKnowledgeDocuments)
      .where(eq(whatsAppKnowledgeDocuments.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete document" }, { status: 500 });
  }
}
