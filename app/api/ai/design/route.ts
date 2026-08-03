import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { buildDesignConcepts, simulateLatency } from "@/lib/mock-ai";
import { withCreditGuard } from "@/lib/credits";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import type { Marketplace, ProductAnalysis } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    analysis?: ProductAnalysis;
    marketplace?: Marketplace;
  };
  const prompt = body.prompt?.trim() || "Generate AI product design concepts from the uploaded product reference.";
  const resolved = resolveReferenceGenerationPayload({
    ...body,
    original_reference: body.original_reference ?? body.analysis?.productIdentity.imageReference,
    product_identity: body.product_identity ?? body.analysis?.productIdentity,
    design_lock: body.design_lock ?? body.analysis?.designLock
  });
  const validation = validateReferenceGenerationRequest({
    action: "AI design concept generation",
    prompt,
    originalReference: resolved.originalReference,
    productIdentity: resolved.productIdentity,
    designLock: resolved.designLock,
    targetRegionId: "scene"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  return withCreditGuard(
    request,
    {
      feature: "ai_design",
      model: "concept-design-engine",
      metadata: { productType: validation.productIdentity.productType }
    },
    async () => {
      await simulateLatency(850);

      const analysis = body.analysis ?? createAnalysisFromReferencePayload({
        productName: body.productName?.trim() || validation.productIdentity.productType,
        category: body.category ?? "Lighting",
        marketplace: body.marketplace ?? "US",
        productIdentity: validation.productIdentity,
        designLock: validation.designLock
      });

      return NextResponse.json({
        concepts: buildDesignConcepts(analysis),
        original_reference: validation.originalReference,
        product_identity: validation.productIdentity,
        design_lock: validation.designLock
      });
    }
  );
}

function createAnalysisFromReferencePayload(input: {
  productName: string;
  category: string;
  marketplace: Marketplace;
  productIdentity: ProductAnalysis["productIdentity"];
  designLock: ProductAnalysis["designLock"];
}): ProductAnalysis {
  return {
    productName: input.productName,
    category: input.category,
    marketplace: input.marketplace,
    imageReferenceMode: "enabled",
    productIdentity: input.productIdentity,
    designLock: input.designLock,
    aiDebug: {
      originalImage: "PASS",
      productIdentity: "PASS",
      designLock: "PASS",
      productMask: input.productIdentity.maskRegions.length >= 5 ? "PASS" : "FAIL",
      visionSource: input.productIdentity.visionModel.provider ?? "mock-fallback",
      visionModel: input.productIdentity.visionModel.name,
      message: "Generated from provided Product Identity JSON."
    },
    opportunityScore: 86,
    targetBuyer: "US Amazon shoppers looking for premium home decor lighting.",
    positioning: "Premium product design direction with strict original-reference preservation.",
    painPoints: ["Buyers need consistent product images and clear material proof."],
    competitorSignals: ["Consistent product identity across image modules improves buyer trust."],
    designLevers: ["material", "color", "surface_finish", "scene_background"],
    complianceNotes: ["Do not make claims without documentation."],
    estimatedPriceBand: "$39.99 - $129.99"
  };
}
