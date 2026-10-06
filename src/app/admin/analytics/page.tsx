import type { Metadata } from "next";
import { count, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { requireAdminPage } from "@/lib/admin-auth";
import { Container, PageHero, Section } from "@/components/ui";
export const metadata: Metadata = { title: "Analytics" };
export default async function AnalyticsAdminPage(){
  await requireAdminPage();
  const rows = await db.select({ event: analyticsEvents.event, sessions: count(sql`distinct ${analyticsEvents.sessionId}`), total: count() }).from(analyticsEvents).groupBy(analyticsEvents.event).orderBy(desc(count()));
  return <><PageHero eyebrow="Admin / Analytics" title="Journey analytics" lead="First-party events help measure the path from story to needs to verified contribution without exposing donor private data."/><Section tone="cream"><Container><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{rows.map(r=><div key={r.event} className="rounded-2xl bg-white p-4 ring-1 ring-teal-900/10"><p className="text-xs font-bold uppercase tracking-wider text-saffron-dark">{r.event}</p><p className="mt-2 font-display text-2xl font-bold text-teal-900">{Number(r.total).toLocaleString("en-IN")}</p><p className="text-xs text-teal-950/55">events · {Number(r.sessions).toLocaleString("en-IN")} sessions</p></div>)}</div></Container></Section></>;
}
