import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentEntries } from "@/db/schema";
import { SITE, CINEMATIC, EMOTIONAL_QUOTES } from "./site";

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
  aboutStory: "Dedicated to nurturing 48+ resident children with unconditional motherly love, hot wholesome meals, modern education, and joyful childhood dignity in Bengaluru.",
  residentCount: "48+ Resident Children",
  mealsCount: "3 Wholesome Hot Meals Daily",

  contactPhone: SITE.phoneIntl,
  contactEmail: SITE.email,
  contactAddress: SITE.address,
  contactHours: SITE.visitingHours,
  googleMapsUrl: SITE.mapsUrl,

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
      posterSrc: "/media/garden.jpg",
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
      answer: "Yes. You can sponsor a special celebratory feast or daily meals for all 48 resident children through the Birthday Feast or Annadana package in our Impact Catalogue.",
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
      quote: "Happy 25th Anniversary Uncle & Aunty! All 48 of us chanted your names during morning prayer and thanked you for the feast!",
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
    return {
      ...DEFAULT_SITE_CONTENT,
      ...parsed,
      docChapters: parsed.docChapters || DEFAULT_SITE_CONTENT.docChapters,
      quotes: parsed.quotes || DEFAULT_SITE_CONTENT.quotes,
      faqs: parsed.faqs || DEFAULT_SITE_CONTENT.faqs,
      wishVideos: parsed.wishVideos || DEFAULT_SITE_CONTENT.wishVideos,
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
