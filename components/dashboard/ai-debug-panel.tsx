import { CheckCircle2, CircleAlert, Cpu } from "lucide-react";
import { hasStrictDesignLock, hasValidImageReference, hasValidProductIdentity } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductAnalysis, ProductIdentity, UploadedProduct } from "@/types/product";

export function AIDebugPanel({
  product,
  productIdentity,
  designLock,
  aiDebug
}: {
  product: UploadedProduct | null;
  productIdentity: ProductIdentity | null;
  designLock: DesignLock | null;
  aiDebug: ProductAnalysis["aiDebug"] | null;
}) {
  const checks = [
    {
      label: "Original Image",
      pass: aiDebug ? aiDebug.originalImage === "PASS" : hasValidImageReference(product?.imageReference ?? productIdentity?.imageReference)
    },
    {
      label: "Product Identity",
      pass: aiDebug ? aiDebug.productIdentity === "PASS" : hasValidProductIdentity(productIdentity)
    },
    {
      label: "Design Lock",
      pass: aiDebug ? aiDebug.designLock === "PASS" : hasStrictDesignLock(designLock)
    }
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-white/10 bg-black/25 p-3">
        <div className="mb-3 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-cyan-100" aria-hidden="true" />
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-100">AI Debug Panel</p>
        </div>
        <div className="grid gap-2">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
              <span className="text-xs font-semibold text-zinc-300">{check.label}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-black ${check.pass ? "text-emerald-200" : "text-amber-200"}`}>
                {check.pass ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
                {check.pass ? "PASS" : "WAIT"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {aiDebug ? (
        <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-cyan-100">Vision Source</p>
            <span className="rounded bg-black/35 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
              {aiDebug.visionSource}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-zinc-300">{aiDebug.visionModel}</p>
          {aiDebug.message ? <p className="mt-1 text-[11px] leading-5 text-zinc-500">{aiDebug.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
