import { NextResponse } from "next/server";
import { buildAmazonListingImageResponse } from "@/lib/amazon-images";
import { simulateLatency } from "@/lib/mock-ai";
import { createMissingReferenceError, hasStrictDesignLock, hasValidProductIdentity } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    productName?: string;
    productIdentity?: ProductIdentity;
    designLock?: DesignLock;
  };

  if (!hasValidProductIdentity(body.productIdentity) || !hasStrictDesignLock(body.designLock)) {
    return NextResponse.json(createMissingReferenceError("Amazon图片生成"), { status: 400 });
  }

  await simulateLatency(850);

  return NextResponse.json(
    buildAmazonListingImageResponse(body.productName?.trim() || "台灯", {
      productIdentity: body.productIdentity,
      designLock: body.designLock
    })
  );
}
