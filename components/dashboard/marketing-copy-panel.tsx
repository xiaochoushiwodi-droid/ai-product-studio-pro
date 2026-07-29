import { Languages, Sparkles } from "lucide-react";
import { marketingCopyModes, marketingLanguages } from "@/lib/marketing-studio";
import type { MarketingCopy, MarketingCopyMode, MarketingLanguage } from "@/types/product";

export function MarketingCopyPanel({
  copy,
  mode,
  language,
  loading,
  disabled,
  onModeChange,
  onLanguageChange,
  onGenerate
}: {
  copy: MarketingCopy | null;
  mode: MarketingCopyMode;
  language: MarketingLanguage;
  loading: boolean;
  disabled: boolean;
  onModeChange: (mode: MarketingCopyMode) => void;
  onLanguageChange: (language: MarketingLanguage) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-500">Optimization Mode</p>
        <div className="grid gap-2">
          {marketingCopyModes.map((item) => (
            <button
              key={item.id}
              className={`rounded-md border p-2 text-left transition ${
                mode === item.id ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25 hover:bg-white/[0.05]"
              }`}
              type="button"
              onClick={() => onModeChange(item.id)}
            >
              <p className="text-xs font-bold text-zinc-100">{item.label}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{item.goal}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-500">Language</p>
        <div className="grid grid-cols-4 gap-1.5">
          {marketingLanguages.map((item) => (
            <button
              key={item.id}
              className={`h-8 rounded-md border text-[11px] font-bold transition ${
                language === item.id ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-black/25 text-zinc-500 hover:text-zinc-200"
              }`}
              type="button"
              onClick={() => onLanguageChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-400/10 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-zinc-600"
        type="button"
        disabled={disabled || loading}
        onClick={onGenerate}
      >
        {loading ? <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" /> : <Languages className="h-4 w-4" aria-hidden="true" />}
        生成图片文案
      </button>

      {copy ? (
        <div className="space-y-3">
          <CopyBlock title="Title" value={copy.title} />
          <div className="rounded-md border border-white/10 bg-black/25 p-3">
            <p className="mb-2 text-xs font-bold text-zinc-100">Bullet Points</p>
            <div className="grid gap-1.5">
              {copy.bulletPoints.map((item) => (
                <p key={item} className="text-[11px] leading-5 text-zinc-300">- {item}</p>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3">
            <p className="mb-2 text-xs font-bold text-cyan-100">Image Copy</p>
            <div className="flex flex-wrap gap-1.5">
              {copy.imageCopy.map((item) => (
                <span key={item} className="rounded border border-cyan-400/20 bg-black/25 px-2 py-1 text-[11px] font-semibold text-cyan-100">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <CopyBlock title="Listing Description" value={copy.listingDescription} />
        </div>
      ) : (
        <div className="rounded-md border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-zinc-500">
          上传产品并完成 Product Identity JSON 后，会自动生成面向美国 Amazon 消费者的英文优先文案。
        </div>
      )}
    </div>
  );
}

function CopyBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <p className="mb-2 text-xs font-bold text-zinc-100">{title}</p>
      <p className="text-[11px] leading-5 text-zinc-300">{value}</p>
    </div>
  );
}
