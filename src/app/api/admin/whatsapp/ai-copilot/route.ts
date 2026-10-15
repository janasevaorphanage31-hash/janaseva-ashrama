import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { VERIFIED_ASHRAMA_FACTS } from "@/lib/whatsapp-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { prompt, occasion, tone = "devotional_heartfelt", language = "en" } = body;

    const isKannada = language === "kn";

    // Fallback template library if no Gemini API key
    const fallbackResponses: Record<string, { english: string; kannada: string }> = {
      annadana: {
        english: `🍲 *Annadana Seva Appeal for 25 Boys | Janaseva Ashrama (Bengaluru)*

Hari Om & Namaste {{1}} Ji 🙏

Today, we invite you to be the reason behind the bright smiles of our 25 resident boys. For just *₹4,500*, you can sponsor their entire day's nutritious meals:
• Hot South Indian breakfast
• Banana-leaf lunch with sambar, vegetable curry & sweet
• Evening fresh milk & nutritious snacks
• Wholesome dinner

✨ *50% Tax Exemption under Section 80G* (Form 10AC: ${VERIFIED_ASHRAMA_FACTS.tax80GForm10AC}).
Instant digital receipt delivered on WhatsApp.

👉 *Sponsor Today's Meals:*
${VERIFIED_ASHRAMA_FACTS.donationUrl}

With heartfelt prayers and blessings,
*Janaseva Ashrama, Bengaluru*`,
        kannada: `🍲 *ಜನಸೇವಾ ಆಶ್ರಮ — 25 ಮಕ್ಕಳಿಗೆ ಇಂದಿನ ಅನ್ನದಾನ ಸೇವೆ*

ಹರಿ ಓಂ ಮತ್ತು ನಮಸ್ಕಾರ {{1}} ಅವರೇ 🙏

ಬೆಂಗಳೂರಿನ ಜನಸೇವಾ ಆಶ್ರಮದ 25 ಮುಗ್ಧ ಬಾಲಕರಿಗೆ ಇಂದಿನ ಪೌಷ್ಟಿಕ ಊಟವನ್ನು ಪ್ರಾಯೋಜಿಸಲು ನಿಮ್ಮನ್ನು ಪ್ರೀತಿಯಿಂದ ಆಹ್ವಾನಿಸುತ್ತೇವೆ.

• ದಿನದ ಪೂರ್ಣ ಊಟ (ತಿಂಡಿ, ಮಧ್ಯಾಹ್ನದ ಊಟ, ಹಾಲು/ಸ್ನ್ಯಾಕ್ಸ್, ರಾತ್ರಿ ಊಟ): *₹4,500*
• 80G ಅಡಿಯಲ್ಲಿ 50% ತೆರಿಗೆ ವಿನಾಯಿತಿ ಲಭ್ಯ (Form 10AC: ${VERIFIED_ASHRAMA_FACTS.tax80GForm10AC}).

👉 *ಈಗಲೇ ಅನ್ನದಾನ ಸೇವೆ ಬುಕ್ ಮಾಡಲು:*
${VERIFIED_ASHRAMA_FACTS.donationUrl}

ಮಕ್ಕಳ ಪ್ರಾರ್ಥನೆ ಮತ್ತು ಧನ್ಯವಾದಗಳೊಂದಿಗೆ,
*ಜನಸೇವಾ ಆಶ್ರಮ, ಬೆಂಗಳೂರು*`,
      },
      birthday: {
        english: `🎂 *Celebrate Your Special Day with 25 Boys at Janaseva Ashrama*

Namaste {{1}} Ji! 🙏

May your special day be filled with joy and divine blessings! On your auspicious occasion, bring pure happiness to 25 resident boys by sponsoring a special celebration feast for *₹5,000*.

🎁 *What happens on your special day:*
• Boys enjoy a special banana-leaf feast with sweet (Payasa/Halwa)
• Special prayer circle dedicated in your name
• Dedicated wish & blessing video delivered directly to your WhatsApp!

👉 *Book Your Celebration Date:*
${VERIFIED_ASHRAMA_FACTS.websiteUrl}/celebrate

*Janaseva Ashrama, Bengaluru*`,
        kannada: `🎂 *ನಿಮ್ಮ ಹುಟ್ಟುಹಬ್ಬವನ್ನು ಜನಸೇವಾ ಆಶ್ರಮದ 25 ಮಕ್ಕಳೊಂದಿಗೆ ಆಚರಿಸಿ*

ನಮಸ್ಕಾರ {{1}} ಅವರೇ! 🙏

ನಿಮ್ಮ ಹುಟ್ಟುಹಬ್ಬದ ಅಥವಾ ವಿವಾಹ ವಾರ್ಷಿಕೋತ್ಸವದ ಶುಭ ಸಂದರ್ಭದಲ್ಲಿ, ನಮ್ಮ 25 ಮುಗ್ಧ ಮಕ್ಕಳಿಗೆ ವಿಶೇಷ ಮೃಷ್ಟಾನ್ನ ಭೋಜನವನ್ನು (ಪಾಯಸ/ಹಣ್ಣುಗಳೊಂದಿಗೆ) ಪ್ರಾಯೋಜಿಸಿ (₹5,000).

✨ ನೀವು ಬರಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೂ ಮಕ್ಕಳ ಸಾಮೂಹಿಕ ಪ್ರಾರ್ಥನೆ ಮತ್ತು ಧನ್ಯವಾದದ ವಿಡಿಯೋವನ್ನು ನಿಮ್ಮ WhatsApp ಗೆ ಕಳುಹಿಸಲಾಗುವುದು.

👉 *ದಿನಾಂಕ ಕಾಯ್ದಿರಿಸಲು:*
${VERIFIED_ASHRAMA_FACTS.websiteUrl}/celebrate`,
      },
    };

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      const systemInstruction = `You are an expert NGO donor communication strategist and copywriter for Janaseva Ashrama (Bengaluru).
Write a high-converting, compliant WhatsApp broadcast message or template.
GROUNDED FACTS:
- Organization: Janaseva Ashrama, Bengaluru, Karnataka
- 25 resident boys
- Daily Meals (Annadana): ₹4,500
- Monthly Ration: ₹6,000
- Birthday Feast: ₹5,000
- 80G Form 10AC: ${VERIFIED_ASHRAMA_FACTS.tax80GForm10AC}
- Form 28 JJ Act: ${VERIFIED_ASHRAMA_FACTS.legalForm28JJAct}
- Tone: ${tone}
- Language: ${isKannada ? "Kannada" : "English"}

Keep output ready to copy and paste for Meta WhatsApp Cloud API templates with {{1}} donor name placeholder.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemInstruction}\n\nTask: ${prompt || occasion || "Annadana appeal for 25 boys"}` }],
              },
            ],
            generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated && generated.trim().length > 20) {
          return NextResponse.json({
            success: true,
            copy: generated.trim(),
            generatedBy: "gemini-1.5-flash",
          });
        }
      }
    }

    // Default fallback
    const matchedCategory = occasion?.toLowerCase().includes("birth") ? "birthday" : "annadana";
    const selected = fallbackResponses[matchedCategory];
    const copy = isKannada ? selected.kannada : selected.english;

    return NextResponse.json({
      success: true,
      copy,
      generatedBy: "verified_template_library",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to generate copy" }, { status: 500 });
  }
}
