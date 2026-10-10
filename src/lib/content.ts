import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  documents,
  donationLines,
  donations,
  impactItems,
  impactMetrics,
  impactMissions,
  mediaAssets,
  missionContributions,
  todayUpdates,
  volunteerApplications,
} from "@/db/schema";
import {
  CAMPAIGN_SEED,
  DEFAULT_ITEMS,
  DOCS_SEED,
  METRIC_SEED,
  TODAY_SEED,
  type ImpactItem,
} from "./seed-data";

let seeding: Promise<void> | null = null;

/** Idempotent first-run seed so the site has structure before the admin adds real content. */
export function ensureSeed(): Promise<void> {
  if (process.env.ALLOW_DEMO_SEED !== "true") return Promise.resolve();
  if (!seeding) {
    seeding = (async () => {
      await db
        .insert(impactItems)
        .values(DEFAULT_ITEMS)
        .onConflictDoUpdate({
          target: impactItems.slug,
          set: {
            unitPrice: sql`excluded.unit_price`,
            name: sql`excluded.name`,
            description: sql`excluded.description`,
          },
        });
      const [{ t }] = await db.select({ t: count() }).from(todayUpdates);
      if (t === 0) {
        await db
          .insert(todayUpdates)
          .values(TODAY_SEED.map((u) => ({ ...u, isSample: true })));
      }
      const [{ c }] = await db.select({ c: count() }).from(campaigns);
      if (c === 0) {
        await db
          .insert(campaigns)
          .values({ ...CAMPAIGN_SEED, status: "approved", isSample: true })
          .onConflictDoNothing();
      }
      const [{ d }] = await db.select({ d: count() }).from(documents);
      if (d === 0) await db.insert(documents).values(DOCS_SEED);
      const [{ m }] = await db.select({ m: count() }).from(impactMetrics);
      if (m === 0) await db.insert(impactMetrics).values(METRIC_SEED).onConflictDoNothing();
    })().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await ensureSeed();
    return await fn();
  } catch (e) {
    console.error("content query failed", e);
    return fallback;
  }
}

export const getImpactItems = (): Promise<ImpactItem[]> =>
  safe(
    async () =>
      (await db
        .select()
        .from(impactItems)
        .where(
          and(
            eq(impactItems.active, true),
            process.env.ALLOW_DEMO_SEED === "true"
              ? sql`true`
              : eq(impactItems.financeApproval, "approved"),
          ),
        )
        .orderBy(asc(impactItems.sortOrder))
      ).map((i) => ({
        slug: i.slug,
        name: i.name,
        description: i.description,
        unitPrice: i.unitPrice,
        icon: i.icon,
        sortOrder: i.sortOrder,
        category: i.category,
        unitLabel: i.unitLabel,
        imageUrl: i.imageUrl,
        featured: i.featured,
        todayNeed: i.todayNeed,
        futureFlag: i.futureFlag,
        accountingMeaning: i.accountingMeaning,
        operationalMeaning: i.operationalMeaning,
        financeApproval: i.financeApproval,
        gallery: i.gallery,
        schemes: i.schemes,
      })),
    process.env.ALLOW_DEMO_SEED === "true" ? DEFAULT_ITEMS : [],
  );

export const getImpactItem = (slug: string): Promise<ImpactItem | null> =>
  safe(
    async () => {
      const [i] = await db
        .select()
        .from(impactItems)
        .where(
          and(
            eq(impactItems.slug, slug),
            eq(impactItems.active, true),
            process.env.ALLOW_DEMO_SEED === "true"
              ? sql`true`
              : eq(impactItems.financeApproval, "approved"),
          ),
        )
        .limit(1);
      if (!i) return null;
      return {
        slug: i.slug,
        name: i.name,
        description: i.description,
        unitPrice: i.unitPrice,
        icon: i.icon,
        sortOrder: i.sortOrder,
        category: i.category,
        unitLabel: i.unitLabel,
        imageUrl: i.imageUrl,
        featured: i.featured,
        todayNeed: i.todayNeed,
        futureFlag: i.futureFlag,
        accountingMeaning: i.accountingMeaning,
        operationalMeaning: i.operationalMeaning,
        financeApproval: i.financeApproval,
        gallery: i.gallery,
        schemes: i.schemes,
      };
    },
    DEFAULT_ITEMS.find((item) => item.slug === slug) ?? null,
  );

export const getTodayUpdates = () =>
  safe(
    async () => {
      const rows = await db
        .select()
        .from(todayUpdates)
        .where(sql`lower(${todayUpdates.status}) = 'published'`)
        .orderBy(desc(todayUpdates.publishedAt))
        .limit(12);

      if (rows.length > 0) return rows;

      return TODAY_SEED.map((u, i) => ({
        id: i + 1,
        title: u.title,
        body: u.body,
        category: u.category,
        imageUrl: u.imageUrl,
        isSample: true,
        status: "published",
        publishedAt: new Date(),
      }));
    },
    TODAY_SEED.map((u, i) => ({
      id: i + 1,
      title: u.title,
      body: u.body,
      category: u.category,
      imageUrl: u.imageUrl,
      isSample: true,
      status: "published",
      publishedAt: new Date(),
    })),
  );

