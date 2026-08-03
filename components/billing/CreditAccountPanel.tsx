"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { CreditCard, Database, Loader2, ReceiptText, ShieldCheck } from "lucide-react";

type CreditUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  credits: number;
  totalUsedCredits: number;
  createdAt: string;
};

type PricingPlan = {
  slug: string;
  name: string;
  credits: number;
  priceCents: number;
  currency: string;
};

type UsageLog = {
  id: string;
  feature: string;
  model: string;
  creditsUsed: number;
  bypassed: boolean;
  status: string;
  createdAt: string;
};

type CreditTransaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
};

type CreditAccount = {
  user: CreditUser;
  plans: PricingPlan[];
  transactions: CreditTransaction[];
  usageLogs: UsageLog[];
};

export function CreditAccountPanel() {
  const [email, setEmail] = useState("seller@example.com");
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("togo-credit-email");
    if (saved) setEmail(saved);
  }, []);

  async function loadAccount(nextEmail = email) {
    setLoading(true);
    setMessage(null);
    window.localStorage.setItem("togo-credit-email", nextEmail);
    try {
      const response = await fetch("/api/credits/me", {
        headers: { "x-togo-user-email": nextEmail }
      });
      const data = (await response.json()) as CreditAccount & { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "Unable to load credit account.");
        return;
      }
      setAccount(data);
    } finally {
      setLoading(false);
    }
  }

  async function purchase(planSlug: string) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-togo-user-email": email
        },
        body: JSON.stringify({ planSlug, provider: "manual" })
      });
      const data = (await response.json()) as { status?: string; message?: string };
      setMessage(data.message ?? (response.ok ? "Credits added." : data.status ?? "Payment provider is not configured."));
      await loadAccount(email);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-white/10 bg-black/45 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-100">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Credit Wallet</h2>
            <p className="text-sm text-zinc-500">TOGO AI commercial usage balance</p>
          </div>
        </div>
        <label className="mb-3 block text-sm font-semibold text-zinc-400">
          Account Email
          <input
            className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/60 px-3 text-sm text-zinc-100 outline-none focus:border-cyan-300/60"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-black transition hover:bg-cyan-100 disabled:opacity-60"
          onClick={() => loadAccount()}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Database className="h-4 w-4" aria-hidden="true" />}
          Load Credits
        </button>

        {account ? (
          <div className="mt-5 grid gap-3">
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Current Credits</p>
              <p className="mt-2 text-4xl font-black text-cyan-100">{account.user.credits.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-500">Used: {account.user.totalUsedCredits.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm">
              <span className="text-zinc-400">Role</span>
              <span className="inline-flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                {account.user.role}
              </span>
            </div>
          </div>
        ) : null}

        {message ? <p className="mt-4 rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{message}</p> : null}
      </section>

      <section className="rounded-lg border border-white/10 bg-black/45 p-5">
        <h2 className="text-lg font-black text-white">Recharge Packages</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(account?.plans ?? fallbackPlans).map((plan) => (
            <article key={plan.slug} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-bold text-cyan-100">{plan.name}</p>
              <p className="mt-3 text-3xl font-black text-white">{plan.credits.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">credits</p>
              <p className="mt-3 text-sm text-zinc-400">
                {(plan.priceCents / 100).toLocaleString("en-US", { style: "currency", currency: plan.currency })}
              </p>
              <button
                className="mt-4 h-10 w-full rounded-md border border-cyan-400/30 bg-cyan-400/10 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-60"
                onClick={() => purchase(plan.slug)}
                disabled={loading}
              >
                Recharge
              </button>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <ActivityList title="AI Usage Log" icon={<ReceiptText className="h-4 w-4" aria-hidden="true" />}>
            {(account?.usageLogs ?? []).map((log) => (
              <li key={log.id} className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-white">{log.feature}</span>
                  <span>{log.bypassed ? "ADMIN BYPASS" : `${log.creditsUsed} credits`}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{log.model} / {log.status}</p>
              </li>
            ))}
          </ActivityList>
          <ActivityList title="Credit Transactions" icon={<CreditCard className="h-4 w-4" aria-hidden="true" />}>
            {(account?.transactions ?? []).map((transaction) => (
              <li key={transaction.id} className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-white">{transaction.type}</span>
                  <span>{transaction.amount > 0 ? "+" : ""}{transaction.amount}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">Balance: {transaction.balanceAfter}</p>
              </li>
            ))}
          </ActivityList>
        </div>
      </section>
    </div>
  );
}

function ActivityList({
  title,
  icon,
  children
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-zinc-200">
        {icon}
        {title}
      </h3>
      <ul className="grid gap-2">{children}</ul>
    </div>
  );
}

const fallbackPlans: PricingPlan[] = [
  { slug: "starter", name: "Starter", credits: 1000, priceCents: 1900, currency: "USD" },
  { slug: "professional", name: "Professional", credits: 10000, priceCents: 9900, currency: "USD" },
  { slug: "enterprise", name: "Enterprise", credits: 100000, priceCents: 69900, currency: "USD" }
];
