import type { ProductIdentity, ProductMaskRegionId } from "@/types/product";

export function ProductMaskPanel({
  productIdentity,
  selectedRegionId,
  onSelectRegion
}: {
  productIdentity: ProductIdentity | null;
  selectedRegionId: ProductMaskRegionId | null;
  onSelectRegion: (regionId: ProductMaskRegionId) => void;
}) {
  if (!productIdentity) {
    return (
      <div className="rounded-md border border-white/10 bg-black/25 p-3">
        <p className="text-xs font-bold text-zinc-200">产品区域 Mask</p>
        <p className="mt-2 text-[11px] leading-5 text-zinc-500">完成视觉分析后自动识别 Shade、Metal、Base、Logo、Light Source。</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {productIdentity.maskRegions.filter((region) => region.id !== "scene").map((region) => {
        const selected = region.id === selectedRegionId;
        return (
          <button
            key={region.id}
            className={`w-full rounded-md border p-3 text-left transition ${
              selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.05]"
            }`}
            type="button"
            onClick={() => onSelectRegion(region.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-zinc-100">{region.label}</p>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-400">{region.material}</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-zinc-500">{region.promptHint}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {region.editableProperties.map((item) => (
                <span key={item} className="rounded border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100">
                  {item}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ProductMaskOverlay({
  productIdentity,
  selectedRegionId,
  onSelectRegion
}: {
  productIdentity: ProductIdentity | null;
  selectedRegionId: ProductMaskRegionId | null;
  onSelectRegion: (regionId: ProductMaskRegionId) => void;
}) {
  if (!productIdentity) return null;

  return (
    <div className="pointer-events-none absolute inset-8">
      {productIdentity.maskRegions.filter((region) => region.id !== "scene").map((region) => {
        const selected = region.id === selectedRegionId;
        return (
          <button
            key={region.id}
            className={`pointer-events-auto absolute rounded-md border text-[10px] font-black backdrop-blur transition ${
              selected
                ? "border-cyan-200 bg-cyan-300/25 text-white shadow-[0_0_28px_rgba(34,211,238,0.35)]"
                : "border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/15"
            }`}
            style={{
              left: `${region.bounds.x}%`,
              top: `${region.bounds.y}%`,
              width: `${region.bounds.width}%`,
              height: `${region.bounds.height}%`
            }}
            type="button"
            onClick={() => onSelectRegion(region.id)}
            title={region.promptHint}
          >
            <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 py-0.5">{region.label}</span>
          </button>
        );
      })}
    </div>
  );
}
