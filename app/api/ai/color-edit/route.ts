import { NextResponse } from "next/server";
import { buildColorEditResponse } from "@/lib/color-design";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { withCreditGuard } from "@/lib/credits";
import { simulateLatency } from "@/lib/mock-ai";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import type { ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    targetRegionId?: ProductMaskRegionId;
  };
  const prompt =
    body.prompt?.trim() ||
    "Generate Amber, Smoke Grey, Olive Green, and Clear glass shade color options. Preserve structure, proportions, metal ring, LED module, battery, and marble base.";
  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "color edit generation",
    prompt,
    originalReference: resolved.originalReference,
    productIdentity: resolved.productIdentity,
    designLock: resolved.designLock,
    targetRegionId: body.targetRegionId ?? "shade"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  return withCreditGuard(
    request,
    {
      feature: "color_edit",
      model: "color-edit-engine",
      metadata: {
        productType: validation.productIdentity.productType,
        targetRegionId: body.targetRegionId ?? "shade"
      }
    },
    async () => {
      await simulateLatency(700);

      return NextResponse.json(
        buildColorEditResponse(prompt, {
          productIdentity: validation.productIdentity,
          designLock: validation.designLock,
          targetRegion: validation.targetRegion,
          referencePrompt: validation.referencePrompt
        })
      );
    }
  );
}
