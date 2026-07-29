import { CheckCircle2 } from "lucide-react";
import type { DesignLock, ProductIdentity } from "@/types/product";

export function ProductIdentityPanel({
  productIdentity,
  designLock
}: {
  productIdentity: ProductIdentity | null;
  designLock: DesignLock | null;
}) {
  if (!productIdentity || !designLock) {
    return (
      <div className="rounded-md border border-white/10 bg-black/25 p-3">
        <p className="text-xs font-bold text-zinc-200">Product Identity</p>
        <p className="mt-2 text-[11px] leading-5 text-zinc-500">等待 AI 视觉分析上传图片。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Product Identity</p>
          <span className="rounded bg-black/35 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
            {productIdentity.visionModel.status}
          </span>
        </div>
        <IdentityField label="产品类型" value={productIdentity.productType} />
      </div>

      <IdentityList title="结构" items={productIdentity.partStructure} />
      <IdentityList title="材质" items={productIdentity.materials.map((item) => item.material)} />
      <IdentityList title="关键特征" items={productIdentity.keyFeatures} />

      <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3">
        <p className="mb-2 text-xs font-bold text-emerald-100">锁定状态</p>
        <div className="grid gap-1.5">
          {[
            "Shape Locked",
            "Dimension Locked",
            "Structure Locked",
            "Camera Locked"
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IdentityField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-zinc-100">{value}</p>
    </div>
  );
}

function IdentityList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <p className="mb-2 text-xs font-bold text-zinc-200">{title}</p>
      <div className="grid gap-1.5">
        {Array.from(new Set(items)).map((item) => (
          <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
