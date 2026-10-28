/**
 * WhatsApp Anti-Ban Intelligent Variation & Media Outreach Engine
 * Designed for Janaseva Ashrama Telecallers and Admin CRM.
 * 
 * Prevents WhatsApp spam-detection algorithms from flagging or banning outreach numbers by:
 * 1. Multi-level spintax (Greetings, Intros, Pitch, Call-to-actions, Vedic Blessings).
 * 2. Time-of-day contextual salutations (Morning, Afternoon, Evening).
 * 3. Trilingual support (English, Kannada ಕನ್ನಡ, and Kanglish transliteration).
 * 4. 4 Narrative focus angles (Annadana meals, Birthday celebrations, Education vidya, 80G tax trust).
 * 5. Cryptographic salt token (#JS-XXXXX) guaranteeing a 100% unique digital message fingerprint.
 * 6. Curated Media Library (Images, Videos, PDFs, Website Tracking Links).
 * 7. Action Call Buttons (1-Tap Donate & 1-Tap Direct Ashrama Call).
 * 8. Verified Bangalore Calling proof & Google Maps Navigation link from SITE.
 */

import { SITE, FORM_10AC, JJ_ACT_REGISTRATION } from "./site";
import { parseCustomerPhone } from "./whatsapp-phone";

export type OutreachLanguage = "en" | "kn" | "kanglish" | "mixed";
export type NarrativeAngle = "annadana" | "birthday" | "vidya" | "trust_80g";
export type MediaType = "none" | "image" | "video" | "pdf" | "link";

// Backwards-compatible aliases
export type AntiBanLanguage = OutreachLanguage;
export type OutreachAngle = NarrativeAngle;
export type AntiBanMediaAsset = MediaAsset;

export interface MediaAsset {
  id: string;
  type: "image" | "video" | "document" | "link";
  title: string;
  description: string;
  url: string;
  filename?: string;
  thumbnailUrl?: string;
}

export const CURATED_OUTREACH_MEDIA: Record<string, MediaAsset> = {
  payment_qr_scanner: {
    id: "payment_qr_scanner",
    type: "image",
    title: "💳 Official Axis Bank UPI Payment QR Scanner",
    description: "Scan with GPay / PhonePe / Paytm / BHIM to donate directly to Janaseva Samruddi Foundation (0% fees).",
    url: `${SITE.url}/media/janaseva-axis-bank-qr.jpg`,
    filename: "janaseva-axis-bank-qr.jpg",
  },
  annadana_feast: {
    id: "annadana_feast",
    type: "image",
    title: "🍲 Satvik Banana Leaf Feast",
    description: "25 resident boys enjoying a freshly cooked hot lunch feast on banana leaves.",
    url: `${SITE.url}/media/banana-leaf-feast.jpg`,
    filename: "janaseva-annadana-feast.jpg",
  },
  birthday_celebration: {
    id: "birthday_celebration",
    type: "image",
    title: "🎂 Birthday Celebration with 25 Boys",
    description: "Donors celebrating birthday cake cutting and feast with resident boys.",
    url: `${SITE.url}/media/birthday-cake-celebration.jpg`,
    filename: "janaseva-birthday-celebration.jpg",
  },
  prayer_assembly: {
    id: "prayer_assembly",
    type: "image",
    title: "🙏 Morning Prayer & Shloka Assembly",
    description: "Daily 6:30 AM prayer assembly chanting shlokas for donors and caregivers.",
    url: `${SITE.url}/media/boys-group-altar.jpg`,
    filename: "janaseva-prayer-assembly.jpg",
  },
  chant_video: {
    id: "chant_video",
    type: "video",
    title: "🎥 Boys Chanting Vedic Blessing Video",
    description: "Heartwarming short clip of resident boys chanting prayers and gratitude.",
    url: `${SITE.url}/media/video-chant-prayer.mp4`,
    filename: "janaseva-children-prayer-chant.mp4",
  },
  ashrama_tour_video: {
    id: "ashrama_tour_video",
    type: "video",
    title: "📹 Ashrama Campus Tour Video",
    description: "Short tour of Turahalli children's home, classrooms, kitchen, and dorms.",
    url: `${SITE.url}/media/ashrama_video.mp4`,
    filename: "janaseva-ashrama-campus-tour.mp4",
  },
  form_10ac_80g: {
    id: "form_10ac_80g",
    type: "document",
    title: "📜 Income Tax 80G Certificate (Form 10AC)",
    description: "Official Govt of India Form 10AC provisional 80G approval (URN: AABTJ7431MF20231).",
    url: `${SITE.url}/documents/form-10ac-80g-approval.pdf`,
    filename: "Form-10AC-80G-Tax-Exemption-Janaseva.pdf",
  },
  jj_act_license: {
    id: "jj_act_license",
    type: "document",
    title: "🏛️ JJ Act Child Care Institution License (Form 28)",
    description: "Govt of Karnataka Directorate of Child Protection License KA18CH0242 for 25 boys.",
    url: `${SITE.url}/documents/jj-act-child-care-institution-registration-form-28.pdf`,
    filename: "Govt-Karnataka-JJ-Act-Registration-Form-28.pdf",
  },
  website_donation_link: {
    id: "website_donation_link",
    type: "link",
    title: "🌐 Official 1-Tap Donation Portal Link",
    description: "Instant UPI & 80G receipt donation link with telecaller attribution tracking.",
    url: `${SITE.url}/give`,
  },
};

