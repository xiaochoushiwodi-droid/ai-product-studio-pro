import { NextResponse } from "next/server";
import { buildProductDesignResponse } from "@/lib/product-design";
import { simulateLatency } from "@/lib/mock-ai";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import type { DesignLock, ProductIdentity, ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prompt?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
    targetRegionId?: ProductMaskRegionId;
  };

  const prompt =
    body.prompt?.trim() ||
    "把底座改成6种石材方案：Calacatta Viola、Calacatta Gold、Indian Green、Nero Marquina、Travertine、White Onyx。";
  const validation = validateReferenceGenerationRequest({
    action: "AI产品设计生成",
    prompt,
    productIdentity: body.productIdentity,
    designLock: body.designLock,
    targetRegionId: body.targetRegionId ?? "base"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

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
