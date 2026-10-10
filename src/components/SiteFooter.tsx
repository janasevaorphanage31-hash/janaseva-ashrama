import Link from "next/link";
import { Logo } from "./Logo";
import { SITE, isConfiguredExternalUrl } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-teal-950 px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-sm text-white/75 no-print w-full max-w-full overflow-hidden">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-8 md:grid-cols-4 lg:gap-12 w-full min-w-0">
        {/* Col 1: About & Identification */}
        <div className="space-y-3">
          <Logo light />
          <p className="max-w-xs text-xs sm:text-sm text-white/80 leading-relaxed">
            A home today. A future we build together.
          </p>
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10 text-xs space-y-1">
            <p className="font-bold text-white leading-tight">
              {SITE.legalName}
            </p>
            <p className="text-[11px] text-gold font-mono">
              PAN: {SITE.pan} · URN: {SITE.urn}
            </p>
            <p className="text-[10px] text-emerald-400 font-semibold">
              ✓ Form 10AC Provisional 80G Approval (AY 2024-25 to 2026-27)
            </p>
            <p className="text-[10px] text-emerald-300 font-semibold">
              ✓ JJ Act Child Care Home: KA18CH0242 (25 Boys, 07–18 Yrs)
            </p>
            <p className="text-[10px] text-teal-200 font-semibold">
              ✓ MCA CSR-1 Approved: CSR00078800 · 12AA Certified
            </p>
          </div>
        </div>

        {/* Col 2: Giving & Programs */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gold mb-3">Giving Programs</p>
          <ul className="space-y-2 text-xs">
            <li><Link href="/supporter-form" className="hover:text-gold transition font-bold text-emerald-300">📋 Official Supporter Form (Makkala Ashraya Kendra)</Link></li>
            <li><Link href="/celebrate-special-day" className="hover:text-gold transition font-bold text-gold">Celebrate Special Day (Birthdays &amp; Anniversaries)</Link></li>
            <li><Link href="/#activities" className="hover:text-gold transition font-bold text-white">NGO Outreach &amp; Drives (Health, Food, Swachh)</Link></li>
            <li><Link href="/impact" className="hover:text-gold transition">Today&apos;s Needs &amp; Basket</Link></li>
            <li><Link href="/make-a-day-matter" className="hover:text-gold transition">Make a Day Matter (Occasion Giving)</Link></li>
            <li><Link href="/recurring-giving" className="hover:text-gold transition">Monthly Regular Giving</Link></li>
            <li><Link href="/today" className="hover:text-gold transition">Today at Janaseva</Link></li>
            <li><Link href="/stories" className="hover:text-gold transition">Stories of Hope</Link></li>
            <li><Link href="/campaigns" className="hover:text-gold transition">Community Campaigns</Link></li>
            <li><Link href="/creators" className="hover:text-gold transition">Creator &amp; Influencer Hub</Link></li>
            <li><Link href="/gift-impact" className="hover:text-gold transition">Gift an Impact Card</Link></li>
            <li><Link href="/impact-wall" className="hover:text-gold transition">Live Impact Wall</Link></li>
          </ul>
        </div>

        {/* Col 3: Organization & Trust */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gold mb-3">Transparency &amp; Legal</p>
          <ul className="space-y-2 text-xs">
            <li><Link href="/transparency" className="hover:text-gold transition">Transparency &amp; Governance</Link></li>
            <li><Link href="/campus" className="hover:text-gold transition">Ashrama Campus Facilities</Link></li>
            <li><Link href="/future" className="hover:text-gold transition">Future Campus Proposal</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-gold transition font-semibold text-white">Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions" className="hover:text-gold transition font-semibold text-white">Terms &amp; Conditions</Link></li>
            <li><Link href="/refund-policy" className="hover:text-gold transition font-semibold text-white">Refund &amp; Cancellation</Link></li>
            <li><Link href="/janaseva-crew" className="hover:text-gold transition">Janaseva Crew (Volunteering)</Link></li>
            <li><Link href="/corporate" className="hover:text-gold transition">Corporate &amp; CSR</Link></li>
            <li><Link href="/company-impact" className="hover:text-gold transition">Company Impact Hub</Link></li>
            <li><Link href="/ngo-network" className="hover:text-gold transition">NGO Network Collaboration</Link></li>
            <li><Link href="/my-impact" className="hover:text-gold transition">Donor Receipt Verification</Link></li>
          </ul>
        </div>

        {/* Col 4: Reach & Verified Contact */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gold">Visit &amp; Contact Us</p>
          
          <div className="space-y-2 text-xs">
            <a href={`tel:${SITE.phoneIntl}`} className="flex items-center gap-2 hover:text-gold transition font-semibold text-white">
              <svg className="h-4 w-4 fill-current text-gold shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
              </svg>
              <span>+91 {SITE.phone}</span>
            </a>

            <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-gold transition break-all">
              <svg className="h-4 w-4 fill-current text-gold shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <span>{SITE.email}</span>
            </a>

            <div className="pt-1 text-white/70 leading-relaxed space-y-1.5">
              <p className="flex items-start gap-2">
                <svg className="h-4 w-4 fill-current text-gold shrink-0 mt-0.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <a
                  href={SITE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors inline-block"
                  title="Open Ashrama location in Google Maps"
                >
                  <strong>Ashrama Campus:</strong> {SITE.address}
                </a>
              </p>
              <p className="pl-6 text-[11px] text-white/60">
                <strong>Registered Society Office:</strong> {SITE.registeredOffice}
              </p>
              <p className="text-[11px] text-gold/80 pl-6">
                Visiting Hours: 10:00 AM to 6:00 PM (IST) by prior appointment
              </p>
            </div>
          </div>

          {/* Social Icons row (Clean SVG, No emojis, No purple) */}
          <div className="pt-2 flex items-center gap-2">
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] text-white transition hover:opacity-90"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
              </svg>
            </a>

            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E1306C] text-white transition hover:opacity-90"
              aria-label="Instagram"
              title="Instagram"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            <a
              href={SITE.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877F2] text-white transition hover:opacity-90"
              aria-label="Facebook"
              title="Facebook"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <a
              href={SITE.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F1419] text-white transition hover:opacity-90 ring-1 ring-white/10"
              aria-label="X (Twitter)"
              title="X (Twitter)"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            <a
              href={SITE.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A66C2] text-white transition hover:opacity-90"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.69 1.69 0 0 0 0-3.38 1.69 1.69 0 0 0 0 3.38m1.39 9.74v-8.37H5.07v8.37h2.78z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
        <p>
          &copy; {new Date().getFullYear()} {SITE.legalName}. Form 10AC Provisional 80G Approval (PAN: {SITE.pan}, URN: {SITE.urn}).
        </p>
        <p className="text-[11px] text-white/50">
          Bengaluru, Karnataka · 100% Verified Direct Allocation · Child Safeguarding
        </p>
      </div>
    </footer>
  );
}
