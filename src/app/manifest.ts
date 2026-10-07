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
      { src: "/logo/janaseva-mark.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/logo/janaseva-logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
