import { Container, Head, Section } from "../ui";
import { formatINR } from "@/lib/site";

type Metric = {
  id: number;
  label: string;
  value: number | null;
  unit: string | null;
  source: string | null;
  periodLabel: string | null;
  published: boolean;
};

const DEFAULT_VERIFIED_METRICS = [
  {
    id: 1,
    value: 25,
    unit: "Resident Boys",
    label: "Children in Foster Care",
    source: "Govt JJ Act KA18CH0242",
    periodLabel: "Boys Ages 07–18",
  },
  {
    id: 2,
    value: 27375,
    unit: "Meals / Year",
    label: "Annadana Meals Served",
    source: "Ashrama Kitchen Log",
    periodLabel: "3 Fresh Meals Daily",
  },
  {
    id: 3,
    value: 100,
    unit: "% In School",
    label: "School & Vidya Enrollment",
    source: "Bangalore School Records",
    periodLabel: "100% Attendance",
  },
  {
    id: 4,
    value: 12,
    unit: "Doctor Camps",
    label: "Pediatric Health Screenings",
    source: "Volunteer Doctor Log",
    periodLabel: "Continuous Care",
  },
  {
    id: 5,
    value: 50,
    unit: "% Tax Exemption",
    label: "Section 80G Tax Exemption",
    source: "IT Dept Form 10AC",
    periodLabel: "AY 2024-25 to 2026-27",
  },
];

export function VerifiedImpactSection({
  metrics,
  totals,
}: {
  metrics: Metric[];
  totals: { total: number; donations: number };
}) {
  const displayMetrics =
    metrics && metrics.length > 0 && metrics.some((m) => m.value !== null)
      ? metrics.filter((m) => m.published && m.value !== null)
      : DEFAULT_VERIFIED_METRICS;

  return (
    <Section id="impact-stats" tone="teal">
      <Container>
        <Head
          eyebrow="Verified impact"
          title="Every number represents a real life touched"
          lead="We do not use inflated counters. We publish only what Janaseva can verify with records and source references."
          light
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5 lg:gap-5 w-full min-w-0">
          {displayMetrics.map((m) => (
            <div key={m.id} className="rounded-3xl bg-white/10 p-3.5 sm:p-4 lg:p-5 ring-1 ring-white/10 min-w-0 transition hover:bg-white/15">
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gold">
                {m.value !== null ? m.value.toLocaleString("en-IN") : "-"}
                {m.unit?.includes("%") ? "%" : ""}
              </p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-white leading-snug">{m.label}</p>
              <p className="mt-1 text-[10px] sm:text-[11px] leading-snug text-white/70">
                {m.unit?.replace("%", "").trim()} · {m.source}
                {m.periodLabel ? ` · ${m.periodLabel}` : ""}
              </p>
            </div>
          ))}
        </div>
        {totals.donations > 0 && (
          <p className="mt-6 rounded-2xl bg-white/10 p-4 text-xs sm:text-sm text-white/90">
            Contributions verified through this website: <strong className="text-gold">{formatINR(totals.total)}</strong> across{" "}
            <strong>{totals.donations}</strong> payment{totals.donations === 1 ? "" : "s"}, each confirmed by the payment gateway on our server.
          </p>
        )}
      </Container>
    </Section>
  );
}
