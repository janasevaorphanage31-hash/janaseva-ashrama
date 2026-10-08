import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Janaseva Ashrama",
    short_name: "Janaseva",
    description: "A home today. A future we build together.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcf8f1",
    theme_color: "#052f2c",
    icons: [
      { src: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { src: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo/janaseva-logo.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
    ],
  };
}
