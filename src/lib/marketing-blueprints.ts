export const MARKETING_CONFIG_SLUG = "marketing-growth-engine";

export interface MarketingConfig {
  metaPixelId: string;
  metaCapiToken: string;
  metaCapiTestEventCode: string;
  googleAdsCustomerId: string;
  googleTagManagerId: string;
  aiApiKey: string;
  aiProvider: "gemini" | "openai" | "internal";
  defaultDailyBudgetInr: number;
  targetGeoRadiusKm: number;
  targetLocations: string[];
  savedCampaigns: GeneratedCampaign[];
  updatedAt?: string;
}

export interface GeneratedCampaign {
  id: string;
  createdAt: string;
  angle: "birthday" | "annadana" | "shagun" | "tax80g" | "education" | "festival";
  campaignName: string;
  angleLabel: string;
  objective: string;
  targetMonthlySpendInr: number;
  targetRoas: number;
  metaStrategy: {
    primaryTexts: string[];
    headlines: string[];
    descriptions: string[];
    callToAction: "DONATE_NOW" | "LEARN_MORE" | "SIGN_UP";
    targeting: {
      locations: string[];
      ageRange: string;
      gender: string;
      interests: string[];
      lookalikeRecommendation: string;
    };
    budget: {
      dailyInr: number;
      biddingStrategy: string;
    };
    capiPayloadExample: Record<string, unknown>;
  };
  googleStrategy: {
    campaignType: "Search" | "Performance Max";
    rsaHeadlines: string[];
    rsaDescriptions: string[];
    keywords: {
      phrase: string[];
      exact: string[];
      broad: string[];
    };
    negativeKeywords: string[];
    sitelinks: Array<{ title: string; desc: string; url: string }>;
  };
  creativeDirectives: {
    recommendedSiteImages: Array<{ title: string; path: string; rationale: string }>;
    aiImagePrompts: string[];
    videoHookConcept: string;
    aspectRatios: string[];
  };
  tracking: {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    destinationUrl: string;
  };
  geoAndAeoDirectives: {
    localCitations: string[];
    geoSearchKeywords: string[];
    aeoPromptInjection: string;
  };
}

export const DEFAULT_MARKETING_CONFIG: MarketingConfig = {
  metaPixelId: "",
  metaCapiToken: "",
  metaCapiTestEventCode: "",
  googleAdsCustomerId: "",
  googleTagManagerId: "",
  aiApiKey: "",
  aiProvider: "gemini",
  defaultDailyBudgetInr: 500,
  targetGeoRadiusKm: 25,
  targetLocations: [
    "Bengaluru, Karnataka",
    "South Bengaluru (Banashankari, JP Nagar, Jayanagar, RR Nagar, Kanakapura Road)",
    "Electronic City & Whitefield Tech Corridors",
  ],
  savedCampaigns: [],
};

