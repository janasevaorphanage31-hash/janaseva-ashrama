import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingSocials } from "@/components/FloatingSocials";
import { BottomDonationDrawer } from "@/components/BottomDonationDrawer";
import { UrgentDonationBar } from "@/components/UrgentDonationBar";
import { LiveDonationToast } from "@/components/LiveDonationToast";
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
    "Official website of Janaseva Ashrama (Reg: KA18CH0242, 80G Form 10AC: AABTJ7431MF20231), a verified children's home & orphanage in Bengaluru, Karnataka nurturing 25 resident boys with hot meals (Annadana), school education, shelter, and medical care.",
  keywords: [
    "janaseva ashrama",
    "janaseva ashrama bangalore",
    "janaseva orphanage",
    "janaseva orphanage bangalore",
    "orphanage in bangalore",
    "orphanage near me bangalore",
    "children home in bangalore",
    "donate to orphanage bangalore",
    "donate meals orphanage bangalore",
    "annadana in bangalore",
    "80g tax exemption ngo bangalore",
    "celebrate birthday in orphanage bangalore",
    "sponsor child education bangalore",
    "turahalli orphanage",
    "subramanyapura children home",
    "uttarahalli ngo",
    "south bangalore orphanage",
    "verified ngo karnataka",
  ],
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.legalName,
  applicationName: "Janaseva Ashrama",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
      "Official website of Janaseva Ashrama, Bengaluru. Caring for 25 resident children with daily nutritious meals, schooling, and unconditional love. 100% verified allocation under JJ Act KA18CH0242 and 80G tax benefit.",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        secureUrl: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        type: "image/jpeg",
        alt: "Original Photo of Janaseva Ashrama Campus & Resident Children Bengaluru",
      },
      {
        url: `${SITE.url}/og-image.jpg`,
        secureUrl: `${SITE.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Janaseva Ashrama Children's Home Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Janaseva Ashrama: Bangalore Orphanage & Children's Home",
    description:
      "Support 25 resident boys at Janaseva Ashrama Bangalore. Sponsor hot meals, education kits, and birthday celebrations. 80G tax-exempt & JJ Act registered.",
    site: "@janasevaashrama",
    creator: "@janasevaashrama",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
  alternates: {
    canonical: SITE.url,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google40ecaabef6839658",
  },
  category: "Non-Profit Organization",
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
        logo: `${SITE.url}/logo/janaseva-logo.png`,
        image: [
          `${SITE.url}/media/janaseva-ashrama-original.jpg`,
          `${SITE.url}/media/boys-group-altar.jpg`,
          `${SITE.url}/media/lawn-cheer-circle.jpg`,
          `${SITE.url}/media/banana-leaf-feast.jpg`,
          `${SITE.url}/media/annadana-hall-hd.jpg`,
        ],
        email: SITE.email,
        telephone: SITE.phoneIntl,
        taxID: SITE.pan,
        identifier: [SITE.urn, SITE.jjActNumber, SITE.csrNumber, SITE.pan],
        foundingDate: "2013-04-02",
        sameAs: [
          SITE.mapsUrl,
          SITE.instagramUrl,
          SITE.facebookUrl,
          SITE.twitterUrl,
        ],
        hasMap: SITE.mapsUrl,
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
        "@type": ["Place", "ChildCare"],
        "@id": `${SITE.url}/#place`,
        name: `${SITE.name} Children's Home & Orphanage`,
        image: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        hasMap: SITE.mapsUrl,
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
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        alternateName: "Janaseva Orphanage",
        image: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        publisher: { "@id": `${SITE.url}/#organization` },
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
        {/* Classical Google thumbnail snippet image tag */}
        <link rel="image_src" href={`${SITE.url}/media/janaseva-ashrama-original.jpg`} />

        {/* Geographic Meta Tags (GEO Local Optimization for Bengaluru) */}
        <meta name="geo.region" content="IN-KA" />
        <meta name="geo.placename" content="Bengaluru, Karnataka, India" />
        <meta name="geo.position" content={`${SITE.geo.latitude};${SITE.geo.longitude}`} />
        <meta name="ICBM" content={`${SITE.geo.latitude}, ${SITE.geo.longitude}`} />
        <meta name="place:location:latitude" content={String(SITE.geo.latitude)} />
        <meta name="place:location:longitude" content={String(SITE.geo.longitude)} />

        {/* Answer Engine Optimization (AEO / Dublin Core Semantic Entity Tags) */}
        <meta name="DC.title" content="Janaseva Ashrama" />
        <meta name="DC.creator" content="Janaseva Samruddi Education & Rural Development Society R" />
        <meta name="DC.subject" content="Orphanage in Bangalore, Child Care Institution, 80G Tax Exemption, Annadana, Children Home" />
        <meta name="DC.description" content="Registered Child Care Institution (KA18CH0242) and public charitable children's home in Bangalore supporting 25 boys." />
        <meta name="DC.identifier" content={SITE.url} />
        <meta name="DC.language" content="en-IN" />
        <meta name="coverage" content="Bengaluru, Karnataka, India" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="Safe For Kids" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
          <ScrollToTopButton />
          <UrgentDonationBar />
          <LiveDonationToast />
          <BottomDonationDrawer />
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
