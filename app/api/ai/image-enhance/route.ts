import { NextResponse } from "next/server";
import { withCreditGuard } from "@/lib/credits";
import { validateReferenceGenerationRequest } from "@/lib/design-lock-guard";
import { simulateLatency } from "@/lib/mock-ai";
import { resolveReferenceGenerationPayload, type ReferenceGenerationPayload } from "@/lib/reference-generation-payload";

export async function POST(request: Request) {
  const body = (await request.json()) as ReferenceGenerationPayload;
  const prompt =
    body.prompt?.trim() ||
    "Enhance the uploaded product image clarity. Preserve exact product shape, dimensions, structure, component positions, and camera angle.";
  const resolved = resolveReferenceGenerationPayload(body);
  const validation = validateReferenceGenerationRequest({
    action: "image enhancement",
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
      feature: "image_enhance",
      model: "image-enhance-engine",
      metadata: { productType: validation.productIdentity.productType }
    },
    async () => {
      await simulateLatency(450);

      return NextResponse.json({
        enhancedImage: {
          id: `enhance-${Date.now()}`,
          imageUrl: validation.originalReference.imageUrl,
          resolution: "1600 x 1600",
          prompt,
          original_reference: validation.originalReference,
          product_identity: validation.productIdentity,
          design_lock: validation.designLock,
          generatedAt: new Date().toISOString()
        }
      });
    }
  );
}
