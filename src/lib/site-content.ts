import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentEntries } from "@/db/schema";
import { SITE, CINEMATIC, EMOTIONAL_QUOTES } from "./site";
import { SUPPORTER_CATEGORIES, type SupporterCategory } from "./supporter-form";

export type TodayMealStatusItem = {
  id: string;
  name: string;
  time: string;
  menu: string;
  status: "served" | "open";
  sponsorName: string;
  amount: number;
  ctaText?: string;
};

export type SiteContentMap = {
  // Hero section
  heroHeadline: string;
  heroSubheadline: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroThirdCta: string;
  heroVideoUrl: string;
  heroPosterUrl: string;
  heroFallbackImageUrl: string;

  // About & Ashrama
  aboutTitle: string;
  aboutStory: string;
  residentCount: string;
  mealsCount: string;

  // Contact details
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactHours: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;

  // Social channels
  socialWhatsapp: string;
  socialInstagram: string;
  socialFacebook: string;
  socialX: string;
  socialLinkedin: string;

  // Legal & Tax
  trustRegistration: string;
  trustPan80g: string;
  trustTaxBenefit: string;

  // Documentary Video Chapters
  docChapters: {
    id: string;
    number: string;
    title: string;
    subtitle: string;
    duration: string;
    videoSrc: string;
    posterSrc: string;
    associatedSlug: string;
    associatedItemName: string;
    associatedPrice: number;
    description: string;
  }[];

  // Caregiver Voices / Quotes
  quotes: {
    quote: string;
    author: string;
    role: string;
    context: string;
    tag: string;
  }[];

  // Frequently Asked Questions
  faqs: {
    question: string;
    answer: string;
    category?: string;
  }[];

  // Delivered Celebration WhatsApp Wish Videos
  wishVideos: WishVideoItem[];

  // Live Daily Meals Status Tracker
  todayMealsStatus: TodayMealStatusItem[];

  // 5 Official Support Tiers & Pricing
  supportTiers: SupporterCategory[];

  // Volunteer & Community Showcase Media
  volunteerVideoUrl?: string;
  volunteerPhotoUrl?: string;
  creatorReelUrl?: string;
  creatorPhotoUrl?: string;

  // Special Celebration & Birthday Packages (Pricing, Menus & WhatsApp Video Cost)
  celebrationPackages: CelebrationPackageItem[];
  celebrationVideoCost: number;
  celebrationVideoHeading: string;
  celebrationVideoDescription: string;
  celebrationVideoCallCost: number;
  celebrationVideoCallTitle: string;

  // Divine Shagun Tiers (Milk ₹11 to Sarva Seva ₹5,001)
  shagunTiers: ShagunTierItem[];

  // On-Ground NGO Field Initiatives
  ngoActivities: NgoActivityItem[];

  // Official Bank Account & Legal Registration Details
  bankDetails: BankDetailsItem;
};

export type CelebrationPackageItem = {
  id: string;
  name: string;
  price: number;
  highlight?: boolean;
  menu: string[];
  servings: string;
  videoBlessingIncluded?: boolean;
  videoCallOptionEnabled?: boolean;
  videoCost?: number;
};

export type ShagunTierItem = {
  amount: number;
  name: string;
  kannada: string;
  meaning: string;
  icon: string;
  isPopular?: boolean;
};

export type NgoActivityItem = {
  id: string;
  category: "food" | "health" | "cleanliness" | "education" | "village";
  categoryLabel: string;
  title: string;
  subtitle: string;
  cadence: string;
  image: string;
  metricBadge: string;
  emotionalTag: string;
  shortDesc: string;
  keyPoints: string[];
  suggestedAmount: number;
  tierName: string;
  volunteerRole: string;
};

export type BankDetailsItem = {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  accountHolder: string;
  accountType: string;
  upiVpa: string;
  jjActRegNo: string;
  form10acUrn: string;
  csrRegistration: string;
  darpanId: string;
};

