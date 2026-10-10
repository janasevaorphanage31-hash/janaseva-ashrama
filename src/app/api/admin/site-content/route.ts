import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { getSiteContentMap, saveSiteContentMap, type SiteContentMap } from "@/lib/site-content";

const CONTENT_ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CONTENT_ADMIN"] as const;

export async function GET() {
  const session = await requireAdminApi([...CONTENT_ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const content = await getSiteContentMap();
  return NextResponse.json({ content });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...CONTENT_ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<SiteContentMap> | null;
  if (!body) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const ok = await saveSiteContentMap(body);
  if (!ok) return NextResponse.json({ error: "Failed to save content." }, { status: 500 });

  // Revalidate Next.js cache so live website updates immediately
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/celebrate-birthday");
  revalidatePath("/admin/content");

  const updated = await getSiteContentMap();
  return NextResponse.json({ ok: true, content: updated });
}

export async function PATCH(req: Request) {
  return POST(req);
}
