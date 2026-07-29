import { LayoutTemplate, Sparkles } from "lucide-react";
import type { MarketingAutoLayout, MarketingTemplate } from "@/types/product";

export function MarketingTemplateLibrary({
  templates,
  layouts,
  selectedLayoutId,
  loading,
  disabled,
  onGenerateLayouts,
  onSelectLayout
}: {
  templates: MarketingTemplate[];
  layouts: MarketingAutoLayout[];
  selectedLayoutId: string | null;
  loading: boolean;
  disabled: boolean;
  onGenerateLayouts: () => void;
  onSelectLayout: (layoutId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <button
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-400/10 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-zinc-600"
        type="button"
        disabled={disabled || loading}
        onClick={onGenerateLayouts}
      >
        {loading ? <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" /> : <LayoutTemplate className="h-4 w-4" aria-hidden="true" />}
        Auto Layout 生成9张图片
      </button>

      <div className="grid gap-2">
        {templates.map((template) => {
          const layout = layouts.find((item) => item.templateId === template.id);
          const selected = layout?.id === selectedLayoutId;

          return (
            <button
              key={template.id}
              className={`rounded-md border p-3 text-left transition ${
                selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25 hover:bg-white/[0.05]"
              }`}
              type="button"
              disabled={!layout}
              onClick={() => layout && onSelectLayout(layout.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-zinc-100">{template.imageIndex}. {template.name}</p>
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-500">1600</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-zinc-500">{template.rules[0]}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {template.layoutRules.slice(0, 2).map((rule) => (
                  <span key={rule} className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-500">
                    {rule}
                  </span>
                ))}
                {template.sceneOptions?.map((scene) => (
                  <span key={scene} className="rounded border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100">
                    {scene}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
