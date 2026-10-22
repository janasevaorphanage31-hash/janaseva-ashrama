import { NextResponse, type NextRequest } from "next/server";

// In-memory sliding rate-limiter for edge/middleware requests
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    if (rateLimitMap.size > 10000) {
      for (const [k, v] of rateLimitMap) {
        if (v.resetTime < now) rateLimitMap.delete(k);
      }
    }
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 0. SANITIZE ACCIDENTAL TRAILING PUNCTUATION IN URLS ──
  // Handles links clicked from Instagram captions, WhatsApp messages, or SMS where a trailing period or comma was captured (e.g. /give. or /donate.)
  if (/[.,;:!]+$/.test(pathname)) {
    const cleanPath = pathname.replace(/[.,;:!]+$/, "") || "/";
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = cleanPath;
    return NextResponse.redirect(redirectUrl, 308);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // ── 1. RATE LIMITING FOR SENSITIVE ENDPOINTS ──
  // A. Auth / Login routes: Max 10 attempts per minute (prevents credential brute force)
  if (
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/v1/auth/login")
  ) {
    if (!checkRateLimit(`auth:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 60 seconds before retrying." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // B. Public donation / checkout creation: Max 30 attempts per minute (prevents gateway spam / carding)
  if (
    pathname.startsWith("/api/v1/checkout/create") ||
    pathname.startsWith("/api/donations") ||
    pathname.startsWith("/api/supporter-form")
  ) {
    if (!checkRateLimit(`checkout:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Donation rate limit exceeded. Please wait a moment." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // ── 2. HIDE ADMIN PAGES PROPERLY ──
  // Intercept all /admin routes (except /admin/login)
  const isAdminPage =
    pathname === "/admin" ||
    (pathname.startsWith("/admin/") && pathname !== "/admin/login");

  const hasAdminCookie =
    Boolean(req.cookies.get("janaseva_admin_session")?.value) ||
    Boolean(req.cookies.get("admin_session")?.value) ||
    Boolean(req.cookies.get("session")?.value);

  if (isAdminPage && !hasAdminCookie) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. AUTH ON EVERY ADMIN API ROUTE ──
  // Intercept /api/admin/* and /api/v1/admin/* (except /api/admin/login)
  const isAdminApi =
    (pathname.startsWith("/api/admin/") && pathname !== "/api/admin/login") ||
    pathname.startsWith("/api/v1/admin/");

  if (isAdminApi && !hasAdminCookie) {
    return NextResponse.json(
      { error: "Unauthorized. Administrator credentials required." },
      { status: 401 }
    );
  }

  // ── 4. CORS LOCKDOWN ON API ROUTES ──
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin") || "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    let isAllowedOrigin = false;

    if (!origin) {
      // Same-origin server requests without origin header
      isAllowedOrigin = true;
    } else {
      try {
        const originHost = new URL(origin).host;
        const reqHost = req.headers.get("host") || "";
        const configuredHost = siteUrl ? new URL(siteUrl).host : "";

        isAllowedOrigin =
          originHost === reqHost ||
          originHost.includes("localhost") ||
          originHost.includes("trycloudflare.com") ||
          (Boolean(configuredHost) && originHost === configuredHost) ||
          originHost.endsWith(".janasevaashrama.org") ||
          originHost.endsWith(".janasevaorphanage.org");
      } catch {
        isAllowedOrigin = false;
      }
    }

    // Preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      if (!isAllowedOrigin) {
        return new NextResponse(null, { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-caller-id, x-razorpay-signature",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (!isAllowedOrigin && origin) {
      return NextResponse.json(
        { error: "Cross-Origin request blocked by security policy." },
        { status: 403 }
      );
    }
  }

  // ── 5. SECURITY HEADERS ON ALL RESPONSES ──
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, apple-touch-icon.png
     * - public static files matching common extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|css|js|mp4|pdf|txt|xml)$).*)",
  ],
};
