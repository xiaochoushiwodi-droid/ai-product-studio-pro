"use client";

import { useEffect, useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";

type CreditCost = {
  id: string;
  feature: string;
  label: string;
  credits: number;
};

export function AdminSettingsPanel() {
  const [adminEmail, setAdminEmail] = useState("admin@togo.ai");
  const [costs, setCosts] = useState<CreditCost[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("togo-admin-email");
    if (saved) setAdminEmail(saved);
  }, []);

  async function loadCosts() {
    setLoading(true);
    setMessage(null);
    window.localStorage.setItem("togo-admin-email", adminEmail);
    try {
      const response = await fetch("/api/admin/settings", {
        headers: { "x-togo-user-email": adminEmail }
      });
      const data = (await response.json()) as { costs?: CreditCost[]; message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "Unable to load credit settings.");
        return;
      }
      setCosts(data.costs ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function saveCost(cost: CreditCost) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-togo-user-email": adminEmail
        },
        body: JSON.stringify({ feature: cost.feature, credits: cost.credits })
      });
      const data = (await response.json()) as { message?: string };
      setMessage(response.ok ? "Credit cost updated." : data.message ?? "Unable to update credit setting.");
    } finally {
      setLoading(false);
    }
  }

  function updateLocalCost(feature: string, credits: number) {
    setCosts((current) => current.map((item) => (item.feature === feature ? { ...item, credits } : item)));
  }

  return (
    <section className="rounded-lg border border-white/10 bg-black/45 p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-md border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-100">
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-black text-white">Credit Cost Center</h2>
          <p className="mt-1 text-sm text-zinc-500">Adjust AI feature pricing without changing route code.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <input
            className="h-11 min-w-0 rounded-md border border-white/10 bg-black/60 px-3 text-sm text-zinc-100 outline-none focus:border-cyan-300/60 sm:w-72"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
            placeholder="admin@togo.ai"
          />
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-black text-black transition hover:bg-cyan-100 disabled:opacity-60"
            onClick={loadCosts}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Load Settings
          </button>
        </div>
      </div>

      {message ? <p className="mb-4 rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{message}</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(costs.length ? costs : fallbackCosts).map((cost) => (
          <article key={cost.feature} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-black text-white">{cost.label}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">{cost.feature}</p>
            <div className="mt-4 flex items-center gap-2">
              <input
                className="h-10 w-28 rounded-md border border-white/10 bg-black/60 px-3 text-sm font-bold text-cyan-100 outline-none focus:border-cyan-300/60"
                type="number"
                min={0}
                value={cost.credits}
                onChange={(event) => updateLocalCost(cost.feature, Number.parseInt(event.target.value || "0", 10))}
              />
              <span className="text-sm text-zinc-500">credits / call</span>
            </div>
            <button
              className="mt-4 h-9 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20"
              onClick={() => saveCost(cost)}
            >
              Save Cost
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

const fallbackCosts: CreditCost[] = [
  { id: "fallback-ai-product-analysis", feature: "ai_product_analysis", label: "AI Product Analysis", credits: 10 },
  { id: "fallback-ai-design", feature: "ai_design", label: "AI Design", credits: 100 },
  { id: "fallback-amazon-images", feature: "amazon_images", label: "Amazon 9 Images", credits: 500 },
  { id: "fallback-engineering", feature: "engineering_drawing", label: "Engineering Drawing", credits: 300 },
  { id: "fallback-exploded", feature: "exploded_view", label: "Exploded View", credits: 300 }
];
