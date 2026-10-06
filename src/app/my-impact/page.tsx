import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Verify Donation Receipt & Impact Tracking · Janaseva Ashrama",
  description:
    "Look up your official 80G tax receipt and verified impact certificate using your unique contribution reference ID.",
  alternates: {
    canonical: `${SITE.url}/my-impact`,
  },
};

export default async function MyImpactPage({ searchParams }: { searchParams: Promise<{ publicId?: string }> }) {
  const sp = await searchParams;
  if (sp.publicId) redirect(`/receipt/${encodeURIComponent(sp.publicId)}`);
  return (
    <>
      <Breadcrumbs items={[{ label: "My Impact Tracking" }]} />
      <Section tone="cream">
        <Container className="max-w-xl">
          <form action="/my-impact" className="rounded-3xl bg-white p-6 ring-1 ring-teal-900/10">
            <label className="text-sm font-semibold text-teal-900" htmlFor="reference">
              Receipt / public reference
            </label>
            <input
              id="reference"
              name="publicId"
              required
              placeholder="Enter your reference"
              className="mt-2 w-full rounded-2xl border border-teal-900/10 px-4 py-3"
            />
            <button className="mt-4 rounded-xl bg-saffron px-6 py-3 text-sm font-bold text-white hover:bg-saffron-dark transition">
              View my impact
            </button>
            <p className="mt-3 text-xs text-teal-950/55">
              For security, the receipt page remains the source of truth for a verified contribution.
            </p>
          </form>
        </Container>
      </Section>
    </>
  );
}
