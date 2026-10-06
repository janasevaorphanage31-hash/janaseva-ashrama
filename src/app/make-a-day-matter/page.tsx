import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Make a Day Matter · Occasion Giving · Janaseva Ashrama Bangalore",
  description:
    "Turn your birthday, anniversary, first salary, or memorial day into wholesome daily meals and learning support for children at Janaseva Ashrama. Form 10AC 80G tax benefit.",
  alternates: {
    canonical: `${SITE.url}/make-a-day-matter`,
  },
};

const OCCASIONS_DATA = [
  {
    name: "Birthday",
    tagline: "Celebrate Life with Wholesome Nourishment",
    description:
      "Instead of transient gifts, dedicate your birthday to nutritious meals, fruits, or study books for the children.",
    suggestedNeed: "Meal Support (₹100/meal)",
    needSlug: "meal",
  },
  {
    name: "Wedding & Anniversary",
    tagline: "Begin a Year of Togetherness with Kindness",
    description:
      "Celebrate your union or wedding anniversary by sharing love, safety, and nourishment with children at the Ashrama.",
    suggestedNeed: "Essentials & Hygiene (₹300/unit)",
    needSlug: "essentials",
  },
  {
    name: "First Salary & Promotion",
    tagline: "A Grateful Milestone for First Earners",
    description:
      "Offer your first earnings or bonus toward the education of young children who dream of their own careers.",
    suggestedNeed: "Education Support (₹250/unit)",
    needSlug: "education",
  },
  {
    name: "Graduation & Milestones",
    tagline: "Celebrate Academic Success with Future Scholars",
    description:
      "Honor your graduation or exam success by equipping students with school books, notebooks, and study mentoring.",
    suggestedNeed: "Education Support (₹250/unit)",
    needSlug: "education",
  },
  {
    name: "In Loving Memory",
    tagline: "Sacred Remembrance of Dear Ones",
    description:
      "Keep the legacy and compassion of beloved elders alive through pure acts of daily care and food sponsorship.",
    suggestedNeed: "Health & Wellbeing (₹500/unit)",
    needSlug: "health",
  },
  {
    name: "Festivals & Auspicious Days",
    tagline: "Spreading Festival Joy & Celebration",
    description:
      "Make Ugadi, Diwali, Eid, Christmas, or personal milestones joyous with sweet treats and festive activities.",
    suggestedNeed: "Sports & Creative Learning (₹250/unit)",
    needSlug: "activities",
  },
];

export default function MakeDayMatterPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Make a Day Matter" }]} />
      <PageHero
        eyebrow="Occasion Giving"
        title="Make a Day Matter"
        lead="Turn birthdays, anniversaries, first salaries, and cherished milestones into verified daily care for children at Janaseva Ashrama."
      />

      <Section tone="cream" className="py-12">
        <Container>
          {/* Two Immediate Pathways */}
          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <div className="rounded-3xl bg-teal-900 p-8 text-white shadow-lg flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-xl bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-200">
                  Option 1 · Instant Giving
                </span>
                <h2 className="mt-3 font-display text-2xl font-bold text-white">
                  Give Directly in Honor Today
                </h2>
                <p className="mt-2 text-sm text-teal-100/80 leading-relaxed">
                  Make a personal contribution today dedicated to someone you love. Receive an instant verified receipt and a personalized digital impact dedication card.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/impact"
                  className="focus-ring inline-block rounded-xl bg-saffron px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-saffron-dark transition"
                >
                  DEDICATE A CONTRIBUTION →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-teal-900/10 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-xl bg-saffron/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-saffron-dark">
                  Option 2 · Group Giving
                </span>
                <h2 className="mt-3 font-display text-2xl font-bold text-teal-900">
                  Start an Occasion Campaign
                </h2>
                <p className="mt-2 text-sm text-teal-950/70 leading-relaxed">
                  Ask friends, family, or colleagues to pitch in instead of gifts. You get a public campaign page, live verified progress, and a printable UPI QR code.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/campaigns/new?occasion=Birthday&type=Individual"
                  className="focus-ring inline-block rounded-xl border-2 border-teal-900 bg-teal-900 px-6 py-3.5 text-sm font-bold text-white shadow hover:bg-teal-800 transition"
                >
                  START AN OCCASION CAMPAIGN →
                </Link>
              </div>
            </div>
          </div>

          {/* Occasion Cards Grid */}
          <div>
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="font-display text-2xl font-bold text-teal-900 sm:text-3xl">
                Choose Your Special Occasion
              </h2>
              <p className="mt-2 text-sm text-teal-950/65">
                Select an occasion below to customize your giving experience or launch a group fundraiser.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {OCCASIONS_DATA.map((occ) => (
                <div
                  key={occ.name}
                  className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 flex flex-col justify-between transition hover:shadow-md hover:ring-teal-900/20"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 ring-1 ring-teal-900/10">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V4a2 2 0 10-2 2h2zm0 0H4m8 0h8" />
                        </svg>
                      </span>
                      <span className="rounded-xl bg-cream px-3 py-1 text-xs font-bold text-teal-900/70">
                        {occ.name}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold text-teal-900">
                      {occ.tagline}
                    </h3>
                    <p className="mt-2 text-xs text-teal-950/70 leading-relaxed">
                      {occ.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-teal-900/10 space-y-2">
                    <p className="text-[11px] font-semibold text-teal-900/50">
                      Suggested: <span className="text-teal-900 font-bold">{occ.suggestedNeed}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/impact/${occ.needSlug}`}
                        className="flex-1 rounded-xl bg-teal-800 py-2 text-center text-xs font-bold text-white hover:bg-teal-900 transition"
                      >
                        Give Now
                      </Link>
                      <Link
                        href={`/campaigns/new?occasion=${encodeURIComponent(occ.name)}&type=Individual`}
                        className="flex-1 rounded-xl border border-teal-900/20 bg-cream py-2 text-center text-xs font-bold text-teal-900 hover:bg-sand transition"
                      >
                        Campaign
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Step Journey */}
          <div className="mt-16 rounded-3xl bg-sand/60 p-8 ring-1 ring-teal-900/10">
            <h2 className="font-display text-xl font-bold text-teal-900 text-center mb-8">
              How Make a Day Matter Works
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center space-y-2">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-900 text-lg font-bold text-white">
                  1
                </div>
                <h3 className="font-bold text-teal-900 text-base">Select Your Milestone</h3>
                <p className="text-xs text-teal-950/70">
                  Pick your birthday, anniversary, or special remembrance and choose what daily need to sponsor.
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-saffron text-lg font-bold text-white">
                  2
                </div>
                <h3 className="font-bold text-teal-900 text-base">Give or Invite Friends</h3>
                <p className="text-xs text-teal-950/70">
                  Contribute directly with a heartfelt message, or share your campaign link and QR code on WhatsApp.
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-800 text-lg font-bold text-white">
                  3
                </div>
                <h3 className="font-bold text-teal-900 text-base">Transparent Impact Proof</h3>
                <p className="text-xs text-teal-950/70">
                  Receive an instant official receipt and see your dedication recognized on the Live Impact Wall.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
