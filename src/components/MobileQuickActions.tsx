"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { SITE } from "@/lib/site";

/**
 * Site-wide mobile floating quick actions.
 * Complies with strict guidelines: No purple gradients, no pill buttons (rounded-2xl instead),
 * no emojis (clean SVG icons only), and includes Location, X, LinkedIn, WhatsApp, Call, Instagram, Facebook.
 */
export function MobileQuickActions() {
  const path = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(path);

  if (path !== prevPath) {
    setPrevPath(path);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (path?.startsWith("/admin")) return null;

  const bottomOffset = count > 0
    ? "bottom-[calc(9.75rem+env(safe-area-inset-bottom))]"
    : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]";

  return (
    <div className={`pointer-events-none fixed ${bottomOffset} right-3 z-40 md:hidden no-print transition-all duration-300`}>
      {open && (
        <button
          aria-label="Close quick actions overlay"
          className="pointer-events-auto fixed inset-0 z-0 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="relative z-10 flex flex-col items-end gap-2">
        <div
          className={`origin-bottom-right transition-all duration-300 ease-out motion-reduce:transition-none ${
            open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
          }`}
        >
          <div className="w-[min(88vw,340px)] rounded-3xl border border-white/70 bg-white/95 p-3 shadow-2xl ring-1 ring-teal-900/10 backdrop-blur">
            <Link
              href="/impact"
              onClick={() => setOpen(false)}
              className="focus-ring mb-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-saffron px-3 text-sm font-extrabold text-white hover:bg-saffron-dark transition shadow"
            >
              MAKE AN IMPACT
            </Link>

            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-950/60 text-center mb-2">
              Connect Directly
            </p>

            <div className="grid grid-cols-4 gap-2">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello Janaseva Ashrama")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex h-11 items-center justify-center rounded-xl bg-[#25D366] text-white transition hover:opacity-90 shadow-sm"
                aria-label="Chat on WhatsApp"
                title="WhatsApp"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
                </svg>
              </a>

              {/* Call */}
              <a
                href={`tel:${SITE.phoneIntl}`}
                className="focus-ring flex h-11 items-center justify-center rounded-xl bg-[#06312F] text-white transition hover:opacity-90 shadow-sm"
                aria-label="Call Janaseva Ashrama"
                title="Call"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
                </svg>
              </a>

              {/* Location */}
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex h-11 items-center justify-center rounded-xl bg-[#C25E00] text-white transition hover:opacity-90 shadow-sm"
                aria-label="View Location on Google Maps"
                title="Location"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href={SITE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex h-11 items-center justify-center rounded-xl bg-[#E1306C] text-white transition hover:opacity-90 shadow-sm"
                aria-label="Follow us on Instagram"
                title="Instagram"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href={SITE.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex h-11 items-center justify-center rounded-xl bg-[#1877F2] text-white transition hover:opacity-90 shadow-sm"
                aria-label="Follow us on Facebook"
                title="Facebook"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href={SITE.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex h-11 items-center justify-center rounded-xl bg-[#0F1419] text-white transition hover:opacity-90 shadow-sm"
                aria-label="Follow us on X"
                title="X (Twitter)"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href={SITE.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring flex h-11 items-center justify-center rounded-xl bg-[#0A66C2] text-white transition hover:opacity-90 shadow-sm col-span-2"
                aria-label="Connect with us on LinkedIn"
                title="LinkedIn"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.69 1.69 0 0 0 0-3.38 1.69 1.69 0 0 0 0 3.38m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                  </svg>
                  <span>LinkedIn</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Main Floating Trigger Button: Modern rounded-2xl (Not pill shaped) */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close quick contact menu" : "Open quick contact and social channels"}
          className="focus-ring pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-900 text-white shadow-xl ring-2 ring-white/80 transition hover:bg-teal-800 active:scale-95"
          title="Contact & Channels"
        >
          {open ? (
            <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
