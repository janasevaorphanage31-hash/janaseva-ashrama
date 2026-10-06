import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-auth";
import { Container, Section } from "@/components/ui";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = { title: "Janaseva Ashrama Admin Suite" };

export default async function AdminPage() {
  const session = await requireAdminPage();

  return (
    <main className="min-h-screen bg-cream py-8">
      <Container>
        <AdminDashboardClient
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
