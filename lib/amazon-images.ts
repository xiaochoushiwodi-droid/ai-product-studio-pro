import { tableLampDimensions, tableLampParts } from "@/lib/table-lamp-spec";
import { buildReferenceGenerationPolicy } from "@/lib/image-reference-workflow";
import type { DesignLock, ProductIdentity, ProductMaskRegion, ReferenceGenerationPrompt } from "@/types/product";

export type AmazonListingImage = {
  id: string;
  index: number;
  title: string;
  imageType: string;
  imageUrl: string;
  layoutPreviewUrl?: string;
  referenceImageUrl?: string;
  productIdentityId?: string;
  designLockApplied?: boolean;
  original_reference?: ProductIdentity["imageReference"];
  product_identity?: ProductIdentity;
  design_lock?: DesignLock;
  targetRegion?: string;
  generatedPrompt?: string;
  resolution: "1600 x 1600";
  amazonUse: "main" | "secondary";
  complianceNotes: string[];
};

export { tableLampDimensions } from "@/lib/table-lamp-spec";

export const amazonListingImages: AmazonListingImage[] = [
  {
    id: "amazon-main-white",
    index: 1,
    title: "Main Image",
    imageType: "Main Image",
    imageUrl: "/amazon-images/amazon-table-lamp-01-main-white.png",
    resolution: "1600 x 1600",
    amazonUse: "main",
    complianceNotes: ["pure white background", "no text or graphic overlay", "show product only"]
  },
  {
    id: "amazon-selling-points",
    index: 2,
    title: "Feature Image",
    imageType: "Feature Image",
    imageUrl: "/amazon-images/amazon-table-lamp-02-selling-points.png",
    resolution: "1600 x 1600",
    amazonUse: "secondary",
    complianceNotes: ["short feature copy allowed", "no unverifiable claims", "clear product benefits"]
  },
  {
    id: "amazon-dimensions",
    index: 3,
    title: "Dimension Image",
    imageType: "Dimension Image",
    imageUrl: "/amazon-images/amazon-table-lamp-03-dimensions.png",
    resolution: "1600 x 1600",
    amazonUse: "secondary",
    complianceNotes: ["show cm and inch", "height 23 cm", "shade 17 cm", "base 8 cm", "readable measurement labels"]
  },
  {
    id: "amazon-materials",
    index: 4,
    title: "Material Image",
    imageType: "Material Image",
    imageUrl: "/amazon-images/amazon-table-lamp-04-materials.png",
    resolution: "1600 x 1600",
    amazonUse: "secondary",
    complianceNotes: ["material-focused secondary image", "no unsupported certification", "consistent with Product Identity"]
  },
  {
    id: "amazon-bedroom",
    index: 5,
    title: "Bedroom Scene",
    imageType: "Bedroom Scene",
    imageUrl: "/amazon-images/amazon-table-lamp-05-bedroom-scene.png",
    resolution: "1600 x 1600",
    amazonUse: "secondary",
    complianceNotes: ["bedroom lifestyle context", "product remains unchanged", "do not imply props are included"]
  },
  {
    id: "amazon-living-room",
    index: 6,
    title: "Living Room Scene",
    imageType: "Living Room Scene",
    imageUrl: "/amazon-images/amazon-table-lamp-06-living-room-scene.png",
    resolution: "1600 x 1600",
    amazonUse: "secondary",
    complianceNotes: ["living room context", "no competitor logo", "no unsupported performance claim"]
  },
  {
    id: "amazon-detail",
    index: 7,
    title: "Detail Image",
    imageType: "Detail Image",
    imageUrl: "/amazon-images/amazon-table-lamp-07-product-detail.png",
    resolution: "1600 x 1600",
    amazonUse: "secondary",
    complianceNotes: ["detail crop", "show real visible components", "no review or rating language"]
  },
  {
    id: "amazon-packaging",
    index: 8,
    title: "Package Image",
    imageType: "Package Image",
    imageUrl: "/amazon-images/amazon-table-lamp-08-packaging.png",
    resolution: "1600 x 1600",
    amazonUse: "secondary",
    complianceNotes: ["package concept allowed", "no fake certification marks", "barcode area is conceptual only"]
  },
  {
    id: "amazon-brand-story",
    index: 9,
    title: "Brand Story",
    imageType: "Brand Story",
    imageUrl: "/amazon-images/amazon-table-lamp-09-brand-story.png",
    resolution: "1600 x 1600",
    amazonUse: "secondary",
    complianceNotes: ["brand story secondary image", "no award or rating claim", "no unsupported guarantees"]
  }
];

export function buildAmazonListingImageResponse(
  productName: string,
  context: {
    productIdentity: ProductIdentity;
    designLock: DesignLock;
    targetRegion?: ProductMaskRegion | null;
    referencePrompt: ReferenceGenerationPrompt;
  }
) {
  const policy = buildReferenceGenerationPolicy(context.productIdentity, context.designLock);
  const prompt = "Generate Amazon 9-image set from the uploaded product reference.";

  return {
    productName,
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
    marketplace: "Amazon US",
    resolution: "1600 x 1600",
    dimensions: tableLampDimensions,
    components: tableLampParts,
    count: amazonListingImages.length,
    ruleSummary: [
      "Main Image uses pure white background with no text, badges, border, or props.",
      "Secondary images may use selling points, dimensions, materials, scene, package, and brand story content.",
      "Avoid fake certifications, ratings, price claims, competitor logos, and unsupported safety claims.",
      "All images must use the original uploaded product as reference."
    ],
    images: amazonListingImages.map((image) => ({
      ...image,
      imageUrl: context.productIdentity.imageReference.imageUrl,
      layoutPreviewUrl: image.imageUrl,
      referenceImageUrl: context.productIdentity.imageReference.imageUrl,
      original_reference: context.productIdentity.imageReference,
      product_identity: context.productIdentity,
      design_lock: context.designLock,
      productIdentityId: context.productIdentity.id,
      designLockApplied: true,
      targetRegion: context.targetRegion?.label ?? "Scene",
      generatedPrompt: context.referencePrompt.systemPrompt,
      complianceNotes: [
        ...image.complianceNotes,
        "use uploaded product as reference",
        "lock original silhouette, proportions, component positions, and camera angle",
        "never recreate or replace with a random product"
      ]
    }))
  };
}
