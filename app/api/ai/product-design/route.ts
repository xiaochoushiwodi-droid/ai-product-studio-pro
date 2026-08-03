import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { buildProductDesignResponse } from "@/lib/product-design";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import { simulateLatency } from "@/lib/mock-ai";
import { withCreditGuard } from "@/lib/credits";
import type { ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    targetRegionId?: ProductMaskRegionId;
  };
  const prompt =
    body.prompt?.trim() ||
    "Change the base material to Indian Green Marble. Preserve the original product proportions, structure, component positions, and camera angle. Generate 6 material design versions.";
  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "AI product design generation",
    prompt,
    originalReference: resolved.originalReference,
    productIdentity: resolved.productIdentity,
    designLock: resolved.designLock,
    targetRegionId: body.targetRegionId ?? "base"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  return withCreditGuard(
    request,
    {
      feature: "ai_design",
      model: "product-design-engine",
      metadata: {
        productType: validation.productIdentity.productType,
        targetRegionId: body.targetRegionId ?? "base"
      }
    },
    async () => {
      await simulateLatency(900);

      return NextResponse.json(
        buildProductDesignResponse(prompt, {
          productIdentity: validation.productIdentity,
          designLock: validation.designLock,
          targetRegion: validation.targetRegion,
          referencePrompt: validation.referencePrompt
        })
      );
    }
  );
}
