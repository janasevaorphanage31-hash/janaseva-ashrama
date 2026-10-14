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
  const protectedRoutes = [
    "/admin",
    "/admin/*",
    "/portal",
    "/portal/*",
    "/api/*",
    "/checkout",
    "/receipt/*",
    "/certificate/*",
    "/gift/*",
    "/my-impact",
    "/thank-you",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: protectedRoutes,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: protectedRoutes,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: protectedRoutes,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: protectedRoutes,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: protectedRoutes,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: protectedRoutes,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: protectedRoutes,
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: protectedRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
