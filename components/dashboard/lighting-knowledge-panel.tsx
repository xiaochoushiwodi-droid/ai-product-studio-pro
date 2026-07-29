import type { LightingKnowledgeRule } from "@/types/product";

export function LightingKnowledgePanel({ rules }: { rules: LightingKnowledgeRule[] }) {
  return (
    <div className="space-y-2">
      {rules.map((rule) => (
        <div key={rule.id} className="rounded-md border border-white/10 bg-black/25 p-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-zinc-100">{rule.title}</p>
            <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100">{rule.category}</span>
          </div>
          <p className="text-[11px] leading-5 text-zinc-400">{rule.designUse}</p>
        </div>
      ))}
    </div>
  );
}
