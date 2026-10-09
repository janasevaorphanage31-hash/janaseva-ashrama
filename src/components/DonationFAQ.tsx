"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { FAQ_ITEMS } from "@/lib/faq";

export function DonationFAQ({
  faqs,
}: {
  faqs?: Array<{
    question?: string;
    answer?: string;
    q?: string;
    a?: string;
    category?: string;
  }>;
} = {}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const activeFaqs =
    faqs && faqs.length > 0
      ? faqs.map((f) => ({
          q: f.question || f.q || "",
          a: f.answer || f.a || "",
          category: f.category || "General",
        }))
      : FAQ_ITEMS;

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="rounded-3xl bg-white p-6 sm:p-8 lg:p-10 ring-1 ring-teal-900/10 shadow-sm">
      <div className="lg:grid lg:grid-cols-[1fr_1.65fr] lg:gap-12 xl:gap-16 lg:items-start">
        {/* Left Column: Heading, Context & Direct Assistance */}
        <div className="lg:sticky lg:top-32 space-y-6 mb-8 lg:mb-0">
          <div>
            <p className="inline-block rounded-lg bg-saffron/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-saffron-dark mb-2">
              Transparent &amp; Verified · ಪ್ರಶ್ನೋತ್ತರ
            </p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-teal-900 leading-tight">
              Common Questions &amp; Clear Answers
            </h2>
            <p className="mt-2 text-sm text-teal-950/75 leading-relaxed">
              How meals are served, 80G tax receipts, visiting the boys in Bangalore, and how your donation is protected.
            </p>
          </div>

          {/* Quick Assistance Box */}
          <div className="rounded-2xl bg-cream p-5 border border-teal-900/10 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900/60">
                Direct Contact &amp; Verification
              </p>
              <p className="text-xs text-emerald-800 font-semibold mt-1">
                ✓ Form 10AC Provisional 80G Approval
              </p>
              <p className="text-[11px] font-mono text-teal-950/60 mt-0.5">
                PAN: {SITE.pan} · URN: {SITE.urn}
              </p>
            </div>

            <div className="border-t border-teal-900/10 pt-3">
              <p className="text-xs font-bold text-teal-900">Have a specific question not answered here?</p>
              <p className="text-xs text-teal-950/65 mt-0.5">Speak directly with an Ashrama trustee or coordinator.</p>
              
              <div className="mt-3 flex flex-wrap gap-2.5">
                <a
                  href={`tel:${SITE.phoneIntl}`}
                  className="focus-ring flex items-center gap-1.5 rounded-xl bg-teal-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition shadow-sm"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
                  </svg>
                  <span>Call {SITE.phone}</span>
                </a>
                <a
                  href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello Janaseva Ashrama, I have a question about donations.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Accordion List */}
        <div className="divide-y divide-teal-900/10">
          {activeFaqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left flex items-start justify-between gap-4 py-1 group"
                  aria-expanded={isOpen}
                >
                  <div>
                    <span className="inline-block rounded-md bg-sand px-2 py-0.5 text-[10px] font-bold text-teal-900 uppercase tracking-wide mb-1.5">
                      {item.category}
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-bold text-teal-900 group-hover:text-saffron-dark transition-colors">
                      {item.q}
                    </h3>
                  </div>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream text-saffron-dark font-bold text-lg transition-transform duration-200 ${
                      isOpen ? "rotate-45 bg-saffron/20" : ""
                    }`}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="mt-3 max-w-3xl text-sm leading-relaxed text-teal-950/80 pl-1 animate-fadeIn">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
