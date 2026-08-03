import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const plans = [
  {
    slug: "starter",
    name: "Starter",
    credits: "1,000",
    price: "$19",
    bullets: ["AI product analysis", "Material and color edits", "Marketing copy tests"]
  },
  {
    slug: "professional",
    name: "Professional",
    credits: "10,000",
    price: "$99",
    bullets: ["Amazon 9-image workflows", "Engineering drawings", "Version history"]
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    credits: "100,000",
    price: "$699",
    bullets: ["Team production runs", "Admin credit control", "Model testing freedom"]
  }
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#07080a] px-5 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <BrandLogo size="medium" priority />
          <nav className="flex gap-2">
            <Link className="rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:text-cyan-100" href="/">
              Studio
            </Link>
            <Link className="rounded-md bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-cyan-100" href="/credits">
              Credits
            </Link>
          </nav>
        </header>

        <section className="py-12">
          <div className="mb-8 max-w-3xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Commercial Credit System</p>
            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">Recharge TOGO AI credits for production workflows.</h1>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              Credits power AI product analysis, image-to-image design edits, Amazon image generation, engineering drawings,
              marketing copy, image layout, and future enhancement models.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.slug} className="rounded-lg border border-white/10 bg-black/45 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-white">{plan.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{plan.credits} credits</p>
                  </div>
                  <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-100">
                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-4xl font-black text-cyan-100">{plan.price}</p>
                <ul className="mt-5 grid gap-3">
                  {plan.bullets.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-black transition hover:bg-cyan-100"
                  href={`/credits?plan=${plan.slug}`}
                >
                  Recharge
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-zinc-400">
            Payment adapters are ready for Stripe, Alipay, and WeChat Pay. After a successful payment webhook, TOGO AI
            adds credits automatically through the credit transaction ledger.
          </div>
        </section>
      </div>
    </main>
  );
}
