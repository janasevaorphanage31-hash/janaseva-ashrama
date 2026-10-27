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
    <div className="min-h-screen bg-sand/30 font-sans text-teal-950 flex flex-col">
      <TelecallerNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <TelecallerPortal initialCallerId="TC01" />
      </main>
    </div>
  );
}
