import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { donationLines, donations, impactGifts } from "@/db/schema";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { ShareButtons } from "@/components/ShareButtons";
import { ReceiptActions } from "@/components/ReceiptActions";
import { ImpactJourney } from "@/components/ImpactJourney";
import { FORM_10AC, SITE, TAX_NOTE, formatINR } from "@/lib/site";

export const metadata: Metadata = { title: "Your Receipt", robots: { index: false, follow: false } };

const maskEmail = (e: string) => {
  const [u, d] = e.split("@");
  return `${u.slice(0, 2)}${"•".repeat(Math.max(2, u.length - 2))}@${d}`;
};

const maskPan = (p: string) => {
  if (!p || p.length < 4) return "••••••••••";
  return `••••••${p.slice(-4).toUpperCase()}`;
};

export default async function ReceiptPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const [d] = await db.select().from(donations).where(eq(donations.publicId, publicId)).limit(1);
  if (!d) notFound();
  const lines = await db.select().from(donationLines).where(eq(donationLines.donationId, d.id)).orderBy(asc(donationLines.id));
  const [gift] = await db.select().from(impactGifts).where(eq(impactGifts.donationId, d.id)).limit(1);

  const verified = d.status === "paid";
  const demo = d.status === "demo";
  const refunded = d.status === "refunded";
  const pending = d.status === "created";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {verified && (
        <div className="no-print mb-5 rounded-3xl bg-teal-900 p-6 text-center text-white">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-800 text-teal-200 ring-1 ring-white/20">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold">Thank you, {d.donorName.split(" ")[0]}.</h1>
          <p className="mt-1 text-sm text-white/80">Your payment has been verified. Here is your impact summary.</p>
        </div>
      )}
      {demo && (
        <div className="mb-5 rounded-2xl border-2 border-saffron bg-saffron/10 p-4 text-sm font-semibold text-saffron-dark">
          DEMO RECEIPT - the payment gateway is not connected yet, so no money was taken and this is not a valid donation receipt.
        </div>
      )}
      {pending && (
        <div className="mb-5 rounded-2xl bg-sand p-4 text-sm font-semibold text-teal-900">
          We are waiting for the payment gateway to confirm this payment. If money was debited, your receipt will be issued automatically - refresh this page in a minute.
        </div>
      )}
      {refunded && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">This payment has been refunded.</div>}

      <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-teal-900/20 pb-5">
          <Logo />
          <div className="text-right text-xs text-teal-950/70">
            <p className="font-bold uppercase tracking-wider text-teal-900">Donation receipt</p>
            <p className="mt-1 font-mono text-sm text-teal-900">{d.receiptNo ?? "Pending"}</p>
            <p>{(d.paidAt ?? d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </header>

        <section className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-900/50">Received from</p>
            <p className="font-semibold text-teal-900">{d.donorName}</p>
            <p className="text-teal-950/60">{maskEmail(d.donorEmail)}</p>
            {Boolean((d.meta as Record<string, unknown>)?.donorPan) && (
              <p className="text-xs font-mono font-bold text-teal-900 mt-1">
                Donor PAN: {maskPan(String((d.meta as Record<string, unknown>).donorPan))}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-900/50">Issued by</p>
            <p className="font-bold text-teal-900 text-xs sm:text-sm">{FORM_10AC.legalName}</p>
            <p className="text-[11px] text-teal-950/70 font-mono mt-0.5">
              PAN: {FORM_10AC.pan} · 80G URN: {FORM_10AC.urn}
            </p>
            <p className="text-[10px] text-teal-950/60 leading-tight mt-0.5">
              Regd: {FORM_10AC.registeredAddress.full}
            </p>
            <p className="text-[10px] text-teal-950/60 mt-0.5">
              Ashrama: {SITE.address} · {SITE.phone}
            </p>
          </div>
        </section>

        {Boolean((d.meta as Record<string, unknown>)?.occasion || (d.meta as Record<string, unknown>)?.dedicationName) && (
          <div className="mt-5 rounded-2xl bg-saffron/10 p-4 border border-saffron/30">
            <p className="text-xs font-bold uppercase tracking-wider text-saffron-dark">Occasion & Dedication</p>
            <p className="mt-1 font-display text-base font-bold text-teal-900">
              {String((d.meta as Record<string, unknown>)?.occasion || "Special Occasion")}
              {Boolean((d.meta as Record<string, unknown>)?.dedicationName) && ` - In Honor Of ${String((d.meta as Record<string, unknown>)?.dedicationName)}`}
            </p>
            {Boolean((d.meta as Record<string, unknown>)?.dedicationMessage) && (
              <p className="mt-1 text-sm italic text-teal-950/75">
                “{String((d.meta as Record<string, unknown>)?.dedicationMessage)}”
              </p>
            )}
          </div>
        )}

        <section className="mt-6">
          <h2 className="font-display text-lg font-bold text-teal-900">Your Impact</h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-teal-900/15 text-left text-xs uppercase tracking-wider text-teal-900/50">
                <th className="py-2 font-bold">Impact</th><th className="py-2 text-right font-bold">Qty</th><th className="py-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-teal-900/5">
                  <td className="py-2.5 text-teal-900">{l.label}</td>
                  <td className="py-2.5 text-right">{l.qty}</td>
                  <td className="py-2.5 text-right font-mono">{formatINR(l.unitPrice * l.qty)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 font-bold text-teal-900" colSpan={2}>{verified ? "Verified amount" : "Amount"}</td>
                <td className="pt-3 text-right font-display text-2xl font-bold text-teal-900">{formatINR(d.amount)}</td>
              </tr>
            </tfoot>
          </table>
          {d.razorpayPaymentId && <p className="mt-3 break-all font-mono text-[11px] text-teal-950/50">Payment ref: {d.razorpayPaymentId}</p>}
        </section>

        <p className="mt-6 rounded-2xl bg-sand p-4 text-xs leading-relaxed text-teal-950/70">{TAX_NOTE}</p>
      </article>

      <ImpactJourney verified={verified}>
        {verified && <p className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm text-teal-900"><strong>Next:</strong> Janaseva can publish future approved updates connected to this contribution. Public reporting uses verified records only.</p>}
      </ImpactJourney>

      <div className="no-print mt-6 space-y-5">
        {verified && gift?.status === "ready" && <div className="rounded-3xl bg-saffron/10 p-5 ring-1 ring-saffron/30"><h2 className="font-display text-lg font-bold text-teal-900">Your Impact Gift is ready</h2><p className="mt-1 text-sm text-teal-950/65">The gift card was unlocked after payment verification.</p><Link href={`/gift/${gift.reference}`} className="mt-3 inline-block rounded-xl bg-saffron px-5 py-2.5 text-sm font-bold text-white">Open gift card</Link></div>}
        <div className="flex flex-wrap items-center gap-3">
          <PrintButton />
          <Link href="/" className="rounded-xl border-2 border-teal-800/30 px-5 py-2.5 text-sm font-bold text-teal-900">Back to home</Link>
        </div>
        {(verified || demo) && (
          <div className="rounded-3xl bg-white p-5 ring-1 ring-teal-900/10">
            <h2 className="font-display text-lg font-bold text-teal-900">Share your impact</h2>
            <p className="mb-3 text-sm text-teal-950/65">Your name and amount are never included - only an invitation.</p>
            <ShareButtons kind="receipt" url="/" text="I chose to make an impact at Janaseva Ashrama. You can too:" />
          </div>
        )}
        {verified && <ReceiptActions donationPublicId={publicId} />}
        {demo && (
          <div className="rounded-2xl border border-saffron/30 bg-saffron/10 p-4 text-xs font-semibold text-saffron-dark">
            Official impact certificates and valid tax receipts are issued exclusively for verified live contributions.
          </div>
        )}
      </div>
    </div>
  );
}
