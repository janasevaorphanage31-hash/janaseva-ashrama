import type { Metadata } from "next";
import { TelecallerPortal } from "@/components/admin/TelecallerPortal";

export const metadata: Metadata = {
  title: "Telecaller Workspace | Antigravity CRM - Janaseva Ashrama",
  description: "Telecaller birthday outreach portal, 1-tap WhatsApp tracking link delivery, and lead disposition logging.",
  robots: { index: false, follow: false },
};

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-sand/30 py-8 px-4 sm:px-6 lg:px-8 font-sans text-teal-950">
      <div className="max-w-7xl mx-auto">
        <TelecallerPortal initialCallerId="TC01" />
      </div>
    </div>
  );
}
