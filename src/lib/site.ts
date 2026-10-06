export const FORM_10AC = {
  formNumber: "FORM NO. 10AC",
  rule: "See rule 17A/11AA/2C",
  orderTitle: "Order for provisional approval",
  pan: "AABTJ7431M",
  legalName: "JANA SEVA SAMRUDDI EDUCATION & RURAL DEVELOPMENT SOCIETY R",
  natureOfActivities: "Charitable",
  din: "AABTJ7431MF2023101",
  applicationNumber: "211740570280823",
  urn: "AABTJ7431MF20231",
  section: "12-Clause (iv) of first proviso to sub-section (5) of section 80G",
  approvalDate: "04-09-2023",
  approvalDateFormatted: "04 September 2023",
  assessmentYears: "From AY 2024-25 to AY 2026-2027",
  approvingAuthority: "Principal Commissioner of Income Tax / Commissioner of Income Tax",
  digitallySignedBy: "AMRITA RANJAN",
  signedDate: "2023.09.04 18:33:39 IST",
  deductionBenefit: "50% Deduction under Section 80G of Income Tax Act, 1961",
  // Registered Society Address (Row 2b of Form 10AC)
  registeredAddress: {
    doorNo: "No.26/34",
    premises: "50 Feet Road, T G Layout",
    postOffice: "Kathriguppe S.O",
    locality: "Bangalore South",
    city: "BANGALORE",
    district: "BANGALORE",
    state: "Karnataka",
    pincode: "560085",
    country: "INDIA",
    full: "No.26/34, 50 Feet Road, T G Layout, Kathriguppe S.O, Bangalore South, BANGALORE, Karnataka 560085, INDIA",
  },
  // Operational Shelter Facility (Children's Home / Orphanage)
  operationalFacility: {
    name: "Janaseva Ashrama",
    type: "Children's Residential Home & Orphanage",
    address: "#27, Gundu Thopu Turahalli, Near Govt School, Jayanagar housing Society Layout, Subramanyapura, Bangalore - 560061",
    locality: "Turahalli, Subramanyapura",
    city: "Bangalore",
    pincode: "560061",
  },
};

export const SITE = {
  name: "JANASEVA ASHRAMA",
  short: "Janaseva",
  legalName: FORM_10AC.legalName,
  pan: FORM_10AC.pan,
  urn: FORM_10AC.urn,
  din: FORM_10AC.din,
  applicationNumber: FORM_10AC.applicationNumber,
  entityType: "Registered Charitable Society & Children's Home (Orphanage)",
  headline: "A HOME TODAY. A FUTURE WE BUILD TOGETHER.",
  tagline: "Service to children without families is the highest temple of devotion.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://janasevaorphanage.org",
  phone: "9980359595",
  phoneIntl: "+919980359595",
  whatsapp: "919980359595",
  email: "janasevaorphanage31@gmail.com",
  /** Replace once official handles are confirmed. */
  instagramUrl: "https://instagram.com/janasevaashrama",
  facebookUrl: "https://facebook.com/janasevaashrama",
  twitterUrl: "https://x.com/janasevaashrama",
  linkedinUrl: "https://linkedin.com/company/janaseva-ashrama",
  // Operational Bangalore Ashrama Facility
  address: "#27, Gundu Thopu Turahalli, Near Govt School, Jayanagar housing Society Layout, Subramanyapura, Bangalore - 560061",
  registeredOffice: FORM_10AC.registeredAddress.full,
  locality: "Turahalli, Subramanyapura",
  city: "Bangalore",
  state: "Karnataka",
  country: "India",
  pincode: "560061",
  geo: {
    latitude: 12.8942,
    longitude: 77.5361,
  },
  visitingHours: "Monday to Sunday: 10:00 AM to 6:00 PM (IST) with prior telephone appointment",
  mapsUrl: "https://maps.google.com/?q=27+Gundu+Thopu+Turahalli+Subramanyapura+Bangalore+560061",
  mapsEmbedUrl: "https://www.google.com/maps?q=Turahalli+Subramanyapura+Bangalore+560061&output=embed",
  taxExemption: "Provisional 80G Approval (Form 10AC, URN: AABTJ7431MF20231) covering AY 2024-25 to AY 2026-27",
  registeredTrust: "Registered Charitable Society (Karnataka) under Section 12A/80G",
};

