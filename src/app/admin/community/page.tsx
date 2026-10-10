import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db, ensureDbSchema } from "@/db";
import { communityMembers, companies, creatorProfiles, ngoPartners, recurringGivingRequests } from "@/db/schema";
import { requireAdminPage } from "@/lib/admin-auth";
import { Container, PageHero, Section } from "@/components/ui";
import { CommunityAdminClient } from "@/components/admin/CommunityAdminClient";

export const metadata: Metadata = { title: "Community CRM & Volunteers Admin | Janaseva Ashrama" };

export default async function CommunityAdminPage() {
  await requireAdminPage();
  await ensureDbSchema();

  const [communityRows, companyRows, creatorRows, partnerRows, recurringRows] = await Promise.all([
    db.select().from(communityMembers).orderBy(desc(communityMembers.createdAt)).limit(100),
    db.select().from(companies).orderBy(desc(companies.createdAt)).limit(50),
    db.select().from(creatorProfiles).orderBy(desc(creatorProfiles.createdAt)).limit(50),
    db.select().from(ngoPartners).orderBy(desc(ngoPartners.createdAt)).limit(50),
    db.select().from(recurringGivingRequests).orderBy(desc(recurringGivingRequests.createdAt)).limit(50),
  ]);

  const groups = [
    { title: "Corporate Companies", rows: companyRows.map((x) => `${x.name} · ${x.status}`) },
    { title: "Creator Profiles", rows: creatorRows.map((x) => `${x.displayName} · ${x.status}`) },
    { title: "NGO Partners", rows: partnerRows.map((x) => `${x.name} · ${x.status}`) },
    {
      title: "Regular Giving Requests",
      rows: recurringRows.map((x) => `₹${x.amount.toLocaleString("en-IN")} · ${x.email} · ${x.status}`),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Admin CRM / Community Pipeline"
        title="Volunteers, Influencers, CSR & WhatsApp Network"
        lead="Review community filings, connect on WhatsApp with 1-click, update vetting statuses, and export contacts for outreach campaigns."
      />
      <Section tone="cream" className="py-8 md:py-12">
        <Container>
          <CommunityAdminClient
            initialMembers={communityRows as any}
            legacyGroups={groups as any}
          />
        </Container>
      </Section>
    </>
  );
}
