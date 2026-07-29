import { NextResponse } from "next/server";
import { buildAmazonListingImageResponse } from "@/lib/amazon-images";
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

  const prompt = "Generate Amazon 9-image set. Use original product reference. Only change background, scene, and listing information overlays.";
  const validation = validateReferenceGenerationRequest({
    action: "Amazon图片生成",
    prompt,
    productIdentity: body.productIdentity,
    designLock: body.designLock,
    targetRegionId: body.targetRegionId ?? "scene"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  await simulateLatency(850);

  return NextResponse.json(
    buildAmazonListingImageResponse(body.productName?.trim() || "台灯", {
      productIdentity: validation.productIdentity,
      designLock: validation.designLock,
      targetRegion: validation.targetRegion,
      referencePrompt: validation.referencePrompt
    })
  );
}
