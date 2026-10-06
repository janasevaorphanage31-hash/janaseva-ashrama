import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { CorporateFormClient } from "@/components/CorporateFormClient";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corporate & CSR Partnerships · Janaseva Ashrama Bangalore",
  description:
    "CSR partnerships, employee volunteering days, payroll giving, and verified impact reporting with Janaseva Ashrama. Form 10AC 80G tax benefit.",
  alternates: {
    canonical: `${SITE.url}/corporate`,
  },
};

export default function CorporatePage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Corporate & CSR" }]} />
      <PageHero
        eyebrow="Corporate impact"
        title="Bring your team. Build something measurable."
        lead="CSR can be a project, a volunteering day, a team campaign or a combination. Tell us what your organisation wants to make possible."
      />
      <Section tone="cream">
        <Container className="max-w-4xl">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["CSR projects", "Sponsor a defined programme or approved project."],
              ["Employee volunteering", "Create a volunteering day around teaching, skills, events or approved media work."],
              ["Team Impact", "Set a shared goal and let employees contribute through one campaign."],
              ["Impact reporting", "Receive reporting based on verified platform and project records."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl bg-white p-6 ring-1 ring-teal-900/10">
                <h2 className="font-display text-2xl font-bold text-teal-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-teal-950/70">{body}</p>
              </div>
            ))}
          </div>

          <CorporateFormClient />
        </Container>
      </Section>
    </>
  );
}
