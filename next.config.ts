import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "payment=*, camera=*, microphone=(), geolocation=(), otp-credentials=*, publickey-credentials-get=*",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://checkout.razorpay.com https://*.razorpay.com https://api.razorpay.com https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com; worker-src 'self' blob:; child-src 'self' blob: https://*.razorpay.com https://api.razorpay.com https://checkout.razorpay.com; frame-src 'self' blob: data: https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://*.rzp.io https://www.facebook.com https://*.googletagmanager.com https:; connect-src 'self' blob: data: https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://*.rzp.io https://connect.facebook.net https://www.facebook.com https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net; img-src 'self' data: blob: https://images.unsplash.com https://i.ytimg.com https://img.youtube.com https://*.razorpay.com https://cdn.razorpay.com https://www.facebook.com https://www.google.com https://www.google.co.in https://googleads.g.doubleclick.net https://www.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline' https://*.razorpay.com; font-src 'self' data: https://*.razorpay.com; object-src 'none'; base-uri 'self';",
  },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/give.", destination: "/give", permanent: true },
      { source: "/donate.", destination: "/donate", permanent: true },
      { source: "/support.", destination: "/supporter-form", permanent: true },
      { source: "/donation", destination: "/give", permanent: true },
      { source: "/donations", destination: "/give", permanent: true },
      { source: "/contribute", destination: "/give", permanent: true },
      { source: "/contributions", destination: "/give", permanent: true },
      { source: "/sponsor", destination: "/give", permanent: true },
      { source: "/annadana", destination: "/give", permanent: true },
      { source: "/annadanam", destination: "/give", permanent: true },
      { source: "/meals", destination: "/give", permanent: true },
      { source: "/food", destination: "/give", permanent: true },
      { source: "/about", destination: "/campus", permanent: true },
      { source: "/about-us", destination: "/campus", permanent: true },
      { source: "/ashram", destination: "/campus", permanent: true },
      { source: "/ashrama", destination: "/campus", permanent: true },
      { source: "/birthday", destination: "/celebrate-birthday", permanent: true },
      { source: "/birthdays", destination: "/celebrate-birthday", permanent: true },
      { source: "/tax", destination: "/give", permanent: true },
      { source: "/80g", destination: "/give", permanent: true },
      { source: "/bank", destination: "/checkout?method=bank", permanent: true },
      { source: "/upi", destination: "/give", permanent: true },
      { source: "/help", destination: "/contact", permanent: true },
      { source: "/c/:slug*", destination: "/campaigns/:slug*", permanent: true },
      { source: "/receipts/:path*", destination: "/receipt/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/support", destination: "/supporter-form" },
      { source: "/supporter", destination: "/supporter-form" },
    ];
  },
};

export default nextConfig;
