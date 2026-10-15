import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-auth";
import { Container } from "@/components/ui";
import { WhatsAppDashboard } from "@/components/admin/whatsapp/WhatsAppDashboard";

export const metadata: Metadata = {
  title: "WhatsApp CRM & Broadcast Suite — Janaseva Ashrama",
};

export default async function AdminWhatsAppPage() {
  const session = await requireAdminPage();

  return (
    <main className="min-h-screen bg-cream py-8">
      <Container>
        <WhatsAppDashboard
          initialSession={{
            user: {
              id: session.user.id,
              displayName: session.user.displayName,
              email: session.user.email,
              role: session.user.role,
            },
          }}
        />
      </Container>
    </main>
  );
}
