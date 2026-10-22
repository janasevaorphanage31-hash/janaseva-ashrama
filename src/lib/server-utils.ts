import { randomBytes } from "node:crypto";

const buckets = new Map<string, { n: number; reset: number }>();

/** Small in-memory rate limiter (per instance). Swap for Redis/edge limiter at scale. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    }
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export const publicToken = () => randomBytes(12).toString("hex");

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "campaign"
  );
}

export const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export const makeRef = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${publicToken().slice(0, 6).toUpperCase()}`;

/** Keep only digits and optional leading +; used for phone inputs and API validation. */
export function normalizePhone(v: string) {
  const t = v.replace(/[^\d+]/g, "");
  const plus = t.startsWith("+") ? "+" : "";
  const digits = t.replace(/\D/g, "").slice(0, 15);
  return plus + digits;
}

/** E.164-ish check: 10-15 digits, optional +. */
export const isPhone = (v: string) => /^\+?\d{10,15}$/.test(v);

/**
 * Strips 4-byte UTF-8 emojis, surrogates, and special symbols to ensure
 * Razorpay orders & subscriptions APIs never return 400 BAD_REQUEST_ERROR
 * ("The notes field should contain valid UTF-8 encoded characters").
 */
export function cleanRazorpayNote(val: unknown, max = 250): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "") // surrogate pairs (emojis)
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width characters
    .replace(/[^\x20-\x7E\u0900-\u097F\u0C80-\u0CFF]/g, " ") // keep standard printable ASCII, Devanagari & Kannada
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
