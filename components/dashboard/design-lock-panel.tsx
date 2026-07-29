import { Lock } from "lucide-react";
import type { DesignLock } from "@/types/product";

export function DesignLockPanel({ designLock }: { designLock: DesignLock | null }) {
  const lockedItems = [
    "Product silhouette",
    "Product proportion",
    "Component position",
    "Camera angle",
    "Overall dimensions"
  ];
  const allowedItems = ["Material", "Color", "Surface finish", "Scene background"];

  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-200" aria-hidden="true" />
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-100">Design Lock</p>
        </div>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${designLock ? "bg-emerald-400/10 text-emerald-100" : "bg-white/10 text-zinc-500"}`}>
          {designLock ? "ON" : "OFF"}
        </span>
      </div>

      <LockGroup title="LOCKED" items={lockedItems} enabled={Boolean(designLock)} />
      <div className="mt-3">
        <LockGroup title="ALLOW EDIT" items={allowedItems} enabled={Boolean(designLock)} tone="cyan" />
      </div>
    </div>
  );
}

function LockGroup({
  title,
  items,
  enabled,
  tone = "emerald"
}: {
  title: string;
  items: string[];
  enabled: boolean;
  tone?: "emerald" | "cyan";
}) {
  const color = tone === "cyan" ? "text-cyan-100 border-cyan-400/20 bg-cyan-400/10" : "text-emerald-100 border-emerald-400/20 bg-emerald-400/10";

  return (
    <div>
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">{title}</p>
      <div className="grid gap-1.5">
        {items.map((item) => (
          <label key={item} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-[11px] font-semibold ${enabled ? color : "border-white/10 bg-white/[0.03] text-zinc-600"}`}>
            <input className="h-3.5 w-3.5 accent-cyan-300" type="checkbox" checked={enabled} readOnly />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}