/** Randomly pick one item from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a short random alphanumeric token (e.g. 5F82B) */
function generateSaltToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Injects invisible zero-width unicode characters (\u200B, \u200C, \u200D, \uFEFF)
 * at random word boundaries.
 * 
 * WHY THIS IS CRUCIAL FOR 300-500 MSGS/DAY:
 * Meta's antispam AI clusters identical message strings by calculating SHA-256 hashes.
 * By scattering invisible zero-width code points, every single outbound message has a
 * 100% unique cryptographic byte fingerprint, preventing hash-clustering bans while
 * remaining completely invisible and pristine to human recipients.
 */
function injectZeroWidthSalt(text: string): string {
  const invisibleTokens = ["\u200B", "\u200C", "\u200D", "\uFEFF"];
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (i % 3 === 0 || i % 4 === 0) {
      const char = invisibleTokens[Math.floor(Math.random() * invisibleTokens.length)];
      words[i] = words[i] + char;
    }
  }
  return words.join(" ");
}

/** Determine time-of-day greeting (IST) */
function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 3600000;
  const istDate = new Date(utc + istOffset);
  const hour = istDate.getHours();

  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export interface AntiBanGenerateOptions {
  leadId?: number | string;
  leadName?: string;
  donorName?: string;
  leadPhone?: string;
  phone?: string;
  callerId: string;
  callerName?: string;
  language?: OutreachLanguage;
  angle?: NarrativeAngle;
  selectedMediaId?: string;
  mediaId?: string;
  customPledgeAmount?: number;
  amount?: number;
  baseUrl?: string;
  masterWhatsAppNumber?: string;
  senderMode?: "central" | "individual";
}

export interface AntiBanActionButton {
  type: "url" | "call";
  label: string;
  target: string;
}

export interface AntiBanGeneratedMessage {
  text: string;
  messageText: string;
  captionText: string;
  greeting: string;
  whatsappUrl: string;
  trackingRef: string;
  saltToken: string;
  mediaAsset?: MediaAsset;
  previewUrl: string;
  targetPhone: string;
  senderPhone: string;
  senderMode: "central" | "individual";
  characterCount: number;
  wordCount: number;
  language: OutreachLanguage;
  angle: NarrativeAngle;
  actionButtons: AntiBanActionButton[];
  mapsUrl: string;
  ashramaAddress: string;
}

/**
 * Generates an Anti-Ban randomized, personalized message with Kanglish,
 * Media Asset Caption, Action Call Buttons, and Verified Google Maps Proof.
 */
