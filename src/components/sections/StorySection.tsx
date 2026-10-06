import { Container, Head, Section } from "../ui";

const PENDING = "To be added by the Ashrama team";

export function StorySection() {
  return (
    <Section id="story" tone="white">
      <Container>
        <Head
          eyebrow="Our story"
          title="Why Janaseva exists"
          lead="Every child deserves to feel safe, seen and hopeful. Janaseva is built around that simple promise - a home where care is lived daily."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-teal-900 p-6 text-white">
            <h3 className="font-display text-2xl font-bold text-gold">Mission</h3>
            <p className="mt-2 leading-relaxed text-white/85">
              To give every child in our care a safe home, nutritious food, quality education, healthcare and the chance to grow with dignity.
            </p>
          </div>
          <div className="rounded-3xl bg-saffron/15 p-6">
            <h3 className="font-display text-2xl font-bold text-saffron-dark">Vision</h3>
            <p className="mt-2 leading-relaxed text-teal-950/80">
              A community that shows up together - so that today&apos;s home grows into a future campus where every child can thrive.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              t: "Our Journey",
              d: "Founded with the conviction that every child deserves unconditional safety, nutritious food, and an unshakeable foundation for life.",
              tag: "Rooted in Service",
            },
            {
              t: "Everyday Care",
              d: "Daily wholesome meals, quality schooling materials, pediatric healthcare, and loving residential guidance provided round the clock.",
              tag: "Active Daily Support",
            },
            {
              t: "Our Community",
              d: "Dedicated resident caregivers, trustees, and volunteer mentors from across Karnataka who stand united with the children.",
              tag: "Trustee Governance",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl border border-teal-800/15 bg-cream p-5 shadow-sm">
              <h3 className="font-display text-xl font-bold text-teal-900">{c.t}</h3>
              <p className="mt-1.5 text-sm text-teal-950/70 leading-relaxed">{c.d}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-saffron-dark">{c.tag}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