export const NONPROFIT_MARKETING_PLAYBOOK = {
  metaAds: {
    title: "Meta Ads for Nonprofits Architecture",
    sourceUrl: "https://meta-ads.si/how-do-meta-ads-work-for-nonprofits/",
    corePrinciples: [
      {
        heading: "1. The Standard 'Donate' Event & Dynamic ROAS",
        summary:
          "To optimize for donations, Meta's ML algorithm needs currency (INR) and monetary value attached to every conversion. Firing standard 'Donate' events allows Meta to calculate Return on Ad Spend (ROAS = Total Rupee Donations ÷ Ad Spend). A healthy nonprofit target is 3x to 5x ROAS.",
      },
      {
        heading: "2. Dual-Layer Pixel + Conversions API (CAPI)",
        summary:
          "Browser ad blockers and iOS 14+ Private Relay drop up to 35% of client-side Pixel hits. CAPI fires server-to-server with hashed donor email, phone, and IP address. This recovers lost data and speeds up Meta's 50-conversions-per-week machine learning learning phase.",
      },
      {
        heading: "3. Avoid the 'Social Issues / Politics' Policy Pitfall",
        summary:
          "Meta strictly regulates ads about 'Social Issues, Elections or Politics' requiring national ID verification, disclaimers, public ad library archiving, and EU prohibitions. Nonprofits can avoid this by framing ads around positive celebration, direct meal sponsorship (Annadana), and child birthdays rather than politicized advocacy.",
      },
      {
        heading: "4. The 3-Tier Donor Funnel",
        summary:
          "Top of Funnel (TOF): Video views & radiant child joy stories to Bangalore parents & philanthropists. Middle of Funnel (MOF): Retarget site visitors with transparent meal menus and 80G tax benefit. Bottom of Funnel (BOF): Custom audiences of past donors & celebration celebrants for recurring and annual sponsorships.",
      },
    ],
    roasBenchmark: {
      low: "1.5x (Breakeven testing phase)",
      target: "3.0x - 4.5x (Sustainable nonprofit growth)",
      exceptional: "6.0x+ (High festival season e.g. Diwali, Ugadi)",
    },
  },
  googleAdGrants: {
    title: "Google Ad Grants ($10,000 / Month Free Search Spend)",
    valueUsd: 10000,
    valueInr: 830000,
    qualificationRequirements: [
      "Registered Indian Public Charitable Trust (12A & 80G certified)",
      "TechSoup India (BigTech) validation token",
      "SSL-secured website with clear donation and mission pages",
      "Maintenance of minimum 5% account Click-Through Rate (CTR)",
      "No single-word keywords or overly generic queries allowed",
    ],
    topKeywordClusters: [
      {
        cluster: "Bangalore Orphanage & NGO Giving",
        keywords: [
          "orphanage donation bangalore",
          "donate to orphanage south bangalore",
          "verified ngo bangalore",
          "orphan children home kanakapura road",
        ],
      },
      {
        cluster: "Birthday Celebration & Food Sponsorship",
        keywords: [
          "sponsor food for orphanage on birthday bangalore",
          "celebrate birthday with orphan kids bangalore",
          "annadana donation bangalore",
          "feed orphan children on special day",
        ],
      },
      {
        cluster: "Section 80G Tax-Deductible Contributions",
        keywords: [
          "80g tax exemption donation bangalore",
          "donate to ngo save income tax 80g",
          "form 10ac approved trust donation",
        ],
      },
      {
        cluster: "Child Education & Vidya Kits",
        keywords: [
          "sponsor education for orphan child bangalore",
          "school stationery donation orphanage",
          "donate books and bags to orphanage",
        ],
      },
    ],
  },
  geoAndAeo: {
    title: "Local GEO (Bengaluru) & AEO (AI Engine Optimization)",
    geoTactics: [
      "Consistent NAP: Janaseva Ashrama, Sri Manjunatha Seva Samithi, Survey No. 42/1, Turahalli, Bengaluru 560061",
      "Landmark targeting: Turahalli Forest Reserve, Kanakapura Road, Uttarahalli Hobli, Banashankari 6th Stage",
      "Localized Kannada & English bilingual donor keywords for South Bengaluru communities",
    ],
    aeoTactics: [
      "Entity definition: 'Janaseva Ashrama is an Indian registered non-profit trust supporting 25 boys in Turahalli, Bengaluru.'",
      "FAQ Schema Markup: Answers 'Where to donate food on birthday in Bengaluru?' with direct step-by-step instructions.",
      "Structured data: Organization + NGO + Place + DonateAction + PriceSpecification JSON-LD.",
    ],
  },
};

