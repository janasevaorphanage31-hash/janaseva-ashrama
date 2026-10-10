import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets, mediaConsents } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, publicToken, rateLimit, slugify } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CONTENT_ADMIN", "MEDIA_REVIEWER"] as const;
const MEDIA_STATUSES = new Set(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "TAKEDOWN", "EXPIRED"]);
const CONSENT_STATUSES = new Set(["PENDING", "CONSENTED", "RESTRICTED", "REVOKED"]);

export async function GET() {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rows = await db
    .select({
      id: mediaAssets.id,
      key: mediaAssets.key,
      kind: mediaAssets.kind,
      publicUrl: mediaAssets.publicUrl,
      posterUrl: mediaAssets.posterUrl,
      altText: mediaAssets.altText,
      caption: mediaAssets.caption,
      credit: mediaAssets.credit,
      status: mediaAssets.status,
      reviewedBy: mediaAssets.reviewedBy,
      reviewedAt: mediaAssets.reviewedAt,
      expiresAt: mediaAssets.expiresAt,
      createdAt: mediaAssets.createdAt,
      consentStatus: mediaConsents.status,
      restrictions: mediaConsents.restrictions,
      consentedAt: mediaConsents.consentedAt,
      consentExpiresAt: mediaConsents.expiresAt,
    })
    .from(mediaAssets)
    .leftJoin(mediaConsents, eq(mediaConsents.mediaId, mediaAssets.id))
    .orderBy(desc(mediaAssets.createdAt))
    .limit(100);

  return NextResponse.json({ media: rows });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!rateLimit(`admin-media:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);
  const kind = clean(b?.kind, 20) || "image";
  const publicUrl = clean(b?.publicUrl, 1000);
  const posterUrl = clean(b?.posterUrl, 1000);
  const altText = clean(b?.altText, 500);
  const caption = clean(b?.caption, 1000);
  const credit = clean(b?.credit, 200);
  const restrictions = clean(b?.restrictions, 1000);
  const consentStatus = clean(b?.consentStatus, 20) || "PENDING";
  const initialStatus = consentStatus === "CONSENTED" ? "REVIEW" : "DRAFT";

  if (!publicUrl || !altText) {
    return NextResponse.json({ error: "Public URL and descriptive alt text are required." }, { status: 400 });
  }

  if (!CONSENT_STATUSES.has(consentStatus)) {
    return NextResponse.json({ error: "Invalid consent status." }, { status: 400 });
  }

  const key = `media-${slugify(altText.slice(0, 30))}-${publicToken().slice(0, 6)}`;

  const [asset] = await db
    .insert(mediaAssets)
    .values({
      key,
      kind,
      publicUrl,
      posterUrl: posterUrl || null,
      altText,
      caption: caption || null,
      credit: credit || null,
      status: "PUBLISHED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    })
    .returning();

  await db.insert(mediaConsents).values({
    mediaId: asset.id,
    status: consentStatus,
    reviewerId: session.user.id,
    restrictions: restrictions || null,
    consentedAt: consentStatus === "CONSENTED" ? new Date() : null,
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/content");
  } catch {}

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "create",
    entity: "media_asset",
    entityId: asset.id,
    afterState: { asset, consentStatus, restrictions },
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, asset });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid media id." }, { status: 400 });

  const [before] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });

  const patch: Partial<typeof mediaAssets.$inferInsert> = {};
  if (b?.status !== undefined) {
    const s = clean(b.status, 20);
    if (!MEDIA_STATUSES.has(s)) return NextResponse.json({ error: "Invalid media status." }, { status: 400 });
    patch.status = s;
    patch.reviewedBy = session.user.id;
    patch.reviewedAt = new Date();
  }
  if (b?.altText !== undefined) patch.altText = clean(b.altText, 500);
  if (b?.caption !== undefined) patch.caption = clean(b.caption, 1000) || null;
  if (b?.credit !== undefined) patch.credit = clean(b.credit, 200) || null;

  if (Object.keys(patch).length > 0) {
    await db.update(mediaAssets).set(patch).where(eq(mediaAssets.id, id));
  }

  // Handle consent status update
  if (b?.consentStatus !== undefined) {
    const cStatus = clean(b.consentStatus, 20);
    if (!CONSENT_STATUSES.has(cStatus)) {
      return NextResponse.json({ error: "Invalid consent status." }, { status: 400 });
    }
    const [existingConsent] = await db
      .select()
      .from(mediaConsents)
      .where(eq(mediaConsents.mediaId, id))
      .limit(1);

    if (existingConsent) {
      await db
        .update(mediaConsents)
        .set({
          status: cStatus,
          reviewerId: session.user.id,
          restrictions: b?.restrictions !== undefined ? clean(b.restrictions, 1000) : existingConsent.restrictions,
          consentedAt: cStatus === "CONSENTED" ? (existingConsent.consentedAt || new Date()) : existingConsent.consentedAt,
        })
        .where(eq(mediaConsents.id, existingConsent.id));
    } else {
      await db.insert(mediaConsents).values({
        mediaId: id,
        status: cStatus,
        reviewerId: session.user.id,
        restrictions: clean(b?.restrictions, 1000) || null,
        consentedAt: cStatus === "CONSENTED" ? new Date() : null,
      });
    }

    // Safeguarding rule: if consent revoked or restricted, immediately take down or restrict media
    if (cStatus === "REVOKED") {
      await db.update(mediaAssets).set({ status: "TAKEDOWN" }).where(eq(mediaAssets.id, id));
    }
  }

  const [after] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: patch.status === "TAKEDOWN" ? "safeguarding_takedown" : "update",
    entity: "media_asset",
    entityId: id,
    beforeState: before,
    afterState: after,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, asset: after });
}
