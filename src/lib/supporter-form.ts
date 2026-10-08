export interface SupporterOption {
  id: string;
  label: string;
  subLabel?: string;
  amount: number;
  isPopular?: boolean;
}

export interface SupporterCategory {
  id: string;
  index: number;
  title: string;
  kannadaTitle: string;
  desc: string;
  icon: string;
  options: SupporterOption[];
}

export const SUPPORTER_CATEGORIES: SupporterCategory[] = [
  {
    id: "food_one_day",
    index: 1,
    title: "One Day Food for all Children",
    kannadaTitle: "ಎಲ್ಲಾ ಮಕ್ಕಳಿಗೆ ಒಂದು ದಿನದ ಊಟ",
    desc: "Wholesome daily Annadana: hot breakfast, nutritious lunch, evening snacks & dinner for all 25 children.",
    icon: "🍲",
    options: [
      { id: "all_children", label: "Full Day (All Children)", subLabel: "Breakfast + Lunch + Dinner", amount: 4500, isPopular: true },
      { id: "two_times", label: "Two Times", subLabel: "Lunch & Dinner for all boys", amount: 3000 },
      { id: "one_time", label: "One Time", subLabel: "Single meal for all boys", amount: 2500 },
    ],
  },
  {
    id: "food_one_month",
    index: 2,
    title: "One Month Food for Children",
    kannadaTitle: "ಮಕ್ಕಳಿಗೆ ಒಂದು ತಿಂಗಳ ಊಟ",
    desc: "Sponsor monthly grocery supplies (Sona Masoori rice, toor dal, fresh vegetables, milk & fruits) for resident children.",
    icon: "🍚",
    options: [
      { id: "4_children", label: "4 Children (1 Month)", subLabel: "Full grocery support", amount: 6000, isPopular: true },
      { id: "2_children", label: "2 Children (1 Month)", subLabel: "Essential ration kit", amount: 4000 },
      { id: "1_child", label: "1 Child (1 Month)", subLabel: "Complete monthly meals", amount: 2000 },
    ],
  },
  {
    id: "cloth_one_set",
    index: 3,
    title: "One Set Cloth for Children",
    kannadaTitle: "ಮಕ್ಕಳಿಗೆ ಬಟ್ಟೆ ಜೋಡಿ",
    desc: "Provide durable everyday cotton outfits, traditional festival wear, and daily clothing sets for boys.",
    icon: "👕",
    options: [
      { id: "8_children", label: "8 Children (1 Set Cloth)", subLabel: "Full wardrobe refresh", amount: 4800, isPopular: true },
      { id: "6_children", label: "6 Children (1 Set Cloth)", subLabel: "Cloth sets for 6 boys", amount: 3600 },
      { id: "3_children", label: "3 Children (1 Set Cloth)", subLabel: "Cloth sets for 3 boys", amount: 1800 },
    ],
  },
  {
    id: "education_one_month",
    index: 4,
    title: "One Month Education for Children",
    kannadaTitle: "ಒಂದು ತಿಂಗಳ ವಿದ್ಯಾಭ್ಯಾಸ",
    desc: "Sponsor monthly tuition, notebooks, stationery, exam preparation, and evening coaching classes.",
    icon: "📚",
    options: [
      { id: "12_children", label: "12 Children (1 Month)", subLabel: "Batch tuition support", amount: 9600, isPopular: true },
      { id: "8_children", label: "8 Children (1 Month)", subLabel: "8 boys schooling & kits", amount: 6400 },
      { id: "4_children", label: "4 Children (1 Month)", subLabel: "4 boys monthly education", amount: 3200 },
    ],
  },
  {
    id: "education_one_year",
    index: 5,
    title: "One Year Education for Children",
    kannadaTitle: "ಒಂದು ವರ್ಷದ ಸಂಪೂರ್ಣ ಶಿಕ್ಷಣ",
    desc: "Annual educational sponsorship covering full school fees, textbook bundles, school bags, shoes, and mentorship.",
    icon: "🎓",
    options: [
      { id: "3_children", label: "3 Children (Full Year)", subLabel: "3 boys complete academic year", amount: 28800, isPopular: true },
      { id: "2_children", label: "2 Children (Full Year)", subLabel: "2 boys full school year", amount: 19200 },
      { id: "1_child", label: "1 Child (Full Year)", subLabel: "1 boy complete academic year", amount: 9600 },
    ],
  },
];

export const OFFICIAL_FORM_META = {
  regd1: "Regd BSK/4/00003/2013-14",
  regd2: "Regd BSK 426/2017-18",
  societyName: "JANA SEVA SAMRUDDI EDUCATION & RURAL DEVELOPMENT SOCIETY (R)",
  kendraName: "MAKKALA ASHRAYA KENDRA",
  phones: ["9945223232", "9980359595"],
  phonesFormatted: "9945223232, 9980359595",
  emails: ["janasevaorphanage@gmail.com", "janasevaorphanage31@gmail.com"],
  website: "www.janasevaashrama.org / www.janasevaorphanage.org",
  slogan: "JOIN WITH US TO EDUCATE THE WORLD",
  formTitle: "SUPPORTERS FORM",
  formSubtitle: "Yes / Would like to support for a",
};
