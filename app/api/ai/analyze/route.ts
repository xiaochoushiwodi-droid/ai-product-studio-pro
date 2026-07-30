import { NextResponse } from "next/server";
import { buildProductAnalysis, simulateLatency } from "@/lib/mock-ai";
import { createMissingReferenceError, hasValidImageReference } from "@/lib/image-reference-workflow";
import { analyzeProductImageWithVision } from "@/lib/vision-analysis";
import type { ImageReference, Marketplace } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
    category?: string;
    marketplace?: Marketplace;
    imageReference?: ImageReference;
  };

  if (!hasValidImageReference(body.imageReference)) {
    return NextResponse.json(createMissingReferenceError("AI视觉分析"), { status: 400 });
  }

  const productName = body.productName?.trim() || "Untitled product";
  const category = body.category || "Kitchen & Dining";
  const vision = await analyzeProductImageWithVision({
    productName,
    category,
    imageReference: body.imageReference
  });

  if (vision.source === "mock-fallback") {
    await simulateLatency();
  }

  const analysis = buildProductAnalysis({
    productName,
    category,
    marketplace: body.marketplace || "US",
    imageReference: body.imageReference,
    visionIdentity: vision.identityJson,
    visionModelName: vision.modelName,
    visionSource: vision.source,
    visionMessage: vision.message
  });

  return NextResponse.json({
    analysis,
    productIdentityJson: {
      productType: analysis.productIdentity.rawVisionJson.productType,
      parts: analysis.productIdentity.rawVisionJson.parts,
      materials: analysis.productIdentity.rawVisionJson.materials,
      dimensions: analysis.productIdentity.rawVisionJson.dimensions,
      editableAreas: analysis.productIdentity.rawVisionJson.editableAreas,
      designLock: analysis.productIdentity.rawVisionJson.designLock
    }
  });
}
