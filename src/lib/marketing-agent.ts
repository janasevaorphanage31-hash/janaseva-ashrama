import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentEntries } from "@/db/schema";
import {
  MARKETING_CONFIG_SLUG,
  DEFAULT_MARKETING_CONFIG,
  type MarketingConfig,
} from "./marketing-blueprints";

export * from "./marketing-blueprints";

let cachedMarketingConfig: { data: MarketingConfig; expiresAt: number } | null = null;

/**
 * Load marketing configuration from PostgreSQL contentEntries.
 * Cached in-memory with a 60s TTL to prevent database roundtrips on every page load.
 */
export async function getMarketingConfig(): Promise<MarketingConfig> {
  const now = Date.now();
  if (cachedMarketingConfig && cachedMarketingConfig.expiresAt > now) {
    return cachedMarketingConfig.data;
  }

  try {
    const [row] = await db
      .select({ body: contentEntries.body })
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "marketing_config"),
          eq(contentEntries.slug, MARKETING_CONFIG_SLUG),
        ),
      )
      .limit(1);

    if (row && row.body) {
      const parsed = JSON.parse(row.body) as Partial<MarketingConfig>;
      const config: MarketingConfig = {
        ...DEFAULT_MARKETING_CONFIG,
        ...parsed,
        savedCampaigns: Array.isArray(parsed.savedCampaigns)
          ? parsed.savedCampaigns
          : [],
      };
      cachedMarketingConfig = { data: config, expiresAt: now + 60_000 };
      return config;
    }
  } catch (err) {
    console.error("Error reading marketing config from DB:", err);
  }

  cachedMarketingConfig = { data: DEFAULT_MARKETING_CONFIG, expiresAt: now + 15_000 };
  return DEFAULT_MARKETING_CONFIG;
}

/**
 * Save marketing configuration to PostgreSQL contentEntries.
 */
export async function saveMarketingConfig(
  updates: Partial<MarketingConfig>,
): Promise<boolean> {
  try {
    const current = await getMarketingConfig();
    const updated: MarketingConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(updated);

    const [existing] = await db
      .select({ id: contentEntries.id })
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "marketing_config"),
          eq(contentEntries.slug, MARKETING_CONFIG_SLUG),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(contentEntries)
        .set({
          body: serialized,
          updatedAt: new Date(),
          status: "published",
        })
        .where(eq(contentEntries.id, existing.id));
    } else {
      await db.insert(contentEntries).values({
        type: "marketing_config",
        slug: MARKETING_CONFIG_SLUG,
        title: "Autonomous Marketing Agent & Growth Engine Settings",
        body: serialized,
        status: "published",
      });
    }

    cachedMarketingConfig = null;
    return true;
  } catch (err) {
    console.error("Error saving marketing config to DB:", err);
    return false;
  }
}
