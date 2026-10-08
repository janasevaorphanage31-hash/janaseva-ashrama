import Link from "next/link";
import { Chip, Container, Head, Section } from "../ui";

const PHASES = [
  { p: "Phase 1", t: "Planning & land", d: "Site, approvals and design." },
  { p: "Phase 2", t: "Residential & dining", d: "Safe homes, kitchen and care spaces." },
  { p: "Phase 3", t: "Learning & health", d: "Classrooms, library and a health room." },
  { p: "Phase 4", t: "Skills & outdoors", d: "Digital/vocational labs, recreation and gardens." },
];
const FACILITIES = ["Residential care", "Education", "Healthcare", "Digital / vocational skills", "Recreation", "Study / library", "Outdoor activities"];

export function FutureSection({ standalone = false }: { standalone?: boolean }) {
  return (
    <Section id="future" tone="sand">
      <Container>
        <div className="mb-3"><Chip tone="gold">Proposed future project</Chip></div>
        <Head
          eyebrow="Our future"
          title="A proposed campus we hope to build - together"
          lead="This is a concept, not an existing campus. Images are illustrative. Plans, phases and facilities may change as the project is finalised."
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full min-w-0">
          <div className="relative overflow-hidden rounded-3xl bg-teal-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/future-campus.jpg" alt="Concept illustration of the proposed future campus" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <span className="absolute left-3 top-3 rounded-xl bg-teal-950/85 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gold">
              Proposed - concept illustration
            </span>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-teal-900">Proposed facilities</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {FACILITIES.map((f) => (
                <li key={f} className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-teal-900 ring-1 ring-teal-900/10">{f}</li>
              ))}
            </ul>
            <h3 className="mt-6 font-display text-xl font-bold text-teal-900">Proposed phases</h3>
            <ol className="mt-3 space-y-2">
              {PHASES.map((p) => (
                <li key={p.p} className="flex gap-3 rounded-2xl bg-white p-3">
                  <span className="shrink-0 rounded-lg bg-teal-800 px-2 py-1 text-xs font-bold text-white">{p.p}</span>
                  <span className="text-sm"><strong className="text-teal-900">{p.t}</strong> - <span className="text-teal-950/70">{p.d}</span></span>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-2xl bg-white p-4 border border-teal-900/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-900/70">
                  Campus Expansion Vision
                </span>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
                  CSR &amp; Endowment Stage
                </span>
              </div>
              <p className="mt-2 text-xs text-teal-950/75 leading-relaxed">
                Janaseva Ashrama is actively consulting with responsible corporate CSR partners and philanthropic foundations for land acquisition and phase-wise construction of this permanent children&apos;s campus in South Bengaluru.
              </p>
            </div>
            <Link href="/get-involved?interest=csr#join" className="focus-ring mt-5 inline-block rounded-xl bg-teal-800 px-6 py-3 text-sm font-bold text-white hover:bg-teal-900 transition shadow-xs">
              Partner With Us (CSR) →
            </Link>
            {!standalone && <Link href="/future" className="ml-4 text-sm font-semibold text-teal-800 underline">View Full Blueprint</Link>}
          </div>
        </div>
      </Container>
    </Section>
  );
}
