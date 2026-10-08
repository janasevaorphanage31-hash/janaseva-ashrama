"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../CartProvider";
import { Container, Section } from "../ui";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";

const ONE_THINGS = [
  {
    category: "ANNADANA",
    slug: "meal",
    title: "Sponsor a Warm Meal",
    amount: 100,
    unit: "meal",
    image: "/media/food.jpg",
    badge: "Most Urgent Today",
    description: "Wholesome hot lunch or dinner: fragrant rice, nutritious lentils (dal), and fresh vegetables cooked with warmth.",
  },
  {
    category: "NUTRITION",
    slug: "fruits",
    title: "Fresh Fruit & Milk Basket",
    amount: 150,
    unit: "basket",
    image: "/media/fruits.jpg",
    badge: "Daily Immunity",
    description: "Orchard apples, bananas, and pure pasteurized dairy providing vital daily calcium, vitamins, and morning smiles.",
  },
  {
    category: "VIDYA DANA",
    slug: "school-kit",
    title: "Complete School Kit & Bag",
    amount: 250,
    unit: "kit",
    image: "/media/school-kit.jpg",
    badge: "Child's Dream",
    description: "School bag, complete notebooks, pencil box, and geometry tools with a child's name written on it.",
  },
  {
    category: "DIGNITY",
    slug: "uniform",
    title: "School Uniform & Shoes",
    amount: 400,
    unit: "set",
    image: "/media/learning.jpg",
    badge: "Equality",
    description: "Tailored pair of school uniforms and sturdy black shoes so every child walks into class with pride.",
  },
  {
    category: "AROGYA",
    slug: "health",
    title: "Pediatric Health & Doctor Care",
    amount: 500,
    unit: "checkup",
    image: "/media/health.jpg",
    badge: "Healing & Care",
    description: "Pediatric wellness check-ups, routine medicines, immunity tonics, and emergency first-aid care.",
  },
  {
    category: "UTSAV",
    slug: "birthday-feast",
    title: "Birthday Celebration Feast",
    amount: 1500,
    unit: "feast",
    image: "/media/food.jpg",
    badge: "Make a Day Matter",
    description: "Sponsor a joyous hot feast with traditional sweets (Payasam) for all 25 Ashrama children on your special day.",
  },
];

export function QuickDecisionSection() {
  const cart = useCart();

  const handleQuickAdd = (slug: string) => {
    const current = cart.qty[slug] || 0;
    cart.setQty(slug, current > 0 ? current + 1 : 1);
    track("quick_start_add", { slug });
  };

  return (
    <Section id="choose" tone="white" className="py-12 md:py-16">
      <Container>
        {/* Section Header */}
        <div className="mb-10 max-w-3xl">
          <p className="inline-block rounded-lg bg-saffron/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-saffron-dark mb-3">
            Simple, Concrete Kindness
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight text-teal-900 sm:text-4xl md:text-5xl">
            Start With One Small Act of Kindness
          </h2>
          <p className="mt-3 text-base sm:text-lg leading-relaxed text-teal-950/75">
            You do not have to change everything at once. You can begin right now by filling one plate, equipping one desk, or celebrating an occasion with the children.
          </p>
        </div>

        {/* 6 Concrete Impact Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full min-w-0">
          {ONE_THINGS.map((item) => {
            const inCart = (cart.qty[item.slug] || 0) > 0;
            return (
              <div
                key={item.category}
                className={`flex flex-col justify-between rounded-2xl bg-cream p-4 ring-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full min-w-0 ${
                  inCart ? "ring-saffron bg-white shadow-md" : "ring-teal-900/10 hover:ring-teal-900/30"
                }`}
              >
                <div>
                  {/* Card Visual Header */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-teal-900">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 250px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />
                    <span className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur">
                      {item.category}
                    </span>
                  </div>

                  {/* Title & Pricing */}
                  <div className="mt-3">
                    <h3 className="font-display text-base font-bold text-teal-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1 font-display text-sm font-bold text-saffron-dark">
                      {formatINR(item.amount)}{" "}
                      <span className="text-xs font-normal text-teal-950/50">/ {item.unit}</span>
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-teal-950/70 line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Actions: Rounded-xl, No pill buttons */}
                <div className="mt-5 pt-3 border-t border-teal-900/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(item.slug)}
                      className={`focus-ring flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition shadow-sm active:scale-95 ${
                        inCart
                          ? "bg-emerald-700 text-white hover:bg-emerald-800"
                          : "bg-saffron text-white hover:bg-saffron-dark"
                      }`}
                    >
                      {inCart ? `Added (${cart.qty[item.slug]}) +` : "MAKE AN IMPACT"}
                    </button>
                  </div>
                  <Link
                    href={`/impact/${item.slug}`}
                    className="block text-center text-[11px] font-semibold text-teal-900/60 hover:text-teal-900 hover:underline"
                  >
                    View breakdown →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alternative Non-Monetary & Celebration Pathways */}
        <div className="mt-12 rounded-3xl bg-sand/50 p-6 sm:p-8 ring-1 ring-teal-900/10">
          <div className="max-w-xl mb-6">
            <h3 className="font-display text-xl font-bold text-teal-900">
              More Ways to Stand With Janaseva
            </h3>
            <p className="text-xs sm:text-sm text-teal-950/65 mt-1">
              Giving can be a celebration, a skill you share, or an organizational partnership.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/make-a-day-matter"
              className="group rounded-2xl bg-white p-5 ring-1 ring-teal-900/10 transition hover:shadow-md hover:ring-saffron"
            >
              <h4 className="font-display text-base font-bold text-teal-900">
                Make a Day Matter
              </h4>
              <p className="mt-1 text-xs text-teal-950/65">
                Celebrate your birthday, anniversary, or milestone with the children.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-saffron-dark group-hover:gap-1.5 transition-all">
                Choose occasion →
              </span>
            </Link>

            <Link
              href="/janaseva-crew"
              className="group rounded-2xl bg-white p-5 ring-1 ring-teal-900/10 transition hover:shadow-md hover:ring-saffron"
            >
              <h4 className="font-display text-base font-bold text-teal-900">
                Give Your Time & Skills
              </h4>
              <p className="mt-1 text-xs text-teal-950/65">
                Mentor in study hour, teach art, or offer technology skills.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-800 group-hover:gap-1.5 transition-all">
                Join the Crew →
              </span>
            </Link>

            <Link
              href="/corporate"
              className="group rounded-2xl bg-white p-5 ring-1 ring-teal-900/10 transition hover:shadow-md hover:ring-saffron"
            >
              <h4 className="font-display text-base font-bold text-teal-900">
                Corporate / CSR
              </h4>
              <p className="mt-1 text-xs text-teal-950/65">
                Employee engagement, kitchen pantry sponsorship, and audited CSR.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-800 group-hover:gap-1.5 transition-all">
                Explore partnership →
              </span>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
