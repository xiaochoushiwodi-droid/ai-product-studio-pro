import { tableLampParts } from "@/lib/table-lamp-spec";
import { buildReferenceGenerationPolicy } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity, ProductMaskRegion, ReferenceGenerationPrompt } from "@/types/product";

export type HighResDesignVariant = {
  id: string;
  title: string;
  imageUrl: string;
  materialPreviewUrl?: string;
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
  baseMaterial: string;
  notes: string;
};

const protectedTableLampParts = tableLampParts.filter((part) => part !== "Marble Base");

export const tableLampDesignVariants: HighResDesignVariant[] = [
  {
    id: "calacatta-viola",
    title: "Version 01 / Calacatta Viola",
    imageUrl: "/ai-designs/table-lamp-calacatta-viola.png",
    resolution: "2048 x 2048",
    baseMaterial: "Calacatta Viola",
    notes: "Purple veined white marble base for a high-end decorative look."
  },
  {
    id: "calacatta-gold",
    title: "Version 02 / Calacatta Gold",
    imageUrl: "/ai-designs/table-lamp-calacatta-gold.png",
    resolution: "2048 x 2048",
    baseMaterial: "Calacatta Gold",
    notes: "Warm gold veining on white marble for a soft luxury home style."
  },
  {
    id: "indian-green",
    title: "Version 03 / Indian Green",
    imageUrl: "/ai-designs/table-lamp-indian-green.png",
    resolution: "2048 x 2048",
    baseMaterial: "Indian Green",
    notes: "Deep green stone base with natural veining and a stable premium feeling."
  },
  {
    id: "nero-marquina",
    title: "Version 04 / Nero Marquina",
    imageUrl: "/ai-designs/table-lamp-nero-marquina.png",
    resolution: "2048 x 2048",
    baseMaterial: "Nero Marquina",
    notes: "Black marble base with white vein contrast for modern luxury."
  },
  {
    id: "travertine",
    title: "Version 05 / Travertine",
    imageUrl: "/ai-designs/table-lamp-travertine.png",
    resolution: "2048 x 2048",
    baseMaterial: "Travertine",
    notes: "Warm beige travertine grain for natural bedroom and living-room scenes."
  },
  {
    id: "white-onyx",
    title: "Version 06 / White Onyx",
    imageUrl: "/ai-designs/table-lamp-white-onyx.png",
    resolution: "2048 x 2048",
    baseMaterial: "White Onyx",
    notes: "Milky white semi-translucent stone expression for a soft luxury accent."
  }
];

export function buildProductDesignResponse(
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
      "Preserve product proportion.",
      "Preserve product structure.",
      "Only modify material, color, and surface finish in the selected region.",
      "Output high-resolution product images.",
      "Never recreate or replace the product."
    ],
    changedPart: context.targetRegion?.partName ?? "Marble Base",
    protectedParts: protectedTableLampParts,
    targetMaterial: "stone material family",
    variants: tableLampDesignVariants.map((variant) => ({
      ...variant,
      imageUrl: context.productIdentity.imageReference.imageUrl,
      materialPreviewUrl: variant.imageUrl,
      referenceImageUrl: context.productIdentity.imageReference.imageUrl,
      original_reference: context.productIdentity.imageReference,
      product_identity: context.productIdentity,
      design_lock: context.designLock,
      productIdentityId: context.productIdentity.id,
      designLockApplied: true,
      targetRegion: context.targetRegion?.label ?? "Base",
      generatedPrompt: context.referencePrompt.systemPrompt,
      allowedEdits: ["material", "color", "surface_finish"],
      lockSummary: "Silhouette, proportions, component positions, and camera angle follow the uploaded product. Only base material expression changes."
    }))
  };
}