export type WishVideoItem = {
  id: string;
  celebrantName: string;
  occasion: string;
  donorName: string;
  deliveredDate: string;
  packageTitle: string;
  packageCost: number;
  videoUrl: string;
  thumbnailUrl?: string;
  quote: string;
};

export const DEFAULT_CELEBRATION_PACKAGES: CelebrationPackageItem[] = [
  {
    id: "breakfast",
    name: "Morning Energy Breakfast",
    price: 1500,
    menu: ["Steaming Idlis or Khara Bath", "Fresh Coconut Chutney", "Hot Sambar", "Warm Milk for all children"],
    servings: "All 25 resident children",
    videoBlessingIncluded: true,
    videoCallOptionEnabled: true,
    videoCost: 0,
  },
  {
    id: "lunch-special",
    name: "Festive Special Lunch with Payasam",
    price: 3500,
    highlight: true,
    menu: ["Hot Rice & Ghee", "Traditional South Indian Sambar & Rasam", "Crispy Pooris & Veg Sagu", "Traditional Sweet Payasam / Halwa", "Crisp Papads & Curd"],
    servings: "Complete festive lunch for all 25 children",
    videoBlessingIncluded: true,
    videoCallOptionEnabled: true,
    videoCost: 0,
  },
  {
    id: "evening-snacks",
    name: "Evening Celebration & Fruit Basket",
    price: 2500,
    menu: ["Warm Badam Milk", "Healthy Evening Savouries", "Fresh Apples & Bananas Fruit Basket", "Special Birthday Biscuits"],
    servings: "Joyful evening snack time for 25 children",
    videoBlessingIncluded: true,
    videoCallOptionEnabled: true,
    videoCost: 0,
  },
  {
    id: "grand-birthday",
    name: "Grand Birthday Feast & Cake Cutting",
    price: 5500,
    menu: ["Large Eggless Birthday Cake", "Special Festive Lunch with Sweets", "Fresh Fruit Basket & Payasam", "Evening Hot Milk & Snacks"],
    servings: "Grand celebratory feast & cake distribution for 25 children",
    videoBlessingIncluded: true,
    videoCallOptionEnabled: true,
    videoCost: 0,
  },
  {
    id: "full-day",
    name: "Grand Full-Day Nourishment & Care",
    price: 8500,
    menu: ["Wholesome Morning Breakfast", "Festive Birthday Lunch with Sweets", "Evening Snacks & Fresh Fruits", "Warm Wholesome Dinner"],
    servings: "24-hour total nutritional sponsorship for the Ashrama",
    videoBlessingIncluded: true,
    videoCallOptionEnabled: true,
    videoCost: 0,
  },
];

export const DEFAULT_SHAGUN_TIERS: ShagunTierItem[] = [
  { amount: 11, name: "Ekadashi Shagun", kannada: "ಶುಭ ಹಾಲು ಸೇವೆ", meaning: "1 Glass Pure Morning Cow Milk for 1 Boy", icon: "🥛" },
  { amount: 21, name: "Dharma Jyothi", kannada: "ಹಣ್ಣು ಪೋಷಣೆ", meaning: "Fresh Banana & Morning Fruit Nutrition", icon: "🍌" },
  { amount: 51, name: "Pancha Bhoota", kannada: "ಬೆಳಗಿನ ಬಿಸಿ ತಿಂಡಿ", meaning: "Steaming Hot Idlis & Sambar Breakfast for 1 Boy", icon: "🍲" },
  { amount: 101, name: "Punya Annadana", kannada: "ಮಧ್ಯಾಹ್ನದ ಅನ್ನದಾನ", meaning: "Full Hot Lunch (Rice, Dal, Sabzi & Curd) for 1 Boy", icon: "🍛", isPopular: true },
  { amount: 251, name: "Saraswati Vidya", kannada: "ವಿದ್ಯಾ ಕಿಟ್ ಸೇವೆ", meaning: "School Notebooks, Geometry & Stationery Kit", icon: "📚" },
  { amount: 501, name: "Arogya Raksha", kannada: "ಆರೋಗ್ಯ ರಕ್ಷಣೆ", meaning: "Pediatric Health Checkup, Vitamins & Tonic", icon: "🩺" },
  { amount: 1001, name: "Anna Daata", kannada: "ವಾರದ ರೇಷನ್ ಸೇವೆ", meaning: "1-Week Kitchen Vegetables & Sona Masoori Rice", icon: "🍚" },
  { amount: 2101, name: "Maha Prasada", kannada: "ಸಿಹಿ ಪಾಯಸದ ಹಬ್ಬ", meaning: "Festival Sweet Payasam Feast for All 25 Boys", icon: "🎉" },
  { amount: 2501, name: "Sampoorna Bhojana", kannada: "ಎಲ್ಲಾ 25 ಮಕ್ಕಳಿಗೆ ಊಟ", meaning: "1-Time Full Dining Hall Feast for All 25 Boys", icon: "🥘" },
  { amount: 5001, name: "Sarva Seva", kannada: "ಸಂಪೂರ್ಣ ದಿನದ ಅನ್ನದಾನ", meaning: "Full Day All 3 Meals + Snacks for All 25 Boys", icon: "👑" },
];

