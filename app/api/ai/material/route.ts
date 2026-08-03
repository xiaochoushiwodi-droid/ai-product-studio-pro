import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { buildMaterialRecommendation, simulateLatency } from "@/lib/mock-ai";
import { withCreditGuard } from "@/lib/credits";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import type { ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    conceptId?: string;
    materialFamily?: string;
    finish?: string;
    targetRegionId?: ProductMaskRegionId;
  };

  if (!body.conceptId) {
    return NextResponse.json({ error: "Concept is required" }, { status: 400 });
  }

  const conceptId = body.conceptId;
  const prompt = body.prompt?.trim() || `Apply ${body.materialFamily || "material"} with ${body.finish || "surface finish"} to the selected product region.`;
  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "material replacement",
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
      feature: "material_edit",
      model: "material-edit-engine",
      metadata: {
        productType: validation.productIdentity.productType,
        materialFamily: body.materialFamily,
        targetRegionId: body.targetRegionId ?? "base"
      }
    },
    async () => {
      await simulateLatency(650);

      return NextResponse.json({
        original_reference: validation.originalReference,
        product_identity: validation.productIdentity,
        design_lock: validation.designLock,
        recommendation: buildMaterialRecommendation({
          conceptId,
          materialFamily: body.materialFamily || "Indian Green",
          finish: body.finish || "Polished stone"
        })
      });
    }
  );
}
