"use client";

import Script from "next/script";

export interface TrackingScriptsProps {
  metaPixelId?: string;
  googleAdsId?: string;
  googleAdsConversionLabel?: string;
  googleTagManagerId?: string;
}

export function TrackingScripts({
  metaPixelId: propPixelId,
  googleAdsId: propGoogleAdsId,
  googleAdsConversionLabel: propConversionLabel,
  googleTagManagerId: propGtmId,
}: TrackingScriptsProps) {
  // Resolve configuration from props or public environment variables
  const metaPixelId =
    (propPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
  const googleAdsId =
    (propGoogleAdsId ||
      process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
      process.env.NEXT_PUBLIC_GTAG_ID ||
      "").trim();
  const googleTagManagerId =
    (propGtmId || process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID || "").trim();

  return (
    <>
      {/* ── Global Defensive Shims: Prevent ReferenceError if scripts are blocked ── */}
      <Script id="tracking-defensive-shims" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          if (typeof window.gtag !== 'function') {
            window.gtag = function() { window.dataLayer.push(arguments); };
          }
          if (typeof window.fbq !== 'function') {
            var n = function() {
              if (n.callMethod) {
                n.callMethod.apply(n, arguments);
              } else {
                n.queue.push(arguments);
              }
            };
            n.queue = [];
            n.loaded = true;
            n.version = '2.0';
            window.fbq = n;
            window._fbq = n;
          }
        `}
      </Script>

      {/* ── 1. Official Meta Pixel (Facebook & Instagram Ads) Base Snippet ── */}
      {metaPixelId && (
        <>
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq && f.fbq.callMethod)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(
                metaPixelId,
              )}&ev=PageView&noscript=1`}
              alt="facebook pixel"
            />
          </noscript>
        </>
      )}

      {/* ── 2. Official Google Tag (gtag.js) for Google Ads & Analytics ── */}
      {googleAdsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              googleAdsId,
            )}`}
            strategy="afterInteractive"
          />
          <Script id="google-ads-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${googleAdsId}', {
                page_path: window.location.pathname,
                send_page_view: true
              });
            `}
          </Script>
        </>
      )}

      {/* ── 3. Google Tag Manager (GTM) Container Snippet (Optional) ── */}
      {googleTagManagerId && (
        <>
          <Script id="gtm-container-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${googleTagManagerId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(
                googleTagManagerId,
              )}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="gtm-fallback"
            />
          </noscript>
        </>
      )}
    </>
  );
}
