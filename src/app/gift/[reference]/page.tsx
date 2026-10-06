import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { donationLines, donations, impactGifts } from "@/db/schema";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { formatINR } from "@/lib/site";

export const metadata: Metadata = { title: "Impact Gift Card", robots: { index: false } };

export default async function GiftPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const [gift] = await db.select().from(impactGifts).where(eq(impactGifts.reference, reference)).limit(1);
  if (!gift) notFound();
  if (!gift.donationId || !["ready", "generated"].includes(gift.status)) notFound();
  const [d] = await db.select().from(donations).where(eq(donations.id, gift.donationId)).limit(1);
  if (!d || d.status !== "paid") notFound();
  const lines = await db.select().from(donationLines).where(eq(donationLines.donationId, d.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <article className="rounded-3xl bg-teal-900 p-7 text-white shadow-sm">
        <Logo light />
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.28em] text-gold">Gift an Impact</p>
        <h1 className="mt-1 font-display text-3xl font-bold">A meaningful gift in your honour</h1>
        <p className="mt-4 text-white/80">Dear <strong>{gift.recipientName}</strong>,</p>
        <p className="mt-2 text-white/90">A verified contribution of <strong>{formatINR(d.amount)}</strong> has been made to Janaseva Ashrama for your <strong>{gift.occasion}</strong>.</p>
        <ul className="mt-3 list-disc pl-5 text-sm text-white/85">
          {lines.map((l) => <li key={l.id}>{l.label} × {l.qty}</li>)}
        </ul>
        {gift.message && <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm">“{gift.message}”</p>}
        {gift.allowSenderName && gift.senderName && <p className="mt-3 text-sm text-white/80">With love, {gift.senderName}</p>}
        <p className="mt-4 text-xs text-white/60">Reference: {gift.reference}</p>
      </article>
      <div className="no-print mt-4 flex gap-2">
        <PrintButton />
        <Link href={`/receipt/${d.publicId}`} className="rounded-xl border border-teal-900/20 px-4 py-2 text-sm font-bold text-teal-900">Back to receipt</Link>
      </div>
    </div>
  );
}
