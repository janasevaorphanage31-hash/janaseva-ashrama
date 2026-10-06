import { redirect } from "next/navigation";
import { getAdminSession, loginAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function submit(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const ok = await loginAdmin(email, password);
  if (!ok) redirect("/admin/login?error=1");
  redirect("/admin");
}

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const params = await searchParams;
  return (
    <main className="min-h-[75vh] bg-cream px-5 py-16">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-saffron-dark">Janaseva Admin</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-teal-950">Secure sign in</h1>
        <p className="mt-2 text-sm text-teal-950/65">Admin portal access is protected. Authorized personnel only.</p>
        {params.error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Sign in failed. Check your credentials.</p>}
        <form action={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-teal-950">
            Email
            <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-teal-900/15 px-4 py-3" />
          </label>
          <label className="block text-sm font-semibold text-teal-950">
            Password
            <input name="password" type="password" required className="mt-1 w-full rounded-xl border border-teal-900/15 px-4 py-3" />
          </label>
          <button className="w-full rounded-xl bg-saffron px-5 py-3.5 font-bold text-white transition hover:bg-saffron-dark">SIGN IN</button>
        </form>
      </div>
    </main>
  );
}
