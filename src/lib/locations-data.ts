export interface LocalityData {
  slug: string;
  name: string;
  kannadaName: string;
  distanceKm: string;
  travelTimeMin: string;
  metroConnectivity: string;
  drivingRoute: string;
  busRoutes: string;
  landmarks: string[];
  description: string;
  localContext: string;
  visitingGuide: string;
  faqs: { q: string; a: string }[];
}

export const BANGALORE_LOCALITIES: LocalityData[] = [
  {
    slug: "turahalli",
    name: "Turahalli",
    kannadaName: "ತುರಹಳ್ಳಿ",
    distanceKm: "0.2 km (Home Locality)",
    travelTimeMin: "1-2 mins walk",
    metroConnectivity: "Thalaghattapura Metro Station (Namma Metro Green Line) is 3.5 km away",
    drivingRoute: "Janaseva Ashrama is situated in Turahalli itself, adjacent to Turahalli Forest, next to the Govt Primary School in Jayanagar Housing Society Layout.",
    busRoutes: "BMTC Route 210-A, 210-H from Banashankari TTMC; get down at Turahalli Govt School stop.",
    landmarks: [
      "Turahalli Forest Viewpoint & Tree Park",
      "Turahalli Govt Primary School",
      "Sobha Forest View Apartments",
      "100 Feet Turahalli-Uttarahalli Main Road",
    ],
    description: "Janaseva Ashrama is proudly based in Turahalli, Bengaluru. Our children's home provides full-time residential shelter, English & Kannada medium schooling, and daily hot Annadana meals to 25 resident boys right here in the peaceful, green surroundings of Turahalli.",
    localContext: "Residents of Turahalli, Sobha Forest View, and Jayanagar Housing Society frequently walk over to celebrate their birthdays, wedding anniversaries, or offer weekend breakfast and lunch feasts to the boys.",
    visitingGuide: "Walk-ins are welcomed between 10:00 AM and 6:00 PM. For weekend Annadana feasts, kindly call ahead to synchronize with our kitchen schedule.",
    faqs: [
      {
        q: "Where exactly is Janaseva Ashrama located in Turahalli?",
        a: "We are at #27, Gundu Thopu, near Govt School, Jayanagar Housing Society Layout, Turahalli, Subramanyapura, Bengaluru - 560061.",
      },
      {
        q: "Can Turahalli residents volunteer or mentor the children?",
        a: "Yes! Local residents from Turahalli regularly volunteer during the 6:00 PM evening study hour to help boys with mathematics, science, English reading, and drawing.",
      },
      {
        q: "How can I celebrate my birthday with the children in Turahalli?",
        a: "You can visit in person to cut a cake and sponsor lunch (₹1,500) or a full day's 3-meal Annadana feast (₹4,500) for all 25 boys with 80G tax benefits.",
      },
    ],
  },
  {
    slug: "subramanyapura",
    name: "Subramanyapura",
    kannadaName: "ಸುಬ್ರಹ್ಮಣ್ಯಪುರ",
    distanceKm: "1.8 km",
    travelTimeMin: "5-7 mins drive",
    metroConnectivity: "Thalaghattapura Metro (Green Line, 3.5 km) or Banashankari Metro (6 km)",
    drivingRoute: "Drive via Subramanyapura Main Road past Subramanyapura Police Station towards Turahalli Govt School / Jayanagar Housing Society Layout.",
    busRoutes: "BMTC Route 210-G, 210-N, 210-AA directly connecting Subramanyapura to Turahalli.",
    landmarks: [
      "Subramanyapura Police Station",
      "Subramanyapura Lake",
      "Gubbalala Gate",
      "Brigade Omega Apartments",
    ],
    description: "Subramanyapura is our immediate neighbor in South Bengaluru. Janaseva Ashrama serves as the primary licensed child care institution and orphanage providing shelter, care, and education for 25 resident boys just minutes from Subramanyapura junction.",
    localContext: "Families and apartment communities in Subramanyapura (including Brigade Omega, Mantri Alpyne, and ISRO Layout) have been steadfast supporters of Janaseva Ashrama's daily Annadana and educational sponsorship programs.",
    visitingGuide: "Visiting takes less than 7 minutes from Subramanyapura. Open every day from 10:00 AM to 6:00 PM.",
    faqs: [
      {
        q: "How far is Janaseva Ashrama from Subramanyapura Police Station?",
        a: "It is approximately 1.8 km (5 to 7 minutes drive) via Subramanyapura Main Road towards Turahalli.",
      },
      {
        q: "Is Janaseva Ashrama recognized by the Karnataka Government?",
        a: "Yes, registered under Section 41(1) of the Juvenile Justice Act (Certificate KA18CH0242) and approved for 80G tax deductions under Form 10AC URN AABTJ7431MF20231.",
      },
      {
        q: "Can I bring cooked food or groceries from Subramanyapura?",
        a: "We welcome dry grocery donations (sona masoori rice, toor dal, cooking sunflower oil, wheat atta) or you can sponsor freshly cooked meals prepared hygienic in our ashrama kitchen.",
      },
    ],
  },
  {
    slug: "uttarahalli",
    name: "Uttarahalli",
    kannadaName: "ಉತ್ತರಹಳ್ಳಿ",
    distanceKm: "3.2 km",
    travelTimeMin: "8-10 mins drive",
    metroConnectivity: "Thalaghattapura Metro (3.5 km) or Banashankari Metro (5 km)",
    drivingRoute: "Head south along Uttarahalli Main Road towards Channasandra / Turahalli, turn left at Jayanagar Housing Society Layout near Govt Primary School.",
    busRoutes: "BMTC Route 210, 210-A, 375 connecting Uttarahalli Circle to Turahalli.",
    landmarks: [
      "Uttarahalli Circle",
      "Dr. Vishnuvardhan Memorial",
      "Rajarajeshwari Temple Link Road",
      "Poornaprajna Layout",
    ],
    description: "Uttarahalli is one of South Bangalore's most vibrant cultural and residential hubs. Located just 3.2 km away, Janaseva Ashrama is the closest verified 80G-licensed children's home where Uttarahalli residents can sponsor meals, educational kits, and celebrate family milestones.",
    localContext: "Many families from Uttarahalli, Poornaprajna Layout, and Channasandra celebrate festive occasions like Ugadi, Diwali, and birthdays with the 25 boys at Janaseva.",
    visitingGuide: "Convenient 8-10 minute drive from Uttarahalli Circle. Advance phone call to +91 99803 59595 is recommended for meal scheduling.",
    faqs: [
      {
        q: "Can Uttarahalli residents book a birthday celebration visit?",
        a: "Yes! You can choose between the Lunch slot (11:30 AM – 1:30 PM) or Evening snacks & cake cutting slot (4:30 PM – 6:30 PM).",
      },
      {
        q: "What is the cost of sponsoring Annadana from Uttarahalli?",
        a: "Morning breakfast is ₹1,000, lunch feast with sweets is ₹1,500, and full-day meals for all 25 boys is ₹4,500 with instant 80G digital receipt.",
      },
    ],
  },
  {
    slug: "banashankari",
    name: "Banashankari",
    kannadaName: "ಬನಶಂಕರಿ",
    distanceKm: "6.5 km",
    travelTimeMin: "15-18 mins drive",
    metroConnectivity: "Banashankari Metro Station (Green Line) connected via direct BMTC buses and taxis",
    drivingRoute: "From Banashankari Temple / TTMC, take Kanakapura Road or Uttarahalli Main Road heading south past Subramanyapura to Turahalli.",
    busRoutes: "BMTC 210 series buses from Banashankari TTMC platform 4 directly reach Turahalli Govt School.",
    landmarks: [
      "Banashankari Amma Temple",
      "Banashankari TTMC & Metro Station",
      "BSK 2nd & 3rd Stage",
      "Deve Gowda Petrol Bunk Junction",
    ],
    description: "Banashankari is the cultural nucleus of South Bangalore. Janaseva Ashrama's managing society maintains its banking and community ties directly in Banashankari (Axis Bank Banashankari Branch). The Ashrama provides 25 boys with shelter and schooling, situated just 15 minutes away in Turahalli.",
    localContext: "Devotees of Banashankari Amma Temple regularly combine temple visits with Annadana seva at Janaseva Ashrama, extending their prayers by nourishing children without families.",
    visitingGuide: "A straight 15-minute drive down Kanakapura Road or Uttarahalli Main Road. Ample safe street parking is available at the Ashrama campus.",
    faqs: [
      {
        q: "How to reach Janaseva Ashrama from Banashankari Bus Stand?",
        a: "Board any 210-series BMTC bus from Banashankari TTMC towards Turahalli or take an auto/cab (approx. ₹120-₹160).",
      },
      {
        q: "Are donations from Banashankari donors eligible for tax exemption?",
        a: "Yes, 50% deduction under Section 80G of the Income Tax Act via Form 10AC URN AABTJ7431MF20231.",
      },
    ],
  },
  {
    slug: "kanakapura-road",
    name: "Kanakapura Road",
    kannadaName: "ಕನಕಪುರ ರಸ್ತೆ",
    distanceKm: "3.5 km",
    travelTimeMin: "8-10 mins drive",
    metroConnectivity: "Thalaghattapura Metro Station & Silk Institute Metro Station (Green Line) are within 3.5 to 4.2 km",
    drivingRoute: "Drive along Kanakapura Main Road (NH 948), turn right at KSIT College / Gubbalala Gate towards Turahalli Forest and Subramanyapura.",
    busRoutes: "BMTC 211, 212, 213, 214 along Kanakapura Road to Gubbalala Gate, followed by a short 3-minute connecting ride to Turahalli.",
    landmarks: [
      "KSIT College of Engineering",
      "Thalaghattapura Metro Station",
      "Art of Living International Ashram (12 km south)",
      "Forum South Bangalore Mall (Prestige Falcon City)",
    ],
    description: "Kanakapura Road is one of Bangalore's fastest-growing residential and institutional corridors. Located right beside this corridor, Janaseva Ashrama provides care, hot Annadana, and schooling for 25 orphaned boys, making it convenient for residents of Prestige Falcon City, Mantri Courtyard, and Purva Highland to participate in charitable seva.",
    localContext: "Tech professionals and families along the Kanakapura Road metro corridor actively support the children's computer lab literacy and school bag sponsorships.",
    visitingGuide: "Very easy access via Thalaghattapura Metro or Gubbalala Gate junction. Open 7 days a week, 10:00 AM to 6:00 PM.",
    faqs: [
      {
        q: "Which metro station is nearest to Janaseva Ashrama on Kanakapura Road?",
        a: "Thalaghattapura Metro Station on the Green Line is closest (3.5 km, approx 8 mins by auto).",
      },
      {
        q: "Can tech employees along Kanakapura Road sponsor a child's education?",
        a: "Yes. Sponsoring an annual school kit (books, uniforms, shoes, bag) is ₹3,500, and a child's monthly education & living cost is ₹2,500.",
      },
    ],
  },
  {
    slug: "jayanagar",
    name: "Jayanagar",
    kannadaName: "ಜಯನಗರ",
    distanceKm: "8.5 km",
    travelTimeMin: "20-25 mins drive",
    metroConnectivity: "Jayanagar Metro Station / South End Circle Metro (Green Line) to Thalaghattapura Metro",
    drivingRoute: "Via Jayanagar 4th Block -> 9th Block -> Banashankari -> Kanakapura Road or Padmanabhanagar -> Turahalli.",
    busRoutes: "BMTC 215, 210 directly connecting Jayanagar 4th Block / 9th Block to Turahalli / Subramanyapura.",
    landmarks: [
      "Jayanagar 4th Block Shopping Complex",
      "Jayanagar Housing Society (our locality developer)",
      "Madhavan Park",
      "Rashtreeya Vidyalaya (RV) Institutions",
    ],
    description: "Jayanagar is Bangalore's historic, traditional heart. Interestingly, Janaseva Ashrama's campus is situated in the 'Jayanagar Housing Society Layout' in Turahalli. Our home provides 25 resident boys with a dignified upbringing, Vedic values, and modern education.",
    localContext: "Generations of Jayanagar residents have practiced Annadana and charitable giving. Janaseva Ashrama is the preferred authentic home for Jayanagar families seeking genuine, direct-impact seva.",
    visitingGuide: "A pleasant 20-minute drive from Jayanagar 4th Block down south. Visit to cut cakes, celebrate anniversaries, or sponsor festive weekend feasts.",
    faqs: [
      {
        q: "Is Janaseva Ashrama connected to Jayanagar?",
        a: "Yes! Our permanent campus is located in the Jayanagar Housing Society Layout in Turahalli, Bangalore South.",
      },
      {
        q: "Can Jayanagar donors sponsor meals online?",
        a: "Yes, you can make instant contributions via UPI (Google Pay, PhonePe, Paytm) at https://www.janasevaorphanage.org/donate and receive an instant 80G tax receipt.",
      },
    ],
  },
  {
    slug: "jp-nagar",
    name: "JP Nagar",
    kannadaName: "ಜೆ.ಪಿ. ನಗರ",
    distanceKm: "7.0 km",
    travelTimeMin: "18-22 mins drive",
    metroConnectivity: "JP Nagar Metro Station or Yelachenahalli Metro Station (Green Line)",
    drivingRoute: "Via JP Nagar 6th Phase -> Chunchgatta Main Road -> Konanakunte Cross -> Gubbalala -> Turahalli.",
    busRoutes: "BMTC Route 210, 215 connecting JP Nagar to Subramanyapura and Turahalli.",
    landmarks: [
      "JP Nagar 6th Phase Ring Road Junction",
      "Konanakunte Cross Metro & Forum Mall",
      "Brigade Millennium & Brigade Gardenia",
      "Sarakki Lake",
    ],
    description: "JP Nagar is home to thousands of socially conscious families, professionals, and senior citizens. Located just 7 km away, Janaseva Ashrama provides 25 boys with 3 hot meals a day, formal schooling, and pediatric healthcare.",
    localContext: "Many residents from JP Nagar Phases 1 through 8 visit Janaseva on festive occasions, birthdays, and death anniversaries (Pitru Tithi) to serve warm meals to the children.",
    visitingGuide: "Quick 18-minute drive via Konanakunte Cross or Subramanyapura. Visitors are welcomed every day from 10:00 AM to 6:00 PM.",
    faqs: [
      {
        q: "How to celebrate Pitru Smarana or Memorial Day from JP Nagar?",
        a: "You can sponsor Annadana meals in memory of departed parents or elders. The boys chant peace shlokas and prayers for your family's ancestors.",
      },
    ],
  },
  {
    slug: "rr-nagar",
    name: "Rajarajeshwari Nagar (RR Nagar)",
    kannadaName: "ರಾಜರಾಜೇಶ್ವರಿ ನಗರ",
    distanceKm: "6.8 km",
    travelTimeMin: "16-20 mins drive",
    metroConnectivity: "Rajarajeshwari Nagar Metro (Purple Line) -> connecting road to Uttarahalli / Turahalli",
    drivingRoute: "From RR Nagar Gate / Temple, take the double road past BEML Layout to Uttarahalli Circle, then 3 minutes down to Turahalli.",
    busRoutes: "BMTC 375, 375-A connecting RR Nagar directly to Uttarahalli and Turahalli.",
    landmarks: [
      "Rajarajeshwari Temple (Sri Jnanakshi Rajarajeshwari)",
      "BEML Layout",
      "Global Village Tech Park",
      "RR Nagar Arch",
    ],
    description: "Rajarajeshwari Nagar is a picturesque, peaceful locality in West-South Bangalore. Located a short 16-minute drive via Uttarahalli, Janaseva Ashrama is the premier licensed children's home for RR Nagar families looking to sponsor meals and support child education.",
    localContext: "Devotees of Sri Rajarajeshwari Temple and tech professionals from Global Village regularly conduct food drives and sponsor meals for the 25 resident boys.",
    visitingGuide: "Head through BEML Layout towards Uttarahalli Circle and continue 3 km to Turahalli. Visiting hours: 10:00 AM to 6:00 PM daily.",
    faqs: [
      {
        q: "Can companies in Global Village RR Nagar do CSR programs with Janaseva?",
        a: "Yes! Janaseva has official MCA CSR-1 registration (CSR00078800) and is eligible for corporate CSR grants under Section 135.",
      },
    ],
  },
  {
    slug: "kengeri",
    name: "Kengeri",
    kannadaName: "ಕೆಂಗೇರಿ",
    distanceKm: "8.2 km",
    travelTimeMin: "20-25 mins drive",
    metroConnectivity: "Kengeri Bus Terminal Metro Station (Purple Line) and suburban rail connections",
    drivingRoute: "Via Kengeri Satellite Town -> Kommaghatta Road or NICE Ring Road exit towards Kanakapura Road / Turahalli.",
    busRoutes: "BMTC 375 series connecting Kengeri TTMC to Uttarahalli and Turahalli.",
    landmarks: [
      "Kengeri Satellite Town",
      "Kengeri TTMC",
      "NICE Road Kanakapura / Mysore Road interchange",
      "Rajarajeswari Medical College",
    ],
    description: "Kengeri connects Bangalore to Mysore and hosts large educational and residential developments. Located 20 minutes away, Janaseva Ashrama cares for 25 boys with full-time shelter, nutritious food, and English/Kannada schooling.",
    localContext: "Students, faculty, and families from Kengeri frequently visit Janaseva to conduct educational workshops and share festive meals with the children.",
    visitingGuide: "Easily reached via NICE Road or Uttarahalli Main Road. Open daily 10:00 AM to 6:00 PM.",
    faqs: [
      {
        q: "How to visit from Kengeri using NICE Road?",
        a: "Take NICE Road from Mysore Road interchange to Kanakapura Road exit (approx 8 mins), then head 4 km towards Turahalli.",
      },
    ],
  },
  {
    slug: "south-bangalore",
    name: "South Bangalore",
    kannadaName: "ದಕ್ಷಿಣ ಬೆಂಗಳೂರು",
    distanceKm: "Central Hub for South Bengaluru",
    travelTimeMin: "5-25 mins from any South Bangalore locality",
    metroConnectivity: "Namma Metro Green Line corridor (Yelachenahalli, Thalaghattapura, Silk Institute)",
    drivingRoute: "Easily accessible from all South Bangalore arterials: Kanakapura Road, Bannerghatta Road, Ring Road, and Uttarahalli Main Road.",
    busRoutes: "Extensive BMTC bus coverage from Banashankari, Jayanagar, and Kengeri TTMCs.",
    landmarks: [
      "Turahalli Forest",
      "Banashankari Temple",
      "Kanakapura Road Metro Corridor",
      "Subramanyapura Lake",
    ],
    description: "South Bangalore is renowned for its cultural heritage, philanthropic traditions, and community warmth. Janaseva Ashrama is a premier government-registered child care institution (JJ Act KA18CH0242) and 80G tax-exempt home nurturing 25 resident boys in South Bangalore.",
    localContext: "From Padmanabhanagar to Electronic City and Banashankari, South Bangalore donors form the backbone of Janaseva Ashrama's daily Annadana and educational excellence initiatives.",
    visitingGuide: "Located in the tranquil environs of Turahalli, our ashrama provides a clean, green, family-friendly space to celebrate special occasions with children.",
    faqs: [
      {
        q: "What makes Janaseva Ashrama unique in South Bangalore?",
        a: "We are 100% transparent: 25 resident boys, licensed under the Juvenile Justice Act (KA18CH0242), Form 10AC 80G tax benefits, and open visiting policy 7 days a week.",
      },
      {
        q: "Can I sponsor food online from anywhere in South Bangalore?",
        a: "Yes. Use our secure online donation portal with UPI or cards. You receive an instant digital receipt and personalized blessings from the boys.",
      },
    ],
  },
];
