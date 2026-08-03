import { buildProductIdentityFromVision, createImageReferenceFromOriginalImage } from "@/lib/image-reference-workflow";
import type { DesignLock, ImageReference, ProductIdentity, VisionProductIdentityJson } from "@/types/product";

export type ReferenceGenerationPayload = {
  prompt?: string;
  productName?: string;
  category?: string;
  original_image?: string;
  original_reference?: ImageReference | string;
  originalReference?: ImageReference | string;
  product_identity?: ProductIdentity | VisionProductIdentityJson;
  productIdentity?: ProductIdentity;
  design_lock?: DesignLock;
  designLock?: DesignLock;
};

export function resolveReferenceGenerationPayload(body: ReferenceGenerationPayload) {
  const originalReference = resolveImageReference(body.original_reference ?? body.originalReference ?? body.original_image);
  const legacyIdentity = body.productIdentity;
  const snakeIdentity = body.product_identity;
  const productIdentity = resolveProductIdentity({
    candidate: snakeIdentity ?? legacyIdentity,
    originalReference,
    productName: body.productName ?? legacyIdentity?.productType ?? "Uploaded product",
    category: body.category ?? "Lighting"
  });

  return {
    originalReference: originalReference ?? productIdentity?.imageReference ?? null,
    productIdentity,
    designLock: body.design_lock ?? body.designLock ?? null
  };
}

export function resolveImageReference(value: ImageReference | string | undefined | null): ImageReference | null {
  if (!value) return null;

  if (typeof value === "string") {
    return createImageReferenceFromOriginalImage({ originalImage: value });
  }

  return value;
}

function resolveProductIdentity(input: {
  candidate?: ProductIdentity | VisionProductIdentityJson;
  originalReference: ImageReference | null;
  productName: string;
  category: string;
}) {
  if (!input.candidate) return null;

  if (isProductIdentity(input.candidate)) {
    return input.candidate;
  }

  if (isVisionProductIdentityJson(input.candidate) && input.originalReference) {
    return buildProductIdentityFromVision({
      productName: input.productName,
      category: input.category,
      imageReference: input.originalReference,
      visionIdentity: input.candidate,
      visionModelName: "External Product Identity JSON",
      visionProvider: "mock-fallback"
    });
  }

  return null;
}

function isProductIdentity(value: ProductIdentity | VisionProductIdentityJson): value is ProductIdentity {
  return Boolean(
    "id" in value &&
      "sourceProductId" in value &&
      "partStructure" in value &&
      "imageReference" in value
  );
}

function isVisionProductIdentityJson(value: ProductIdentity | VisionProductIdentityJson): value is VisionProductIdentityJson {
  return Boolean(
    "productType" in value &&
      "parts" in value &&
      "materials" in value &&
      "dimensions" in value &&
      "editableAreas" in value &&
      "lockedAreas" in value &&
      "camera" in value
  );
}