export const DEFAULT_NGO_ACTIVITIES: NgoActivityItem[] = [
  {
    id: "food-distribution",
    category: "food",
    categoryLabel: "Annadana & Meals",
    title: "Hot Meal Feeds & Hunger Relief",
    subtitle: "Fresh satvik food served with dignity",
    cadence: "Weekly Seva & Drives",
    image: "/media/banana-leaf-feast.jpg",
    metricBadge: "15,000+ Meals Served",
    emotionalTag: "🍲 Zero hunger for destitute elders",
    shortDesc: "Beyond daily campus cooking, we distribute hot rice, aromatic sambar, and fresh vegetables to homeless elders and hospital bystanders.",
    keyPoints: ["Freshly prepared satvik meals", "Eco-friendly leaf-lined packaging", "Dignity and warmth for every soul"],
    suggestedAmount: 4500,
    tierName: "Tier 01: Full Day Annadana",
    volunteerRole: "Kitchen Seva & Distribution",
  },
  {
    id: "health-camps",
    category: "health",
    categoryLabel: "Healthcare & Arogya",
    title: "Free Medical Camps & Pediatric Care",
    subtitle: "Healing hands for children and elders",
    cadence: "Monthly Health Camp",
    image: "/media/ashrama_yoga_terrace.jpg",
    metricBadge: "100% Children Screened",
    emotionalTag: "🩺 Complete paediatric vigilance",
    shortDesc: "Volunteer pediatricians and dentists provide comprehensive growth checkups, blood tests, eye screenings, and medicine kits.",
    keyPoints: ["Quarterly pediatric checkups", "Vital vitamins & deworming", "Mental health & loving mentorship"],
    suggestedAmount: 6000,
    tierName: "Tier 03: Comprehensive Healthcare",
    volunteerRole: "Medical Seva & Coordination",
  },
  {
    id: "education-vidya",
    category: "education",
    categoryLabel: "Vidya & Education",
    title: "Evening Tuition & Digital Literacy",
    subtitle: "Modern learning for bright futures",
    cadence: "Daily 5:30 PM - 8:00 PM",
    image: "/media/education.jpg",
    metricBadge: "100% Pass Rate",
    emotionalTag: "📚 Knowledge breaks poverty cycles",
    shortDesc: "Daily homework supervision, STEM experiments, spoken English coaching, and computer labs build self-reliant scholars.",
    keyPoints: ["1-on-1 subject tutoring", "Computer skills & internet safety", "School uniforms, bags & kits"],
    suggestedAmount: 3500,
    tierName: "Tier 02: Full Academic Support",
    volunteerRole: "Teacher / Weekend Mentor",
  },
  {
    id: "sports-culture",
    category: "village",
    categoryLabel: "Sports & Culture",
    title: "Yoga, Martial Arts & Cricket Club",
    subtitle: "Physical fitness, discipline & mental peace",
    cadence: "Daily Morning & Evening",
    image: "/media/play.jpg",
    metricBadge: "Active Daily Coaching",
    emotionalTag: "🏏 Healthier bodies, stronger minds",
    shortDesc: "Courtyard yoga sessions, athletic sprints, cricket coaching, and Indian cultural shlokas nurture well-rounded confidence.",
    keyPoints: ["Morning Surya Namaskar & Pranayama", "Cricket, badminton & board games", "Traditional shloka recitation"],
    suggestedAmount: 2500,
    tierName: "Tier 04: Holistic Living",
    volunteerRole: "Sports Coach / Activity Leader",
  },
];

