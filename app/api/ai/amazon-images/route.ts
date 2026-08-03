import { NextResponse } from "next/server";
import { buildAmazonListingImageResponse } from "@/lib/amazon-images";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { withCreditGuard } from "@/lib/credits";
import { simulateLatency } from "@/lib/mock-ai";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import type { ProductMaskRegionId } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    targetRegionId?: ProductMaskRegionId;
  };
  const prompt = body.prompt?.trim() || "Generate Amazon 9-image set. Use original product reference. Only change background, scene, and listing information overlays.";
  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "Amazon image generation",
    prompt,
    originalReference: resolved.originalReference,
    productIdentity: resolved.productIdentity,
    designLock: resolved.designLock,
    targetRegionId: body.targetRegionId ?? "scene"
  });

  if (!validation.ok) {
    return NextResponse.json(validation.error, { status: validation.status });
  }

  return withCreditGuard(
    request,
    {
      feature: "amazon_images",
      model: "amazon-image-engine",
      metadata: {
        productType: validation.productIdentity.productType,
        imageCount: 9
      }
    },
    async () => {
      await simulateLatency(850);

      return NextResponse.json(
        buildAmazonListingImageResponse(body.productName?.trim() || validation.productIdentity.productType, {
          productIdentity: validation.productIdentity,
          designLock: validation.designLock,
          targetRegion: validation.targetRegion,
          referencePrompt: validation.referencePrompt
        })
      );
    }
  );
}
