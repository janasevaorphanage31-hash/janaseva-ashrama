import type { Metadata } from "next";
import { VolunteerForm } from "@/components/forms";
import { Container, PageHero, Section } from "@/components/ui";
import { InvolvedSection } from "@/components/sections/InvolvedSection";
import { INTERESTS } from "@/lib/site";

export const metadata: Metadata = { title: "Get Involved" };

export default async function GetInvolvedPage({ searchParams }: { searchParams: Promise<{ interest?: string }> }) {
  const { interest } = await searchParams;
  const options = INTERESTS.map((i) => ({ key: i.key, t: i.t }));
  const initial = options.some((o) => o.key === interest) ? (interest as string) : options[0].key;

  return (
    <>
      <PageHero eyebrow="Get involved" title="Give time, skill or partnership" lead="Money is one way to help. There are many others." />
      <InvolvedSection standalone />
      <Section id="join" tone="cream">
        <Container className="max-w-xl">
          <h2 className="mb-4 font-display text-3xl font-bold text-teal-900">Tell us how you would like to help</h2>
          <VolunteerForm interests={options} initial={initial} />
        </Container>
      </Section>
    </>
  );
}
