import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CreditAccountPanel } from "@/components/billing/CreditAccountPanel";

export default function CreditsPage() {
  return (
    <main className="min-h-screen bg-[#07080a] px-5 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <BrandLogo size="medium" priority />
          <nav className="flex gap-2">
            <Link className="rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:text-cyan-100" href="/">
              Studio
            </Link>
            <Link className="rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:text-cyan-100" href="/pricing">
              Pricing
            </Link>
            <Link className="rounded-md bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-cyan-100" href="/admin">
              Admin
            </Link>
          </nav>
        </header>

        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">TOGO AI Credits</p>
          <h1 className="text-3xl font-black text-white md:text-5xl">Credit wallet and recharge center.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
            Ordinary users spend credits before every AI call. Admin users bypass credit deduction and can test all AI
            models without daily limits.
          </p>
        </div>

        <CreditAccountPanel />
      </div>
    </main>
  );
}
