import { NextResponse } from "next/server";
import { buildAnalyzeProductResponse } from "@/lib/analyze-product-response";
import {
  createImageReferenceFromOriginalImage,
  createMissingReferenceError,
  hasValidImageReference
} from "@/lib/image-reference-workflow";
import { buildProductAnalysis, simulateLatency } from "@/lib/mock-ai";
import { analyzeProductImageWithVision } from "@/lib/vision-analysis";
import { createAIProviderErrorResponse } from "@/lib/ai/runtime";
import { normalizeVisionProviderName } from "@/lib/ai/vision-provider";
import { withCreditGuard } from "@/lib/credits";
import type { ImageReference, Marketplace, VisionProviderName } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
    category?: string;
    marketplace?: Marketplace;
    original_image?: string;
    original_reference?: ImageReference;
    vision_provider?: VisionProviderName;
  };

  const imageReference = body.original_reference ?? (body.original_image ? createImageReferenceFromOriginalImage({
    originalImage: body.original_image,
    fileName: "original_image"
  }) : null);

  if (!hasValidImageReference(imageReference)) {
    return NextResponse.json(createMissingReferenceError("AI vision analysis"), { status: 400 });
  }

  const productName = body.productName?.trim() || "Uploaded product";
  const category = body.category || "Lighting";
  return withCreditGuard(
    request,
    {
      feature: "ai_product_analysis",
      model: normalizeVisionProviderName(body.vision_provider) ?? process.env.OPENAI_VISION_MODEL ?? "vision-provider",
      metadata: { productName, category }
    },
    async () => {
      let vision;
      try {
        vision = await analyzeProductImageWithVision({
          productName,
          category,
          imageReference,
          providerName: normalizeVisionProviderName(body.vision_provider) ?? undefined
        });
      } catch (error) {
        const response = createAIProviderErrorResponse(error);
        return NextResponse.json(response.payload, { status: response.status });
      }

      if (vision.source === "mock-fallback") {
        await simulateLatency();
      }

      const analysis = buildProductAnalysis({
        productName,
        category,
        marketplace: body.marketplace || "US",
        imageReference,
        visionIdentity: vision.identityJson,
        visionModelName: vision.modelName,
        visionSource: vision.source,
        visionMessage: vision.message
      });

      return NextResponse.json(buildAnalyzeProductResponse(analysis));
    }
  );
}
