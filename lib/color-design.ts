import { tableLampParts } from "@/lib/table-lamp-spec";
import { buildReferenceGenerationPolicy } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity, ProductMaskRegion, ReferenceGenerationPrompt } from "@/types/product";

export type HighResColorVariant = {
  id: string;
  title: string;
  imageUrl: string;
  colorPreviewUrl?: string;
  referenceImageUrl?: string;
  productIdentityId?: string;
  designLockApplied?: boolean;
  original_reference?: ProductIdentity["imageReference"];
  product_identity?: ProductIdentity;
  design_lock?: DesignLock;
  targetRegion?: string;
  generatedPrompt?: string;
  allowedEdits?: string[];
  lockSummary?: string;
  resolution: string;
  shadeColor: string;
  changedPart: string;
  transparency: string;
  notes: string;
};

const protectedTableLampParts = tableLampParts.filter((part) => part !== "Glass Shade");

export const tableLampShadeColorVariants: HighResColorVariant[] = [
  {
    id: "shade-amber",
    title: "Color 01 / Amber",
    imageUrl: "/ai-designs/table-lamp-shade-amber.png",
    resolution: "2048 x 2048",
    shadeColor: "Amber",
    changedPart: "Glass Shade",
    transparency: "warm transparent glass",
    notes: "Warm amber transparent shade for a softer home atmosphere."
  },
  {
    id: "shade-smoke-grey",
    title: "Color 02 / Smoke Grey",
    imageUrl: "/ai-designs/table-lamp-shade-smoke-grey.png",
    resolution: "2048 x 2048",
    shadeColor: "Smoke Grey",
    changedPart: "Glass Shade",
    transparency: "smoked semi-transparent glass",
    notes: "Smoke grey shade for a sharper black-tech and industrial look."
  },
  {
    id: "shade-olive-green",
    title: "Color 03 / Olive Green",
    imageUrl: "/ai-designs/table-lamp-shade-olive-green.png",
    resolution: "2048 x 2048",
    shadeColor: "Olive Green",
    changedPart: "Glass Shade",
    transparency: "soft green transparent glass",
    notes: "Olive green shade for natural, vintage, and premium decor positioning."
  },
  {
    id: "shade-clear",
    title: "Color 04 / Clear",
    imageUrl: "/ai-designs/table-lamp-shade-clear.png",
    resolution: "2048 x 2048",
    shadeColor: "Clear",
    changedPart: "Glass Shade",
    transparency: "clear transparent glass",
    notes: "Clear glass shade for the cleanest main-image product expression."
  }
];

export function buildColorEditResponse(
  prompt: string,
  context: {
    productIdentity: ProductIdentity;
    designLock: DesignLock;
    targetRegion?: ProductMaskRegion | null;
    referencePrompt: ReferenceGenerationPrompt;
  }
) {
  const policy = buildReferenceGenerationPolicy(context.productIdentity, context.designLock);

  return {
    prompt,
    imageReferenceMode: "enabled",
    referenceImageUrl: context.productIdentity.imageReference.imageUrl,
    original_reference: context.productIdentity.imageReference,
    product_identity: context.productIdentity,
    design_lock: context.designLock,
    productIdentity: context.productIdentity,
    designLock: context.designLock,
    targetRegion: context.targetRegion,
    referencePrompt: context.referencePrompt,
    generationPolicy: policy,
    requestContract: {
      original_reference: context.productIdentity.imageReference,
      product_identity: context.productIdentity.rawVisionJson,
      design_lock: policy.design_lock,
      prompt
    },
    constraints: [
      "Image Reference mode: uploaded image is the only product reference.",
      "Design Lock: silhouette, dimensions, structure, component positions, and camera angle are locked.",
      "Only edit shade color, transparency, and surface finish.",
      "Preserve glass thickness and reflections.",
      "Never recreate or replace the product."
    ],
    changedPart: context.targetRegion?.partName ?? "Glass Shade",
    protectedParts: protectedTableLampParts,
    targetColors: ["Amber", "Smoke Grey", "Olive Green", "Clear"],
    variants: tableLampShadeColorVariants.map((variant) => ({
      ...variant,
      imageUrl: context.productIdentity.imageReference.imageUrl,
      colorPreviewUrl: variant.imageUrl,
      referenceImageUrl: context.productIdentity.imageReference.imageUrl,
      original_reference: context.productIdentity.imageReference,
      product_identity: context.productIdentity,
      design_lock: context.designLock,
      productIdentityId: context.productIdentity.id,
      designLockApplied: true,
      targetRegion: context.targetRegion?.label ?? "Shade",
      generatedPrompt: context.referencePrompt.systemPrompt,
      allowedEdits: ["color", "surface_finish"],
      lockSummary: "Silhouette, proportions, component positions, and camera angle follow the uploaded product. Only shade color changes."
    }))
  };
}
