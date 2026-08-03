import { tableLampDimensions, tableLampParts, tableLampStructure } from "@/lib/table-lamp-spec";
import { buildReferenceGenerationPolicy } from "@/lib/image-reference-workflow";
import type { DesignLock, EngineeringDrawingView, EngineeringExplodedPart, ProductIdentity, ProductMaskRegion, ReferenceGenerationPrompt } from "@/types/product";

export const tableLampExplodedParts: EngineeringExplodedPart[] = [
  {
    order: 1,
    name: "Glass Shade",
    material: "Glass",
    role: "17 cm translucent diffuser and primary visible color surface.",
    editableScope: "color, transparency, rim highlight, surface finish"
  },
  {
    order: 2,
    name: "Metal Ring",
    material: "Metal",
    role: "Holds the shade, aligns the LED, and forms the visible connection line.",
    editableScope: "surface finish, thickness tolerance, edge radius"
  },
  {
    order: 3,
    name: "LED Module",
    material: "LED module",
    role: "Centered light module below the shade.",
    editableScope: "light color and diffusion only"
  },
  {
    order: 4,
    name: "Battery",
    material: "Battery cell",
    role: "Hidden power module inside the base structure.",
    editableScope: "service access and packaging note only"
  },
  {
    order: 5,
    name: "Marble Base",
    material: "Stone",
    role: "8 cm weighted base for stability and material expression.",
    editableScope: "stone family, gloss, edge radius, underside pad"
  }
];

export const engineeringDrawingViews: EngineeringDrawingView[] = [
  {
    id: "engineering-front-view",
    index: 1,
    title: "Front View",
    viewType: "front",
    imageUrl: "/engineering/table-lamp-front.svg",
    resolution: "1600 x 1200",
    scale: "1:2",
    drawingNotes: [
      `Overall height ${tableLampDimensions.heightCm} cm`,
      `Shade width ${tableLampDimensions.shadeCm} cm`,
      `Base width ${tableLampDimensions.baseCm} cm`,
      "Center axis locked"
    ]
  },
  {
    id: "engineering-side-view",
    index: 2,
    title: "Side View",
    viewType: "side",
    imageUrl: "/engineering/table-lamp-side.svg",
    resolution: "1600 x 1200",
    scale: "1:2",
    drawingNotes: [
      `Overall height ${tableLampDimensions.heightCm} cm`,
      "Glass shade side silhouette locked",
      "Hidden LED and battery stack",
      "Stable compact base envelope"
    ]
  },
  {
    id: "engineering-top-view",
    index: 3,
    title: "Top View",
    viewType: "top",
    imageUrl: "/engineering/table-lamp-top.svg",
    resolution: "1600 x 1200",
    scale: "1:2",
    drawingNotes: [
      `Shade diameter ${tableLampDimensions.shadeCm} cm`,
      `Base footprint ${tableLampDimensions.baseCm} cm`,
      "Metal ring and LED remain concentric",
      "Battery service area shown as dashed concept"
    ]
  },
  {
    id: "engineering-exploded-view",
    index: 4,
    title: "Exploded View",
    viewType: "exploded",
    imageUrl: "/engineering/table-lamp-exploded.svg",
    resolution: "1600 x 1200",
    scale: "assembly view",
    drawingNotes: [
      `Automatically decomposed into ${tableLampParts.length} parts`,
      tableLampStructure,
      "Assembly order from top to bottom",
      "Material edit target remains isolated"
    ]
  }
];

export function buildEngineeringDrawingResponse(
  productName: string,
  context: {
    productIdentity: ProductIdentity;
    designLock: DesignLock;
    targetRegion?: ProductMaskRegion | null;
    referencePrompt: ReferenceGenerationPrompt;
  }
) {
  const policy = buildReferenceGenerationPolicy(context.productIdentity, context.designLock);
  const prompt = "Generate front, side, top, and exploded engineering views from the uploaded product reference.";

  return {
    productName,
    mode: "engineering-dimensions",
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
    input: prompt,
    dimensions: tableLampDimensions,
    structure: tableLampStructure,
    components: tableLampParts,
    autoExplodedParts: tableLampExplodedParts,
    count: engineeringDrawingViews.length,
    views: engineeringDrawingViews.map((view) => ({
      ...view,
      original_reference: context.productIdentity.imageReference,
      product_identity: context.productIdentity,
      design_lock: context.designLock
    }))
  };
}
