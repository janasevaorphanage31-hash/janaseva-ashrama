import type { Metadata } from "next";
import { TelecallerPortal } from "@/components/admin/TelecallerPortal";
import { TelecallerNavbar } from "@/components/admin/TelecallerNavbar";

export const metadata: Metadata = {
  title: "Telecaller Workspace | Antigravity CRM - Janaseva Ashrama",
  description: "Telecaller birthday outreach portal, 1-tap WhatsApp tracking link delivery, and lead disposition logging.",
  robots: { index: false, follow: false },
};

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-sand/30 font-sans text-teal-950 flex flex-col overscroll-none">
      {/* Hide bulky desktop navbar on mobile to give telecallers 100% zero-scroll screen space */}
      <div className="hidden lg:block">
        <TelecallerNavbar />
      </div>
      <main className="flex-1 max-w-7xl w-full mx-auto p-0 sm:py-4 sm:px-4 lg:py-6 lg:px-8 overscroll-none">
        <TelecallerPortal />
      </main>
    </div>
  );
}
