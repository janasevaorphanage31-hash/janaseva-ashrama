import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
export const metadata: Metadata = {
  title: "Ashrama Campus & Future Facility Plan | Janaseva Ashrama Bangalore",
  description:
    "Explore the Janaseva Ashrama Turahalli, Subramanyapura residential facility and our proposed future campus expansion roadmap for healthcare, learning, and skill development.",
};

import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function CampusPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Campus & Facilities" }]} />
      <PageHero
        eyebrow="Proposed future project"
        title="A future campus we can build together."
        lead="The future campus is a proposal, not an existing facility. Its scope, funding progress and timelines will be updated only from verified project records."
      />
      <Section tone="cream">
        <Container className="max-w-5xl">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Phase 1", "Planning, approvals and foundational work"],
              ["Phase 2", "Construction and essential facilities"],
              ["Phase 3", "Learning, skills, health and community spaces"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-3xl bg-white p-6 ring-1 ring-teal-900/10">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-saffron-dark">{a}</p>
                <h2 className="mt-2 font-display text-xl font-bold text-teal-900">{b}</h2>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-teal-900 p-7 text-white">
            <h2 className="font-display text-2xl font-bold">Build with us</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
              Support for the proposed project must be represented separately from current operational needs. We will publish verified funding progress and project documents as they become available.
            </p>
            <Link href="/corporate" className="mt-5 inline-block rounded-xl bg-saffron px-6 py-3 text-sm font-bold hover:bg-saffron-dark transition">
              Discuss project partnership
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
