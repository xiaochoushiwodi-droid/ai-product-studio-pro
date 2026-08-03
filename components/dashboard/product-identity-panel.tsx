import { CheckCircle2, LockKeyhole, ScanLine } from "lucide-react";
import type { DesignLock, ProductIdentity } from "@/types/product";

export function ProductIdentityPanel({
  productIdentity,
  designLock,
  productName
}: {
  productIdentity: ProductIdentity | null;
  designLock: DesignLock | null;
  productName?: string;
}) {
  if (!productIdentity || !designLock) {
    return (
      <div className="rounded-md border border-white/10 bg-black/25 p-3">
        <p className="text-xs font-bold text-zinc-200">Product Identity</p>
        <p className="mt-2 text-[11px] leading-5 text-zinc-500">Waiting for AI vision analysis of the uploaded product image.</p>
      </div>
    );
  }

  const raw = productIdentity.rawVisionJson;

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-cyan-100" aria-hidden="true" />
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Product Identity</p>
          </div>
          <span className="rounded bg-black/35 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
            {productIdentity.visionModel.provider ?? "mock-fallback"} / {productIdentity.visionModel.status}
          </span>
        </div>
        <div className="grid gap-2">
          <IdentityField label="Product" value={productName || productIdentity.productType} />
          <IdentityField label="Type" value={productIdentity.productType} />
          <IdentityField label="Design Style" value={productIdentity.designStyle} />
          <IdentityField label="Brand Positioning" value={productIdentity.brandPositioning} />
        </div>
      </div>

      <IdentityList title="Structure" items={raw.parts.map((part) => `${part.name} - ${part.shape} - ${part.position}`)} />
      <IdentityList title="Material" items={Array.from(new Set(raw.materials.length > 0 ? raw.materials : productIdentity.materials.map((item) => item.material)))} />
      <IdentityList title="Key Features" items={productIdentity.keyFeatures} />

      <div className="rounded-md border border-white/10 bg-black/25 p-3">
        <p className="mb-2 text-xs font-bold text-zinc-200">Camera</p>
        <div className="grid gap-1.5">
          <IdentityMini label="Angle" value={productIdentity.camera.angle} />
          <IdentityMini label="View" value={productIdentity.camera.view} />
          <IdentityMini label="Lighting" value={productIdentity.camera.lighting} />
        </div>
      </div>

      <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3">
        <p className="mb-2 text-xs font-bold text-emerald-100">Design Lock</p>
        <div className="grid gap-1.5">
          {[
            "Shape Locked",
            "Dimension Locked",
            "Structure Locked",
            "Camera Locked"
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-emerald-100">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
        <p className="mb-2 text-xs font-bold text-amber-100">Editable</p>
        <div className="grid gap-1.5">
          {productIdentity.editableAreas.map((item) => (
            <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-amber-100">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {formatEditableArea(item)}
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

function IdentityMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="font-semibold text-zinc-500">{label}</span>
      <span className="text-right font-semibold text-zinc-300">{value}</span>
    </div>
  );
}

function IdentityList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <p className="mb-2 text-xs font-bold text-zinc-200">{title}</p>
      <div className="grid gap-1.5">
        {Array.from(new Set(items)).map((item) => (
          <div key={item} className="flex items-start gap-2 text-[11px] font-semibold leading-5 text-zinc-300">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatEditableArea(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
