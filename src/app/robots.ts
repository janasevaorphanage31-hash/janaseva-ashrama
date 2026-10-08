import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let host = "www.janasevaashrama.org";
  try {
    const h = await headers();
    host = h.get("x-forwarded-host") || h.get("host") || host;
  } catch {}
  const baseUrl = `https://${host}`;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/checkout",
          "/receipt/*",
          "/certificate/*",
          "/gift/*",
          "/my-impact",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/checkout",
          "/receipt/*",
          "/certificate/*",
          "/gift/*",
          "/my-impact",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
