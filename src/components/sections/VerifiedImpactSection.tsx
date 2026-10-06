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

export function VerifiedImpactSection({
  metrics,
  totals,
}: {
  metrics: Metric[];
  totals: { total: number; donations: number };
}) {
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
          {metrics.map((m) => {
            const live = m.published && m.value !== null && !!m.source;
            return (
              <div key={m.id} className="rounded-3xl bg-white/10 p-3 sm:p-4 lg:p-5 ring-1 ring-white/10 min-w-0 transition hover:bg-white/15">
                <p className="font-display text-3xl lg:text-4xl font-bold text-gold">{live ? m.value!.toLocaleString("en-IN") : "-"}</p>
                <p className="mt-1 text-sm font-semibold">{m.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-white/60">
                  {live ? `${m.unit ?? ""} · ${m.source}${m.periodLabel ? ` · ${m.periodLabel}` : ""}` : "Will be published once verified"}
                </p>
              </div>
            );
          })}
        </div>
        {totals.donations > 0 && (
          <p className="mt-6 rounded-2xl bg-white/10 p-4 text-sm">
            Contributions verified through this website: <strong className="text-gold">{formatINR(totals.total)}</strong> across{" "}
            <strong>{totals.donations}</strong> payment{totals.donations === 1 ? "" : "s"}, each confirmed by the payment gateway on our server.
          </p>
        )}
      </Container>
    </Section>
  );
}