export const EMOTIONAL_QUOTES = [
  {
    quote: "When you fill a child's plate, you don't just nourish a body - you restore a child's belief that the world is kind.",
    author: "Sunita Bai",
    role: "Head Caregiver & Matron",
    context: "Janaseva Kitchen & Care",
    tag: "Nourishment & Care",
  },
  {
    quote: "When young Rajesh received his very own school uniform and books with his name, he held them to his chest. Today he is dreaming of becoming an engineer.",
    author: "Ramesh K.",
    role: "Volunteer Teacher & Mentor",
    context: "Evening Study Hour",
    tag: "Education & Dreams",
  },
  {
    quote: "Manava Sevaye Madhava Seva: Service to children without families is the highest temple of devotion.",
    author: "Seva Wisdom",
    role: "Spiritual Ethos",
    context: "Ashrama Philosophy",
    tag: "Sacred Giving",
  },
  {
    quote: "Janaseva gave me a loving family when I had nowhere to turn. Today, as a graduate, I know every rupee given here changes a destiny forever.",
    author: "Kavitha M.",
    role: "Ashrama Alumni & Educator",
    context: "Class of 2022",
    tag: "Alumni Story",
  },
];

/**
 * Cinematic master video. Drop real Ashrama footage at these paths (or change them).
 * Poster is always shown first; if a video fails, the poster stays.
 */
export const CINEMATIC = {
  videoDesktop: "/media/master-mobile.mp4",
  videoMobile: "/media/master-mobile.mp4",
  posterDesktop: "/media/poster-desktop.jpg",
  posterMobile: "/media/poster.jpg",
};

export const CHAPTERS = [
  { kicker: "Morning", text: "Every morning, a home wakes up." },
  { kicker: "Daily life", text: "Meals. Lessons. Laughter. Care." },
  { kicker: "Real needs", text: "Real days. Real people. Real needs." },
  { kicker: "Today", text: "A home today." },
  { kicker: "Tomorrow", text: "A future we build together." },
];

/** Tax wording is grounded in official Income Tax Department Form 10AC. */
export const TAX_NOTE =
  "Janaseva (JANA SEVA SAMRUDDI EDUCATION & RURAL DEVELOPMENT SOCIETY R, PAN: AABTJ7431M) holds official provisional approval under Section 80G (Form 10AC, URN: AABTJ7431MF20231, DIN: AABTJ7431MF2023101, Order dated 04-09-2023) covering Assessment Years AY 2024-25 to AY 2026-27. Indian taxpayers are eligible for a 50% deduction under Section 80G. Automated, verified digital 80G receipts are issued instantly upon contribution.";

export const formatINR = (n?: number | string | null): string => {
  if (n === null || n === undefined || n === "") return "₹0";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "₹0";
  return "₹" + Math.round(num).toLocaleString("en-IN");
};

/**
 * 80G Tax Exemption Math:
 * Under Section 80G of the Indian Income Tax Act, 50% of donations to registered charitable trusts
 * are eligible for deduction from taxable income.
 */
export const calculateTaxBenefit = (donationAmount: number, taxBracketPercent: number = 30) => {
  const safeAmount = Math.max(0, Number(donationAmount) || 0);
  const eligibleDeduction = Math.round(safeAmount * 0.5); // 50% deduction
  const estimatedTaxSavings = Math.round(eligibleDeduction * (taxBracketPercent / 100));
  const effectiveCost = Math.max(0, safeAmount - estimatedTaxSavings);
  return {
    donationAmount: safeAmount,
    eligibleDeduction,
    estimatedTaxSavings,
    effectiveCost,
    taxBracketPercent,
  };
};

export const INTERESTS: { key: string; t: string; desc: string }[] = [
  { key: "Teaching", t: "Teaching & Tutoring", desc: "Help with school subjects, evening homework, or spoken English." },
  { key: "Technology", t: "Technology & IT", desc: "Help with computer literacy, coding basics, or website systems." },
  { key: "Creative", t: "Arts & Creativity", desc: "Drawing, painting, music, dance, craft, or theater workshops." },
  { key: "Sports", t: "Sports & Fitness", desc: "Cricket, football, yoga, athletics, or physical games coaching." },
  { key: "Photography", t: "Photography & Media", desc: "Document daily life with dignity and create authentic stories." },
  { key: "Health", t: "Healthcare & Nutrition", desc: "Medical check-ups, dental camps, hygiene awareness, or diet." },
  { key: "Events", t: "Events & Festivals", desc: "Coordinate special occasions, outings, celebrations, or visits." },
  { key: "Operations", t: "Operations & Admin", desc: "Logistics, inventory management, library organization, and support." },
  { key: "Mentorship", t: "Career Guidance & Mentorship", desc: "Guide older students toward higher education and careers." },
  { key: "Other", t: "Other Skills", desc: "Tell us about a unique skill you want to share with the children." },
];

const PLACEHOLDER_URLS = new Set(["https://instagram.com/", "https://facebook.com/"]);
export const isConfiguredExternalUrl = (url: string) => !!url && !PLACEHOLDER_URLS.has(url);

export const OCCASIONS = [
  "Birthday",
  "First Salary",
  "Graduation",
  "Anniversary",
  "Festival",
  "Thank You",
  "Tribute",
  "Achievement",
  "Just Because",
] as const;

export const CAMPAIGN_TYPES = [
  "Individual",
  "Friends",
  "College",
  "Office",
  "Community",
  "Sports Team",
] as const;

