import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const revalidate = 86400; // 24 hours

export default async function robots(): Promise<MetadataRoute.Robots> {
  const primaryUrl = "https://www.janasevaorphanage.org";
  const ashramaUrl = "https://www.janasevaashrama.org";

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

  const aiAndSearchCrawlers = [
    "*",
    "Googlebot",
    "Google-Extended",
    "Bingbot",
    "OAI-SearchBot",
    "GPTBot",
    "PerplexityBot",
    "ClaudeBot",
    "Applebot-Extended",
    "Amazonbot",
    "CCBot",
    "FacebookBot",
    "facebookexternalhit",
    "Bytespider",
    "cohere-ai",
  ];

  return {
    rules: aiAndSearchCrawlers.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: protectedRoutes,
    })),
    sitemap: [
      `${primaryUrl}/sitemap.xml`,
      `${ashramaUrl}/sitemap.xml`,
    ],
  };
}