export const getDocuments = () =>
  safe(() => db.select().from(documents).where(eq(documents.status, "published")).orderBy(asc(documents.sortOrder)), []);

export const getMetrics = () =>
  safe(() => db.select().from(impactMetrics).where(eq(impactMetrics.published, true)).orderBy(asc(impactMetrics.sortOrder)), []);

/** Only counts payments verified by the server (never demo-mode ones). */
export const getVerifiedPlatformTotals = () =>
  safe(
    async () => {
      const [t] = await db
        .select({ total: sql<number>`coalesce(sum(${donations.amount}),0)::int`, n: count() })
        .from(donations)
        .where(eq(donations.status, "paid"));
      return { total: t.total, donations: t.n };
    },
    { total: 0, donations: 0 },
  );

async function campaignStats(campaignId: number) {
  const [t] = await db
    .select({ raised: sql<number>`coalesce(sum(${donations.amount}),0)::int`, supporters: count() })
    .from(donations)
    .where(and(eq(donations.campaignId, campaignId), eq(donations.status, "paid")));
  const units = await db
    .select({ label: donationLines.label, qty: sql<number>`sum(${donationLines.qty})::int` })
    .from(donationLines)
    .innerJoin(donations, eq(donations.id, donationLines.donationId))
    .where(and(eq(donations.campaignId, campaignId), eq(donations.status, "paid"), sql`${donationLines.itemSlug} is not null`))
    .groupBy(donationLines.label);
  return { raised: t.raised, supporters: t.supporters, units };
}

export const getApprovedCampaigns = () =>
  safe(async () => {
    const rows = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.status, "approved"), sql`(${campaigns.endDate} is null or ${campaigns.endDate} >= now())`))
      .orderBy(desc(campaigns.createdAt))
      .limit(24);
    return Promise.all(rows.map(async (c) => ({ ...c, ...(await campaignStats(c.id)) })));
  }, []);

export const getCampaign = (slug: string) =>
  safe(async () => {
    const [c] = await db.select().from(campaigns).where(and(eq(campaigns.slug, slug), eq(campaigns.status, "approved"), sql`(${campaigns.endDate} is null or ${campaigns.endDate} >= now())`)).limit(1);
    if (!c) return null;
    return { ...c, ...(await campaignStats(c.id)) };
  }, null);

export const getMissions = () =>
  safe(async () => {
    const rows = await db.select().from(impactMissions).where(eq(impactMissions.status, "ACTIVE")).orderBy(desc(impactMissions.createdAt));
    return Promise.all(
      rows.map(async (m) => {
        const [s] = await db
          .select({ raised: sql<number>`coalesce(sum(${missionContributions.allocatedAmount}),0)::int`, supporters: count() })
          .from(missionContributions)
          .innerJoin(donations, eq(donations.id, missionContributions.donationId))
          .where(and(eq(missionContributions.missionId, m.id), eq(donations.status, "paid")));
        return { ...m, raised: s.raised, supporters: s.supporters };
      }),
    );
  }, []);

export const getImpactWall = () =>
  safe(async () => {
    const [sum] = await db
      .select({ total: sql<number>`coalesce(sum(${donations.amount}),0)::int`, donations: count() })
      .from(donations)
      .where(eq(donations.status, "paid"));
    const [todaySum] = await db
      .select({ total: sql<number>`coalesce(sum(${donations.amount}),0)::int`, donations: count() })
      .from(donations)
      .where(and(eq(donations.status, "paid"), sql`${donations.paidAt} >= date_trunc('day', now())`));
    const [campaignCount] = await db
      .select({ n: count() })
      .from(campaigns)
      .where(eq(campaigns.status, "approved"));
    const [volunteerCount] = await db
      .select({ n: count() })
      .from(volunteerApplications)
      .where(sql`${volunteerApplications.status} in ('APPROVED','COMPLETED')`);

    const recentDonations = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        donorName: donations.donorName,
        anonymous: donations.anonymous,
        paidAt: donations.paidAt,
      })
      .from(donations)
      .where(eq(donations.status, "paid"))
      .orderBy(desc(donations.paidAt))
      .limit(12);

    const latestSupporters = recentDonations.map((d) => ({
      id: d.id,
      displayName: d.anonymous ? "Kind Supporter" : d.donorName.trim(),
      amount: d.amount,
      paidAt: d.paidAt,
    }));

    return {
      totalAmount: sum.total,
      donationCount: sum.donations,
      todayAmount: todaySum.total,
      todayDonations: todaySum.donations,
      campaignCount: campaignCount.n,
      volunteerCount: volunteerCount.n,
      latestSupporters,
      metrics: await db.select().from(impactMetrics).where(eq(impactMetrics.published, true)).orderBy(asc(impactMetrics.sortOrder)),
    };
  }, { totalAmount: 0, donationCount: 0, todayAmount: 0, todayDonations: 0, campaignCount: 0, volunteerCount: 0, latestSupporters: [], metrics: [] });

export const getApprovedMedia = () =>
  safe(
    async () => {
      const rows = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.status, "PUBLISHED"))
        .orderBy(desc(mediaAssets.createdAt))
        .limit(60);
      return rows;
    },
    [],
  );

