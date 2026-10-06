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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCampaign(slug);
  if (!c || c.status !== "approved") return { title: "Campaign", robots: { index: false } };
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

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCampaign(slug);
  if (!c) notFound();

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
          <div className="mb-2 flex gap-2"><Chip tone="gold">{c.occasion}</Chip>{c.isSample && <Chip tone="plain">Example</Chip>}</div>
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
