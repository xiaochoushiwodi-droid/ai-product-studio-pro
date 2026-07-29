import { NextResponse } from "next/server";
import { buildMaterialRecommendation, simulateLatency } from "@/lib/mock-ai";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import type { DesignLock, ProductIdentity, ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    conceptId?: string;
    materialFamily?: string;
    finish?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
    targetRegionId?: ProductMaskRegionId;
  };

  if (!body.conceptId) {
    return NextResponse.json({ error: "Concept is required" }, { status: 400 });
  }

  const prompt = `Apply ${body.materialFamily || "material"} with ${body.finish || "surface finish"} to the selected product region.`;
  const validation = validateReferenceGenerationRequest({
    action: "材质替换",
    prompt,
    productIdentity: body.productIdentity,
    designLock: body.designLock,
    targetRegionId: body.targetRegionId ?? "base"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  await simulateLatency(650);

  return NextResponse.json({
    recommendation: buildMaterialRecommendation({
      conceptId: body.conceptId,
      materialFamily: body.materialFamily || "Recycled Polymer",
      finish: body.finish || "Soft matte"
    })
  });
}
