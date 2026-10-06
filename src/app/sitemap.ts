import type { MetadataRoute } from "next";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://janasevaorphanage.org";

  const staticRoutes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/celebrate-birthday", priority: 0.95, changeFrequency: "daily" as const },
    { path: "/story", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/today", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/impact", priority: 0.95, changeFrequency: "daily" as const },
    { path: "/impact-wall", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/make-a-day-matter", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/campaigns", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/gift-impact", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/missions", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/get-involved", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/janaseva-crew", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/skill-giving", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/corporate", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/team-impact", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/creators", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ngo-network", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/future", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/transparency", priority: 0.85, changeFrequency: "monthly" as const },
    { path: "/stories", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/recurring-giving", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/celebrate-special-day", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/campus", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/company-impact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/partners", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/terms-and-conditions", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/privacy-policy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/refund-policy", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const activeCampaigns = await db
      .select({ slug: campaigns.slug, updatedAt: campaigns.updatedAt })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, "approved"),
          sql`(${campaigns.endDate} is null or ${campaigns.endDate} >= now())`
        )
      )
      .limit(100);

    const campaignRoutes = activeCampaigns.map((c) => ({
      url: `${baseUrl}/campaigns/${c.slug}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    const { DEFAULT_ITEMS } = await import("@/lib/seed-data");
    const impactRoutes = DEFAULT_ITEMS.map((item) => ({
      url: `${baseUrl}/impact/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    dynamicRoutes = [...campaignRoutes, ...impactRoutes];
  } catch (err) {
    console.error("Error generating dynamic sitemap entries:", err);
  }

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  return [...staticEntries, ...dynamicRoutes];
}
