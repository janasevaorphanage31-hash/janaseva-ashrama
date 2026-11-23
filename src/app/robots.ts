import type { MetadataRoute } from "next";

export const revalidate = 86400; // 24 hours

export default async function robots(): Promise<MetadataRoute.Robots> {
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
    "ChatGPT-User",
    "GPTBot",
    "PerplexityBot",
    "ClaudeBot",
    "Claude-SearchBot",
    "Applebot",
    "Applebot-Extended",
    "Amazonbot",
    "CCBot",
    "FacebookBot",
    "facebookexternalhit",
    "Meta-ExternalAgent",
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
      `${ashramaUrl}/sitemap.xml`,
    ],
  };
}