export const DEFAULT_BANK_DETAILS: BankDetailsItem = {
  bankName: "Axis Bank",
  accountNumber: "913020019616990",
  ifsc: "UTIB0000102",
  branch: "Banashankari",
  accountHolder: "Janaseva Samruddi Education & Rural Development Society (R)",
  accountType: "Current Account",
  upiVpa: "janaseva.ashrama@axisbank",
  jjActRegNo: "KA18CH0242",
  form10acUrn: "AABTJ7431MF20231",
  csrRegistration: "CSR00078945",
  darpanId: "KA/2021/0284729",
};

export const DEFAULT_SITE_CONTENT: SiteContentMap = {
  heroHeadline: SITE.headline,
  heroSubheadline: "See what today looks like at Janaseva Ashrama - and choose how you want to be part of tomorrow.",
  heroPrimaryCta: "MAKE AN IMPACT",
  heroSecondaryCta: "SEE TODAY",
  heroThirdCta: "GET INVOLVED",
  heroVideoUrl: CINEMATIC.videoDesktop,
  heroPosterUrl: CINEMATIC.posterDesktop,
  heroFallbackImageUrl: "/media/learning.jpg",

  aboutTitle: SITE.legalName,
  aboutStory: "Dedicated to nurturing 25 resident children in our orphanage with unconditional motherly love, hot wholesome meals, modern education, and joyful childhood dignity in Bengaluru.",
  residentCount: "25 Resident Children",
  mealsCount: "3 Wholesome Hot Meals Daily",

  contactPhone: SITE.phoneIntl,
  contactEmail: SITE.email,
  contactAddress: SITE.address,
  contactHours: SITE.visitingHours,
  googleMapsUrl: SITE.mapsUrl,
  googleMapsEmbedUrl: SITE.mapsEmbedUrl,

  socialWhatsapp: `https://wa.me/${SITE.whatsapp}`,
  socialInstagram: SITE.instagramUrl,
  socialFacebook: SITE.facebookUrl,
  socialX: SITE.twitterUrl,
  socialLinkedin: SITE.linkedinUrl,

  trustRegistration: SITE.registeredTrust,
  trustPan80g: SITE.taxExemption,
  trustTaxBenefit: "Donations are eligible for 50% deduction under Section 80G of the Indian Income Tax Act.",

  docChapters: [
    {
      id: "chapter1",
      number: "01",
      title: "Dawn & Morning Light",
      subtitle: "Awakening with prayer, gentle routines, and fresh energy",
      duration: "0:45",
      videoSrc: "/media/chapter1_dawn.mp4",
      posterSrc: "/media/lawn-cheer-circle.jpg",
      associatedSlug: "fruits",
      associatedItemName: "Fruit & Milk Basket",
      associatedPrice: 150,
      description: "Every morning begins at 6:00 AM with clean routines, fresh courtyard air, and quiet gratitude for a new day.",
    },
    {
      id: "chapter2",
      number: "02",
      title: "The Ashrama Kitchen",
      subtitle: "Wholesome hot meals prepared fresh with motherly care",
      duration: "0:50",
      videoSrc: "/media/chapter2_breakfast.mp4",
      posterSrc: "/media/food.jpg",
      associatedSlug: "meal",
      associatedItemName: "Warm Meal Support",
      associatedPrice: 100,
      description: "Steam rises from giant pots of rice, fresh sambar, and dal. Every child receives dignified, nutritious sustenance.",
    },
    {
      id: "chapter3",
      number: "03",
      title: "Vidya: The Classroom",
      subtitle: "Books, focused homework, and passionate teachers",
      duration: "0:52",
      videoSrc: "/media/chapter3_vidya.mp4",
      posterSrc: "/media/education.jpg",
      associatedSlug: "school-kit",
      associatedItemName: "Complete School Kit",
      associatedPrice: 250,
      description: "Desks filled with determination. Evening study hours turn timid children into bright, ambitious dreamers.",
    },
    {
      id: "chapter4",
      number: "04",
      title: "Play & Unbridled Joy",
      subtitle: "Laughter, games, music, and carefree childhood",
      duration: "0:48",
      videoSrc: "/media/chapter4_play.mp4",
      posterSrc: "/media/play.jpg",
      associatedSlug: "activity",
      associatedItemName: "Sports & Creative Play",
      associatedPrice: 350,
      description: "Childhood must never be lost. Playgrounds echo with cricket shouts, jump ropes, and genuine laughter.",
    },
    {
      id: "chapter5",
      number: "05",
      title: "Evening Shanti & Rest",
      subtitle: "Peaceful reflection, safe dormitories, and sweet dreams",
      duration: "0:40",
      videoSrc: "/media/chapter5_night.mp4",
      posterSrc: "/media/learning.jpg",
      associatedSlug: "bedding",
      associatedItemName: "Bedding & Warm Blanket Set",
      associatedPrice: 600,
      description: "Under warm blankets, the day ends with quiet prayer. Tomorrow is full of promise, sheltered and safe.",
    },
  ],

  quotes: EMOTIONAL_QUOTES,

  faqs: [
    {
      question: "Are donations to Janaseva Ashrama tax deductible under Section 80G?",
      answer: "Yes. Janaseva Ashrama holds Form 10AC Provisional 80G Approval. Donors in India are eligible for a 50% deduction under Section 80G of the Income Tax Act. A verified 80G receipt is automatically generated with every contribution.",
      category: "tax",
    },
    {
      question: "Can I visit Janaseva Ashrama to meet the children or celebrate my birthday?",
      answer: "Yes, visitors are warmly welcome. We encourage donors to celebrate birthdays, anniversaries, or special milestones with the children. Visiting hours are 10:00 AM to 6:00 PM (IST) by prior appointment to respect the children's study and rest schedules.",
      category: "visit",
    },
    {
      question: "How do I know my donation actually reaches the children?",
      answer: "100% of public impact contributions go directly toward verified child welfare items (food, groceries, school kits, healthcare, and clothing). We maintain audited accounts, vendor purchase vouchers, and transparent annual financial reports.",
      category: "transparency",
    },
    {
      question: "Can I sponsor food (Annadana) for all children on a specific day?",
      answer: "Yes. You can sponsor a special celebratory feast or daily meals for all 25 resident children through the Birthday Feast or Annadana package in our Impact Catalogue.",
      category: "donation",
    },
    {
      question: "Where is Janaseva Ashrama located in Bengaluru?",
      answer: "Janaseva Ashrama is situated at #27, Gundu Thopu Turahalli, Near Govt School, Jayanagar housing Society Layout, Subramanyapura, Bangalore - 560061, Karnataka, India.",
      category: "location",
    },
  ],
  wishVideos: [
    {
      id: "wish-1",
      celebrantName: "Little Ananya's 7th Birthday",
      occasion: "7th Birthday",
      donorName: "Priya & Rajesh (Bengaluru)",
      deliveredDate: "Delivered on WhatsApp • 28 Sep 2026",
      packageTitle: "Special Birthday Lunch with Payasam",
      packageCost: 3500,
      videoUrl: "/media/ashrama_video.mp4",
      thumbnailUrl: "/media/meals.jpg",
      quote: "Happy Birthday Ananya Didi! Thank you for the sweet payasam and pooris! We chanted your name and prayed for your health and happiness!",
    },
    {
      id: "wish-2",
      celebrantName: "Dr. & Mrs. Kulkarni's 25th Anniversary",
      occasion: "Silver Jubilee Anniversary",
      donorName: "Siddharth Kulkarni (Indiranagar)",
      deliveredDate: "Delivered on WhatsApp • 01 Oct 2026",
      packageTitle: "Complete Day Nourishment & Fruits",
      packageCost: 7500,
      videoUrl: "/media/chapter2_breakfast.mp4",
      thumbnailUrl: "/media/fruits.jpg",
      quote: "Happy 25th Anniversary Uncle & Aunty! All 25 of us chanted your names during morning prayer and thanked you for the feast!",
    },
    {
      id: "wish-3",
      celebrantName: "Vikram's First Salary Celebration",
      occasion: "First Salary Milestone",
      donorName: "Vikram S. (Whitefield)",
      deliveredDate: "Delivered on WhatsApp • 03 Oct 2026",
      packageTitle: "Evening Snacks & Fresh Fruit Platter",
      packageCost: 2500,
      videoUrl: "/media/chapter4_play.mp4",
      thumbnailUrl: "/media/pantry.jpg",
      quote: "Congratulations Vikram Bhaiya on your first job! May God bless you with immense success in your career!",
    },
  ],
  todayMealsStatus: [
    {
      id: "breakfast",
      name: "7:30 AM Breakfast",
      time: "7:30 AM",
      menu: "Steaming Idlis & Warm Milk",
      status: "served",
      sponsorName: "Sponsored by Bangalore Well-wisher",
      amount: 51,
      ctaText: "Sponsor Morning Milk (₹51)",
    },
    {
      id: "lunch",
      name: "1:00 PM Lunch",
      time: "1:00 PM",
      menu: "Hot Rice, Sambar & Palya",
      status: "served",
      sponsorName: "Sponsored by Devotee Family",
      amount: 101,
      ctaText: "Sponsor Warm Lunch (₹101)",
    },
    {
      id: "snack",
      name: "4:30 PM Snack",
      time: "4:30 PM",
      menu: "Fresh Fruit & Pure Milk",
      status: "open",
      sponsorName: "Open for Sponsorship",
      amount: 51,
      ctaText: "Sponsor Fruits & Milk (₹51) →",
    },
    {
      id: "dinner",
      name: "8:00 PM Dinner",
      time: "8:00 PM",
      menu: "Hot Wholesome Dinner",
      status: "open",
      sponsorName: "Open for Sponsorship",
      amount: 101,
      ctaText: "Sponsor Punya Meal (₹101) →",
    },
  ],
  supportTiers: SUPPORTER_CATEGORIES,
  volunteerVideoUrl: "/media/ashrama_video.mp4",
  volunteerPhotoUrl: "/media/volunteers.jpg",
  creatorReelUrl: "/media/ashrama_journey.mp4",
  creatorPhotoUrl: "/media/community.jpg",

  celebrationPackages: DEFAULT_CELEBRATION_PACKAGES,
  celebrationVideoCost: 0,
  celebrationVideoHeading: "Personalized WhatsApp Singing Video Blessing",
  celebrationVideoDescription: "Children chant celebrant name in prayer hall, sing auspicious songs, and caregiver sends HD video + photos on WhatsApp within 2 hours of meal serving.",
  celebrationVideoCallCost: 0,
  celebrationVideoCallTitle: "Live WhatsApp Video Call with Boys (10 Mins During Feast)",

  shagunTiers: DEFAULT_SHAGUN_TIERS,
  ngoActivities: DEFAULT_NGO_ACTIVITIES,
  bankDetails: DEFAULT_BANK_DETAILS,
};

