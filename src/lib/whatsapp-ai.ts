import { db } from "@/db";
import { whatsAppKnowledgeDocuments } from "@/db/schema";
import { eq, or, like, sql } from "drizzle-orm";

/**
 * Janaseva Ashrama Grounded Knowledge System
 * Verified legal, organizational, and seva information.
 */
export const VERIFIED_ASHRAMA_FACTS = {
  name: "Janaseva Ashrama",
  location: "Bengaluru, Karnataka, India",
  phone: "+91 99803 59595",
  email: "janasevaorphanage@gmail.com",
  websiteUrl: "https://www.janasevaashrama.org",
  donationUrl: "https://www.janasevaashrama.org/donate",
  beneficiariesCount: 25,
  beneficiaryDescription: "25 resident boys receiving shelter, nutrition, English-medium schooling, and moral guidance",
  legalForm28JJAct: "KA18CH0242",
  tax80GForm10AC: "AAATJ5578EF20214",
  taxBenefit: "50% tax exemption under Section 80G of the Income Tax Act",
  sevas: [
    {
      title: "One Full Day Meals for 25 Boys (Annadana)",
      amountINR: 4500,
      description: "Breakfast, hot afternoon lunch, evening milk & snacks, and dinner for all 25 boys.",
    },
    {
      title: "Monthly Grocery & Ration Provision",
      amountINR: 6000,
      description: "Rice, dal, oil, spices, pulses, and provisions for 1 month.",
    },
    {
      title: "Special Birthday / Celebration Seva Feast",
      amountINR: 5000,
      description: "Special banana-leaf feast with sweet (payasa/halwa) and fresh fruits for all resident children.",
    },
    {
      title: "School Uniform & Education Kit",
      amountINR: 2500,
      description: "Textbooks, notebooks, geometry box, school shoes, and two sets of uniforms.",
    },
    {
      title: "Sponsor 25 Boys (General Seva Fund)",
      amountINR: 1000,
      description: "Voluntary donation of any amount towards daily healthcare, shelter maintenance, and sports equipment.",
    },
  ],
};

/**
 * Detects if text is primarily in Kannada or requests Kannada response.
 */
export function isKannadaLanguage(text: string): boolean {
  if (!text) return false;
  // Kannada Unicode range: 0C80 - 0CFF
  const kannadaRegex = /[\u0C80-\u0CFF]/;
  if (kannadaRegex.test(text)) return true;

  const lower = text.toLowerCase();
  const kannadaLatinKeywords = ["namaskara", "kannada", "seve", "dana", "oota", "ashrama"];
  return kannadaLatinKeywords.some((kw) => lower.includes(kw));
}

/**
 * Fetches relevant knowledge documents from the database for Grounded RAG.
 */
