import { NextResponse } from "next/server";
import { buildMaterialRecommendation, simulateLatency } from "@/lib/mock-ai";
import { createMissingReferenceError, hasStrictDesignLock, hasValidProductIdentity } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    conceptId?: string;
    materialFamily?: string;
    finish?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
  };

  if (!body.conceptId) {
    return NextResponse.json({ error: "Concept is required" }, { status: 400 });
  }

  if (!hasValidProductIdentity(body.productIdentity) || !hasStrictDesignLock(body.designLock)) {
    return NextResponse.json(createMissingReferenceError("材质替换"), { status: 400 });
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
