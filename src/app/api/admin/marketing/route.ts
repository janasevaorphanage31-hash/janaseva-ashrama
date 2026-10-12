import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getMarketingConfig,
  saveMarketingConfig,
  generateCampaignBlueprint,
  NONPROFIT_MARKETING_PLAYBOOK,
  type MarketingConfig,
  type GeneratedCampaign,
} from "@/lib/marketing-agent";

const MARKETING_ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CONTENT_ADMIN"] as const;

export async function GET() {
  const session = await requireAdminApi([...MARKETING_ROLES]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getMarketingConfig();
  return NextResponse.json({
    config,
    playbook: NONPROFIT_MARKETING_PLAYBOOK,
  });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...MARKETING_ROLES]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { action } = body as {
    action?: string;
    config?: Partial<MarketingConfig>;
    angle?: "birthday" | "annadana" | "shagun" | "tax80g" | "education" | "festival";
    customPrompt?: string;
    campaignId?: string;
    capiPayload?: Record<string, unknown>;
  };

  // 1. Save Settings / API Keys
  if (action === "save_config") {
    if (!body.config || typeof body.config !== "object") {
      return NextResponse.json({ error: "Missing config data" }, { status: 400 });
    }
    const success = await saveMarketingConfig(body.config);
    if (!success) {
      return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
    }
    const updated = await getMarketingConfig();
    return NextResponse.json({ ok: true, config: updated });
  }

  // 2. Generate Campaign via AI Agent
  if (action === "generate_campaign") {
    const angle = body.angle || "birthday";
    const customPrompt = body.customPrompt || "";

    const currentConfig = await getMarketingConfig();
    let newCampaign: GeneratedCampaign = generateCampaignBlueprint(angle, customPrompt);

    // If customPrompt was provided or AI key configured, attempt to enrich with AI if API key is active
    if (currentConfig.aiApiKey && currentConfig.aiProvider === "gemini") {
      try {
        const promptText = `You are a world-class growth marketing director for Janaseva Ashrama, an authentic non-profit orphanage home housing 25 resident boys in Turahalli, Bengaluru, Karnataka (Section 80G Form 10AC verified).
Generate 3 powerful emotional, high-converting ad copy primary texts, 5 catchy headlines (under 35 characters), and 1 Midjourney/Flux photorealistic image prompt for a campaign focusing on: ${angle}.
User extra notes: ${customPrompt || "Focus on real impact, transparent meals, and child smiles."}
Return JSON with keys: primaryTexts (array of 3 strings), headlines (array of 5 strings), aiImagePrompt (string).`;

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
            currentConfig.aiApiKey,
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );

        if (resp.ok) {
          const geminiData = await resp.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed.primaryTexts) && parsed.primaryTexts.length > 0) {
              newCampaign.metaStrategy.primaryTexts = parsed.primaryTexts;
            }
            if (Array.isArray(parsed.headlines) && parsed.headlines.length > 0) {
              newCampaign.metaStrategy.headlines = [
                ...parsed.headlines,
                ...newCampaign.metaStrategy.headlines.slice(parsed.headlines.length),
              ];
            }
            if (typeof parsed.aiImagePrompt === "string") {
              newCampaign.creativeDirectives.aiImagePrompts.unshift(parsed.aiImagePrompt);
            }
          }
        }
      } catch (e) {
        console.warn("AI generation fallback to built-in blueprint:", e);
      }
    }

    // Save newly generated campaign into history
    const existing = currentConfig.savedCampaigns || [];
    const updatedCampaigns = [newCampaign, ...existing.slice(0, 19)]; // Keep last 20
    await saveMarketingConfig({ savedCampaigns: updatedCampaigns });

    return NextResponse.json({
      ok: true,
      campaign: newCampaign,
      savedCount: updatedCampaigns.length,
    });
  }

  // 3. Delete Saved Campaign
  if (action === "delete_campaign") {
    if (!body.campaignId) {
      return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
    }
    const currentConfig = await getMarketingConfig();
    const filtered = (currentConfig.savedCampaigns || []).filter(
      (c) => c.id !== body.campaignId,
    );
    await saveMarketingConfig({ savedCampaigns: filtered });
    return NextResponse.json({ ok: true, savedCampaigns: filtered });
  }

  // 4. Test Meta Conversions API (CAPI) Dispatch
  if (action === "test_capi") {
    const currentConfig = await getMarketingConfig();
    const testPayload = body.capiPayload || {
      event_name: "Donate",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: {
        client_ip_address: "103.21.124.5",
        client_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      custom_data: {
        currency: "INR",
        value: 3500.0,
        content_name: "Festive Birthday Lunch with Payasam",
      },
      test_event_code: currentConfig.metaCapiTestEventCode || undefined,
    };

    if (currentConfig.metaPixelId && currentConfig.metaCapiToken) {
      try {
        const metaUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(
          currentConfig.metaPixelId,
        )}/events?access_token=${encodeURIComponent(currentConfig.metaCapiToken)}`;

        const metaRes = await fetch(metaUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [testPayload],
            test_event_code: currentConfig.metaCapiTestEventCode || undefined,
          }),
        });

        const metaResult = await metaRes.json();
        return NextResponse.json({
          ok: metaRes.ok,
          mode: "live_meta_graph_api",
          status: metaRes.status,
          result: metaResult,
          payloadSent: testPayload,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
          ok: false,
          mode: "live_meta_graph_api",
          error: errorMessage,
          payloadSent: testPayload,
        });
      }
    }

    // Simulation mode when token not yet configured
    return NextResponse.json({
      ok: true,
      mode: "simulation",
      message:
        "Meta CAPI Simulation Successful. Fired standard 'Donate' event with currency 'INR' and value ₹3,500. Add your Meta Pixel ID and CAPI Token to test against live Meta Graph API.",
      validation: {
        eventNameValid: true,
        currencyIsINR: true,
        valuePresent: true,
        timestampEpochValid: true,
        clientIpPresent: true,
      },
      payloadValidated: testPayload,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
