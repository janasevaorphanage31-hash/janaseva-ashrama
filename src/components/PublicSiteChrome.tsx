"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingSocials } from "@/components/FloatingSocials";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { UrgentDonationBar } from "@/components/UrgentDonationBar";
import { LiveDonationToast } from "@/components/LiveDonationToast";
import { BottomDonationDrawer } from "@/components/BottomDonationDrawer";
import { BottomNav } from "@/components/BottomNav";

/**
 * PublicSiteChrome renders customer-facing website components (Header, Footer,
 * Live Donation Toasts, Floating WhatsApp, Bottom Nav, Donation Drawer).
 *
 * For all /admin and /portal routes, it completely suppresses the customer
 * website chrome and public donation widgets, providing a pure, uncluttered
 * operational workspace for staff and telecallers.
 */
export function PublicSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStaffWorkspace = pathname?.startsWith("/admin") || pathname?.startsWith("/portal");
  const isCheckout = pathname === "/checkout" || pathname === "/donate" || pathname === "/give";

  if (isStaffWorkspace) {
    return (
      <div className="w-full max-w-full min-h-screen bg-sand/30 font-sans text-teal-950">
        {children}
      </div>
    );
  }

  // Pure focused checkout experience: strictly omit floating drawers, sticky bars, toasts,
  // and bottom nav to eliminate any possibility of overlays intercepting mobile touch events.
  if (isCheckout) {
    return (
      <>
        <SiteHeader />
        <main className="w-full max-w-full min-w-0 overflow-x-clip">{children}</main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="w-full max-w-full min-w-0 overflow-x-clip">{children}</main>
      <SiteFooter />
      <FloatingSocials />
      <ScrollToTopButton />
      <UrgentDonationBar />
      <LiveDonationToast />
      <BottomDonationDrawer />
      <BottomNav />
    </>
  );
}
