import Link from "next/link";
import { SITE } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-cream px-4 py-16 sm:py-24">
      <div className="max-w-xl mx-auto text-center space-y-6">
        {/* Emblem Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-amber-900">
          <span>🙏 Janaseva Ashrama · Bangalore</span>
        </div>

        {/* 404 Visual Number */}
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl font-black text-teal-950 tracking-tight">
          4<span className="text-saffron">0</span>4
        </h1>

        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-teal-950">
            Page Not Found
          </h2>
          <p className="mt-2 text-sm sm:text-base text-teal-950/70 max-w-md mx-auto leading-relaxed">
            The page you are looking for may have moved or no longer exists.
            Let us help you find your way back to supporting our 25 resident boys.
          </p>
        </div>

        {/* Primary Direct Donation Pathway */}
        <div className="pt-1">
          <Link
            href="/give"
            className="group block w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-4 text-left shadow-lg hover:from-amber-600 hover:to-amber-800 transition transform hover:-translate-y-0.5 border border-amber-400/40"
          >
            <div className="flex items-center justify-between text-white">
              <span className="font-extrabold text-base flex items-center gap-2">
                <span>💛</span>
                <span>Support &amp; Donate to 25 Boys</span>
              </span>
              <span className="text-xl font-bold group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-xs text-amber-100 font-medium mt-1">
              Start from ₹11 · 100% Tax Deductible (80G Form 10AC) · Instant WhatsApp Receipt
            </p>
          </Link>
        </div>

        {/* Quick Return Pathways */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
          <Link
            href="/"
            className="group rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs hover:border-saffron hover:shadow-md transition"
          >
            <p className="font-bold text-sm text-teal-950 group-hover:text-saffron-dark flex items-center justify-between">
              <span>🏠 Return to Homepage</span>
              <span>→</span>
            </p>
            <p className="text-xs text-teal-950/60 mt-0.5">Explore 25 boys, mission &amp; daily needs</p>
          </Link>

          <Link
            href="/celebrate-birthday"
            className="group rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs hover:border-saffron hover:shadow-md transition"
          >
            <p className="font-bold text-sm text-teal-950 group-hover:text-saffron-dark flex items-center justify-between">
              <span>🎂 Celebrate Birthday</span>
              <span>→</span>
            </p>
            <p className="text-xs text-teal-950/60 mt-0.5">Sponsor a feast or book a campus visit</p>
          </Link>

          <Link
            href="/impact"
            className="group rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs hover:border-saffron hover:shadow-md transition"
          >
            <p className="font-bold text-sm text-teal-950 group-hover:text-saffron-dark flex items-center justify-between">
              <span>🍲 Daily Needs Giving</span>
              <span>→</span>
            </p>
            <p className="text-xs text-teal-950/60 mt-0.5">Sponsor milk, groceries or school kits</p>
          </Link>

          <Link
            href="/janaseva-crew"
            className="group rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs hover:border-saffron hover:shadow-md transition"
          >
            <p className="font-bold text-sm text-teal-950 group-hover:text-saffron-dark flex items-center justify-between">
              <span>🤝 Join Janaseva Crew</span>
              <span>→</span>
            </p>
            <p className="text-xs text-teal-950/60 mt-0.5">2.5 hrs/week weekend mentoring</p>
          </Link>
        </div>

        {/* WhatsApp Help */}
        <div className="pt-4 border-t border-teal-900/10">
          <p className="text-xs text-teal-950/60">
            Need urgent assistance? Chat with ashrama caregivers directly on WhatsApp:
          </p>
          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Namaste Janaseva Ashrama, I am looking for assistance on your website.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 font-bold text-xs text-emerald-800 hover:text-emerald-900 underline underline-offset-4"
          >
            <span>💬 WhatsApp Caregiver Team (+91 94480 50358)</span>
          </a>
        </div>
      </div>
    </main>
  );
}
