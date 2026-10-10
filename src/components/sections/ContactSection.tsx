import { Container, Head, Section } from "../ui";
import { SITE } from "@/lib/site";
import type { SiteContentMap } from "@/lib/site-content";

export function ContactSection({ content }: { content?: Partial<SiteContentMap> } = {}) {
  const phone = content?.contactPhone || `+91 ${SITE.phone}`;
  const rawPhone = phone.replace(/[^0-9]/g, "").slice(-10) || SITE.phone;
  const whatsappUrl = content?.socialWhatsapp || `https://wa.me/${SITE.whatsapp}`;
  const email = content?.contactEmail || SITE.email;
  const address = content?.contactAddress || SITE.address;
  const hours = content?.contactHours || SITE.visitingHours;
  const mapsUrl = content?.googleMapsUrl || SITE.mapsUrl;

  return (
    <Section id="contact" tone="cream" className="py-12 md:py-16">
      <Container>
        <Head
          eyebrow="Meet Our 25 Children · ಪವಿತ್ರ ಸೇವೆ"
          title="Our Doors Are Always Open"
          lead="A child's innocent smile is waiting for you in Bengaluru. Come sit with our 25 boys, share a warm meal in our dining hall, or celebrate your family's special day. When you visit Janaseva, you are welcomed as family."
        />

        {/* 3 Contact Cards */}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full min-w-0 mt-8">
          <li className="min-w-0">
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
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
                      Direct Telephone
                    </span>
                    <span className="block font-display text-base font-bold text-teal-900">
                      {phone}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-teal-950/70 leading-relaxed">
                  Speak directly with an Ashrama caregiver or trustee.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-900/5">
                <span className="text-xs font-bold text-saffron-dark inline-flex items-center gap-1">
                  Call Now →
                </span>
              </div>
            </a>
          </li>

          <li className="min-w-0">
            <a
              href={whatsappUrl.startsWith("http") ? whatsappUrl : `https://wa.me/${whatsappUrl}`}
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
                      WhatsApp Seva
                    </span>
                    <span className="block font-display text-base font-bold text-teal-900">
                      +91 {rawPhone}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-teal-950/70 leading-relaxed">
                  Instant visit coordination, photos of the boys, and guidance.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-900/5">
                <span className="text-xs font-bold text-saffron-dark inline-flex items-center gap-1">
                  Message on WhatsApp →
                </span>
              </div>
            </a>
          </li>

          <li className="min-w-0">
            <a
              href={`mailto:${email}`}
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
                      {email}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-teal-950/70 leading-relaxed">
                  CSR proposals, 80G tax receipt inquiries, and official updates.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-900/5">
                <span className="text-xs font-bold text-saffron-dark inline-flex items-center gap-1">
                  Write to Us →
                </span>
              </div>
            </a>
          </li>
        </ul>

        {/* ── CLEAN, WARM ASHRAMA CAMPUS CARD (NO BROKEN/EXTRA MAP IFRAME) ── */}
        <div className="mt-8 rounded-3xl bg-teal-950 p-6 sm:p-8 text-white shadow-xl border border-teal-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Visit Us in Bangalore</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Janaseva Ashrama Campus
              </h3>

              <p className="mt-3 text-sm text-white/90 leading-relaxed">
                <strong>Campus Address:</strong><br />
                {address}
              </p>

              <div className="mt-3 space-y-1.5 text-xs text-white/75">
                <p>
                  <strong>Visiting Hours:</strong> {hours}
                </p>
                <p>
                  <strong>Landmarks:</strong> Near Govt School, Jayanagar Housing Society Layout, Turahalli, Subramanyapura, South Bengaluru.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-emerald-300 border border-white/10">
                  ✓ 100% Direct to 25 Boys
                </span>
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-gold border border-white/10">
                  ✓ Form 10AC 80G Tax-Exempt
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur flex flex-col justify-between gap-4">
              <div>
                <h4 className="font-display text-lg font-bold text-gold">
                  Warm Welcome &amp; Peaceful Routine
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-white/85">
                  The boys love meeting visitors and sharing moments of joy! We kindly request a prior call or WhatsApp message 24 hours ahead so our kitchen can prepare fresh tea and welcome your family warmly without disrupting the children&apos;s studies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/15">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-teal-950 transition hover:bg-gold/90 shadow cursor-pointer font-bold"
                >
                  <svg className="h-4 w-4 fill-current text-teal-950" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>Open in Google Maps</span>
                </a>

                <a
                  href={whatsappUrl.startsWith("http") ? `${whatsappUrl}?text=${encodeURIComponent("Hello, I would like to schedule a visit to Janaseva Ashrama to meet the children.")}` : `https://wa.me/${whatsappUrl}?text=${encodeURIComponent("Hello, I would like to schedule a visit to Janaseva Ashrama to meet the children.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  Schedule Visit on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
