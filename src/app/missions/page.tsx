import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, Container } from "@/components/ui";
import { getMissions } from "@/lib/content";
import { formatINR } from "@/lib/site";

export const metadata: Metadata = { title: "Impact Missions" };

export default async function MissionsPage() {
  const missions = await getMissions();
  return (
    <>
      <PageHero eyebrow="Impact Missions" title="Join a mission" lead="Support shared goals like meal and education challenges with verified progress." />
      <Section tone="cream">
        <Container>
          {missions.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-teal-900/70">No active missions yet.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {missions.map((m) => {
                const pct = m.targetAmount ? Math.min(100, Math.round((m.raised / m.targetAmount) * 100)) : null;
                return (
                  <li key={m.id} className="rounded-3xl bg-white p-5 ring-1 ring-teal-900/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-saffron-dark">{m.status}</p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-teal-900">{m.title}</h2>
                    <p className="mt-1 text-sm text-teal-950/70">{m.description}</p>
                    {m.targetAmount && (
                      <>
                        <div className="mt-3 h-2 overflow-hidden rounded-xl bg-teal-100"><div className="h-full bg-saffron" style={{ width: `${pct}%` }} /></div>
                        <p className="mt-1 text-xs text-teal-950/70">{formatINR(m.raised)} of {formatINR(m.targetAmount)} ({pct}%)</p>
                      </>
                    )}
                    {m.targetUnits && <p className="mt-1 text-xs text-teal-950/70">Target: {m.targetUnits} {m.unitLabel || "units"}</p>}
                    <p className="mt-1 text-xs text-teal-950/70">Verified supporters: {m.supporters}</p>
                    <Link href={`/impact?mission=${m.slug}`} className="focus-ring mt-3 inline-block rounded-xl bg-teal-800 px-5 py-2 text-sm font-bold text-white">Support mission</Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
