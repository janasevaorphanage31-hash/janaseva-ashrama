import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, slugify } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CAMPAIGN_ADMIN"] as const;
const STATUSES = new Set(["pending", "approved", "rejected", "paused", "archived"]);

export async function GET() {
  if (!(await requireAdminApi([...ROLES]))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  return NextResponse.json({ campaigns: rows });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const b = await req.json().catch(() => null);
  const title = clean(b?.title, 200);
  const occasion = clean(b?.occasion, 100) || "General Seva";
  const campaignType = clean(b?.campaignType, 60) || "annadana";
  const story = clean(b?.story, 10000) || title;
  const goalAmount = Math.max(100, Math.floor(Number(b?.goalAmount) || 10000));
  const coverImage = clean(b?.coverImage, 5000000) || "/media/annadana-hall-hd.jpg";
  const organizerName = clean(b?.organizerName, 120) || session.user.displayName;
  const organizerEmail = clean(b?.organizerEmail, 120) || session.user.email;
  const organizerPhone = clean(b?.organizerPhone, 40) || null;
  const displayName = clean(b?.displayName, 120) || organizerName;
  const status = clean(b?.status, 20) || "approved";

  let slug = slugify(clean(b?.slug, 120) || title);
  if (!slug) slug = "campaign-" + Date.now();

  // Check unique slug
  const [existing] = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const [row] = await db
    .insert(campaigns)
    .values({
      slug,
      title,
      occasion,
      campaignType,
      story,
      goalAmount,
      coverImage,
      organizerName,
      organizerEmail,
      organizerPhone,
      displayName,
      status: STATUSES.has(status) ? status : "approved",
      endDate: b?.endDate ? new Date(b.endDate) : null,
    })
    .returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "create",
    entity: "campaign",
    entityId: row.id,
    afterState: row,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/campaigns");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, campaign: row });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Valid campaign id is required." }, { status: 400 });

  const [before] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  const updates: Record<string, any> = {};
  if (b?.title !== undefined) updates.title = clean(b.title, 200);
  if (b?.occasion !== undefined) updates.occasion = clean(b.occasion, 100);
  if (b?.story !== undefined) updates.story = clean(b.story, 10000);
  if (b?.goalAmount !== undefined) updates.goalAmount = Math.max(100, Math.floor(Number(b.goalAmount) || 0));
  if (b?.status && STATUSES.has(clean(b.status, 20))) updates.status = clean(b.status, 20);
  if (b?.moderationNote !== undefined) updates.moderationNote = clean(b.moderationNote, 2000);
  if (b?.coverImage !== undefined) updates.coverImage = clean(b.coverImage, 5000000);
  if (b?.endDate !== undefined) updates.endDate = b.endDate ? new Date(b.endDate) : null;
  updates.updatedAt = new Date();

  const [row] = await db.update(campaigns).set(updates).where(eq(campaigns.id, id)).returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "moderate",
    entity: "campaign",
    entityId: id,
    beforeState: before,
    afterState: row,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/campaigns");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, campaign: row });
}

export async function DELETE(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(req.url);
  let id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id)) {
    const b = await req.json().catch(() => null);
    id = Number(b?.id);
  }

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Valid campaign id is required." }, { status: 400 });
  }

  const [before] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!before) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  await db.delete(campaigns).where(eq(campaigns.id, id));

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "delete",
    entity: "campaign",
    entityId: id,
    beforeState: before,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/campaigns");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, deletedId: id });
}
