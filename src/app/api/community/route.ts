import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, ensureDbSchema } from "@/db";
import { communityMembers, volunteerApplications, creatorProfiles, companies } from "@/db/schema";
import { clean, clientIp, isEmail, isPhone, normalizePhone, rateLimit, slugify } from "@/lib/server-utils";
import { NAME_REGEX } from "@/lib/validation";
import { requireAdminApi } from "@/lib/admin-auth";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const VALID_ROLES = new Set(["VOLUNTEER", "INFLUENCER", "COMPANY_CSR", "WHATSAPP_AMBASSADOR"]);

export async function POST(req: Request) {
  try {
    if (!rateLimit(`comm_join:${clientIp(req)}`, 10, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
    }

    await ensureDbSchema();

    const b = await req.json().catch(() => null);
    if (!b) return NextResponse.json({ error: "Invalid submission payload." }, { status: 400 });

    const role = (clean(b?.role, 32) || "VOLUNTEER").toUpperCase();
    const name = clean(b?.name, 120);
    const email = clean(b?.email, 200)?.toLowerCase();
    const phoneRaw = clean(b?.phone, 24);
    const phone = normalizePhone(phoneRaw);
    const city = clean(b?.city, 80);
    const handleOrOrg = clean(b?.handleOrOrg, 150);
    const reach = clean(b?.reach, 80);
    const skills = clean(b?.skills, 300);
    const message = clean(b?.message, 1000);
    const whatsappOptIn = b?.whatsappOptIn !== false;

    if (!VALID_ROLES.has(role)) {
      return NextResponse.json({ error: "Please select a valid community role." }, { status: 400 });
    }

    if (!name || name.length < 2 || !NAME_REGEX.test(name)) {
      return NextResponse.json(
        { error: "Please enter a valid full name (letters only, minimum 2 characters)." },
        { status: 400 },
      );
    }

    if (!email || !isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!phone || !isPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid WhatsApp mobile number (10-15 digits)." },
        { status: 400 },
      );
    }

    // Insert into communityMembers
    const [member] = await db
      .insert(communityMembers)
      .values({
        role,
        name,
        email,
        phone,
        city: city || null,
        handleOrOrg: handleOrOrg || null,
        reach: reach || null,
        skills: skills || null,
        message: message || null,
        whatsappOptIn,
        status: "NEW",
      })
      .returning();

    // Cross-link with legacy pipeline tables for deep CRM integration
    if (role === "VOLUNTEER") {
      await db
        .insert(volunteerApplications)
        .values({
          name,
          email,
          phone,
          skills: skills || null,
          availability: reach || null,
          interestArea: skills || "Teaching",
          message: message || null,
          consent: true,
          status: "NEW",
        })
        .catch(() => {});
    } else if (role === "INFLUENCER") {
      const slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
      await db
        .insert(creatorProfiles)
        .values({
          displayName: name,
          slug,
          bio: message || `Content Creator (${handleOrOrg || "Social Media"})`,
          socialLinks: { handle: handleOrOrg, reach, email, phone },
          status: "PENDING",
        })
        .catch(() => {});
    } else if (role === "COMPANY_CSR") {
      const orgName = handleOrOrg || name;
      const slug = `${slugify(orgName)}-${Date.now().toString(36).slice(-5)}`;
      await db
        .insert(companies)
        .values({
          name: orgName,
          slug,
          contactPerson: name,
          email,
          phone,
          csrInterest: [skills, message].filter(Boolean).join(" - ") || "Corporate CSR & Employee Volunteering",
          status: "PENDING",
        })
        .catch(() => {});
    }

    // Build personalized WhatsApp invite message
    let prefilledText = "";
    if (role === "VOLUNTEER") {
      prefilledText = `Namaste Janaseva Ashrama! My name is ${name}. I just registered as a Volunteer (${skills || "Teaching & Weekend Seva"}). Please add me to the official Sevak WhatsApp Group!`;
    } else if (role === "INFLUENCER") {
      prefilledText = `Namaste Janaseva Ashrama! I am ${name} (${handleOrOrg || "Content Creator"}). I registered to collaborate and visit the Bangalore campus to create reels & stories for the children!`;
    } else if (role === "COMPANY_CSR") {
      prefilledText = `Namaste Janaseva Ashrama! I represent ${handleOrOrg || name}. We would like to partner with Janaseva Ashrama for Corporate CSR & employee engagement.`;
    } else {
      prefilledText = `Namaste Janaseva Ashrama! My name is ${name}. I would like to join the WhatsApp Community Network to receive ashrama updates and urgent needs!`;
    }

    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(prefilledText)}`;

    return NextResponse.json({
      ok: true,
      id: member.id,
      role: member.role,
      name: member.name,
      whatsappUrl,
      message: "Thank you for joining our community! Tap below to connect directly on WhatsApp.",
    });
  } catch (err: any) {
    console.error("Community join error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to submit community registration. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "CSR_ADMIN", "PARTNER_ADMIN"]);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbSchema();

    const url = new URL(req.url);
    const role = url.searchParams.get("role")?.toUpperCase();
    const q = url.searchParams.get("q")?.trim();

    const conditions: any[] = [];
    if (role && VALID_ROLES.has(role)) {
      conditions.push(eq(communityMembers.role, role));
    }
    if (q) {
      conditions.push(
        or(
          ilike(communityMembers.name, `%${q}%`),
          ilike(communityMembers.email, `%${q}%`),
          ilike(communityMembers.phone, `%${q}%`),
          ilike(communityMembers.city, `%${q}%`),
          ilike(communityMembers.handleOrOrg, `%${q}%`),
        ),
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const rows = await db
      .select()
      .from(communityMembers)
      .where(whereClause)
      .orderBy(desc(communityMembers.createdAt))
      .limit(100);

    return NextResponse.json({ members: rows });
  } catch (err: any) {
    console.error("Community members fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "CSR_ADMIN", "PARTNER_ADMIN"]);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbSchema();
    const b = await req.json().catch(() => null);
    if (!b || !b.id) return NextResponse.json({ error: "Member ID is required." }, { status: 400 });

    const numId = Number(b.id);
    if (!numId || Number.isNaN(numId)) {
      return NextResponse.json({ error: "Valid Member ID is required." }, { status: 400 });
    }
    const status = clean(b.status, 32)?.toUpperCase();
    const adminNotes = clean(b.adminNotes, 500);

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    const [updated] = await db
      .update(communityMembers)
      .set(updates)
      .where(eq(communityMembers.id, numId))
      .returning();

    return NextResponse.json({ ok: true, member: updated });
  } catch (err: any) {
    console.error("Community member patch error:", err);
    return NextResponse.json({ error: err?.message || "Failed to update member" }, { status: 500 });
  }
}

