import Link from "next/link";
import { requireAdminPage, logoutAdmin } from "@/lib/admin-auth";
import { PageHero, Section, Container } from "@/components/ui";
import AdminContentClient from "./AdminContentClient";

export default async function AdminContentPage() {
  const session = await requireAdminPage();
  return (
    <>
      <div className="bg-teal-950 py-3 text-white border-b border-white/10">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="font-bold text-saffron hover:underline">
                &larr; Admin Overview
              </Link>
              <span className="text-white/30">|</span>
              <span className="text-white/70">Logged in: <strong className="text-white">{session.user.displayName}</strong> ({session.user.role})</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" target="_blank" className="font-semibold text-white/80 hover:text-white">
                View Live Website &rarr;
              </Link>
              <form action={async () => { "use server"; await logoutAdmin(); }}>
                <button className="rounded-lg bg-white/10 px-3 py-1 font-semibold text-white hover:bg-white/20 transition">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </Container>
      </div>
      <PageHero eyebrow="Admin CMS" title="CONTENT & CATALOG CONTROL" lead="Update Catalogs, Media, Today Moments, Platform Metrics, and Documents without changing code." />
      <Section tone="cream"><Container><AdminContentClient /></Container></Section>
    </>
  );
}
