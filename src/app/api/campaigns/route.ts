import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { clean, clientIp, isEmail, isPhone, normalizePhone, publicToken, rateLimit, slugify } from "@/lib/server-utils";
import { NAME_REGEX } from "@/lib/validation";

const COVERS = ["/media/garden.jpg", "/media/community.jpg", "/media/food.jpg", "/media/education.jpg", "/media/play.jpg", "/media/volunteers.jpg"];
const OCCASIONS = new Set(["Birthday", "Anniversary", "First Salary", "Graduation", "Achievement", "Festival", "Tribute", "Thank You", "Custom occasion"]);
const CAMPAIGN_TYPES = new Set(["Individual", "Couple", "Family", "Friends", "Company", "Team", "College", "School", "Sports team", "Creator / community"]);

export async function POST(req: Request) {
  if (!rateLimit(`camp:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }
  const b = await req.json().catch(() => null);
  const title = clean(b?.title, 120);
  const occasion = clean(b?.occasion, 40);
  const campaignType = clean(b?.campaignType, 40);
  const story = clean(b?.story, 3000);
  const organizerName = clean(b?.organizerName, 100);
  const organizerEmail = clean(b?.organizerEmail, 200);
  const organizerPhone = normalizePhone(clean(b?.organizerPhone, 24));
  const goal = Math.floor(Number(b?.goalAmount));
  const cover = COVERS.includes(b?.coverImage) ? b.coverImage : COVERS[0];

  if (title.length < 5 || story.length < 20 || !organizerName || organizerName.length < 2 || !NAME_REGEX.test(organizerName) || !isEmail(organizerEmail)) {
    return NextResponse.json({ error: "Please complete valid title, story, organizer name (letters only) and valid email." }, { status: 400 });
  }
  if (!OCCASIONS.has(occasion) || !CAMPAIGN_TYPES.has(campaignType)) {
    return NextResponse.json({ error: "Please choose a valid occasion and campaign type." }, { status: 400 });
  }
  if (!organizerPhone || !isPhone(organizerPhone)) {
    return NextResponse.json({ error: "Please enter a valid phone number (10-15 digits)." }, { status: 400 });
  }
  if (!Number.isFinite(goal) || goal < 500 || goal > 10_000_000) {
    return NextResponse.json({ error: "Goal must be between ₹500 and ₹1,00,00,000." }, { status: 400 });
  }

  const slug = `${slugify(title)}-${publicToken().slice(0, 5)}`;
  await db.insert(campaigns).values({
    slug,
    title,
    occasion,
    campaignType,
    story,
    coverImage: cover,
    organizerName,
    organizerEmail,
    organizerPhone,
    goalAmount: goal,
    status: "pending",
  });
  return NextResponse.json({ ok: true, slug });
}