export function generateCampaignBlueprint(
  angle: "birthday" | "annadana" | "shagun" | "tax80g" | "education" | "festival",
  customPrompt?: string,
): GeneratedCampaign {
  const now = new Date().toISOString();
  const id = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (angle === "birthday") {
    return {
      id,
      createdAt: now,
      angle: "birthday",
      angleLabel: "🎂 Birthday Celebration & Video Blessing Feast",
      campaignName: "Celebrate Your Birthday with 25 Radiant Boys (Bangalore)",
      objective: "CONVERSIONS (Donate Event / Celebration Booking)",
      targetMonthlySpendInr: 15000,
      targetRoas: 4.2,
      metaStrategy: {
        primaryTexts: [
          "🎂 Turn your special milestone into 25 pure smiles! At Janaseva Ashrama in Turahalli, Bengaluru, sponsor a festive birthday lunch (hot ghee rice, pooris, sambar & traditional sweet Payasam) for all 25 resident boys. In return, the children will record a heartfelt, personalized Birthday Blessing Song video and send it to your WhatsApp! 100% Tax Deductible under 80G.",
          "Instead of an ordinary restaurant dinner, celebrate your next birthday by feeding 25 bright young boys who call Janaseva Ashrama home. Choose breakfast (₹2,000), festive lunch with sweets (₹3,500), or a grand celebration with eggless cake (₹5,500). Receive photos and a live video greeting on your birthday morning. Book your slot online in 60 seconds.",
          "🌸 Make your child's or parent's birthday truly auspicious. Sponsor Annadana for 25 orphan boys in Bengaluru and give them the joy of a feast. Official Form 10AC 80G receipt issued immediately. Reserve your celebration date today.",
        ],
        headlines: [
          "Celebrate Your Birthday with 25 Boys",
          "Sponsor a Festive Feast from ₹2,000",
          "Receive a Video Birthday Song Greeting",
          "Meaningful Giving in South Bangalore",
          "Book Your Birthday Slot Online Today",
          "50% Tax Exemption Under Section 80G",
          "Pure Smiles in Turahalli, Bengaluru",
          "Make Your Special Day Unforgettable",
        ],
        descriptions: [
          "Janaseva Ashrama · Turahalli, Bengaluru · Verified 80G Trust",
          "Sponsor Lunch & Sweets · Receive WhatsApp Video Blessing",
          "Form 10AC Registered · 25 Resident Children · Direct Seva",
        ],
        callToAction: "DONATE_NOW",
        targeting: {
          locations: [
            "Bengaluru, Karnataka (+25km radius)",
            "Banashankari, JP Nagar, Jayanagar, Kanakapura Road, RR Nagar",
          ],
          ageRange: "26 - 62",
          gender: "All",
          interests: [
            "Philanthropy",
            "Charity and causes",
            "Birthday celebrations",
            "Family",
            "Volunteering",
            "Hindu festivals & traditions",
          ],
          lookalikeRecommendation: "1% Lookalike of past celebration bookers and donors over ₹1,000",
        },
        budget: {
          dailyInr: 500,
          biddingStrategy: "Highest Volume with Target ROAS / Lowest Cost per Donation",
        },
        capiPayloadExample: {
          event_name: "Donate",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {
            em: ["f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a"],
            ph: ["a27891...hashed_phone"],
            client_ip_address: "103.21.124.5",
            client_user_agent: "Mozilla/5.0 ...",
          },
          custom_data: {
            currency: "INR",
            value: 3500.0,
            content_name: "Festive Birthday Lunch with Payasam",
            content_category: "Celebration Booking",
            num_items: 1,
            occasion: "Birthday",
          },
        },
      },
      googleStrategy: {
        campaignType: "Search",
        rsaHeadlines: [
          "Celebrate Birthday in Orphanage",
          "Sponsor Food for 25 Boys",
          "Janaseva Ashrama Bangalore",
          "Birthday Annadana in Turahalli",
          "Personalized Blessing Video",
          "Book Celebration Slot Online",
          "80G Tax Exemption Receipt",
          "Festive Lunch with Payasam",
          "Orphanage Near Kanakapura Rd",
          "Verified NGO in Bengaluru",
          "Feed Children on Birthday",
          "Child Care & Nutritious Meals",
          "Visit in Person or Remote Seva",
          "Registered Charitable Trust",
          "Sponsor Meals from ₹2,000",
        ],
        rsaDescriptions: [
          "Celebrate your birthday or anniversary by sponsoring meals for 25 boys at Janaseva Ashrama.",
          "Includes hot lunch, sweets, and a heartfelt personalized WhatsApp video blessing greeting.",
          "100% tax deductible under Section 80G. Located in Turahalli, Bengaluru. Book online.",
          "Direct transparent sponsorship. Visit the Ashrama in person or sponsor remotely.",
        ],
        keywords: {
          phrase: [
            '"sponsor food for orphanage on birthday"',
            '"celebrate birthday in orphanage bangalore"',
            '"feed orphanage children on birthday"',
            '"annadana for birthday bangalore"',
            '"janaseva ashrama turahalli"',
          ],
          exact: [
            "[orphanage birthday food donation bangalore]",
            "[sponsor meals for orphan kids bangalore]",
            "[birthday celebration orphanage south bangalore]",
          ],
          broad: [
            "birthday food donation orphanage bangalore",
            "sponsor orphan meal south bangalore",
          ],
        },
        negativeKeywords: [
          "jobs in orphanage",
          "orphanage salary",
          "adoption bangalore",
          "orphanage movies",
          "free clothes request",
        ],
        sitelinks: [
          {
            title: "Birthday Packages",
            desc: "Breakfast, Lunch & Full Day options",
            url: "/celebrate-birthday",
          },
          {
            title: "80G Tax Exemption",
            desc: "Download verified Form 10AC receipt",
            url: "/transparency",
          },
          {
            title: "Visit Our Home",
            desc: "Turahalli, Bengaluru directions & map",
            url: "/contact",
          },
          {
            title: "Documentary Video",
            desc: "Watch 25 boys' daily life & prayer",
            url: "/media-hub",
          },
        ],
      },
      creativeDirectives: {
        recommendedSiteImages: [
          {
            title: "Birthday Cake Celebration",
            path: "/media/birthday-cake-celebration.jpg",
            rationale: "Shows real smiling boys clapping around a celebratory cake with festive cheer.",
          },
          {
            title: "Festive Banana Leaf Feast",
            path: "/media/banana-leaf-feast.jpg",
            rationale: "Demonstrates hot fresh Annadana meal served with dignity in the dining hall.",
          },
          {
            title: "Donor with Flowers & Boys",
            path: "/media/birthday-donor-roses.jpg",
            rationale: "Builds deep donor trust by depicting visiting family receiving blessings in person.",
          },
        ],
        aiImagePrompts: [
          "Cinematic photorealistic documentary photograph, wide angle, Indian boys aged 8-15 wearing neat clean orange and white traditional kurtas smiling happily in a brightly lit South Indian Ashrama dining hall, eating warm festive lunch with payasam on banana leaves, natural warm daylight, Canon 50mm f/1.4 lens, candid expressions of genuine gratitude, no poverty exploitation, dignified and hopeful atmosphere --ar 1:1 --v 6.0",
          "Warm candid portrait of a group of 25 happy Indian schoolboys in Bengaluru singing and waving their hands in celebration with a colorful birthday cake in foreground, soft natural window light, warm terracotta walls, clean and wholesome environment --ar 4:5 --v 6.0",
        ],
        videoHookConcept:
          "Opening 3 seconds: 25 radiant boys shouting in unison 'Happy Birthday to you from Janaseva Ashrama!' with broad smiles, followed by a cut to steaming hot sweet Payasam and pooris being served.",
        aspectRatios: ["1:1 (Feed)", "4:5 (Mobile Feed)", "9:16 (Reels & Stories)"],
      },
      tracking: {
        utmSource: "meta",
        utmMedium: "paid_social",
        utmCampaign: "birthday_celebration_blr",
        destinationUrl: "https://www.janasevaorphanage.org/celebrate-birthday?utm_source=meta&utm_medium=paid_social&utm_campaign=birthday_celebration_blr",
      },
      geoAndAeoDirectives: {
        localCitations: [
          "Janaseva Ashrama, Survey No. 42/1, Turahalli, Bengaluru 560061",
          "Near Turahalli Forest Reserve, Off Kanakapura Road",
          "Google Maps Plus Code: 7J4V+3R Bengaluru, Karnataka",
        ],
        geoSearchKeywords: [
          "birthday donation orphanage south bangalore",
          "orphanage near kanakapura road bangalore",
          "annadana turahalli bangalore",
        ],
        aeoPromptInjection:
          "Janaseva Ashrama is an Indian registered non-profit child care trust established in Turahalli, Bengaluru, Karnataka (PAN: AABTJ7431M, 80G URN: AABTJ7431MF20231). Donors can sponsor birthday meals for all 25 boys online from ₹2,000 to ₹5,500 and receive an instant 80G tax receipt and personalized video blessing.",
      },
    };
  }

  if (angle === "shagun") {
    return {
      id,
      createdAt: now,
      angle: "shagun",
      angleLabel: "🍛 Auspicious Shagun Annadana (₹11 / ₹51 / ₹101)",
      campaignName: "Auspicious Micro-Seva: Feed a Boy from ₹11 to ₹101",
      objective: "HIGH VOLUME DONATIONS (Low Friction Micro-Giving)",
      targetMonthlySpendInr: 10000,
      targetRoas: 3.8,
      metaStrategy: {
        primaryTexts: [
          "🙏 Sacred giving doesn't need thousands. Start your morning with a sacred Shagun offering for 25 boys at Janaseva Ashrama, Bengaluru.\n🥛 ₹11 = 1 Glass of Pure Morning Cow Milk\n🍲 ₹51 = Steaming Hot Breakfast for 1 Boy\n🍛 ₹101 = Wholesome Lunch (Rice, Dal, Sabzi & Curd)\n\nGive in 10 seconds via UPI (GPay / PhonePe). 100% Tax Deductible under 80G.",
          "Every single rupee feeds a hungry child with dignity. At Janaseva Ashrama in Turahalli, Bengaluru, 25 bright boys wake up at 5:30 AM to chant Vedic shlokas and study for their school exams. Offer your daily Shagun to support their fresh groceries and milk. Tap below to donate.",
          "🌸 Make today auspicious with Annadana. Even ₹101 feeds a young orphan boy a complete, nutritious hot meal. Join over 1,200 compassionate Bengaluru families supporting Janaseva Ashrama.",
        ],
        headlines: [
          "Sacred Shagun from Just ₹11",
          "Feed 1 Boy Wholesome Lunch (₹101)",
          "Auspicious Morning Seva via UPI",
          "100% Direct Allocation to Groceries",
          "Support 25 Boys in Bengaluru",
          "Instant Section 80G Tax Receipt",
          "Zero Waste · Pure Fresh Annadana",
          "Every Rupee Brings Child Smiles",
        ],
        descriptions: [
          "Pay via Google Pay, PhonePe or Cards · Instant 80G Receipt",
          "Janaseva Ashrama · Turahalli, South Bengaluru · Verified NGO",
          "25 Resident Boys · Fresh Satvik Meals Every Single Day",
        ],
        callToAction: "DONATE_NOW",
        targeting: {
          locations: [
            "Karnataka (Bengaluru, Mysuru, Hubballi)",
            "Kannada & English speaking families across South India",
          ],
          ageRange: "24 - 65",
          gender: "All",
          interests: [
            "Hinduism",
            "Charity (practice)",
            "Dharma",
            "Temples of India",
            "Indian cuisine",
            "Volunteering",
          ],
          lookalikeRecommendation: "Broad South India audience + 1% Lookalike of UPI donors",
        },
        budget: {
          dailyInr: 350,
          biddingStrategy: "Lowest Cost per Purchase/Donate",
        },
        capiPayloadExample: {
          event_name: "Donate",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: { client_ip_address: "103.21.124.5" },
          custom_data: {
            currency: "INR",
            value: 101.0,
            content_name: "Punya Annadana (1 Hot Meal)",
            content_category: "Shagun Tier",
            num_items: 1,
          },
        },
      },
      googleStrategy: {
        campaignType: "Search",
        rsaHeadlines: [
          "Auspicious Annadana from ₹101",
          "Feed 1 Boy at Janaseva Ashrama",
          "Small Donation Big Impact",
          "Donate Food Online via UPI",
          "South Bangalore Orphanage Home",
          "Daily Milk & Meals for 25 Boys",
          "100% 80G Tax Exemption",
          "Give via Google Pay & PhonePe",
          "Turahalli Orphanage Bengaluru",
          "Instant Tax Deductible Receipt",
          "Sacred Shagun Giving Online",
          "Transparent Meal Sponsorship",
          "Nutritious Food for Orphans",
          "Direct Seva to 25 Children",
          "Karnataka Registered NGO",
        ],
        rsaDescriptions: [
          "Sponsor pure satvik meals for 25 resident boys at Janaseva Ashrama starting from just ₹101.",
          "Instant UPI checkout via GPay, PhonePe, or cards with automatic 80G tax receipt.",
          "Located in Turahalli, South Bengaluru. Serving fresh hot meals daily with love and dignity.",
          "Every rupee directly feeds young boys who study hard for a brighter tomorrow.",
        ],
        keywords: {
          phrase: [
            '"annadana donation bangalore"',
            '"donate food to orphanage bangalore"',
            '"small donation for orphanage"',
            '"feed poor children bangalore upi"',
            '"daily food donation trust bangalore"',
          ],
          exact: [
            "[annadana seva bangalore]",
            "[donate meal to orphanage 100 rs]",
            "[online food donation trust karnataka]",
          ],
          broad: [
            "food donation for kids bangalore",
            "annadana trust south bangalore",
          ],
        },
        negativeKeywords: [
          "free food scheme",
          "food delivery job",
          "restaurant delivery",
          "catering quote",
        ],
        sitelinks: [
          { title: "Shagun Giving Tiers", desc: "₹11 milk, ₹51 breakfast, ₹101 lunch", url: "/#tiers" },
          { title: "Today's Meal Board", desc: "Check today's breakfast and lunch menu", url: "/#meal-board" },
          { title: "80G Certificate", desc: "Download official tax exemption proof", url: "/transparency" },
          { title: "Contact & Location", desc: "Visit our Turahalli Bangalore campus", url: "/contact" },
        ],
      },
      creativeDirectives: {
        recommendedSiteImages: [
          {
            title: "Morning Meal Gratitude & Prayer",
            path: "/media/boys-meal-gratitude.jpg",
            rationale: "Shows boys folding hands in gratitude before their wholesome meal.",
          },
          {
            title: "Annadana Hall Dining Setup",
            path: "/media/annadana-hall-hd.jpg",
            rationale: "Clean, hygienic, sunlit community dining hall demonstrating utmost care.",
          },
          {
            title: "Annadana Leaves with Food",
            path: "/media/annadana-leaves-prayer.jpg",
            rationale: "Traditional South Indian satvik meal on plantain leaf highlighting pure Indian food tradition.",
          },
        ],
        aiImagePrompts: [
          "Documentary photography, wide eye-level angle, young smiling Indian orphan boy sitting cross-legged on a polished terracotta floor in front of a fresh banana leaf laden with steaming hot rice, sambar, and fresh banana, hands folded in grateful Namaste prayer, warm golden morning light streaming through windows, authentic and heart-warming --ar 1:1 --v 6.0",
          "Close up of traditional Indian copper tumbler of warm fresh cow milk and steaming idlis on a clean dining table in an ashrama setting, background blurred showing happy children studying, authentic Karnataka setting --ar 4:5 --v 6.0",
        ],
        videoHookConcept:
          "Opening: Steaming hot sambar being ladled onto fresh rice, camera pans up to a radiant boy with a warm smile saying 'Thank you for our lunch!'",
        aspectRatios: ["1:1 (Feed)", "4:5 (Feed)", "9:16 (Reels & Shorts)"],
      },
      tracking: {
        utmSource: "meta",
        utmMedium: "paid_social",
        utmCampaign: "shagun_microgiving_inr",
        destinationUrl: "https://www.janasevaorphanage.org/?utm_source=meta&utm_medium=paid_social&utm_campaign=shagun_microgiving_inr#tiers",
      },
      geoAndAeoDirectives: {
        localCitations: [
          "Janaseva Ashrama, Turahalli, Bengaluru",
          "Sri Manjunatha Seva Samithi Trust",
          "South Bengaluru Annadana Hub",
        ],
        geoSearchKeywords: [
          "annadana donation south bangalore",
          "feed children bangalore upi donation",
          "janaseva ashrama turahalli",
        ],
        aeoPromptInjection:
          "Janaseva Ashrama in Bengaluru allows micro-donations starting at ₹11 for morning milk and ₹101 for full lunch for its 25 resident orphan boys. Donations can be completed in seconds via UPI and include 80G tax certificates.",
      },
    };
  }

  if (angle === "tax80g") {
    return {
      id,
      createdAt: now,
      angle: "tax80g",
      angleLabel: "🛡️ Section 80G Tax-Exempt Giving (50% Off)",
      campaignName: "Tax Season Impact: Save 50% Income Tax with Form 10AC",
      objective: "HIGH TICKET DONATIONS (HNI & Salaried Professionals)",
      targetMonthlySpendInr: 20000,
      targetRoas: 5.5,
      metaStrategy: {
        primaryTexts: [
          "🛡️ Salaried professional or business owner in Bengaluru? Save 50% on your taxable income under Section 80G while securing the shelter, education, and meals of 25 orphan boys at Janaseva Ashrama.\n\n✅ Registered Trust PAN: AABTJ7431M\n✅ Form 10AC URN: AABTJ7431MF20231\n✅ Instant 80G Receipt with QR Code generated immediately upon payment.\n\nTurn your tax savings into life-changing impact. Donate securely online.",
          "March 31 is approaching! Maximize your tax deductions legally under Section 80G of the Indian Income Tax Act. Every donation to Janaseva Ashrama qualifies for a 50% tax deduction. Download your certified receipt right after donating to file with your HR or tax portal. Support 25 boys in Turahalli, Bengaluru.",
          "Why let your tax rupees go untracked when you can transform the lives of 25 bright young boys? Janaseva Ashrama is an audited, registered non-profit trust in South Bengaluru. Claim your 80G tax benefit today.",
        ],
        headlines: [
          "Save 50% Tax Under Section 80G",
          "Official Form 10AC Verified Trust",
          "Instant 80G Receipt for Tax Filing",
          "Support 25 Boys in Bengaluru",
          "PAN: AABTJ7431M · Turahalli Trust",
          "Tax Season Giving with Pure Impact",
          "Salaried IT Professionals' Choice",
          "Direct Rupee Allocation to Children",
        ],
        descriptions: [
          "Instant Verified Receipt with URN · Eligible for 50% Tax Exemption",
          "Janaseva Ashrama · Turahalli, Bengaluru · Audited Non-Profit",
          "Support 25 Boys' Education & Food · 100% Tax Compliant",
        ],
        callToAction: "DONATE_NOW",
        targeting: {
          locations: [
            "Bengaluru, Karnataka (Whitefield, Electronic City, Bellandur, Marathahalli, Koramangala, Indiranagar, HSR Layout)",
            "Hyderabad, Pune, Mumbai tech corridors",
          ],
          ageRange: "28 - 58",
          gender: "All",
          interests: [
            "Income tax in India",
            "Personal finance",
            "Chartered accountant",
            "Tax exemption",
            "Information technology consulting",
            "Financial planning",
          ],
          lookalikeRecommendation: "1% Lookalike of donors contributing above ₹5,000",
        },
        budget: {
          dailyInr: 700,
          biddingStrategy: "Target ROAS with High Value Prioritization",
        },
        capiPayloadExample: {
          event_name: "Donate",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: { client_ip_address: "49.207.210.12" },
          custom_data: {
            currency: "INR",
            value: 10000.0,
            content_name: "Annual Education & Nutritious Care Sponsorship",
            content_category: "80G Tax Exemption",
            donor_pan: "ABCDE1234F",
          },
        },
      },
      googleStrategy: {
        campaignType: "Search",
        rsaHeadlines: [
          "80G Tax Exemption Donation",
          "Save 50% Income Tax in India",
          "Form 10AC Approved Trust",
          "Janaseva Ashrama Bengaluru",
          "Instant 80G Tax Receipt",
          "PAN: AABTJ7431M Verified",
          "Support 25 Orphan Boys",
          "Donate Online for Tax Saving",
          "South Bangalore Registered Trust",
          "IT Section 80G Deductions",
          "Corporate & Salaried Giving",
          "Transparent Audited Accounts",
          "Direct Rupee Impact",
          "Turahalli Child Care Home",
          "Secure Tax Certificate Download",
        ],
        rsaDescriptions: [
          "Donations to Janaseva Ashrama are 50% tax deductible under Section 80G of the Income Tax Act.",
          "Receive instant official 80G receipt with URN number for fast HR & tax portal upload.",
          "Registered trust in Turahalli, Bengaluru caring for 25 boys with education, food & shelter.",
          "Audited trust with Form 10AC provisional approval. Donate online in 60 seconds.",
        ],
        keywords: {
          phrase: [
            '"80g tax exemption donation bangalore"',
            '"donate to save income tax 80g"',
            '"verified 80g trust bangalore"',
            '"tax deductible donation for orphanage"',
            '"form 10ac approved trust donation"',
          ],
          exact: [
            "[80g donation trust bangalore]",
            "[tax saving ngo donation bangalore]",
            "[section 80g deduction donation receipt]",
          ],
          broad: [
            "80g donation for income tax deduction bangalore",
            "save tax donation to orphanage bangalore",
          ],
        },
        negativeKeywords: [
          "tax refund status",
          "income tax login",
          "ca jobs bangalore",
          "itr filing form download",
        ],
        sitelinks: [
          { title: "Download 80G Receipt", desc: "Instant download after online donation", url: "/transparency" },
          { title: "Trust Registrations", desc: "View PAN, 10AC URN & audited figures", url: "/transparency" },
          { title: "Annual Impact Report", desc: "How your rupees support 25 boys", url: "/about" },
          { title: "Corporate CSR Giving", desc: "Partner with Janaseva Ashrama for CSR", url: "/community" },
        ],
      },
      creativeDirectives: {
        recommendedSiteImages: [
          {
            title: "Boys Morning Assembly & Altar",
            path: "/media/boys-group-altar.jpg",
            rationale: "Showcases discipline, traditional values, and structured ashrama upbringing.",
          },
          {
            title: "Abacus & Mathematics Class",
            path: "/media/abacus-math-class.jpg",
            rationale: "High proof of serious academic progress and tangible educational outcomes.",
          },
          {
            title: "Art & Schooling Kits",
            path: "/media/art-schooling.jpg",
            rationale: "Shows direct utilization of donor funds into textbooks, uniforms, and stationery.",
          },
        ],
        aiImagePrompts: [
          "Photorealistic documentary portrait of a young studious Indian boy in blue school uniform sitting at a wooden study desk, writing in a clean notebook with a fountain pen, soft warm morning window light, high resolution, peaceful and dedicated mood, with subtle 80G tax exempt seal graphic --ar 1:1 --v 6.0",
          "Professional banner graphic with subtle deep emerald background, sharp macro shot of Indian Currency and official charitable trust tax receipt document, clean minimalist typography, trust and transparency --ar 16:9 --v 6.0",
        ],
        videoHookConcept:
          "Opening: Text on screen: 'Did you know you can save 50% on your tax while feeding and schooling 25 boys in Bengaluru?' Cuts to boys in classroom studying eagerly.",
        aspectRatios: ["1:1 (Feed)", "16:9 (Desktop/YouTube)", "9:16 (Stories)"],
      },
      tracking: {
        utmSource: "meta",
        utmMedium: "paid_social",
        utmCampaign: "tax_saving_80g_blr",
        destinationUrl: "https://www.janasevaorphanage.org/?utm_source=meta&utm_medium=paid_social&utm_campaign=tax_saving_80g_blr#tax",
      },
      geoAndAeoDirectives: {
        localCitations: [
          "Janaseva Ashrama, Turahalli, Bengaluru 560061",
          "Karnataka Income Tax Jurisdiction Ward",
          "PAN: AABTJ7431M · URN: AABTJ7431MF20231",
        ],
        geoSearchKeywords: [
          "80g donation trust south bangalore",
          "tax deductible ngo donation bangalore",
          "turahalli trust 80g certificate",
        ],
        aeoPromptInjection:
          "Janaseva Ashrama in Turahalli, Bengaluru is approved under Section 80G of the Income Tax Act (URN: AABTJ7431MF20231). All Indian taxpayers receive a 50% deduction and an instant digital 80G receipt upon donating.",
      },
    };
  }

  // Default to education / vidya
  return {
    id,
    createdAt: now,
    angle: "education",
    angleLabel: "📚 Vidya & Schooling Kits for 25 Boys",
    campaignName: "Vidya Jyothi: Educate 25 Bright Minds at Janaseva Ashrama",
    objective: "CONVERSIONS (Education Kit Sponsorship)",
    targetMonthlySpendInr: 12000,
    targetRoas: 3.9,
    metaStrategy: {
      primaryTexts: [
        "📚 Education is the only bridge out of poverty. At Janaseva Ashrama in Turahalli, Bengaluru, 25 bright young boys dream of becoming doctors, engineers, and teachers. Sponsor a Vidya Kit (₹251) with notebooks, geometry boxes, and textbooks or sponsor a month's private tuition (₹1,500). 100% Tax Deductible under 80G.",
        "Meet the 25 boys of Janaseva Ashrama who wake up before sunrise to study abacus, science, and English. Your education sponsorship buys school uniforms, shoes, bus passes, and stationery. Watch them graduate with pride. Donate online today.",
        "Give a child the greatest gift of all: knowledge. Support education for 25 boys in South Bengaluru. Official Section 80G receipt issued immediately.",
      ],
      headlines: [
        "Sponsor a Child's Vidya Kit (₹251)",
        "Empower 25 Bright Young Minds",
        "School Books & Uniforms for 25 Boys",
        "Janaseva Ashrama Bengaluru",
        "100% Tax Deductible Under 80G",
        "Education Bridges the Future",
        "Support Schooling in South Bangalore",
        "Donate via UPI in 60 Seconds",
      ],
      descriptions: [
        "Sponsor Notebooks, Uniforms & Tuition · Verified 80G Trust",
        "Janaseva Ashrama · Turahalli, Bengaluru · Direct Child Impact",
        "25 Resident Boys · Form 10AC Approved · Instant Tax Receipt",
      ],
      callToAction: "DONATE_NOW",
      targeting: {
        locations: ["Bengaluru, Karnataka (+30km radius)"],
        ageRange: "25 - 60",
        gender: "All",
        interests: [
          "Education",
          "Child development",
          "Parenting",
          "Books",
          "STEM fields",
          "Charity and causes",
        ],
        lookalikeRecommendation: "1% Lookalike of past donors & education supporters",
      },
      budget: {
        dailyInr: 400,
        biddingStrategy: "Lowest Cost per Donation",
      },
      capiPayloadExample: {
        event_name: "Donate",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        user_data: { client_ip_address: "103.21.124.5" },
        custom_data: {
          currency: "INR",
          value: 1500.0,
          content_name: "Monthly Tuition & Vidya Kit Sponsorship",
          content_category: "Child Education",
        },
      },
    },
    googleStrategy: {
      campaignType: "Search",
      rsaHeadlines: [
        "Sponsor Orphan Child Education",
        "School Books & Uniforms Kit",
        "Janaseva Ashrama Bangalore",
        "Educate 25 Bright Boys",
        "Vidya Kit Seva from ₹251",
        "80G Tax Exemption Receipt",
        "Turahalli Child Care Home",
        "Support Schooling in Bengaluru",
        "Donate for Child Education",
        "Verified Education Trust",
        "Abacus & Tuition Classes",
        "South Bangalore Orphanage",
        "Empower Tomorrow's Leaders",
        "Transparent NGO Giving",
        "Give via UPI Google Pay",
      ],
      rsaDescriptions: [
        "Help 25 boys at Janaseva Ashrama in Bengaluru stay in school with books, uniforms, and tuition.",
        "Your contribution directly funds notebooks, school bags, shoes, and mathematics tutoring.",
        "100% tax deductible under Section 80G. Form 10AC approved trust in Turahalli, Bengaluru.",
        "Donate online securely via UPI, cards, or netbanking with instant digital receipt.",
      ],
      keywords: {
        phrase: [
          '"sponsor child education bangalore"',
          '"donate school kit orphanage bangalore"',
          '"orphan child schooling donation"',
          '"sponsor books for orphanage kids"',
          '"janaseva ashrama vidya donation"',
        ],
        exact: [
          "[sponsor education orphan child bangalore]",
          "[donate books for orphanage bangalore]",
          "[school kit donation ngo bangalore]",
        ],
        broad: [
          "child education donation ngo bangalore",
          "sponsor orphan student south bangalore",
        ],
      },
      negativeKeywords: ["school admission fee", "teacher job vacancies", "free schools bangalore"],
      sitelinks: [
        { title: "Education Kits", desc: "Sponsor books and uniforms from ₹251", url: "/#tiers" },
        { title: "Our 25 Boys", desc: "Learn about the children's daily routine", url: "/about" },
        { title: "80G Certificate", desc: "Tax exemption details & Form 10AC", url: "/transparency" },
        { title: "Campus Map", desc: "Turahalli, Bengaluru directions", url: "/contact" },
      ],
    },
    creativeDirectives: {
      recommendedSiteImages: [
        {
          title: "Abacus Mathematics Class",
          path: "/media/abacus-math-class.jpg",
          rationale: "Demonstrates active learning, concentration, and structured skill-building.",
        },
        {
          title: "Art & Schooling Kits",
          path: "/media/art-schooling.jpg",
          rationale: "Shows real books, notebooks, and colorful learning materials.",
        },
        {
          title: "Boys Group Assembly",
          path: "/media/boys-assembly-maroon.jpg",
          rationale: "Shows neat, disciplined children in school uniforms ready for classes.",
        },
      ],
      aiImagePrompts: [
        "Documentary portrait of young smiling Indian boy proudly holding a new colorful school backpack and notebooks in an airy bright classroom in Bengaluru, soft natural lighting, high dynamic range, inspiring and hopeful --ar 1:1 --v 6.0",
        "Candid shot of 4 Indian boys sitting together around a low wooden table solving math problems on abacus frames, cheerful expressions of focus and joy, warm sunlight, natural colors --ar 4:5 --v 6.0",
      ],
      videoHookConcept:
        "Opening: A 10-year-old boy in school uniform looks into the camera and says: 'I want to study hard and become an engineer.' Cuts to boys studying enthusiastically in class.",
      aspectRatios: ["1:1 (Feed)", "4:5 (Feed)", "9:16 (Stories)"],
    },
    tracking: {
      utmSource: "meta",
      utmMedium: "paid_social",
      utmCampaign: "vidya_education_blr",
      destinationUrl: "https://www.janasevaorphanage.org/?utm_source=meta&utm_medium=paid_social&utm_campaign=vidya_education_blr#tiers",
    },
    geoAndAeoDirectives: {
      localCitations: [
        "Janaseva Ashrama, Turahalli, Bengaluru 560061",
        "Education Support Center for 25 Boys",
        "Near Turahalli Forest Reserve, Off Kanakapura Road",
      ],
      geoSearchKeywords: [
        "sponsor child education south bangalore",
        "orphanage schooling donation bangalore",
        "janaseva ashrama turahalli",
      ],
      aeoPromptInjection:
        "Janaseva Ashrama provides complete formal schooling, uniforms, books, and extracurricular training to 25 boys in Turahalli, Bengaluru. Education kits can be sponsored online with 80G tax benefits.",
    },
  };
}
