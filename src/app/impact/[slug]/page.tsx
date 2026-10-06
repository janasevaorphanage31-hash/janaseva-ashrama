import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getImpactItem, getImpactItems } from "@/lib/content";
import { ImpactDetailClient } from "@/components/ImpactDetailClient";
import { SITE, formatINR } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getImpactItem(slug);
  if (!item) return { title: "Impact Area Not Found" };

  return {
    title: `${item.name} (${formatINR(item.unitPrice)}) | Janaseva Ashrama`,
    description: `${item.description} Transparent, server-verified giving for Janaseva Ashrama.`,
    openGraph: {
      title: `${item.name} - Janaseva Ashrama`,
      description: item.description,
      images: item.imageUrl ? [{ url: item.imageUrl }] : undefined,
    },
  };
}

export default async function ImpactDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getImpactItem(slug);
  if (!item) notFound();

  const allItems = await getImpactItems();
  const relatedItems = allItems.filter((i) => i.slug !== item.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.description,
    image: item.imageUrl ? `${SITE.url}${item.imageUrl}` : undefined,
    offers: {
      "@type": "Offer",
      price: item.unitPrice,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "NGO",
        name: "Janaseva Ashrama",
        url: SITE.url,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImpactDetailClient item={item} relatedItems={relatedItems} />
    </>
  );
}
