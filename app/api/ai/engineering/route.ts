import { NextResponse } from "next/server";
import { buildEngineeringDrawingResponse } from "@/lib/engineering-drawings";
import { simulateLatency } from "@/lib/mock-ai";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import type { DesignLock, ProductIdentity, ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
    targetRegionId?: ProductMaskRegionId;
  };

  const prompt = "Generate engineering dimension views and exploded view from the uploaded product reference.";
  const validation = validateReferenceGenerationRequest({
    action: "工程尺寸图生成",
    prompt,
    productIdentity: body.productIdentity,
    designLock: body.designLock,
    targetRegionId: body.targetRegionId
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  await simulateLatency(650);

  return NextResponse.json(
    buildEngineeringDrawingResponse(body.productName?.trim() || "台灯", {
      productIdentity: validation.productIdentity,
      designLock: validation.designLock,
      targetRegion: validation.targetRegion,
      referencePrompt: validation.referencePrompt
    })
  );
}
