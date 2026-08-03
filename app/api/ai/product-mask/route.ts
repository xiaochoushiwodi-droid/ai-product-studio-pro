import { NextResponse } from "next/server";
import { withCreditGuard } from "@/lib/credits";
import { createProductMaskEngineResult } from "@/lib/product-mask-engine";
import {
  createMissingReferenceError,
  hasValidImageReference,
  hasValidProductIdentity,
  isTableLampIdentity
} from "@/lib/image-reference-workflow";
import type { ImageReference, ProductIdentity } from "@/types/product";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    original_reference?: ImageReference;
    product_identity?: ProductIdentity;
  };

  if (!hasValidImageReference(body.original_reference) || !hasValidProductIdentity(body.product_identity)) {
    return NextResponse.json(createMissingReferenceError("Product Mask Engine"), { status: 400 });
  }

  const originalReference = body.original_reference;
  const productIdentity = body.product_identity;
  return withCreditGuard(
    request,
    {
      feature: "product_mask",
      model: "product-mask-engine",
      metadata: { productType: productIdentity.productType }
    },
    async () => {
      const maskEngine = createProductMaskEngineResult({
        productIdentityId: productIdentity.id,
        imageReference: originalReference,
        visionIdentity: productIdentity.rawVisionJson,
        isTableLamp: isTableLampIdentity(productIdentity)
      });

      return NextResponse.json({
        mask_engine: maskEngine,
        mask_regions: maskEngine.regions
      });
    }
  );
}
