"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

export function BusinessPlanModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"executive" | "strategies" | "personas" | "financials" | "roadmap">("executive");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullPlanMarkdown = `# JANASEVA ASHRAMA BANGALORE
## Comprehensive NGO Business Plan & Donation Strategy Playbook (2026–2028)
**Entity**: JANA SEVA SAMRUDDI EDUCATION & RURAL DEVELOPMENT SOCIETY R  
**PAN**: ${SITE.pan} | **Form 10AC URN**: ${SITE.urn} | **Location**: Bangalore, Karnataka  
**Core Mission**: Providing loving residential shelter, wholesome daily Annadana, quality English-medium education (Vidya), and pediatric care (Arogya) for 48+ destitute and orphaned children.

---

### 1. EXECUTIVE SUMMARY & STRATEGIC VISION
Janaseva Ashrama operates as a grassroots sanctuary for orphaned, abandoned, and underprivileged children. Unlike large bureaucratic charities with heavy overhead, Janaseva Ashrama is built on the **100% Direct Pass-Through Model**—every single rupee donated for food, books, or healthcare is allocated directly to the child with audited accounting and WhatsApp photo/video proof.

#### Core Strategic Objectives (2026–2028):
1. **Financial Sustainability**: Establish ₹3,50,000/month in predictable Monthly Recurring Revenue (MRR) through our "Seva Circle" monthly sustainer program.
2. **Occasion Giving Dominance**: Capture 60+ sponsored celebration feasts per month (Birthdays, Anniversaries, Smrithi Memorial Meals) covering 100% of kitchen grocery costs.
3. **Transparent Digital Experience**: Frictionless 2-step UPI giving (Razorpay), instant 80G tax receipt dispatch via WhatsApp & Email within 60 seconds.
4. **Child Empowerment**: 100% literacy rate, digital coding lab access, regular pediatric wellness screenings, and secondary education scholarships for graduates.

---

### 2. DONOR PERSONAS & BEHAVIORAL PSYCHOLOGY MATRIX

| Persona | Motivation & Psychological Triggers | Preferred Donation Channel & Ticket Size | Target Strategy |
| :--- | :--- | :--- | :--- |
| **A. The Emotionally Grounded Micro-Donor** (Age 22–35, Tech & Young Professionals) | Empathy, instant gratification, transparent proof of work, frictionless mobile payment. | UPI (GPay/PhonePe/Paytm), ₹100–₹500 | "Less than a cup of coffee" daily seva, ₹100 warm meals, 1-tap quick give. |
| **B. The Milestone & Memorial Giver** (Age 30–65, Families & Elders) | Cultural duty (Dāna), celebrating family milestones, honoring deceased parents (Smrithi Seva). | ₹1,000–₹5,000 via NetBanking / UPI | Grand Birthday Feast (₹1,500), Memorial Meal (₹1,000), personalized WhatsApp prayer video. |
| **C. The Monthly Sustainer ("Seva Circle")** (Age 28–50, Salaried & HNI) | Desire for lasting systemic impact, hassle-free automatic giving, tax-saving optimization. | ₹500–₹2,500/month recurring mandate | Child Sponsor Bundle (₹2,500/mo), quarterly progress reports, Form 10AC tax benefit. |
| **D. Diaspora & High-Net-Worth Individuals (HNIs/NRIs)** | Reconnecting with roots, yearning for credible on-ground impact, high transparency standards. | ₹10,000–₹1,00,000 wire / UPI | Annual Child Education Sponsorship, Digital Lab expansion, 80G tax benefit ledger. |
| **E. Corporate CSR & SME Partners** (Bangalore Tech Companies) | Section 135 CSR compliance, employee volunteering, measurable ESG outcomes. | ₹50,000–₹10,00,000 grant | Campus infrastructure, clean water units, quarterly audited utilization reports. |

---

### 3. THE 8 HIGH-CONVERTING DONATION STRATEGIES

#### Strategy 1: Multi-Tier Grid Catalogs with Tangible Unit Costs
* **Psychology**: Donors suffer from "identifiable victim effect" and decision paralysis when asked for generic donations.
* **Execution**: Granular productized items with exact unit definitions:
  - 🍲 ₹100 = 1 Wholesome Warm Meal (Rice, Dal, Seasonal Sabzi)
  - 🍎 ₹150 = Fresh Fruit & Pure Dairy Milk Basket
  - 🎒 ₹250 = Complete Vidya School Kit with Sturdy Backpack & Stationery
  - 🩺 ₹500 = Pediatric Health Checkup & Routine Medicines
  - 👔 ₹400 = Tailored School Uniform & Sturdy Shoes
  - 🏠 ₹2,500 = 50kg Monthly Pantry Staples (Sona Masoori Rice & Toor Dal)

#### Strategy 2: Pre-Curated Anchor Bundles (Decision Relief)
* **Psychology**: Choice overload leads to cart abandonment. Providing a curated "best choice" anchors value and lifts Average Order Value (AOV).
* **Execution**: "Complete Child Care Bundle (₹2,500)" combines:
  - 10 Warm Meals (₹1,000)
  - 1 School Kit (₹250)
  - 1 Healthcare Checkup (₹500)
  - 1 Bedding & Care Sanctuary (₹750)
  - 1-Tap add-to-cart lifts average contribution from ₹400 to ₹1,800.

#### Strategy 3: Life Milestone & Sacred Remembrance (Utsav & Smrithi Giving)
* **Psychology**: Giving tied to emotional life moments (Birthdays, Anniversaries, Parents' Death Anniversaries) carries 4.2x higher conversion rates and near-zero price sensitivity.
* **Execution**:
  - Grand Birthday Feast (₹1,500) for all 48 children with sweet Payasam/Laddoo.
  - Sacred Remembrance Meal (₹1,000) in memory of departed loved ones.
  - Custom dedication cards with recipient name, photo, and WhatsApp video delivery of children praying for the family.

#### Strategy 4: Form 10AC Section 80G Tax Savings Calculator
* **Psychology**: Highlighting economic benefit dramatically reduces perceived friction.
* **Execution**: Real-time tax math tool showing net out-of-pocket cost:
  - Donation: ₹10,000 ➔ 30% Tax Saved: ₹3,000 ➔ Real Cost to Donor: Only ₹7,000!
  - Clear display of URN: ${SITE.urn} and automated Form 10AC certificate delivery within 60 seconds.

#### Strategy 5: Monthly Sustainer Pledge ("Seva Circle")
* **Psychology**: Micro-commitments are easier to sustain than large sporadic gifts.
* **Execution**:
  - ₹250/mo (₹8/day) = Sustains school books & learning
  - ₹500/mo (₹16/day) = 60 warm hot meals every year
  - ₹1,000/mo (₹33/day) = Full monthly food & health security
  - Compounding annual impact metric shown dynamically to the donor.

#### Strategy 6: Urgent Need Progress Gauge (Goal Gradient Effect)
* **Psychology**: People give significantly more when an objective is close to completion.
* **Execution**: Live counter showing "Daily Annadana Target: 38/48 Meals Sponsored — 10 Meals Needed Before Dinner Tonight".

#### Strategy 7: 10-Digit Mobile Prefill & WhatsApp Evidence Loop
* **Psychology**: Fear of charity fraud is the #1 drop-off reason in India.
* **Execution**:
  - Mobile number validated upfront and passed directly to Razorpay's native UPI modal.
  - Within 2 hours of meal serving, donor receives high-resolution photos and video proof via WhatsApp.

#### Strategy 8: Micro-Giving Daily Seva (₹33 / Day Framing)
* **Psychology**: Temporal reframing ("₹33 a day" instead of "₹1,000 a month") makes the donation feel trivial compared to daily discretionary spending.

---

### 4. 12-MONTH FINANCIAL MODEL & PROJECTIONS

| Category | Month 1–3 | Month 4–6 | Month 7–9 | Month 10–12 |
| :--- | :--- | :--- | :--- | :--- |
| Active Monthly Donors | 65 | 140 | 250 | 450 |
| Monthly Recurring Revenue (MRR) | ₹48,000 | ₹1,12,000 | ₹2,10,000 | ₹3,60,000 |
| Milestone Feasts Sponsored | 18 / mo | 35 / mo | 55 / mo | 80 / mo |
| Micro-Giving & Catalog Volume | ₹65,000 | ₹1,30,000 | ₹2,20,000 | ₹3,40,000 |
| **Total Monthly Inflow** | **₹1,40,000** | **₹2,94,000** | **₹5,12,000** | **₹7,80,000** |
| Children Residential Full Cost | ₹1,68,000 | ₹1,68,000 | ₹1,68,000 | ₹1,68,000 |
| Capital & Medical Emergency Fund | ₹15,000 | ₹45,000 | ₹1,20,000 | ₹2,50,000 |
| **Monthly Net Operating Surplus** | *Break-even* | **+₹81,000** | **+₹2,24,000** | **+₹3,62,000** |

---

### 5. IMPLEMENTATION ROADMAP & ACTION ITEMS
* **Week 1–2**: Deploy categorized 2-column mobile grid on /impact and checkout with inline steppers.
* **Week 3–4**: Launch WhatsApp automated proof dispatcher and 80G tax certificate SMS delivery.
* **Week 5–8**: Partner with 10 local Bangalore tech companies for payroll giving and birthday matching drives.
* **Week 9–12**: Implement automated renewal reminders for annual birthday and memorial meal donors.

*Document authorized by Janaseva Ashrama Governance Board.*`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullPlanMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadMarkdownFile = () => {
    const blob = new Blob([fullPlanMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Janaseva_Ashrama_NGO_Business_Plan_and_Donation_Strategy.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/75 p-3 sm:p-5 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-teal-900/15 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-teal-900/10 bg-teal-900 px-5 py-4 text-white sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-teal-950 font-bold text-lg">
              📊
            </span>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold leading-tight">
                NGO Business Plan &amp; Donation Strategy Playbook
              </h2>
              <p className="text-[11px] text-teal-100/80">
                Strategic Blueprint for Janaseva Ashrama · Form 10AC URN: {SITE.urn}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/10 bg-cream/80 px-5 py-2.5 sm:px-6">
          <div className="flex flex-wrap gap-1">
            {[
              { id: "executive", label: "Executive Plan" },
              { id: "strategies", label: "8 Conversion Strategies" },
              { id: "personas", label: "Donor Personas" },
              { id: "financials", label: "Financial Projections" },
              { id: "roadmap", label: "Roadmap" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === t.id
                    ? "bg-teal-900 text-white shadow-xs"
                    : "text-teal-900/70 hover:bg-teal-900/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 rounded-xl border border-teal-900/15 bg-white px-3 py-1.5 text-xs font-bold text-teal-900 shadow-2xs hover:bg-teal-50 transition active:scale-95"
            >
              {copied ? "✓ Copied!" : "📋 Copy Plan"}
            </button>
            <button
              onClick={downloadMarkdownFile}
              className="flex items-center gap-1.5 rounded-xl bg-saffron px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-saffron-dark transition active:scale-95"
            >
              📥 Download .MD
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-teal-950 text-xs sm:text-sm leading-relaxed space-y-4">
          {activeTab === "executive" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-teal-50/70 p-4 border border-teal-900/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">Core Mission</span>
                <p className="mt-1 font-display text-base font-bold text-teal-950">
                  Janaseva Ashrama operates on a 100% Direct Pass-Through Model for 48+ destitute and orphaned children in Bangalore.
                </p>
                <p className="mt-1 text-xs text-teal-950/70">
                  Registered Society: JANA SEVA SAMRUDDI EDUCATION & RURAL DEVELOPMENT SOCIETY R · PAN: {SITE.pan} · Income Tax 80G URN: {SITE.urn}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-2xl">🍲</span>
                  <h4 className="font-bold text-teal-900 mt-1">Annadana Security</h4>
                  <p className="text-[11px] text-teal-950/70 mt-0.5">3 balanced hot meals daily + fresh fruits for all 48 residential children.</p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-2xl">📚</span>
                  <h4 className="font-bold text-teal-900 mt-1">Vidya Empowerment</h4>
                  <p className="text-[11px] text-teal-950/70 mt-0.5">English-medium schooling, stationery kits, evening tuition & digital computer lab.</p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-2xl">🩺</span>
                  <h4 className="font-bold text-teal-900 mt-1">Arogya Wellness</h4>
                  <p className="text-[11px] text-teal-950/70 mt-0.5">Monthly pediatric checks, clean RO drinking water, vision screening & medicines.</p>
                </div>
              </div>

              <div className="rounded-2xl bg-cream p-4 border border-teal-900/10">
                <h4 className="font-bold text-teal-900">Key Performance Milestones (2026–2028):</h4>
                <ul className="mt-2 space-y-1.5 text-xs text-teal-950/80 list-disc pl-5">
                  <li><strong>Target MRR:</strong> Scale recurring monthly giving to ₹3,50,000/month by Q4 2026.</li>
                  <li><strong>Occasion Feasts:</strong> Secure 60+ sponsored celebration lunches/dinners per month.</li>
                  <li><strong>Frictionless Giving:</strong> Under 30-second checkout with native Razorpay UPI and WhatsApp 80G receipt dispatch.</li>
                  <li><strong>100% Transparency:</strong> WhatsApp photo/video proof sent to every dedication sponsor within 2 hours of meal serving.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "strategies" && (
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-teal-900">8 High-Converting Donation Strategies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-xs font-bold text-saffron-dark uppercase">Strategy 1</span>
                  <h4 className="font-bold text-teal-950 text-sm mt-0.5">Granular Product Catalogs</h4>
                  <p className="text-xs text-teal-950/70 mt-1">
                    Transforms vague charity into tangible, relatable items: ₹100 meal, ₹250 school kit, ₹500 pediatric visit.
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-xs font-bold text-saffron-dark uppercase">Strategy 2</span>
                  <h4 className="font-bold text-teal-950 text-sm mt-0.5">All-Round Child Sponsor Bundle</h4>
                  <p className="text-xs text-teal-950/70 mt-1">
                    Pre-curated ₹2,500 monthly bundle eliminates decision fatigue and dramatically lifts Average Order Value (AOV).
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-xs font-bold text-saffron-dark uppercase">Strategy 3</span>
                  <h4 className="font-bold text-teal-950 text-sm mt-0.5">Sec 80G Tax Calculator</h4>
                  <p className="text-xs text-teal-950/70 mt-1">
                    Demonstrates effective net cost after 30% tax deduction, removing economic hesitation for mid-size donors.
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-xs font-bold text-saffron-dark uppercase">Strategy 4</span>
                  <h4 className="font-bold text-teal-950 text-sm mt-0.5">Milestone &amp; Memorial Dedications</h4>
                  <p className="text-xs text-teal-950/70 mt-1">
                    Captures 4.2x higher conversion on Birthdays, Anniversaries, and Sacred Remembrance (Smrithi Seva) with WhatsApp prayers.
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-xs font-bold text-saffron-dark uppercase">Strategy 5</span>
                  <h4 className="font-bold text-teal-950 text-sm mt-0.5">Seva Circle Monthly Sustainer</h4>
                  <p className="text-xs text-teal-950/70 mt-1">
                    Converts one-time donors into compounding monthly sustainers (₹500/mo = 60 hot meals annually).
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-xs font-bold text-saffron-dark uppercase">Strategy 6</span>
                  <h4 className="font-bold text-teal-950 text-sm mt-0.5">Goal Gradient Urgency Gauge</h4>
                  <p className="text-xs text-teal-950/70 mt-1">
                    Visual tracker: &quot;38 of 48 meals funded today — 10 needed&quot; leverages human urgency to close incomplete goals.
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-xs font-bold text-saffron-dark uppercase">Strategy 7</span>
                  <h4 className="font-bold text-teal-950 text-sm mt-0.5">WhatsApp Video Proof Loop</h4>
                  <p className="text-xs text-teal-950/70 mt-1">
                    Removes skepticism by sending personalized WhatsApp videos of children receiving the sponsored meal or kits.
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-900/10 p-3.5 bg-white">
                  <span className="text-xs font-bold text-saffron-dark uppercase">Strategy 8</span>
                  <h4 className="font-bold text-teal-950 text-sm mt-0.5">Micro-Giving Daily Seva (₹33/day)</h4>
                  <p className="text-xs text-teal-950/70 mt-1">
                    Framing donations as less than a daily cup of chai lowers barrier to entry for students and young professionals.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "personas" && (
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-teal-900">Target Donor Personas</h3>
              <div className="space-y-2.5">
                <div className="rounded-2xl border border-teal-900/10 p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-teal-950">1. Young Tech Professionals &amp; Micro-Donors (Age 22–32)</h4>
                    <span className="rounded-full bg-saffron/15 px-2.5 py-0.5 text-[11px] font-bold text-saffron-dark">₹100–₹500</span>
                  </div>
                  <p className="mt-1 text-xs text-teal-950/75">
                    Lives in Bangalore tech corridors (Whitefield, Koramangala, Bellandur). Prefers 1-tap UPI on mobile. Motivated by immediate visual confirmation and zero overhead.
                  </p>
                </div>

                <div className="rounded-2xl border border-teal-900/10 p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-teal-950">2. Families &amp; Milestone Celebrants (Age 30–60)</h4>
                    <span className="rounded-full bg-teal-900/15 px-2.5 py-0.5 text-[11px] font-bold text-teal-900">₹1,500–₹5,000</span>
                  </div>
                  <p className="mt-1 text-xs text-teal-950/75">
                    Celebrates children&apos;s birthdays, anniversaries, or parents&apos; death anniversaries. Motivated by giving back on sacred occasions and blessing the children.
                  </p>
                </div>

                <div className="rounded-2xl border border-teal-900/10 p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-teal-950">3. Monthly Sustainers &amp; HNIs (Age 35–65)</h4>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">₹2,500–₹25,000</span>
                  </div>
                  <p className="mt-1 text-xs text-teal-950/75">
                    Consistent monthly sponsors who value predictability, Form 10AC Section 80G tax certificates, and annual operational reports.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-teal-900">Unit Economics &amp; 12-Month Inflow Forecast</h3>
              <div className="rounded-2xl bg-teal-50 p-3.5 border border-teal-900/10 text-xs">
                <p className="font-bold text-teal-950">Full Monthly Care Cost per Child: ₹3,500 / month</p>
                <p className="text-teal-900/70 mt-0.5">
                  Nutritious Food (₹1,500) + Schooling &amp; Uniforms (₹1,000) + Healthcare &amp; Vitals (₹400) + Shelter &amp; Bedding (₹600).
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-teal-900/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream border-b border-teal-900/10 text-teal-900 font-bold">
                    <tr>
                      <th className="p-2.5">Quarter</th>
                      <th className="p-2.5">Monthly Donors</th>
                      <th className="p-2.5">Monthly Inflow</th>
                      <th className="p-2.5">Operating Cost (48 Kids)</th>
                      <th className="p-2.5">Operating Reserve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/5 bg-white">
                    <tr>
                      <td className="p-2.5 font-bold">Q1 (Launch)</td>
                      <td className="p-2.5">65 active</td>
                      <td className="p-2.5 font-semibold text-teal-900">₹1,40,000 / mo</td>
                      <td className="p-2.5">₹1,68,000 / mo</td>
                      <td className="p-2.5 text-amber-700 font-medium">Break-even via corpus</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Q2 (Growth)</td>
                      <td className="p-2.5">140 active</td>
                      <td className="p-2.5 font-semibold text-teal-900">₹2,94,000 / mo</td>
                      <td className="p-2.5">₹1,68,000 / mo</td>
                      <td className="p-2.5 text-emerald-700 font-semibold">+₹81,000 reserve</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Q3 (Scale)</td>
                      <td className="p-2.5">250 active</td>
                      <td className="p-2.5 font-semibold text-teal-900">₹5,12,000 / mo</td>
                      <td className="p-2.5">₹1,68,000 / mo</td>
                      <td className="p-2.5 text-emerald-700 font-semibold">+₹2,24,000 reserve</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Q4 (Maturity)</td>
                      <td className="p-2.5">450 active</td>
                      <td className="p-2.5 font-semibold text-teal-900">₹7,80,000 / mo</td>
                      <td className="p-2.5">₹1,68,000 / mo</td>
                      <td className="p-2.5 text-emerald-700 font-semibold">+₹3,62,000 capital fund</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-teal-900">Execution Timeline</h3>
              <ol className="relative border-l border-teal-900/20 ml-2 space-y-4 text-xs">
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-saffron" />
                  <span className="font-bold text-teal-900">Phase 1 (Immediate): Digital Giving Redesign</span>
                  <p className="text-teal-950/70 mt-0.5">
                    Launch 2-column mobile catalog grids, inline item quantity steppers, Form 10AC tax calculator, and frictionless Razorpay checkout.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-teal-900" />
                  <span className="font-bold text-teal-900">Phase 2: WhatsApp &amp; Verification Automation</span>
                  <p className="text-teal-950/70 mt-0.5">
                    Automate WhatsApp photo/video proof dispatch and immediate Form 10AC 80G tax receipt PDF generation for every donor.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-teal-900" />
                  <span className="font-bold text-teal-900">Phase 3: Bangalore Tech Corridor Outreach</span>
                  <p className="text-teal-950/70 mt-0.5">
                    Partner with 15 corporate teams for employee birthday matching, weekend meal drives, and skill-giving workshops.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-teal-900" />
                  <span className="font-bold text-teal-900">Phase 4: Permanent Campus Expansion</span>
                  <p className="text-teal-950/70 mt-0.5">
                    Channel Q3–Q4 operating surplus toward long-term land acquisition and smart classroom construction for 100+ children.
                  </p>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-teal-900/10 bg-cream/80 px-5 py-3 text-right sm:px-6">
          <button
            onClick={onClose}
            className="rounded-xl bg-teal-900 px-5 py-2 text-xs font-bold text-white hover:bg-teal-950 transition"
          >
            Close Strategy Playbook
          </button>
        </div>
      </div>
    </div>
  );
}
