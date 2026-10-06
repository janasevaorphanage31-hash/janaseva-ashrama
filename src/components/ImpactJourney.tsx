import type { ReactNode } from "react";

export function ImpactJourney({ verified, children }: { verified: boolean; children: ReactNode }) {
  const steps = [
    ["01", "Contribution", "Your selected impact and amount"],
    ["02", verified ? "Payment verified" : "Awaiting verification", verified ? "Confirmed by the payment system" : "The payment gateway is still confirming"],
    ["03", verified ? "Impact recorded" : "Impact pending", verified ? "Only verified contributions are included in public impact reporting" : "Impact is not reported publicly until verification"],
    ["04", verified ? "Evidence & updates" : "Updates", verified ? "Future approved stories can show what happened" : "Return here after confirmation"],
  ];
  return <section className="no-print mt-6 rounded-3xl bg-white p-5 ring-1 ring-teal-900/10">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-saffron-dark">Your Impact Journey</p>
    <h2 className="mt-1 font-display text-2xl font-bold text-teal-900">From contribution to verified impact.</h2>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">{steps.map(([n,t,d]) => <div key={n} className="rounded-2xl bg-cream p-4"><span className="text-xs font-bold text-saffron-dark">{n}</span><h3 className="mt-1 font-display text-lg font-bold text-teal-900">{t}</h3><p className="mt-1 text-xs leading-relaxed text-teal-950/65">{d}</p></div>)}</div>
    {children}
  </section>;
}
