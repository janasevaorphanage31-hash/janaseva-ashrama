import { NextResponse } from "next/server";
import { generateWhatsAppLink } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { db } from "@/db";
import { agLeads } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AntiBanLanguage, OutreachAngle } from "@/lib/whatsapp-antiban";

export const dynamic = "force-dynamic";

async function handleLinkGeneration(
  req: Request,
  leadIdParam: string,
  options?: {
    language?: AntiBanLanguage;
    angle?: OutreachAngle;
    mediaId?: string;
    senderMode?: "central" | "individual";
    amount?: number;
  }
) {
  const auth = await authenticateCallerOrAdmin(req);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to your telecaller portal." },
      { status: 401 }
    );
  }

  const leadId = parseInt(leadIdParam, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead ID." }, { status: 400 });
  }

  // Row-level security: Verify lead exists and belongs to caller (or admin)
  const [lead] = await db
    .select({
      leadId: agLeads.leadId,
      assignedCallerId: agLeads.assignedCallerId,
    })
    .from(agLeads)
    .where(eq(agLeads.leadId, leadId))
    .limit(1);

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  if (!auth.isAdmin && lead.assignedCallerId !== auth.callerId) {
    return NextResponse.json(
      { error: "Access denied. This lead is assigned to another telecaller." },
      { status: 403 }
    );
  }

  let host = req.headers.get("host") || "www.janasevaorphanage.org";
  if (host === "janasevaorphanage.org") host = "www.janasevaorphanage.org";
  if (host === "janasevaashrama.org") host = "www.janasevaashrama.org";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const result = await generateWhatsAppLink(
    leadId,
    auth.callerId,
    baseUrl,
    options
  );

  return NextResponse.json({
    success: true,
    ...result,
    callerId: auth.callerId,
    isAdmin: auth.isAdmin,
  });
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const language = (searchParams.get("language") || undefined) as AntiBanLanguage | undefined;
    const angle = (searchParams.get("angle") || undefined) as OutreachAngle | undefined;
    const mediaId = searchParams.get("mediaId") || undefined;
    const senderMode = (searchParams.get("senderMode") || undefined) as "central" | "individual" | undefined;
    const amountStr = searchParams.get("amount");
    const amount = amountStr ? Number(amountStr) : undefined;

    return await handleLinkGeneration(req, id, {
      language,
      angle,
      mediaId,
      senderMode,
      amount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { language, angle, mediaId, senderMode, amount } = body;

    return await handleLinkGeneration(req, id, {
      language,
      angle,
      mediaId,
      senderMode,
      amount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
