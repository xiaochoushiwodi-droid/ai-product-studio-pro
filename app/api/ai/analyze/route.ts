import { NextResponse } from "next/server";
import { buildProductAnalysis, simulateLatency } from "@/lib/mock-ai";
import { createMissingReferenceError, hasValidImageReference } from "@/lib/image-reference-workflow";
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

  await simulateLatency();

  const analysis = buildProductAnalysis({
    productName: body.productName?.trim() || "Untitled product",
    category: body.category || "Kitchen & Dining",
    marketplace: body.marketplace || "US",
    imageReference: body.imageReference
  });

  return NextResponse.json({ analysis });
}
