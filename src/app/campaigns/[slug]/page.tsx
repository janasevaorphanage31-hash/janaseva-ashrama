import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { ShareButtons } from "@/components/ShareButtons";
import { Track } from "@/components/Track";
import { Chip, Container, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getCampaign } from "@/lib/content";
import { formatINR, SITE } from "@/lib/site";
import { db } from "@/db";
import { influencerProfiles, agDonations } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCampaign(slug);
  if (c && c.status === "approved") {
    return {
      title: `${c.title} · Janaseva Ashrama Campaigns`,
      description: c.story.slice(0, 150),
      alternates: {
        canonical: `${SITE.url}/campaigns/${c.slug}`,
      },
      openGraph: {
        title: c.title,
        description: c.story.slice(0, 150),
        images: c.coverImage ? [c.coverImage] : [],
      },
    };
  }

  // Check influencer profile
  const [inf] = await db
    .select()
    .from(influencerProfiles)
    .where(eq(influencerProfiles.influencerCode, slug.toUpperCase()))
    .limit(1);

  if (inf) {
    const title = `${inf.displayName} × Janaseva Ashrama Fundraiser`;
    const description = `Support 25 resident boys with ${inf.displayName} (${inf.instagramHandle || "@creator"}). 100% Tax Deductible (80G Form 10AC).`;
    return {
      title,
      description,
      alternates: {
        canonical: `${SITE.url}/campaigns/${slug}`,
      },
      openGraph: {
        title,
        description,
        images: inf.coverImageUrl ? [inf.coverImageUrl] : [`${SITE.url}/og-image.jpg`],
      },
    };
  }

  return { title: "Campaign", robots: { index: false } };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCampaign(slug);

  if (!c) {
    // Check if it's an influencer profile
    const [inf] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.influencerCode, slug.toUpperCase()))
      .limit(1);

    if (!inf) notFound();

    // Query live donation stats for this influencer
    const [stats] = await db
      .select({
        totalAmount: sql<number>`coalesce(sum(${agDonations.amount}), 0)`,
        totalDonors: sql<number>`count(*)`,
      })
      .from(agDonations)
      .where(eq(agDonations.callerRefId, inf.influencerCode));

    const totalRaised = Number(stats?.totalAmount || 0);
    const totalDonors = Number(stats?.totalDonors || 0);
    const goal = inf.targetGoalAmount || 50000;
    const pct = Math.min(100, Math.round((totalRaised / goal) * 100));
    const mealsCount = Math.round(totalRaised / 50);

    // Recent donors ticker
    const recentDonors = await db
      .select({
        name: agDonations.donorName,
        amount: agDonations.amount,
        createdAt: agDonations.createdAt,
      })
      .from(agDonations)
      .where(eq(agDonations.callerRefId, inf.influencerCode))
      .orderBy(desc(agDonations.createdAt))
      .limit(5);

    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "https";
    const campaignUrl = `${proto}://${host}/campaigns/${slug}`;
    const giveUrl = `/give?ref=${inf.influencerCode}`;
    const qr = await QRCode.toDataURL(campaignUrl, { margin: 1, width: 240, color: { dark: "#0a403d", light: "#ffffff" } });

    return (
      <main className="min-h-screen bg-cream">
        <Breadcrumbs items={[{ label: "Campaigns", href: "/campaigns" }, { label: `${inf.displayName} Fundraiser` }]} />
        <Track event="influencer_campaign_view" meta={{ influencerCode: inf.influencerCode }} />

        {/* Hero Banner */}
        <div className="relative bg-teal-950 py-12 md:py-16 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 opacity-95" />
          <Container className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/40 px-3.5 py-1 text-xs font-black uppercase text-amber-300">
              <span>📸 Verified Instagram Creator Partner</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
              {inf.displayName} × Janaseva Ashrama
            </h1>
            <p className="text-sm sm:text-base text-teal-100/80 max-w-xl mx-auto leading-relaxed">
              {inf.campaignStory ||
                `Join ${inf.displayName} (${inf.instagramHandle || "@creator"}) in feeding and educating 25 orphaned boys living at Janaseva Ashrama in Bengaluru.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-amber-200">
              <span className="flex items-center gap-1 font-semibold">✓ 100% Tax Exemption (80G Form 10AC)</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold">✓ Instant WhatsApp Receipt</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold">✓ Zero Middlemen</span>
            </div>
          </Container>
        </div>

        {/* Main Content & Giving Thermometer */}
        <Section tone="cream" className="!py-8 md:!py-12">
          <Container className="max-w-4xl mx-auto grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left Story & Impact Units */}
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-teal-900/10 space-y-4">
                <h2 className="font-display text-2xl font-bold text-teal-950">Why We Are Raising Funds</h2>
                <p className="text-sm leading-relaxed text-teal-950/80">
                  Janaseva Ashrama is home to 25 resident boys who rely on daily meals, schooling, shelter, and medical care. Every rupee raised directly funds wholesome nutritious meals, milk, school kits, and festival celebrations.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                  <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200/60 text-center">
                    <span className="text-2xl block mb-1">🍲</span>
                    <span className="font-display font-black text-amber-900 text-lg block">{mealsCount.toLocaleString()}</span>
                    <span className="text-[11px] text-amber-950/70 font-bold block">Meals Sponsored</span>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200/60 text-center">
                    <span className="text-2xl block mb-1">👦</span>
                    <span className="font-display font-black text-emerald-900 text-lg block">25 Boys</span>
                    <span className="text-[11px] text-emerald-950/70 font-bold block">Resident Beneficiaries</span>
                  </div>
                  <div className="rounded-2xl bg-sky-50 p-4 border border-sky-200/60 text-center col-span-2 sm:col-span-1">
                    <span className="text-2xl block mb-1">👥</span>
                    <span className="font-display font-black text-sky-900 text-lg block">{totalDonors}</span>
                    <span className="text-[11px] text-sky-950/70 font-bold block">Community Donors</span>
                  </div>
                </div>
              </div>

              {/* Recent Supporters */}
              {recentDonors.length > 0 && (
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-teal-900/10 space-y-3">
                  <h3 className="font-display text-base font-bold text-teal-950 flex items-center gap-2">
                    <span>❤️ Recent Supporters via {inf.displayName}</span>
                  </h3>
                  <div className="divide-y divide-teal-900/5 text-xs">
                    {recentDonors.map((d, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-teal-950">{d.name || "Generous Patron"}</p>
                          <p className="text-[10px] text-teal-950/50">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "Recently"}
                          </p>
                        </div>
                        <span className="font-display font-black text-emerald-800 text-sm">
                          {formatINR(d.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-teal-900/10 space-y-3">
                <h3 className="font-display text-base font-bold text-teal-950">Share with Friends &amp; Followers</h3>
                <ShareButtons kind="campaign" url={campaignUrl} text={`Support 25 boys with ${inf.displayName} at Janaseva Ashrama!`} />
              </div>
            </div>

            {/* Right Sticky Giving Thermometer & Action Box */}
            <aside className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm border border-teal-900/10 lg:sticky lg:top-20">
              <div>
                <p className="text-xs font-bold text-teal-950/60 uppercase tracking-wider">Funds Raised</p>
                <p className="mt-1 font-display text-3xl sm:text-4xl font-black text-emerald-800">
                  {formatINR(totalRaised)}
                </p>
                <p className="text-xs text-teal-950/60 mt-0.5">
                  of {formatINR(goal)} campaign goal ({pct}%)
                </p>

                <div className="mt-3 h-3 overflow-hidden rounded-xl bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs font-semibold text-teal-950/70">{totalDonors} supporter{totalDonors === 1 ? "" : "s"} so far</p>
              </div>

              <Link
                href={giveUrl}
                className="group block w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-4 text-center text-white shadow-lg hover:from-amber-600 hover:to-amber-800 transition transform hover:-translate-y-0.5 border border-amber-400/40"
              >
                <span className="font-extrabold text-base block">💛 DONATE WITH {inf.displayName.toUpperCase()}</span>
                <span className="text-xs text-amber-100 font-medium block mt-1">Start from ₹11 · 1-Tap UPI · Instant 80G Tax Receipt</span>
              </Link>

              <div className="text-center pt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`QR code linking to ${inf.displayName} fundraiser`} width={140} height={140} className="mx-auto rounded-xl ring-1 ring-teal-900/10" />
                <p className="mt-1 text-[11px] text-teal-950/55">Scan to open campaign</p>
              </div>
            </aside>
          </Container>
        </Section>
      </main>
    );
  }

  const approved = c.status === "approved";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const url = `${proto}://${host}/campaigns/${c.slug}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#0a403d", light: "#ffffff" } });
  const pct = Math.min(100, Math.round((c.raised / c.goalAmount) * 100));

  return (
    <>
      <Breadcrumbs items={[{ label: "Campaigns", href: "/campaigns" }, { label: c.title }]} />
      <Track event="campaign_view" meta={{ slug: c.slug }} />
      <div className="relative bg-teal-950">
        {c.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.coverImage} alt={c.title} className="h-64 w-full object-cover opacity-70 md:h-96" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-6 text-white">
          <div className="mb-2 flex gap-2"><Chip tone="gold">{c.occasion}</Chip><Chip tone="gold">Verified Campaign</Chip></div>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">{c.title}</h1>
          <p className="mt-1 text-sm text-white/75">A campaign by {c.organizerName} · {c.campaignType}</p>
        </div>
      </div>

      <Section tone="cream" className="!py-8 md:!py-12">
        <Container className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            {!approved && (
              <p className="mb-4 rounded-2xl bg-saffron/15 p-4 text-sm font-semibold text-saffron-dark">
                Pending review - this campaign is not public yet and cannot receive support until the Ashrama team approves it.
              </p>
            )}
            <h2 className="font-display text-2xl font-bold text-teal-900">The story</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-teal-950/80">{c.story}</p>
            {c.units.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display text-lg font-bold text-teal-900">Impact units so far</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {c.units.map((u) => <li key={u.label} className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-teal-900 ring-1 ring-teal-900/10">{u.label} × {u.qty}</li>)}
                </ul>
              </div>
            )}
            {approved && (
              <div className="mt-8">
                <h3 className="font-display text-lg font-bold text-teal-900">Share this campaign</h3>
                <div className="mt-3"><ShareButtons kind="campaign" url={url} text={`Please support: ${c.title}`} /></div>
              </div>
            )}
          </div>

          <aside className="h-fit space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 lg:sticky lg:top-20">
            <div>
              <p className="font-display text-3xl font-bold text-teal-900">{formatINR(c.raised)}</p>
              <p className="text-sm text-teal-950/60">verified of {formatINR(c.goalAmount)} goal</p>
              <div className="mt-3 h-3 overflow-hidden rounded-xl bg-teal-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Verified progress">
                <div className="h-full rounded-xl bg-saffron" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold text-teal-900">{c.supporters} supporter{c.supporters === 1 ? "" : "s"}</p>
              <p className="mt-1 text-xs text-teal-950/50">Only server-verified payments are counted. Supporter names are never shown.</p>
            </div>
            {approved && (
              <Link href={`/impact?campaign=${c.slug}`} className="focus-ring block rounded-xl bg-saffron px-6 py-3.5 text-center text-sm font-bold tracking-wide text-white shadow-lg hover:bg-saffron-dark">
                SUPPORT THIS CAMPAIGN
              </Link>
            )}
            {approved && (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`QR code linking to ${c.title}`} width={160} height={160} className="mx-auto rounded-xl ring-1 ring-teal-900/10" />
                <p className="mt-1 text-xs text-teal-950/55">Scan to open this campaign</p>
              </div>
            )}
          </aside>
        </Container>
      </Section>
    </>
  );
}
