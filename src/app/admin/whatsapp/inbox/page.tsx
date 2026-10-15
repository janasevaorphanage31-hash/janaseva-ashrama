import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-auth";
import { Container } from "@/components/ui";
import { TeamInbox } from "@/components/admin/whatsapp/TeamInbox";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WhatsApp Team Inbox — Janaseva Ashrama",
};

export default async function AdminWhatsAppInboxPage() {
  const session = await requireAdminPage();

  return (
    <main className="min-h-screen bg-cream py-6">
      <Container>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/whatsapp"
              className="text-xs font-bold text-teal-900 hover:underline flex items-center gap-1"
            >
              ← WhatsApp Dashboard
            </Link>
          </div>
          <span className="text-xs font-semibold text-teal-950/60">
            Signed in as {session.user.displayName}
          </span>
        </div>
        <TeamInbox currentUserId={session.user.id} />
      </Container>
    </main>
  );
}
