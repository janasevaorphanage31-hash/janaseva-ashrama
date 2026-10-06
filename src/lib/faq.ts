import { SITE } from "./site";

export type FAQItem = {
  q: string;
  category: string;
  a: string;
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    q: "What is Janaseva Ashrama?",
    category: "About & Mission",
    a: "Janaseva Ashrama is a registered public charitable trust and residential children's home (orphanage) located in Bengaluru (Bangalore), Karnataka, India. The Ashrama provides complete residential care, 3 nutritious hot meals daily (Annadana), school education, healthcare, and loving family mentorship to 48+ orphaned, abandoned, and economically vulnerable children.",
  },
  {
    q: "Are donations to Janaseva Ashrama eligible for 80G tax deductions in India?",
    category: "Tax & Receipts",
    a: "Yes. Janaseva operates under JANA SEVA SAMRUDDI EDUCATION & RURAL DEVELOPMENT SOCIETY R (PAN: AABTJ7431M) and holds official provisional approval under Section 80G of the Income Tax Act, 1961 (Form No. 10AC, Unique Registration Number: AABTJ7431MF20231, Document Identification Number: AABTJ7431MF2023101, Order dated 04-09-2023) covering Assessment Years AY 2024-25 to AY 2026-27. Indian taxpayers are eligible for a 50% tax deduction under Section 80G. Every contribution automatically generates an official digital 80G receipt.",
  },
  {
    q: "Where is Janaseva Ashrama located in Bangalore, and can I visit?",
    category: "Visiting & Location",
    a: `Janaseva Ashrama is situated at #27, Gundu Thopu Turahalli, Near Govt School, Jayanagar housing Society Layout, Subramanyapura, Bangalore - 560061, Karnataka. Visiting hours are Monday to Sunday from 10:00 AM to 6:00 PM (IST). To safeguard the children's daily study routines, privacy, and health, donors and visitors are requested to schedule their visit in advance by calling or messaging us on WhatsApp at +91 ${SITE.phone}.`,
  },
  {
    q: "Can I celebrate my birthday, anniversary, or a family milestone at the Ashrama?",
    category: "Occasions & Giving",
    a: "Yes! Through our 'Make a Day Matter' initiative, you can sponsor a special celebratory feast with traditional sweets (Payasam / Laddoo) for all 48 children on your birthday, wedding anniversary, child's milestone, or in sacred memory of departed elders (Smrithi Seva). You can visit to serve the meal in person or receive verified photo/video updates on WhatsApp.",
  },
  {
    q: "How does 100% verified allocation work? Is there administrative waste?",
    category: "Transparency",
    a: "We operate on a transparent itemized needs model. When you choose specific needs (such as ₹100 for a warm meal or ₹250 for a complete school kit), 100% of your contribution is directly booked to procure those verified goods from local vendors with GST invoices. We do not deduct unverified administrative cuts.",
  },
  {
    q: "Can I donate anonymously without my name being shown publicly?",
    category: "Privacy & Giving",
    a: "Yes. Simply select the 'Donate Anonymously' checkbox at checkout. Your personal name and contact information will remain strictly confidential and will never appear on public impact walls or donor lists.",
  },
  {
    q: "What payment methods are supported for donating?",
    category: "Payments",
    a: "We support all Indian payment methods via RBI-authorized Razorpay, including UPI (Google Pay, PhonePe, Paytm, BHIM, Cred), Debit & Credit Cards (Rupay, Visa, MasterCard), and Net Banking across all major Indian banks. All transactions are protected with 256-bit bank-grade encryption.",
  },
  {
    q: "How does Janaseva Ashrama protect child safety and dignity?",
    category: "Child Safeguarding",
    a: "We strictly observe our Child Safeguarding Policy. Children at Janaseva Ashrama are never treated as emotional conversion tokens, pity objects, or promotional merchandise. Public media is strictly reviewed, respectful, and dignified.",
  },
  {
    q: "How can I sponsor a child's complete schooling or uniform?",
    category: "Education",
    a: "You can select the 'Complete School Kit & Bag' (₹250), 'School Uniform & Shoes' (₹400), or 'Evening Tutoring Support' (₹250) directly from our Needs Catalog. For long-term educational sponsorships or corporate CSR programs, please reach out to our trustees directly.",
  },
  {
    q: "How can I volunteer my time or skills at Janaseva Ashrama?",
    category: "Volunteering",
    a: "We warmly welcome volunteers in Bangalore for evening study mentoring, English speaking, computer training, sports, music, art, and healthcare camps. You can apply through our Janaseva Crew page or contact us on WhatsApp.",
  },
];
