import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { buildEngineeringDrawingResponse } from "@/lib/engineering-drawings";
import { withCreditGuard } from "@/lib/credits";
import { simulateLatency } from "@/lib/mock-ai";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import type { ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    targetRegionId?: ProductMaskRegionId;
  };
  const prompt = body.prompt?.trim() || "Generate front view, side view, top view, and exploded view from the uploaded product reference.";
  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "engineering drawing generation",
    prompt,
    originalReference: resolved.originalReference,
    productIdentity: resolved.productIdentity,
    designLock: resolved.designLock,
    targetRegionId: body.targetRegionId
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  return withCreditGuard(
    request,
    {
      feature: "engineering_drawing",
      model: "engineering-drawing-engine",
      metadata: {
        productType: validation.productIdentity.productType,
        includesExplodedView: true
      }
    },
    async () => {
      await simulateLatency(650);

      return NextResponse.json(
        buildEngineeringDrawingResponse(body.productName?.trim() || validation.productIdentity.productType, {
          productIdentity: validation.productIdentity,
          designLock: validation.designLock,
          targetRegion: validation.targetRegion,
          referencePrompt: validation.referencePrompt
        })
      );
    }
  );
}