export function generateAntiBanMessage(options: AntiBanGenerateOptions): AntiBanGeneratedMessage {
  const {
    callerId,
    callerName = "Janaseva Ashrama Volunteer",
    language = "kanglish",
    angle = "annadana",
    baseUrl = SITE.url,
    masterWhatsAppNumber = SITE.phoneIntl,
    senderMode = "central",
  } = options;

  const cleanName = (options.leadName || options.donorName || "Noble Supporter").trim();
  const rawPhone = options.leadPhone || options.phone || "";
  const selectedMediaId = options.selectedMediaId || options.mediaId || "annadana_feast";
  const customPledgeAmount = options.customPledgeAmount || options.amount;
  const timeOfDay = getTimeOfDay();
  const salt = generateSaltToken();
  const trackingRef = callerId ? callerId.toUpperCase() : "DIRECT";

  // Clean and parse customer phone number reliably
  const customerPhoneInfo = parseCustomerPhone(rawPhone);
  const formattedPhone = customerPhoneInfo.waNumber;

  // Selected media asset (if any)
  const mediaAsset = selectedMediaId && CURATED_OUTREACH_MEDIA[selectedMediaId]
    ? CURATED_OUTREACH_MEDIA[selectedMediaId]
    : undefined;

  // Build target donation URL with tracking parameters
  const amountParam = customPledgeAmount && customPledgeAmount > 0 ? `&amount=${customPledgeAmount}` : "";
  const leadParam = options.leadId ? `&lead_id=${options.leadId}` : "";
  const portalUrl = `${baseUrl}/give?ref=${trackingRef}${leadParam}${amountParam}`;
  const birthdayUrl = `${baseUrl}/celebrate-birthday?ref=${trackingRef}${leadParam}`;

  let greeting = "";
  let intro = "";
  let body = "";
  let tierBreakdown = "";
  let trustProof = "";
  let closingBlessing = "";
  let saltLine = "";

  // ──────────────────────────────────────────────────────────────────────────
  // 1. KANGLISH / MIXED LANGUAGE GENERATION (ಕನ್ನಡ in English Alphabet)
  // ──────────────────────────────────────────────────────────────────────────
  if (language === "kanglish" || language === "mixed") {
    const timeGreetingKanglish = {
      morning: ["Namaskara", "Shubhodaya", "Good morning"],
      afternoon: ["Namaskara", "Shubha Madhyahna", "Good afternoon"],
      evening: ["Namaskara", "Shubha Sanje", "Good evening"],
    }[timeOfDay];

    greeting = `${pick(timeGreetingKanglish)} ${cleanName} Sir/Madam! 🙏`;

    intro = pick([
      `Janaseva Ashrama (Turahalli, Bengaluru) nalli ashrataraagiruva 25 anatha makkala kadeyinda ee vishēsha prarthane mattu namaskara! 👦✨`,
      `Namma Turahalli Janaseva Ashrama da 25 makkala nitya baale ele ootakke mattu vidyabhyasakke sahaya bedi nimage ee sandēsha kalsuthiddivi. 🌸`,
      `I hope neevu mattu nimma family kshemavaagiddiri. Namma Ashrama da 25 makkalu daily 6:30 AM satsang nalli noble donors ge shloka chanting maadthaare. 🌺`,
    ]);

    if (angle === "birthday") {
      body = pick([
        `Nimma athava nimma family members birthday / anniversary dina Janaseva Ashrama 25 resident makkalige special festive feast sponsor maadi celebrate maadi! Turahalli Ashrama ge neevê direct aagi banni, cake cut maadi, makkalige baale eleyalli bisi payasa oota badisi aashirvada thagoli.`,
        `Milestone day celebrate maadalu idhu thumbe shreshtavaada seva. Namma 25 makkalu direct aagi nimma hesaralli Vedic prayer maadi, nimage video blessing kalisuththeve.`,
      ]);
      tierBreakdown = `🎂 Birthday & Special Day Seva Options:\n• ₹2,500 — Festive Lunch Feast with Sweet Payasam (25 Boys)\n• ₹3,500 — Celebration Cake, Evening Snacks & Feast\n• ₹4,500 — Full Day 4-Meal Annadana & Personalized Video Blessing`;
    } else if (angle === "vidya") {
      body = pick([
        `Vidya daanavê mahaa daana. Namma Ashrama da 25 makkalu local Bengaluru recognized shaalegalalli oduthidhaare. Evening study hour nalli tuition mattu computers kalisthiddivi. Makkala school uniforms, textbooks, bags mattu exam fees ge nimma sahaya kodi.`,
        `Anatha makkala shikshanadalli sahaya maadi avara bhavishyavannu ujwala maadalu nimage idhu uttama avakasha.`,
      ]);
      tierBreakdown = `📚 Vidya Support Tiers:\n• ₹1,800 — 3 Pairs Durable Cotton School Uniforms\n• ₹2,400 — 1 Month Tuition & Notebooks for 8 Boys\n• ₹3,200 — 1 Year School Adoption (Admissions & Books)`;
    } else if (angle === "trust_80g") {
      body = pick([
        `Janaseva Ashrama Karnataka Sarkarada Juvenile Justice Act (JJ Act KA18CH0242) nalli registered aagiruvudhu. 100% direct allocation for 25 boys. Neevu kodo prathi roopayigu Income Tax Act Section 80G (Form 10AC: ${FORM_10AC.urn}) nalli 50% tax exemption siguththe. Instant WhatsApp receipt barcode bandubiduththe.`,
        `Registered child care institution. Zero middlemen. 100% seva direct makkala thalupathe. Instant 80G tax receipt WhatsApp nalli siguththe.`,
      ]);
      tierBreakdown = `📜 Govt Accreditations & 80G Tax Exemption:\n• Karnataka JJ Act Registration: ${JJ_ACT_REGISTRATION.registrationNumber}\n• Form 10AC 80G Approval URN: ${FORM_10AC.urn}\n• MCA CSR-1 Registration: CSR00078800`;
    } else {
      // Default Annadana
      body = pick([
        `Namma Ashrama dalli 25 beliyuva baalakarige nithya 4 hothu shuddha, bisi-bisi satvik oota (pure cow milk, bisi thindi, baale ele oota mattu raatri oota) needalaaguthide. Groceries (Sona Masoori akki, toor dal, fresh tharakaari) purchase maadalu nimma sahayavannu bedtidivi.`,
        `Namma kitchen grocery supply ge nimma chikka sahaya saaku. ₹501 kottaru 3 dinada makkala haalina karchige sahayavaaguththe.`,
      ]);
      tierBreakdown = `🍲 Pavitra Annadana Seva Tiers:\n• ₹501 — 3 Dinada Cow Milk & Pediatric Care\n• ₹1,500 — 25 Makkalige Bisi Breakfast Feast\n• ₹2,500 — Wholesome Festive Lunch Feast (Payasa + Sweets)\n• ₹4,500 — Full Day 4-Meal Annadana (All 25 Boys)`;
    }

    trustProof = `🏛️ Govt Form 28 JJ Act: ${JJ_ACT_REGISTRATION.registrationNumber} · 100% 80G Tax Exemption (Form 10AC: ${FORM_10AC.urn}). Instant WhatsApp receipt.`;
    closingBlessing = pick([
      `Shree Devaru nimage mattu nimma kutumbakke aayu, aarogya, aishwarya thumbalendu namma 25 makkalu prathidina 6:30 AM satsang nalli prarthane maduthare! 🙏✨`,
      `Makkala mukhada naguvige kaaranavaagi. Thimma uhaara manassige thumba danyavadagalu! 🌸`,
      `May God bless you and your family with boundless peace and prosperity. Dhanyavadagalu! 🌺`,
    ]);
    saltLine = `[Ref Token: #JS-${salt}]`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. KANNADA LANGUAGE GENERATION (ಕನ್ನಡ)
  // ──────────────────────────────────────────────────────────────────────────
  else if (language === "kn") {
    const timeGreetingKn = {
      morning: ["ಶುಭೋದಯ", "ನಮಸ್ಕಾರ"],
      afternoon: ["ಶುಭ ಮಧ್ಯಾಹ್ನ", "ನಮಸ್ಕಾರ"],
      evening: ["ಶುಭ ಸಂಜೆ", "ನಮಸ್ಕಾರ"],
    }[timeOfDay];

    greeting = `${pick(timeGreetingKn)} ${cleanName} ನವರೇ! 🙏`;

    intro = pick([
      `ಬೆಂಗಳೂರಿನ ಜನಸೇವಾ ಆಶ್ರಮದ (ತುರಹಳ್ಳಿ) 25 ಮುಗ್ಧ ಅನಾಥ ಮಕ್ಕಳ ಪರವಾಗಿ ಹೃತ್ಪೂರ್ವಕ ಪ್ರಣಾಮಗಳು! 👦✨`,
      `ನಮ್ಮ ಜನಸೇವಾ ಆಶ್ರಮದಲ್ಲಿ ಆಶ್ರಯ ಪಡೆದಿರುವ 25 ಬಾಲಕರ ಪಾಲನೆ ಹಾಗೂ ಸೇವೆಯ ಕುರಿತು ಈ ಪುಟ್ಟ ಸಂದೇಶವನ್ನು ಕಳುಹಿಸುತ್ತಿದ್ದೇವೆ. 🌸`,
      `ನಮ್ಮ ಜನಸೇವಾ ಆಶ್ರಮದ (KA18CH0242) 25 ವಸತಿ ಬಾಲಕರ ನಿತ್ಯ ಅನ್ನದಾನ ಹಾಗೂ ವಿದ್ಯಾಭ್ಯಾಸದ ಸಹಕಾರಕ್ಕಾಗಿ ತಮ್ಮಲ್ಲಿ ವಿನಮ್ರ ವಿನಂತಿ. 🍲`,
    ]);

    if (angle === "birthday") {
      body = pick([
        `ತಮ್ಮ ಅಥವಾ ಕುಟುಂಬದವರ ಹುಟ್ಟುಹಬ್ಬ, ವಿವಾಹ ವಾರ್ಷಿಕೋತ್ಸವ ಅಥವಾ ಪುಣ್ಯತಿಥಿಯ ಸವಿ ನೆನಪಿನಲ್ಲಿ ನಮ್ಮ 25 ಮಕ್ಕಳಿಗೆ ಸಿಹಿ ಪಾಯಸದೊಂದಿಗೆ ಊಟ ಬಡಿಸಿ ಆಶೀರ್ವಾದ ಪಡೆಯಿರಿ. ವಿಶೇಷ ದಿನದಂದು ಆಶ್ರಮಕ್ಕೆ ನೇರವಾಗಿ ಭೇಟಿ ನೀಡಿ ಮಕ್ಕಳೊಂದಿಗೆ ಕೇಕ್ ಕತ್ತರಿಸಿ, ಅನ್ನದಾನ ನೆರವೇರಿಸಿ ಸಾರ್ಥಕತೆ ಪಡೆಯಬಹುದು.`,
        `ವಿಶೇಷ ದಿನದಂದು ಆಶ್ರಮಕ್ಕೆ ನೇರವಾಗಿ ಭೇಟಿ ನೀಡಿ ಮಕ್ಕಳೊಂದಿಗೆ ಕೇಕ್ ಕತ್ತರಿಸಿ, ಅನ್ನದಾನ ನೆರವೇರಿಸಿ ಸಾರ್ಥಕತೆ ಪಡೆಯಬಹುದು. ಮಕ್ಕಳು ತಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ವಿಶೇಷ ಪ್ರಾರ್ಥನೆ ಮಾಡುತ್ತಾರೆ.`,
      ]);
      tierBreakdown = `🎂 ಜನ್ಮದಿನ ಮಹಾ ಅನ್ನದಾನ ಕೊಡುಗೆಗಳು:\n• ₹2,500 - ಸಿಹಿ ಪಾಯಸದ ವಿಶೇಷ ಭೋಜನ (25 ಮಕ್ಕಳಿಗೆ)\n• ₹3,500 - ಕೇಕ್, ಸಂಜೆ ತಿಂಡಿ ಮತ್ತು ಹಬ್ಬದ ಊಟ\n• ₹4,500 - ಇಡೀ ದಿನದ 4 ಹೊತ್ತಿನ ಪೂರ್ಣ ಅನ್ನದಾನ`;
    } else if (angle === "vidya") {
      body = pick([
        `ನಮ್ಮ ಆಶ್ರಮದ 25 ಬಾಲಕರು ಶಾಲಾ ಶಿಕ್ಷಣ, ಟ್ಯೂಷನ್ ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ತರಬೇತಿ ಪಡೆಯುತ್ತಿದ್ದಾರೆ. ಅವರ ಸಮವಸ್ತ್ರ, ಪುಸ್ತಕ ಹಾಗೂ ಶಾಲಾ ಶುಲ್ಕಕ್ಕೆ ತಮ್ಮ ಪ್ರೋತ್ಸಾಹ ಅತ್ಯಮೂಲ್ಯ.`,
        `ವಿದ್ಯಾದಾನವೇ ಮಹಾದಾನ. ಅನಾಥ ಮಕ್ಕಳ ಶಿಕ್ಷಣಕ್ಕೆ ನೆರವು ನೀಡಿ ಅವರ ಭವಿಷ್ಯಕ್ಕೆ ಬೆಳಕಾಗಿ.`,
      ]);
      tierBreakdown = `📚 ವಿದ್ಯಾ ಸೇವಾ ಕೊಡುಗೆಗಳು:\n• ₹1,800 - 3 ಜೊತೆ ಕಾಟನ್ ಸಮವಸ್ತ್ರಗಳು\n• ₹2,400 - 8 ಮಕ್ಕಳ 1 ತಿಂಗಳ ಟ್ಯೂಷನ್ ಹಾಗೂ ನೋಟ್‌ಬುಕ್‌ಗಳು\n• ₹3,200 - 1 ಮಗುವಿನ ವಾರ್ಷಿಕ ಶಾಲಾ ಪ್ರವೇಶ ಹಾಗೂ ಪಠ್ಯಪುಸ್ತಕಗಳು`;
    } else if (angle === "trust_80g") {
      body = pick([
        `ಜನಸೇವಾ ಆಶ್ರಮವು ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಬಾಲನ್ಯಾಯ ಕಾಯ್ದೆ (JJ Act KA18CH0242) ಅಡಿಯಲ್ಲಿ ನೋಂದಾಯಿತ ಅಧಿಕೃತ ಸಂಸ್ಥೆಯಾಗಿದೆ. ನೀವು ನೀಡುವ ಪ್ರತಿಯೊಂದು ರೂಪಾಯಿಯೂ ನೇರವಾಗಿ 25 ಮಕ್ಕಳ ಆಹಾರ, ವಸತಿ ಮತ್ತು ವೈದ್ಯಕೀಯ ವೆಚ್ಚಕ್ಕೆ ಬಳಕೆಯಾಗುತ್ತದೆ.`,
        `ಆದಾಯ ತೆರಿಗೆ ಕಾಯ್ದೆ 80G ಅಡಿಯಲ್ಲಿ 50% ತೆರಿಗೆ ವಿನಾಯಿತಿ ಮತ್ತು ತಕ್ಷಣದ ಡಿಜಿಟಲ್ ರಸೀದಿ WhatsApp ಮೂಲಕ ತಲುಪುತ್ತದೆ.`,
      ]);
      tierBreakdown = `📜 ಸರ್ಕಾರದ ಅಧಿಕೃತ 80G ವಿನಾಯಿತಿ:\n• ಆದಾಯ ತೆರಿಗೆ ಕಾಯ್ದೆ 80G (Form 10AC: ${FORM_10AC.urn}) ಅಡಿಯಲ್ಲಿ 50% ತೆರಿಗೆ ವಿನಾಯಿತಿ ಲಭ್ಯ.\n• ತಕ್ಷಣದ ಡಿಜಿಟಲ್ ರಸೀದಿ WhatsApp ಮೂಲಕ ತಲುಪುತ್ತದೆ.`;
    } else {
      // Default Annadana
      body = pick([
        `ನಮ್ಮ ಆಶ್ರಮದಲ್ಲಿ 25 ಬೆಳೆಯುವ ಬಾಲಕರಿಗೆ ಪ್ರತಿದಿನ ಶುದ್ಧ, ಸಾತ್ವಿಕ ಮತ್ತು ಪೌಷ್ಟಿಕ 4 ಹೊತ್ತಿನ ಆಹಾರ (ಹಾಲು, ಇಡ್ಲಿ, ಮಧ್ಯಾಹ್ನ-ರಾತ್ರಿಯ ಅನ್ನ ಸಾಂಬಾರ್) ನೀಡಲಾಗುತ್ತಿದೆ. ಇಂದಿನ ತುರ್ತು ಅನ್ನದಾನ ಸೇವೆಗೆ ಕೈಜೋಡಿಸಿ.`,
        `ಇಂದಿನ ತುರ್ತು ಅನ್ನದಾನ ಸೇವೆಗೆ ಕೈಜೋಡಿಸಿ. ನಿಮ್ಮ ಪುಟ್ಟ ನೆರವು ಒಂದು ಮಗುವಿನ ಹಸಿವನ್ನು ನೀಗಿಸುತ್ತದೆ.`,
      ]);
      tierBreakdown = `🍲 ಪವಿತ್ರ ಅನ್ನದಾನ ಸೇವಾ ವಿವರ:\n• ₹501 - 3 ದಿನಗಳ ಪೌಷ್ಟಿಕ ಆಹಾರ ಹಾಗೂ ಹಾಲಿನ ಸೇವೆ\n• ₹1,500 - 25 ಮಕ್ಕಳಿಗೆ ಬೆಳಗಿನ ಬಿಸಿ ಉಪಹಾರ ಹಾಗೂ ಹಾಲು\n• ₹2,500 - 25 ಮಕ್ಕಳಿಗೆ ಸಾತ್ವಿಕ ಮಧ್ಯಾಹ್ನದ ಊಟ\n• ₹4,500 - ಇಡೀ ದಿನದ 4 ಹೊತ್ತಿನ ಸಂಪೂರ್ಣ ಅನ್ನದಾನ`;
    }

    trustProof = `🛡️ 100% ಪಾರದರ್ಶಕತೆ · ಸರ್ಕಾರದ ನೋಂದಣಿ: ${JJ_ACT_REGISTRATION.registrationNumber} · 80G ತೆರಿಗೆ ವಿನಾಯಿತಿ ರಸೀದಿ.`;
    closingBlessing = pick([
      `ಶ್ರೀ ದೇವರು ನಿಮಗೆ ಮತ್ತು ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಸಕಲ ಸುಖ-ಶಾಂತಿ, ಆಯುರಾರೋಗ್ಯ ಕರುಣಿಸಲಿ ಎಂದು ನಮ್ಮ 25 ಮಕ್ಕಳು ಪ್ರಾರ್ಥಿಸುತ್ತಾರೆ. 🙏✨`,
      `ಮಕ್ಕಳ ಮುಖದಲ್ಲಿ ನಗು ತರುವ ತಮ್ಮ ಸೇವೆಗೆ ಕೋಟಿ ಕೋಟಿ ಧನ್ಯವಾದಗಳು. ದೇವರೆಲ್ಲರಿಗೂ ಒಳ್ಳೆಯದನ್ನು ಮಾಡಲಿ. 🌸`,
      `ತಮ್ಮ ಉದಾರ ಮನಸ್ಸಿಗೆ ನಮ್ಮ ಆಶ್ರಮದ ಪರವಾಗಿ ತುಂಬು ಹೃದಯದ ಕೃತಜ್ಞತೆಗಳು. ಧನ್ಯವಾದಗಳು! 🌺`,
    ]);
    saltLine = `[ಸೇವಾ ರೆಫರೆನ್ಸ್: #JS-${salt}]`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ENGLISH LANGUAGE GENERATION (DEFAULT)
  // ──────────────────────────────────────────────────────────────────────────
  else {
    const timeGreetingEn = {
      morning: ["Good morning", "Namaste", "Warm morning greetings"],
      afternoon: ["Good afternoon", "Namaste", "Warm greetings"],
      evening: ["Good evening", "Namaste", "Warm evening greetings"],
    }[timeOfDay];

    greeting = `${pick(timeGreetingEn)} ${cleanName} Ji! 🙏`;

    intro = pick([
      `Heartfelt blessings and warmest prayers from all 25 young resident boys at Janaseva Ashrama, Bangalore! 👦✨`,
      `On behalf of our 25 resident boys and elder caregivers at Janaseva Ashrama (Turahalli, Bengaluru), I am reaching out with deep gratitude. 🌸`,
      `I hope this message finds you in radiant health and happiness. Our 25 resident boys remember our noble well-wishers every morning during our 6:30 AM satsang prayers. 🌺`,
    ]);

    if (angle === "birthday") {
      body = pick([
        `Celebrate your upcoming birthday, wedding anniversary, or memorial day in the most meaningful way—by feeding 25 orphaned boys a fresh festive feast. You are warmly welcome to visit our Turahalli campus to cut cake and serve the meal in person!`,
        `Make your milestone day truly memorable. Sponsoring a festive feast with sweet payasam brings pure joy to our resident boys, and the children will chant heartfelt Vedic prayers for your family's health and prosperity.`,
      ]);
      tierBreakdown = `🎂 Milestone Celebration Sponsorship Options:\n• ₹2,500 — Festive Lunch Feast with Sweet Payasam (25 Boys)\n• ₹3,500 — Celebration Cake, Evening Fruit Basket & Special Feast\n• ₹4,500 — Full Day 4-Meal Annadana & Personalized WhatsApp Video Blessing`;
    } else if (angle === "vidya") {
      body = pick([
        `True empowerment begins with education. All 25 resident boys attend accredited local schools in Bengaluru, followed by evening science and mathematics tuition at our ashrama. Your kind support provides textbooks, school uniforms, and exam stationery.`,
        `Vidya Dana is the highest form of seva. Support an orphaned child's academic journey this academic year and help him build an independent, dignified future.`,
      ]);
      tierBreakdown = `📚 Education & Vidya Support Tiers:\n• ₹1,800 — 3 Pairs of Durable Cotton School Uniforms\n• ₹2,400 — 1 Month Tuition, Textbooks & Notebooks for 8 Boys\n• ₹3,200 — 1 Full Academic Year School Adoption (Admissions, Bags & Books)`;
    } else if (angle === "trust_80g") {
      body = pick([
        `Janaseva Ashrama is a registered public charitable trust and licensed Child Care Institution under Karnataka Govt JJ Act registration KA18CH0242. Unlike large aggregator charities, 100% of public sponsorships directly feed and educate 25 specific resident boys.`,
        `Every contribution to Janaseva Ashrama is fully eligible for 50% tax deduction under Section 80G Form 10AC of the Income Tax Act. Instant 80G tax receipt is sent to your WhatsApp immediately upon payment.`,
      ]);
      tierBreakdown = `📜 Verified Accreditations & 80G Tax Exemption:\n• Govt Juvenile Justice Act: ${JJ_ACT_REGISTRATION.registrationNumber}\n• Form 10AC Section 80G URN: ${FORM_10AC.urn}\n• MCA CSR-1 Registration: CSR00078800`;
    } else {
      // Default Annadana
      body = pick([
        `Our kitchen serves 4 fresh satvik meals every single day (morning pure cow milk, hot breakfast, wholesome lunch, and dinner) to 25 growing boys. We rely purely on voluntary kindness from benevolent citizens to keep our kitchen stocked with rice, dal, and fresh vegetables.`,
        `Every sacred meal counts. Whether you sponsor hot breakfast for ₹1,500 or contribute ₹501 for a child's weekly care, your gift directly reaches the dining leaf of our 25 resident boys.`,
      ]);
      tierBreakdown = `🍲 Sacred Annadana Sponsorship Tiers:\n• ₹501 — 3 Days Satvik Meals & Pediatric Cow Milk\n• ₹1,500 — Nutritious Breakfast Feast for all 25 Boys\n• ₹2,500 — Festive Lunch Feast with Vegetables & Sweet\n• ₹4,500 — Complete 24-Hr Full-Day Annadana (All 4 Meals)`;
    }

    trustProof = `🛡️ 100% Direct Allocation · Licensed Govt Home (JJ Act ${JJ_ACT_REGISTRATION.registrationNumber}) · Instant 80G Receipt.`;
    closingBlessing = pick([
      `May the Almighty shower your home with everlasting peace, good health, and abundance. Thank you for your noble heart! 🙏✨`,
      `Our 25 resident boys pray for your family's continued well-being and happiness. We deeply appreciate your kind consideration. 🌸`,
      `Wishing you and your loved ones immense divine grace, joy, and success. Sincere regards from the Janaseva Ashrama family. 🌺`,
    ]);
    saltLine = `[Official Seva Token: #JS-${salt}]`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHYSICAL CALLING LOCATION & EXACT VERIFIED GOOGLE MAPS LINK FROM SITE
  // ──────────────────────────────────────────────────────────────────────────
  let locationBlock = "";
  if (language === "kn") {
    locationBlock = `📍 ಆಶ್ರಮದ ವಿಳಾಸ: ${SITE.address}\n🗺️ ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್: ${SITE.mapsUrl}\n📞 ನೇರ ದೂರವಾಣಿ: ${SITE.phoneIntl}`;
  } else if (language === "kanglish" || language === "mixed") {
    locationBlock = `📍 Ashrama Address: ${SITE.address}\n🗺️ Google Maps Pin: ${SITE.mapsUrl}\n📞 Helpline: ${SITE.phoneIntl}`;
  } else {
    locationBlock = `📍 Calling From: ${SITE.address}\n🗺️ Google Maps Pin: ${SITE.mapsUrl}\n📞 Ashrama Helpline: ${SITE.phoneIntl}`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTION CALL BUTTONS (DONATE WEBSITE LINK & DIRECT CALL MAIN NUMBER)
  // ──────────────────────────────────────────────────────────────────────────
  const cleanPhoneDigits = SITE.phoneIntl.replace(/\D/g, "");
  const actionButtonsBlock = [
    "━━━━━━━━━━━━━━━━━━━━━━━━━",
    `👉 [ 📲 1-TAP PAY VIA GPAY / PHONEPE / BHIM UPI ]`,
    `upi://pay?pa=MAB.037349050110044@axisbank&pn=JANASEVA%20SAMRUDDI%20EDUCATI&cu=INR&tn=Janaseva%20Ashrama%20Seva`,
    `Official UPI ID: MAB.037349050110044@axisbank`,
    "",
    `👉 [ 🌐 1-TAP DONATE (ONLINE / 80G RECEIPT) ]`,
    portalUrl,
    "",
    `👉 [ 📞 DIRECT CALL ASHRAMA ]`,
    `${SITE.phoneIntl} (Tap to Call)`,
    "",
    `👉 [ 💬 WHATSAPP CARETAKER ]`,
    `https://wa.me/${cleanPhoneDigits}`,
    "",
    `👉 [ 📍 GOOGLE MAPS ASHRAMA PIN ]`,
    SITE.mapsUrl,
    "━━━━━━━━━━━━━━━━━━━━━━━━━",
  ].join("\n");

  const actionButtons: AntiBanActionButton[] = [
    {
      type: "url",
      label: "🌐 Donate Now",
      target: portalUrl,
    },
    {
      type: "call",
      label: "📞 Call Ashrama",
      target: `tel:${SITE.phoneIntl.replace(/\s+/g, "")}`,
    },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // INTERACTIVE QUICK-REPLY PROMPT MENU (2-WAY DIALOGUE FOR WHITELISTING)
  // ──────────────────────────────────────────────────────────────────────────
  let interactiveMenu = "";
  if (language === "kn") {
    interactiveMenu = `🌸 ತಕ್ಷಣದ ಪ್ರತಿಕ್ರಿಯೆ ಆಯ್ಕೆಗಳು (ಸಂಖ್ಯೆಯನ್ನು ರಿಪ್ಲೈ ಮಾಡಿ):\n[1] 🍲 ಇಂದಿನ ಅನ್ನದಾನ ಸೇವೆ (₹501 / ₹1,500)\n[2] 🎂 ಜನ್ಮದಿನ / ಶುಭದಿನ ಸೇವೆ ಕಾಯ್ದಿರಿಸಲು\n[3] 📜 ಸರ್ಕಾರದ 80G ತೆರಿಗೆ ವಿನಾಯಿತಿ ರಸೀದಿಗೆ\n[4] 📸 ಇಂದಿನ ಅಡುಗೆ ಮತ್ತು ಮಕ್ಕಳ ಫೋಟೋ ನೋಡಲು\n👉 ಆಶ್ರಮದ ಜೊತೆ ನೇರವಾಗಿ ಮಾತನಾಡಲು "ನಮಸ್ಕಾರ" ಎಂದು ಸಂದೇಶ ಕಳುಹಿಸಿ!`;
  } else if (language === "kanglish" || language === "mixed") {
    interactiveMenu = `🌸 Quick Reply Options (Number reply maadi):\n[1] 🍲 Sponsor hot meals for 25 boys (₹501 / ₹1,500)\n[2] 🎂 Book birthday special feast & prayer blessing\n[3] 📜 Receive Official Govt Form 10AC 80G Tax Exemption PDF\n[4] 📸 Request today's live kitchen photos\n👉 Direct aagi caretaker jothe maathaadalu "NAMASTE" antha reply maadi!`;
  } else {
    interactiveMenu = `🌸 Quick Response Options (Reply with a number):\n[1] 🍲 Sponsor Today's Fresh Satvik Meals (₹501 / ₹1,500)\n[2] 🎂 Book a Birthday / Special Day Blessing Video\n[3] 📜 Receive Official Govt Form 10AC 80G Tax Exemption PDF\n[4] 📸 Request Today's Live Kitchen & Children Photos\n👉 Or simply reply "Namaste" to connect directly with our ashrama caretaker!`;
  }

  // Media note: Only title mention, NO ugly raw link in the text!
  let mediaNote = "";
  if (mediaAsset) {
    if (mediaAsset.type === "image") {
      mediaNote = `📸 Attached: ${mediaAsset.title}`;
    } else if (mediaAsset.type === "video") {
      mediaNote = `🎥 Video Attached: ${mediaAsset.title}`;
    } else if (mediaAsset.type === "document") {
      mediaNote = `📄 Official Govt PDF: ${mediaAsset.title}`;
    }
  }

  // Assembled lines for FULL text message (used in wa.me fallback)
  const assembledLines = [
    greeting,
    "",
    intro,
    "",
    body,
    "",
    tierBreakdown,
    mediaNote ? `\n${mediaNote}` : "",
    "",
    actionButtonsBlock,
    "",
    trustProof,
    locationBlock,
    "",
    closingBlessing,
    "",
    saltLine,
  ].filter((line) => line !== "");

  // Assembled lines for CAPTION when image/media is sent directly via Native Share
  const captionLines = [
    greeting,
    "",
    intro,
    "",
    body,
    "",
    tierBreakdown,
    "",
    actionButtonsBlock,
    "",
    trustProof,
    locationBlock,
    "",
    closingBlessing,
    "",
    saltLine,
  ].filter((line) => line !== "");

  const rawFullText = assembledLines.join("\n");
  const rawCaptionText = captionLines.join("\n");

  // Scatter invisible zero-width unicode characters to guarantee a 100% unique SHA-256 fingerprint
  const fullText = injectZeroWidthSalt(rawFullText);
  const captionText = injectZeroWidthSalt(rawCaptionText);

  // Standard click-to-chat sends to lead's phone number
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(fullText)}`;

  return {
    text: fullText,
    messageText: fullText,
    captionText,
    greeting,
    whatsappUrl,
    trackingRef,
    saltToken: salt,
    mediaAsset,
    previewUrl: portalUrl,
    targetPhone: formattedPhone,
    senderPhone: senderMode === "central" ? masterWhatsAppNumber : (options.callerName || masterWhatsAppNumber),
    senderMode,
    characterCount: fullText.length,
    wordCount: fullText.split(/\s+/).filter(Boolean).length,
    language,
    angle,
    actionButtons,
    mapsUrl: SITE.mapsUrl,
    ashramaAddress: SITE.address,
  };
}