const SITE_CONTENT_SLUG = "global-site-content";

export async function getSiteContentMap(): Promise<SiteContentMap> {
  try {
    const [row] = await db
      .select()
      .from(contentEntries)
      .where(and(eq(contentEntries.type, "settings"), eq(contentEntries.slug, SITE_CONTENT_SLUG)))
      .limit(1);

    if (!row || !row.body) return DEFAULT_SITE_CONTENT;

    const parsed = JSON.parse(row.body);
    const heroVideoUrl = parsed.heroVideoUrl || DEFAULT_SITE_CONTENT.heroVideoUrl;

    return {
      ...DEFAULT_SITE_CONTENT,
      ...parsed,
      heroVideoUrl,
      heroPosterUrl: parsed.heroPosterUrl || "/media/poster-desktop.jpg",
      volunteerVideoUrl: parsed.volunteerVideoUrl || DEFAULT_SITE_CONTENT.volunteerVideoUrl,
      volunteerPhotoUrl: parsed.volunteerPhotoUrl || DEFAULT_SITE_CONTENT.volunteerPhotoUrl,
      creatorReelUrl: parsed.creatorReelUrl || DEFAULT_SITE_CONTENT.creatorReelUrl,
      creatorPhotoUrl: parsed.creatorPhotoUrl || DEFAULT_SITE_CONTENT.creatorPhotoUrl,
      docChapters: parsed.docChapters || DEFAULT_SITE_CONTENT.docChapters,
      quotes: parsed.quotes || DEFAULT_SITE_CONTENT.quotes,
      faqs: parsed.faqs || DEFAULT_SITE_CONTENT.faqs,
      wishVideos: parsed.wishVideos || DEFAULT_SITE_CONTENT.wishVideos,
      todayMealsStatus: parsed.todayMealsStatus || DEFAULT_SITE_CONTENT.todayMealsStatus,
      supportTiers: parsed.supportTiers || DEFAULT_SITE_CONTENT.supportTiers,
      celebrationPackages: parsed.celebrationPackages || DEFAULT_SITE_CONTENT.celebrationPackages,
      celebrationVideoCost: typeof parsed.celebrationVideoCost === "number" ? parsed.celebrationVideoCost : DEFAULT_SITE_CONTENT.celebrationVideoCost,
      celebrationVideoHeading: parsed.celebrationVideoHeading || DEFAULT_SITE_CONTENT.celebrationVideoHeading,
      celebrationVideoDescription: parsed.celebrationVideoDescription || DEFAULT_SITE_CONTENT.celebrationVideoDescription,
      celebrationVideoCallCost: typeof parsed.celebrationVideoCallCost === "number" ? parsed.celebrationVideoCallCost : DEFAULT_SITE_CONTENT.celebrationVideoCallCost,
      celebrationVideoCallTitle: parsed.celebrationVideoCallTitle || DEFAULT_SITE_CONTENT.celebrationVideoCallTitle,
      shagunTiers: parsed.shagunTiers || DEFAULT_SITE_CONTENT.shagunTiers,
      ngoActivities: parsed.ngoActivities || DEFAULT_SITE_CONTENT.ngoActivities,
      bankDetails: { ...DEFAULT_SITE_CONTENT.bankDetails, ...(parsed.bankDetails || {}) },
    };
  } catch (err) {
    console.error("Error reading site content settings:", err);
    return DEFAULT_SITE_CONTENT;
  }
}

export async function saveSiteContentMap(data: Partial<SiteContentMap>): Promise<boolean> {
  try {
    const current = await getSiteContentMap();
    const updated = { ...current, ...data };
    const serialized = JSON.stringify(updated);

    const [existing] = await db
      .select({ id: contentEntries.id })
      .from(contentEntries)
      .where(and(eq(contentEntries.type, "settings"), eq(contentEntries.slug, SITE_CONTENT_SLUG)))
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
        type: "settings",
        slug: SITE_CONTENT_SLUG,
        title: "Global Website Settings and Copy",
        body: serialized,
        status: "published",
      });
    }

    return true;
  } catch (err) {
    console.error("Error saving site content settings:", err);
    return false;
  }
}