export async function getRelevantKnowledge(query: string, language: "en" | "kn"): Promise<string[]> {
  try {
    const words = query
      .toLowerCase()
      .replace(/[^\w\s\u0C80-\u0CFF]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (words.length === 0) {
      const topDocs = await db
        .select()
        .from(whatsAppKnowledgeDocuments)
        .where(eq(whatsAppKnowledgeDocuments.status, "PUBLISHED"))
        .limit(3);
      return topDocs.map((d) => `${d.title}:\n${d.content}`);
    }

    const conditions = words.map((w) =>
      or(
        like(whatsAppKnowledgeDocuments.title, `%${w}%`),
        like(whatsAppKnowledgeDocuments.content, `%${w}%`)
      )
    );

    const matches = await db
      .select()
      .from(whatsAppKnowledgeDocuments)
      .where(or(...conditions))
      .limit(4);

    return matches.map((d) => `${d.title}:\n${d.content}`);
  } catch {
    return [];
  }
}

/**
 * Rule-Based Grounded Intent Resolver (100% deterministic fallback)
 */
function resolveIntentRuleBased(
  query: string,
  donorName?: string,
  isKannada = false
): { replyText: string; humanTakeoverNeeded: boolean } {
  const q = query.toLowerCase();

  // 1. Human Takeover / Agent Escalation
  if (
    q.includes("human") ||
    q.includes("agent") ||
    q.includes("speak to someone") ||
    q.includes("call me") ||
    q.includes("complaint") ||
    q.includes("refund") ||
    q.includes("wrong amount") ||
    q.includes("contact person") ||
    q.includes("ಮಾತನಾಡಬೇಕು")
  ) {
    const text = isKannada
      ? `🙏 ನಮಸ್ಕಾರ ${donorName ? donorName + " ಅವರೇ" : ""}.\n\nನಮ್ಮ ಜನಸೇವಾ ಆಶ್ರಮದ ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿಗೆ ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ವರ್ಗಾಯಿಸಲಾಗಿದೆ. ನಮ್ಮ ತಂಡದವರು ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.\n\nজরೂರ್ ಕರೆಗಾಗಿ: +91 99803 59595`
      : `🙏 Namaste ${donorName ? donorName : "Ji"},\n\nI have assigned your request to our senior Ashrama coordinator. A team member will join this chat or call you shortly.\n\nFor urgent queries, please call: +91 99803 59595.`;
    return { replyText: text, humanTakeoverNeeded: true };
  }

  // 2. 80G Tax Exemption & Receipts
  if (
    q.includes("80g") ||
    q.includes("tax") ||
    q.includes("receipt") ||
    q.includes("deduction") ||
    q.includes("10ac") ||
    q.includes("ರಸೀದಿ") ||
    q.includes("ತೆರಿಗೆ")
  ) {
    const text = isKannada
      ? `📜 ಜನಸೇವಾ ಆಶ್ರಮ — 80G ತೆರಿಗೆ ರಿಯಾಯಿತಿ ಮಾಹಿತಿ:\n\n• ಜನಸೇವಾ ಆಶ್ರಮಕ್ಕೆ ನೀಡುವ ಎಲ್ಲಾ ದೇಣಿಗೆಗಳಿಗೆ ಆದಾಯ ತೆರಿಗೆ ಕಾಯ್ದೆ 80G ಅಡಿಯಲ್ಲಿ 50% ತೆರಿಗೆ ವಿನಾಯಿತಿ ಲಭ್ಯವಿದೆ.\n• 80G Form 10AC ನೋಂದಣಿ ಸಂಖ್ಯೆ: ${VERIFIED_ASHRAMA_FACTS.tax80GForm10AC}\n• Form 28 JJ Act ನೋಂದಣಿ: ${VERIFIED_ASHRAMA_FACTS.legalForm28JJAct}\n• ದೇಣಿಗೆ ನೀಡಿದ ತಕ್ಷಣ ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ರಸೀದಿಯನ್ನು ನಿಮ್ಮ WhatsApp ಅಥವಾ ಇಮೇಲ್‌ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.\n\nದೇಣಿಗೆ ನೀಡಲು: ${VERIFIED_ASHRAMA_FACTS.donationUrl}`
      : `📜 Janaseva Ashrama — 80G Tax Exemption & Receipts:\n\n• All donations are 50% tax exempt under Section 80G of the Indian Income Tax Act.\n• Form 10AC Approval No: ${VERIFIED_ASHRAMA_FACTS.tax80GForm10AC}\n• Juvenile Justice Act Registration: ${VERIFIED_ASHRAMA_FACTS.legalForm28JJAct}\n• Official digital receipts with 80G certificate are delivered immediately upon online donation via WhatsApp & email.\n\nOfficial Donation Portal:\n${VERIFIED_ASHRAMA_FACTS.donationUrl}`;
    return { replyText: text, humanTakeoverNeeded: false };
  }

  // 3. Annadana & Meals Cost
  if (
    q.includes("meal") ||
    q.includes("food") ||
    q.includes("lunch") ||
    q.includes("breakfast") ||
    q.includes("annadana") ||
    q.includes("ration") ||
    q.includes("ಊಟ") ||
    q.includes("ಅನ್ನದಾನ")
  ) {
    const text = isKannada
      ? `🍲 ಜನಸೇವಾ ಆಶ್ರಮ — 25 ಮಕ್ಕಳಿಗೆ ಅನ್ನದಾನ ಸೇವೆ:\n\n• ಒಂದು ದಿನದ ಸಂಪೂರ್ಣ ಊಟ (ತಿಂಡಿ, ಮಧ್ಯಾಹ್ನದ ಊಟ, ಹಾಲು/ಸ್ನ್ಯಾಕ್ಸ್, ರಾತ್ರಿ ಊಟ): ₹4,500\n• ಒಂದು ತಿಂಗಳ ರೇಷನ್ ಮತ್ತು ದಿನಸಿ ಸಾಮಗ್ರಿಗಳು: ₹6,000\n• ಹುಟ್ಟುಹಬ್ಬದ ವಿಶೇಷ ಮೃಷ್ಟಾನ್ನ ಭೋಜನ (ಪಾಯಸ/ಹಣ್ಣುಗಳೊಂದಿಗೆ): ₹5,000\n\nನಮ್ಮ 25 ಮಕ್ಕಳ ಅನ್ನದಾನ ಸೇವೆ ಬುಕ್ ಮಾಡಲು:\n${VERIFIED_ASHRAMA_FACTS.donationUrl}\n\nಹೆಚ್ಚಿನ ಮಾಹಿತಿಗೆ ಕರೆ ಮಾಡಿ: +91 99803 59595`
      : `🍲 Janaseva Ashrama — Annadana for 25 Boys:\n\n• Full Day Meals for 25 Boys (Breakfast, Lunch, Evening Milk/Snacks, Dinner): ₹4,500\n• One Month Grocery & Ration Provision: ₹6,000\n• Special Birthday Seva Feast (Special lunch with sweet & fruits): ₹5,000\n\nTo sponsor Annadana directly:\n${VERIFIED_ASHRAMA_FACTS.donationUrl}\n\nHelpline: +91 99803 59595`;
    return { replyText: text, humanTakeoverNeeded: false };
  }

  // 4. Birthday & Special Day Celebrations
  if (
    q.includes("birthday") ||
    q.includes("anniversary") ||
    q.includes("celebrat") ||
    q.includes("special day") ||
    q.includes("ಹುಟ್ಟುಹಬ್ಬ") ||
    q.includes("ವರ್ಧಂತಿ")
  ) {
    const text = isKannada
      ? `🎂 ನಿಮ್ಮ ಹುಟ್ಟುಹಬ್ಬ ಅಥವಾ ವಿಶೇಷ ದಿನವನ್ನು ನಮ್ಮ 25 ಮಕ್ಕಳೊಂದಿಗೆ ಆಚರಿಸಿ:\n\n• ವಿಶೇಷ ಮಧ್ಯಾಹ್ನದ ಭೋಜನ: ₹5,000\n• ಸಂಪೂರ್ಣ ದಿನದ ಅನ್ನದಾನ: ₹4,500\n• ನೀವು ಆಶ್ರಮಕ್ಕೆ ಖುದ್ದಾಗಿ ಭೇಟಿ ನೀಡಿ ಮಕ್ಕಳಿಗೆ ಊಟ ಬಡಿಸಬಹುದು, ಅಥವಾ ನೀವು ಬರಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ ಮಕ್ಕಳ ಪ್ರಾರ್ಥನೆ ಮತ್ತು ಧನ್ಯವಾದದ ವಿಡಿಯೋವನ್ನು ನಿಮಗೆ ಕಳುಹಿಸುತ್ತೇವೆ.\n\nಆಚರಣೆ ದಿನಾಂಕ ಬುಕ್ ಮಾಡಲು:\n${VERIFIED_ASHRAMA_FACTS.websiteUrl}/celebrate`
      : `🎂 Celebrate Your Birthday or Anniversary with our 25 Boys:\n\n• Special Seva Feast: ₹5,000\n• Full Day Annadana: ₹4,500\n• You are welcome to visit our Bengaluru campus in person to serve the boys directly. If you are celebrating remotely, we share authorized blessing & wish video proofs directly on WhatsApp!\n\nBook your celebration date:\n${VERIFIED_ASHRAMA_FACTS.websiteUrl}/celebrate`;
    return { replyText: text, humanTakeoverNeeded: false };
  }

  // 5. How to Donate / Bank Account / UPI
  if (
    q.includes("how to donate") ||
    q.includes("donate") ||
    q.includes("account") ||
    q.includes("upi") ||
    q.includes("gpay") ||
    q.includes("phonepe") ||
    q.includes("payment") ||
    q.includes("ದಾನ")
  ) {
    const text = isKannada
      ? `🙏 ಜನಸೇವಾ ಆಶ್ರಮಕ್ಕೆ ದೇಣಿಗೆ ನೀಡುವ ಅಧಿಕೃತ ವಿಧಾನಗಳು:\n\n1. ಅಧಿಕೃತ ಜಾಲತಾಣ (UPI, GPay, PhonePe, ಕಾರ್ಡ್, ನೆಟ್‌ಬ್ಯಾಂಕಿಂಗ್):\n${VERIFIED_ASHRAMA_FACTS.donationUrl}\n\n2. ಅಧಿಕೃತ ಟ್ರಸ್ಟ್ Axis Bank UPI ID: MAB.037349050110044@axisbank (Janaseva Samruddi Education Trust)\n\nಎಲ್ಲಾ ದೇಣಿಗೆಗಳಿಗೆ ತಕ್ಷಣವೇ 80G ಡಿಜಿಟಲ್ ರಸೀದಿ ಲಭ್ಯವಿದೆ.\nದೂರವಾಣಿ: +91 99803 59595`
      : `🙏 Ways to Donate to Janaseva Ashrama (Bengaluru):\n\n1. Instant Official Portal (UPI, Google Pay, PhonePe, Cards, NetBanking):\n👉 ${VERIFIED_ASHRAMA_FACTS.donationUrl}\n\n2. Official Trust Axis Bank UPI: MAB.037349050110044@axisbank (Janaseva Samruddi Education Trust)\n\n• Instant 80G tax receipt generated with every online contribution.\n• 100% of your support directly reaches the nutrition and education of our 25 boys.`;
    return { replyText: text, humanTakeoverNeeded: false };
  }

  // 6. About Ashrama / Location / Visiting Hours
  if (
    q.includes("about") ||
    q.includes("where") ||
    q.includes("address") ||
    q.includes("location") ||
    q.includes("visit") ||
    q.includes("hours") ||
    q.includes("ವಿಳಾಸ") ||
    q.includes("ಆಶ್ರಮ")
  ) {
    const text = isKannada
      ? `🏡 ಜನಸೇವಾ ಆಶ್ರಮ — ಪರಿಚಯ ಮತ್ತು ವಿಳಾಸ:\n\n• ಬೆಂಗಳೂರಿನಲ್ಲಿರುವ ಜನಸೇವಾ ಆಶ್ರಮವು 25 ಅನಾಥ ಮತ್ತು ನಿರ್ಗತಿಕ ಬಾಲಕರಿಗೆ ಆಶ್ರಯ, ಪೌಷ್ಟಿಕ ಆಹಾರ, ಶಿಕ್ಷಣ ಮತ್ತು ಪ್ರೀತಿಯನ್ನು ನೀಡುತ್ತಿದೆ.\n• ಕಾನೂನು ಮಾನ್ಯತೆ: Form 28 JJ Act (KA18CH0242)\n• ಭೇಟಿ ನೀಡುವ ಸಮಯ: ಪ್ರತಿದಿನ ಬೆಳಗ್ಗೆ 9:00 ರಿಂದ ಸಂಜೆ 6:30 ರವರೆಗೆ.\n• ಸಂಪರ್ಕ: +91 99803 59595\n• ಇಮೇಲ್: janasevaorphanage@gmail.com\n\nವೆಬ್‌ಸೈಟ್: ${VERIFIED_ASHRAMA_FACTS.websiteUrl}`
      : `🏡 About Janaseva Ashrama:\n\n• Home to ~25 boys in Bengaluru, Karnataka, providing shelter, healthy nutrition, schooling, and life guidance.\n• Legal Registration: Form 28 JJ Act (Registration No: ${VERIFIED_ASHRAMA_FACTS.legalForm28JJAct})\n• 80G Tax Exemption No: ${VERIFIED_ASHRAMA_FACTS.tax80GForm10AC}\n• Visiting Hours: 9:00 AM to 6:30 PM daily (Prior appointment suggested).\n• Phone: +91 99803 59595\n• Email: janasevaorphanage@gmail.com\n\nOfficial Website: ${VERIFIED_ASHRAMA_FACTS.websiteUrl}`;
    return { replyText: text, humanTakeoverNeeded: false };
  }

  // Default Warm Welcome & Menu
  const defaultText = isKannada
    ? `🙏 ನಮಸ್ಕಾರ ${donorName ? donorName + " ಅವರೇ" : ""}!\nಜನಸೇವಾ ಆಶ್ರಮದ (ಬೆಂಗಳೂರು) ಅಧಿಕೃತ WhatsApp ಸಹಾಯವಾಣಿಗೆ ಸ್ವಾಗತ.\nನಮ್ಮ 25 ಮಕ್ಕಳ ಸೇವೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?\n\n1. ಅನ್ನದಾನ ಸೇವೆ ವಿವರಗಳು (ದಿನದ ಊಟ ₹4,500)\n2. 80G ತೆರಿಗೆ ರಿಯಾಯಿತಿ ರಸೀದಿ ಮಾಹಿತಿ\n3. ಹುಟ್ಟುಹಬ್ಬದ ಸೇವೆ ಆಚರಣೆ\n4. ಆಶ್ರಮಕ್ಕೆ ಭೇಟಿ ನೀಡುವ ಸಮಯ ಮತ್ತು ವಿಳಾಸ\n5. ಸಿಬ್ಬಂದಿಯೊಂದಿಗೆ ಮಾತನಾಡಲು 'human' ಎಂದು ಟೈಪ್ ಮಾಡಿ.\n\nಆನ್‌ಲೈನ್ ದೇಣಿಗೆಗಾಗಿ: ${VERIFIED_ASHRAMA_FACTS.donationUrl}`
    : `🙏 Namaste ${donorName ? donorName : "Ji"}!\nWelcome to Janaseva Ashrama (Bengaluru) WhatsApp Seva Desk.\nHow may we assist you today for our 25 resident boys?\n\n1. Annadana & Meals for 25 Boys (Full Day Meals: ₹4,500)\n2. 80G Tax Exemption & Instant Receipts\n3. Birthday & Anniversary Seva Feasts\n4. Ashrama Location & Visiting Hours\n5. Type "human" to connect with a staff coordinator.\n\nOfficial Donation Portal:\n👉 ${VERIFIED_ASHRAMA_FACTS.donationUrl}`;

  return { replyText: defaultText, humanTakeoverNeeded: false };
}

/**
 * Generate AI Response with Grounded RAG + Gemini Flash (with infallible fallback)
 */
export async function generateWhatsAppAiResponse(params: {
  userMessage: string;
  donorName?: string;
  preferredLanguage?: string;
  conversationHistory?: Array<{ direction: string; content?: string | null }>;
}): Promise<{ replyText: string; humanTakeoverNeeded: boolean }> {
  const isKannada =
    params.preferredLanguage === "kn" || isKannadaLanguage(params.userMessage);

  const ruleResult = resolveIntentRuleBased(
    params.userMessage,
    params.donorName,
    isKannada
  );

  // If user requested human takeover, immediately return
  if (ruleResult.humanTakeoverNeeded) {
    return ruleResult;
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return ruleResult;
  }

  // Fetch grounded knowledge documents
  const knowledgeChunks = await getRelevantKnowledge(
    params.userMessage,
    isKannada ? "kn" : "en"
  );

  const systemPrompt = `You are the official, respectful, warm WhatsApp AI Assistant of Janaseva Ashrama (Bengaluru, Karnataka).
Your duty is to answer donor questions accurately, warmly, and truthfully.

VERIFIED FACTS (NEVER CONTRADICT OR INVENT OTHER DATA):
- Organization: Janaseva Ashrama, Bengaluru, Karnataka, India.
- Cause: Full residential care, food, education, and development of 25 resident boys.
- Form 28 JJ Act Registration No: ${VERIFIED_ASHRAMA_FACTS.legalForm28JJAct}.
- 80G Income Tax Approval No: ${VERIFIED_ASHRAMA_FACTS.tax80GForm10AC} (Form 10AC). All donations are 50% tax exempt.
- Daily Meals (Annadana) for 25 Boys: ₹4,500.
- Monthly Grocery Provision: ₹6,000.
- Birthday Seva Feast: ₹5,000.
- Education Kit: ₹2,500.
- Official Donation URL: ${VERIFIED_ASHRAMA_FACTS.donationUrl}.
- Phone: ${VERIFIED_ASHRAMA_FACTS.phone}.

RULES:
1. Always be polite, heartfelt, and humble ("Namaste", "🙏").
2. Answer in ${isKannada ? "Kannada (ಕನ್ನಡ)" : "English"}.
3. Keep replies concise and formatted for WhatsApp (use emojis, bullet points, clean spacing).
4. Never promise false claims or fabricate bank accounts. Only share the official website or verified trust phone number.
5. If the user complains, asks for refunds, or asks to speak with a human coordinator, mention that you are connecting them to a senior staff coordinator.

ADDITIONAL KNOWLEDGE:
${knowledgeChunks.join("\n\n")}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nDonor Message: ${params.userMessage}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      return ruleResult;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (candidateText && candidateText.trim().length > 10) {
      return { replyText: candidateText.trim(), humanTakeoverNeeded: false };
    }

    return ruleResult;
  } catch {
    return ruleResult;
  }
}
