import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    try {
      const h = await headers();
      const host = h.get("x-forwarded-host") || h.get("host") || "www.janasevaashrama.org";
      const proto = h.get("x-forwarded-proto") || "https";
      baseUrl = `${proto}://${host}`;
    } catch {
      baseUrl = "https://www.janasevaashrama.org";
    }
  }
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
