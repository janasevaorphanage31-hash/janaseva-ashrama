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

          {/* Collective Impact & Transparency Guarantees */}
          <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-teal-900/10 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-900/10 pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-teal-900">Collective Care for 25 Resident Boys</h2>
                <p className="mt-1 text-xs text-teal-950/65">
                  100% direct allocation model. We honor donor privacy and celebrate collective participation without competitive rankings.
                </p>
              </div>
              <Link
                href="/impact"
                className="rounded-xl bg-saffron px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-saffron-dark transition"
              >
                Sponsor a Need 💝
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
                <span className="text-2xl mb-2 block">🍲</span>
                <p className="text-sm font-bold text-teal-900">4 Wholesome Meals Daily</p>
                <p className="mt-1 text-xs text-teal-950/65">
                  Fresh milk, breakfast, balanced festival lunch, evening snacks, and warm dinner prepared fresh on campus.
                </p>
              </div>

              <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
                <span className="text-2xl mb-2 block">📚</span>
                <p className="text-sm font-bold text-teal-900">100% School Enrollment</p>
                <p className="mt-1 text-xs text-teal-950/65">
                  Full tuition, textbooks, uniforms, daily homework coaching, and Spoken English mentorship for all 25 boys.
                </p>
              </div>

              <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
                <span className="text-2xl mb-2 block">🩺</span>
                <p className="text-sm font-bold text-teal-900">Arogya &amp; Healthcare</p>
                <p className="mt-1 text-xs text-teal-950/65">
                  Bi-monthly doctor checkups, essential medicines, clean drinking water, and safe hygienic dormitory living.
                </p>
              </div>

              <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
                <span className="text-2xl mb-2 block">📜</span>
                <p className="text-sm font-bold text-teal-900">100% Tax Deductible (80G)</p>
                <p className="mt-1 text-xs text-teal-950/65">
                  Every verified contribution receives an instant Form 10AC tax exemption certificate download.
                </p>
              </div>
            </div>
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
