import { Container, Head, Section } from "../ui";
import { SITE } from "@/lib/site";

export function ContactSection() {
  return (
    <Section id="contact" tone="cream">
      <Container>
        <Head
          eyebrow="Bengaluru Location & Reach Us"
          title="Come closer to the work, not just the website."
          lead="Want to understand the Ashrama, volunteer your time, celebrate a special day, or visit the children? Reach the team directly."
        />

        {/* 3 Contact Cards - Clean SVG Icons */}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full min-w-0">
          <li className="min-w-0">
            <a
              href={`tel:${SITE.phoneIntl}`}
              className="focus-ring flex h-full flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-saffron"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-900">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
                    </svg>
                  </span>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-teal-900/50">
                      Direct Phone Call
                    </span>
                    <span className="block font-display text-base font-bold text-teal-900">
                      +91 {SITE.phone}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-teal-950/70 leading-relaxed">
                  Speak directly with an Ashrama trustee or coordinator.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-900/5">
                <span className="text-xs font-bold text-saffron-dark inline-flex items-center gap-1">
                  Connect now →
                </span>
              </div>
            </a>
          </li>

          <li className="min-w-0">
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello Janaseva Ashrama, I would like to visit or understand more about supporting the children.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring flex h-full flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-saffron"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
                    </svg>
                  </span>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-teal-900/50">
                      WhatsApp Assistance
                    </span>
                    <span className="block font-display text-base font-bold text-teal-900">
                      +91 9980359595
                    </span>
                  </div>
                </div>
                <p className="text-xs text-teal-950/70 leading-relaxed">
                  Instant help, visit coordination and photo updates.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-900/5">
                <span className="text-xs font-bold text-saffron-dark inline-flex items-center gap-1">
                  Connect now →
                </span>
              </div>
            </a>
          </li>

          <li className="min-w-0">
            <a
              href={`mailto:${SITE.email}`}
              className="focus-ring flex h-full flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-saffron"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/20 text-teal-950">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </span>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-teal-900/50">
                      Official Email
                    </span>
                    <span className="block font-display text-base font-bold text-teal-900 break-all">
                      {SITE.email}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-teal-950/70 leading-relaxed">
                  CSR proposals, bank transfer receipts and official inquiries.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-900/5">
                <span className="text-xs font-bold text-saffron-dark inline-flex items-center gap-1">
                  Connect now →
                </span>
              </div>
            </a>
          </li>
        </ul>

        {/* Bangalore GEO Card & Visiting Hours */}
        <div className="mt-8 rounded-3xl bg-teal-900 p-6 text-white md:p-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="inline-block rounded-md bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold mb-3">
                Bengaluru (Bangalore) GEO Coordinates
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-bold">
                Janaseva Ashrama, Bengaluru
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                <strong>Address:</strong> {SITE.address}
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-white/70">
                <p>
                  <strong>Visiting Hours:</strong> {SITE.visitingHours}
                </p>
                <p>
                  <strong>Area &amp; Landmarks:</strong> Near Govt School, Jayanagar Housing Society Layout, Turahalli, Subramanyapura, South Bengaluru.
                </p>
                <p>
                  <strong>Legal Society Entity:</strong> {SITE.legalName} (PAN: {SITE.pan})
                </p>
                <p>
                  <strong>Form 10AC Approval:</strong> Section 80G Provisional (URN: {SITE.urn}, AY 2024-25 to 2026-27).
                </p>
                <p>
                  <strong>Registered Society Office:</strong> {SITE.registeredOffice}
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <span>✓</span> 100% Tax Deductible (Section 80G)
                  </span>
                  <a href="#trust" className="text-gold font-bold hover:underline">
                    View Verified Bank Details →
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur flex flex-col justify-between gap-4">
              <div>
                <h4 className="font-display text-lg font-bold text-gold">
                  Visiting &amp; Child Safeguarding Policy
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-white/80">
                  To safeguard children&apos;s daily routine, studies, and privacy, we request all visitors to confirm their visit at least 24 hours in advance via telephone or WhatsApp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                <a
                  href={SITE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-teal-950 transition hover:bg-gold/90 shadow"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>View on Google Maps</span>
                </a>
                <a
                  href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello, I would like to schedule a visit to Janaseva Ashrama.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  Schedule Visit on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── GOOGLE MAPS INTERACTIVE LOCATION ── */}
        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-teal-900/10 border border-teal-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-teal-950 text-white gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EA4335] text-white shadow-md">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-white">
                  Jana Seva Ashrama · Official Campus Map &amp; Location
                </h4>
                <p className="text-[11px] text-teal-200/80">
                  #27 Gundu Thopu, Near Govt School, Jayanagar Housing Society Layout, Turahalli, Subramanyapura, Bengaluru
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-teal-950 hover:bg-gold/90 transition shadow-sm"
              >
                <span>Open in Google Maps App →</span>
              </a>
            </div>
          </div>

          <div className="relative w-full h-[360px] md:h-[450px] bg-sand/30">
            <iframe
              src={SITE.mapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Jana Seva Ashrama Google Maps Location"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
