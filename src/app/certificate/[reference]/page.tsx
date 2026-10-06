import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { donationLines, donations, impactCertificates } from "@/db/schema";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { formatINR } from "@/lib/site";

export const metadata: Metadata = { title: "Impact Certificate", robots: { index: false } };

export default async function CertificatePage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const [cert] = await db.select().from(impactCertificates).where(eq(impactCertificates.reference, reference)).limit(1);
  if (!cert) notFound();
  const [d] = await db.select().from(donations).where(eq(donations.id, cert.donationId)).limit(1);
  if (!d || d.status !== "paid") notFound();
  const lines = await db.select().from(donationLines).where(eq(donationLines.donationId, d.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <article className="rounded-3xl border-2 border-gold/60 bg-white p-7 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <Logo />
          <p className="text-right text-xs text-teal-900/60">Reference<br /><span className="font-mono text-sm text-teal-900">{cert.reference}</span></p>
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-teal-900">Impact Certificate</h1>
        <p className="mt-2 text-sm text-teal-950/75">This certifies that {cert.displayName || d.donorName} made a verified contribution of <strong>{formatINR(d.amount)}</strong> to Janaseva Ashrama on {(d.paidAt || d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.</p>
        <p className="mt-3 rounded-2xl bg-sand p-3 text-sm text-teal-900">{cert.statement}</p>
        <ul className="mt-3 list-disc pl-5 text-sm text-teal-950/80">
          {lines.map((l) => <li key={l.id}>{l.label} × {l.qty}</li>)}
        </ul>
      </article>
      <div className="no-print mt-4 flex gap-2">
        <PrintButton />
        <Link href={`/receipt/${d.publicId}`} className="rounded-xl border border-teal-900/20 px-4 py-2 text-sm font-bold text-teal-900">Back to receipt</Link>
      </div>
    </div>
  );
}
