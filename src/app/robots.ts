import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const revalidate = 86400; // 24 hours

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = SITE.url; // "https://www.janasevaashrama.org"
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
