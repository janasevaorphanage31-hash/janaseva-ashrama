import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { companies, creatorProfiles, ngoPartners, recurringGivingRequests } from "@/db/schema";
import { requireAdminPage } from "@/lib/admin-auth";
import { Container, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Community Admin" };
export default async function CommunityAdminPage(){
  await requireAdminPage();
  const [companyRows, creatorRows, partnerRows, recurringRows] = await Promise.all([
    db.select().from(companies).orderBy(desc(companies.createdAt)).limit(50),
    db.select().from(creatorProfiles).orderBy(desc(creatorProfiles.createdAt)).limit(50),
    db.select().from(ngoPartners).orderBy(desc(ngoPartners.createdAt)).limit(50),
    db.select().from(recurringGivingRequests).orderBy(desc(recurringGivingRequests.createdAt)).limit(50),
  ]);
  const groups = [
    ["Corporate", companyRows.map(x=>`${x.name} · ${x.status}`)],
    ["Creators", creatorRows.map(x=>`${x.displayName} · ${x.status}`)],
    ["NGO partners", partnerRows.map(x=>`${x.name} · ${x.status}`)],
    ["Regular giving", recurringRows.map(x=>`₹${x.amount.toLocaleString("en-IN")} · ${x.email} · ${x.status}`)],
  ] as const;
  return <><PageHero eyebrow="Admin / Community" title="Community & partnership pipeline" lead="Review corporate, creator, NGO partner and regular-giving requests. Private contact information stays inside the protected admin area."/><Section tone="cream"><Container><div className="grid gap-5 lg:grid-cols-2">{groups.map(([title, rows])=><section key={title} className="rounded-3xl bg-white p-5 ring-1 ring-teal-900/10"><h2 className="font-display text-xl font-bold text-teal-900">{title}</h2><ul className="mt-3 space-y-2 text-sm">{rows.length ? rows.map((r,i)=><li key={i} className="rounded-xl bg-cream px-3 py-2">{r}</li>) : <li className="text-teal-950/50">No submissions yet.</li>}</ul></section>)}</div></Container></Section></>;
}
