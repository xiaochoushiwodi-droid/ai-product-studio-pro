import { NextResponse } from "next/server";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { createAIProviderErrorResponse } from "@/lib/ai/runtime";
import { editProductImageWithProvider, normalizeImageProviderName } from "@/lib/ai/image-provider";
import { normalizeVisionProviderName } from "@/lib/ai/vision-provider";
import { withCreditGuard } from "@/lib/credits";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";
import type { ImageProviderName, ProductMaskRegionId, VisionProviderName } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload & {
    targetRegionId?: ProductMaskRegionId;
    variantCount?: number;
    image_provider?: ImageProviderName;
    vision_provider?: VisionProviderName;
    amazonMode?: boolean;
  };
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "PROMPT_REQUIRED", message: "Image-to-image product edit requires a prompt." }, { status: 400 });
  }

  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "AI image-to-image product edit",
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
      feature: "product_image_edit",
      model: normalizeImageProviderName(body.image_provider) ?? process.env.OPENAI_IMAGE_MODEL ?? "image-provider",
      metadata: {
        productType: validation.productIdentity.productType,
        targetRegionId: body.targetRegionId ?? "shade"
      }
    },
    async () => {
      let result;
      try {
        result = await editProductImageWithProvider({
          originalReference: validation.originalReference,
          productIdentity: validation.productIdentity,
          designLock: validation.designLock,
          prompt,
          targetRegion: validation.targetRegion,
          variantCount: body.variantCount,
          imageProviderName: normalizeImageProviderName(body.image_provider) ?? undefined,
          visionProviderName: normalizeVisionProviderName(body.vision_provider) ?? undefined,
          resolution: body.amazonMode ? "1600 x 1600" : "1024 x 1024",
          amazonMode: body.amazonMode
        });
      } catch (error) {
        const response = createAIProviderErrorResponse(error);
        return NextResponse.json(response.payload, { status: response.status });
      }

      if (result.variants.length === 0 && result.rejectedReports.length > 0) {
        return NextResponse.json({
          error: "PRODUCT_STRUCTURE_CHANGED",
          message: "Generated image changed locked product structure and was hidden.",
          consistency: result.rejectedReports
        }, { status: 409 });
      }

      return NextResponse.json({
        ...result,
        original_reference: validation.originalReference,
        product_identity: validation.productIdentity,
        design_lock: validation.designLock,
        requestContract: {
          original_reference: validation.originalReference,
          product_identity: validation.productIdentity.rawVisionJson,
          design_lock: validation.designLock,
          prompt
        }
      });
    }
  );
}
