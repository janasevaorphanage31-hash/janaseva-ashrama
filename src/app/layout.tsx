import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileQuickActions } from "@/components/MobileQuickActions";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingSocials } from "@/components/FloatingSocials";
import { getImpactItems } from "@/lib/content";
import { PWARegister } from "@/components/PWARegister";
import { FAQ_ITEMS } from "@/lib/faq";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Janaseva Ashrama: Orphanage & Children's Home in Bangalore | 80G Tax Exemption | Donate Food & Education",
    template: "%s · Janaseva Ashrama Bangalore",
  },
  description:
    "Support Janaseva Ashrama, a registered public charitable children's home & orphanage in Bengaluru, Karnataka. Sponsor daily meals (Annadana), school kits, healthcare, and birthday feasts for 25 children. 100% verified allocation with Form 10AC 80G tax exemption, JJ Act registration (KA18CH0242), and MCA CSR-1 approval (CSR00078800).",
  keywords: [
    "orphanage in bangalore",
    "children home bangalore",
    "donate to orphanage bangalore",
    "donate meals orphanage bangalore",
    "annadana bangalore",
    "ngo 80g tax exemption bangalore",
    "celebrate birthday in orphanage bangalore",
    "sponsor child education bangalore",
    "janaseva ashrama turahalli subramanyapura bangalore",
    "ngo near me bangalore",
    "verified donation platform india",
  ],
  authors: [{ name: SITE.legalName }],
  creator: SITE.name,
  publisher: SITE.name,
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE.url,
    siteName: SITE.name,
    title: "Janaseva Ashrama: Orphanage & Children's Home in Bangalore | 80G Tax Exemption",
    description:
      "A Home Today. A Future We Build Together. Sponsor daily meals (Annadana), education, and healthcare for 25 children in Bengaluru, Karnataka.",
    images: [
      {
        url: "/media/poster-desktop.jpg",
        width: 1200,
        height: 630,
        alt: "Children at Janaseva Ashrama Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Janaseva Ashrama: Bangalore Orphanage & Children's Home",
    description:
      "Support 25 vulnerable children in our orphanage with daily nutritious meals, schooling, and healthcare. 100% verified allocation & 80G tax benefit.",
    images: ["/media/poster-desktop.jpg"],
  },
  alternates: {
    canonical: SITE.url,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google40ecaabef6839658",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#06312f",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const catalog = await getImpactItems();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["NGO", "NonProfitOrganization"],
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        legalName: SITE.legalName,
        alternateName: [
          "Janaseva Ashrama Charitable Trust",
          "Janaseva Orphanage",
          "Janaseva Children's Home Bangalore",
        ],
        description:
          "Janaseva Ashrama is a registered public charitable trust and residential home for orphaned and vulnerable children in Bengaluru (Bangalore), Karnataka. Child Care Institution registered under JJ Act 2015 (KA18CH0242), MCA CSR-1 approved (CSR00078800), and Form 10AC provisional 80G tax exemption.",
        url: SITE.url,
        logo: `${SITE.url}/media/poster.jpg`,
        email: SITE.email,
        taxID: SITE.pan,
        identifier: [SITE.urn, SITE.jjActNumber, SITE.csrNumber, SITE.pan],
        address: {
          "@type": "PostalAddress",
          streetAddress: "#27, Gundu Thopu Turahalli, Near Govt School, Jayanagar housing Society Layout, Subramanyapura",
          addressLocality: SITE.city,
          addressRegion: SITE.state,
          postalCode: SITE.pincode,
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SITE.geo.latitude,
          longitude: SITE.geo.longitude,
        },
        areaServed: [
          { "@type": "City", name: "Bengaluru" },
          { "@type": "State", name: "Karnataka" },
          { "@type": "Country", name: "India" },
        ],
        knowsAbout: [
          "Orphanage care in Bangalore",
          "Children residential home",
          "Annadana meal sponsorship",
          "Child education sponsorship",
          "80G tax exemption NGO",
          "Birthday celebration in orphanage",
        ],
        potentialAction: {
          "@type": "DonateAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE.url}/#impact`,
            inLanguage: "en-IN",
            actionPlatform: [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform",
            ],
          },
          recipient: {
            "@type": "Organization",
            name: SITE.name,
          },
        },
      },
      {
        "@type": "Place",
        "@id": `${SITE.url}/#place`,
        name: `${SITE.name} Children's Home`,
        address: {
          "@type": "PostalAddress",
          streetAddress: "#27, Gundu Thopu Turahalli, Near Govt School, Jayanagar housing Society Layout, Subramanyapura",
          addressLocality: SITE.city,
          addressRegion: SITE.state,
          postalCode: SITE.pincode,
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SITE.geo.latitude,
          longitude: SITE.geo.longitude,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
            opens: "10:00",
            closes: "18:00",
          },
        ],
        telephone: SITE.phoneIntl,
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <html lang="en" className="overflow-x-hidden max-w-full">
      <head>
        <meta name="geo.region" content="IN-KA" />
        <meta name="geo.placename" content="Bengaluru" />
        <meta name="geo.position" content={`${SITE.geo.latitude};${SITE.geo.longitude}`} />
        <meta name="ICBM" content={`${SITE.geo.latitude}, ${SITE.geo.longitude}`} />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />
        <meta name="coverage" content="Bengaluru, Karnataka, India" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="Safe For Kids" />
        <Script
          id="seo-geo-aeo-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="antialiased min-h-screen w-full max-w-full overflow-x-hidden">
        <CartProvider catalog={catalog}>
          <PWARegister />
          <SiteHeader />
          <main className="w-full max-w-full min-w-0 overflow-x-hidden">{children}</main>
          <SiteFooter />
          <FloatingSocials />
          <MobileQuickActions />
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
