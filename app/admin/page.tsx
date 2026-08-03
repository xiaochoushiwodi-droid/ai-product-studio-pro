import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { AdminUsersPanel } from "@/components/billing/AdminUsersPanel";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#07080a] px-5 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <BrandLogo size="medium" priority />
          <nav className="flex gap-2">
            <Link className="rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:text-cyan-100" href="/">
              Studio
            </Link>
            <Link className="rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:text-cyan-100" href="/credits">
              Credits
            </Link>
            <Link className="rounded-md bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-cyan-100" href="/admin/settings">
              Settings
            </Link>
          </nav>
        </header>

        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">TOGO AI Admin</p>
          <h1 className="text-3xl font-black text-white md:text-5xl">Commercial control center.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
            View users, credits, consumption logs, and account state. Admin identities are controlled by database role
            or the `TOGO_ADMIN_EMAILS` bootstrap environment variable.
          </p>
        </div>

        <AdminUsersPanel />
      </div>
    </main>
  );
}
