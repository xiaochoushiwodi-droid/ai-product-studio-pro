"use client";

import { FormEvent, useState } from "react";
import { CircuitBoard, KeyRound, LogIn, PackageCheck, ScanLine, Store } from "lucide-react";
import type { Marketplace, SellerSession } from "@/types/product";

const marketplaces: Marketplace[] = ["US", "UK", "DE", "JP", "CA"];

export function LoginCard({
  onLogin
}: {
  onLogin: (session: SellerSession) => void;
}) {
  const [sellerName, setSellerName] = useState("北星供应链");
  const [email, setEmail] = useState("seller@example.com");
  const [marketplace, setMarketplace] = useState<Marketplace>("US");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin({
      sellerName: sellerName.trim() || "演示卖家",
      email: email.trim() || "seller@example.com",
      marketplace
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0c0f] px-4 py-10 text-zinc-100">
      <div className="grid w-full max-w-5xl gap-0 overflow-hidden rounded-lg border border-white/10 bg-[#090a0c] shadow-[0_32px_120px_rgba(0,0,0,0.55)] lg:grid-cols-[1fr_400px]">
        <section className="canvas-grid min-h-[560px] border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            <Store className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">工业设计 AI 工作台</p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-white md:text-6xl">
            AI Product Studio Pro
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            面向 Amazon 卖家的产品设计、材质替换、场景图、工程图与包装输出工作台。
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { label: "AI设计", icon: ScanLine },
              { label: "材质渲染", icon: CircuitBoard },
              { label: "出图模块", icon: PackageCheck }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-md border border-white/10 bg-black/35 p-4 text-sm font-semibold text-zinc-200">
                  <Icon className="mb-3 h-5 w-5 text-cyan-200" aria-hidden="true" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="bg-[#0d0f13] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-zinc-200">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">卖家登录</h2>
              <p className="text-sm text-zinc-500">演示工作台入口</p>
            </div>
          </div>

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-zinc-400">卖家名称</span>
            <input
              className="h-11 w-full rounded-md border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
              value={sellerName}
              onChange={(event) => setSellerName(event.target.value)}
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-zinc-400">邮箱</span>
            <input
              className="h-11 w-full rounded-md border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-semibold text-zinc-400">主要站点</span>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
              value={marketplace}
              onChange={(event) => setMarketplace(event.target.value as Marketplace)}
            >
              {marketplaces.map((item) => (
                <option key={item} value={item}>
                  Amazon {item}
                </option>
              ))}
            </select>
          </label>

          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-black transition hover:bg-cyan-100"
            type="submit"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            进入工作台
          </button>
        </form>
      </div>
    </main>
  );
}
