import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { db } from "@/db";
import { whatsAppAutomations, whatsAppAutomationExecutions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const automations = await db
      .select()
      .from(whatsAppAutomations)
      .orderBy(desc(whatsAppAutomations.createdAt));

    // If empty, seed default standard workflows
    if (automations.length === 0) {
      const defaults = [
        {
          name: "Instant 80G Donation Receipt & Blessing",
          triggerType: "DONATION_CAPTURED",
          enabled: true,
          configuration: {
            includeReceiptLink: true,
            include80GDetails: true,
            delaySeconds: 0,
          },
        },
        {
          name: "Birthday & Special Day Seva Wishes",
          triggerType: "BIRTHDAY_SEVA",
          enabled: true,
          configuration: {
            sendAtHour: 8,
            includeBoyPrayerVideo: true,
          },
        },
        {
          name: "New Inbound Donor Greeting & Menu",
          triggerType: "INBOUND_GREETING",
          enabled: true,
          configuration: {
            autoWelcome: true,
            enableAiBot: true,
          },
        },
        {
          name: "Seva Video / Photo Proof Delivery",
          triggerType: "MEDIA_PROOF",
          enabled: true,
          configuration: {
            deliverToDonor: true,
          },
        },
      ];

      for (const d of defaults) {
        await db.insert(whatsAppAutomations).values(d);
      }
    }

    const all = await db.select().from(whatsAppAutomations);
    const recentExecutions = await db
      .select()
      .from(whatsAppAutomationExecutions)
      .orderBy(desc(whatsAppAutomationExecutions.startedAt))
      .limit(20);

    return NextResponse.json({ automations: all, recentExecutions });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch automations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, enabled, configuration } = body;

    if (!id) {
      return NextResponse.json({ error: "Automation ID is required" }, { status: 400 });
    }

    const updates: any = { updatedAt: new Date() };
    if (enabled !== undefined) updates.enabled = Boolean(enabled);
    if (configuration !== undefined) updates.configuration = configuration;

    const [updated] = await db
      .update(whatsAppAutomations)
      .set(updates)
      .where(eq(whatsAppAutomations.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, automation: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update automation" }, { status: 500 });
  }
}
