import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://janasevaorphanage.org";
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
