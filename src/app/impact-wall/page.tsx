import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, Container } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getImpactWall } from "@/lib/content";
import { formatINR, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Live Impact Wall · Verified Community Impact · Janaseva Ashrama",
  description:
    "A transparent, collective view of verified contributions at Janaseva Ashrama without competitive leaderboards or private donor data.",
  alternates: {
    canonical: `${SITE.url}/impact-wall`,
  },
};

export default async function ImpactWallPage() {
  const wall = await getImpactWall();

  return (
    <>
      <Breadcrumbs items={[{ label: "Impact Wall" }]} />
      <PageHero
        eyebrow="Live Impact Wall"
        title="Our impact together"
        lead="A collective view of verified support. We celebrate community participation without competitive rankings or exposing personal details."
      />
      <Section tone="cream">
        <Container>
          {/* Top Aggregates */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Card t="Verified contributions" v={formatINR(wall.totalAmount)} />
            <Card t="Verified donations" v={wall.donationCount.toLocaleString("en-IN")} />
            <Card t="Today's contributions" v={formatINR(wall.todayAmount)} sub={`${wall.todayDonations} today`} />
            <Card t="Active campaigns" v={wall.campaignCount.toLocaleString("en-IN")} />
            <Card t="Approved volunteers" v={wall.volunteerCount.toLocaleString("en-IN")} />
          </div>

          {/* Latest Verified Supporters */}
          <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-teal-900/10 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-900/10 pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-teal-900">Latest supporters</h2>
                <p className="mt-1 text-xs text-teal-950/65">
                  Real contributions verified on our server. Donors choose whether their name appears or stays anonymous.
                </p>
              </div>
              <Link
                href="/impact"
                className="rounded-xl bg-saffron px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-saffron-dark"
              >
                Make an impact
              </Link>
            </div>

            {wall.latestSupporters.length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {wall.latestSupporters.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl bg-cream/70 p-4 ring-1 ring-teal-900/5"
                  >
                    <div>
                      <p className="text-sm font-bold text-teal-900">{s.displayName}</p>
                      <p className="text-xs text-teal-950/60">
                        {s.paidAt
                          ? new Date(s.paidAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Verified"}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-teal-800">
                      {formatINR(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-center text-sm text-teal-950/60">
                Verified community contributions will be reflected here in real time.
              </p>
            )}
          </div>

          {/* Verified Field Metrics */}
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-teal-900">Verified field metrics</h2>
            <p className="mt-1 text-xs text-teal-950/65">
              Metrics substantiated through operational and financial reports.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {wall.metrics.map((m) => (
                <div key={m.id} className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
                  <p className="font-display text-2xl font-bold text-teal-900">
                    {m.value?.toLocaleString("en-IN") ?? "-"}
                  </p>
                  <p className="text-sm font-semibold text-teal-900">{m.label}</p>
                  <p className="text-xs text-teal-950/60">
                    {m.unit ?? ""}{m.periodLabel ? ` · ${m.periodLabel}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Card({ t, v, sub }: { t: string; v: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10">
      <p className="font-display text-2xl font-bold text-teal-900">{v}</p>
      <p className="text-sm text-teal-950/70">{t}</p>
      {sub && <p className="mt-1 text-xs font-semibold text-saffron-dark">{sub}</p>}
    </div>
  );
}
