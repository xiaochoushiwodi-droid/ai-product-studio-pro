import { tableLampDimensions } from "@/lib/table-lamp-spec";
import { buildProductMaskRegionsFromVision } from "@/lib/product-mask-engine";
import { makeId } from "@/lib/utils";
import type {
  AllowedProductEdit,
  DesignLock,
  ImageReference,
  ProductIdentity,
  ProductIdentityMaterial,
  ProductMaskRegion,
  UploadedProduct,
  VisionProductIdentityJson,
  VisionProviderName
} from "@/types/product";

export const allowedReferenceEdits = ["material", "color", "surface_finish", "scene_background"] as const;

export function createImageReference(product: UploadedProduct): ImageReference {
  return {
    mode: "image-reference",
    sourceProductId: product.id,
    fileName: product.fileName,
    imageUrl: product.imageUrl,
    uploadedAt: product.uploadedAt,
    referenceStrength: "strict"
  };
}

export function createImageReferenceFromOriginalImage(input: {
  originalImage: string;
  sourceProductId?: string;
  fileName?: string;
}): ImageReference {
  return {
    mode: "image-reference",
    sourceProductId: input.sourceProductId || makeId("uploaded-original"),
    fileName: input.fileName || "original_image",
    imageUrl: input.originalImage,
    uploadedAt: new Date().toISOString(),
    referenceStrength: "strict"
  };
}

export function hasValidImageReference(imageReference: ImageReference | undefined | null): imageReference is ImageReference {
  return Boolean(
    imageReference &&
      imageReference.mode === "image-reference" &&
      imageReference.referenceStrength === "strict" &&
      imageReference.imageUrl &&
      imageReference.sourceProductId
  );
}

export function hasValidProductIdentity(productIdentity: ProductIdentity | undefined | null): productIdentity is ProductIdentity {
  return Boolean(
    productIdentity &&
      productIdentity.id &&
      productIdentity.sourceProductId &&
      productIdentity.productType &&
      Array.isArray(productIdentity.partStructure) &&
      productIdentity.partStructure.length > 0 &&
      Array.isArray(productIdentity.materials) &&
      productIdentity.materials.length > 0 &&
      Array.isArray(productIdentity.editableAreas) &&
      productIdentity.editableAreas.length > 0 &&
      Array.isArray(productIdentity.maskRegions) &&
      productIdentity.maskRegions.length > 0 &&
      hasValidImageReference(productIdentity.imageReference)
  );
}

export function hasStrictDesignLock(designLock: DesignLock | undefined | null): designLock is DesignLock {
  return Boolean(
    designLock &&
      designLock.mode === "strict-reference-lock" &&
      designLock.productOutline === "locked" &&
      designLock.sizeProportion === "locked" &&
      designLock.partPositions === "locked" &&
      designLock.cameraAngle === "locked" &&
      designLock.overallDimensions === "locked"
  );
}

export const tableLampMaskRegions: ProductMaskRegion[] = [
  {
    id: "shade",
    label: "Shade",
    partName: "Glass Shade",
    material: "Glass",
    editableProperties: ["material", "color", "surface_finish"],
    lockedNeighbors: ["Metal Ring", "LED Module", "Battery", "Marble Base"],
    promptHint: "Only edit the shade material, color, transparency, or finish. Preserve base, metal ring, light source, product proportion, and camera angle.",
    confidence: 0.82,
    source: "rule-based",
    bounds: { x: 30, y: 10, width: 40, height: 34 }
  },
  {
    id: "metal",
    label: "Metal",
    partName: "Metal Ring",
    material: "Metal",
    editableProperties: ["material", "color", "surface_finish"],
    lockedNeighbors: ["Glass Shade", "LED Module", "Battery", "Marble Base"],
    promptHint: "Only edit the visible metal finish. Preserve shade, base, light source, silhouette, and camera angle.",
    confidence: 0.82,
    source: "rule-based",
    bounds: { x: 39, y: 43, width: 22, height: 13 }
  },
  {
    id: "base",
    label: "Base",
    partName: "Marble Base",
    material: "Stone",
    editableProperties: ["material", "color", "surface_finish"],
    lockedNeighbors: ["Glass Shade", "Metal Ring", "LED Module", "Battery"],
    promptHint: "Only edit the base material, color, or finish. Preserve shade, metal structure, light source, product proportion, and camera angle.",
    confidence: 0.82,
    source: "rule-based",
    bounds: { x: 36, y: 72, width: 28, height: 18 }
  },
  {
    id: "logo",
    label: "Logo",
    partName: "Logo",
    material: "Graphic mark",
    editableProperties: ["color", "surface_finish"],
    lockedNeighbors: ["Glass Shade", "Metal Ring", "LED Module", "Battery", "Marble Base"],
    promptHint: "Only edit a small visible logo or brand mark. Do not add a logo if none exists.",
    confidence: 0.7,
    source: "rule-based",
    bounds: { x: 44, y: 78, width: 12, height: 6 }
  },
  {
    id: "light-source",
    label: "Light Source",
    partName: "LED Module",
    material: "LED",
    editableProperties: ["color"],
    lockedNeighbors: ["Glass Shade", "Metal Ring", "Marble Base"],
    promptHint: "Only tune visible light color or glow. Preserve component position, shade geometry, and base material.",
    confidence: 0.78,
    source: "rule-based",
    bounds: { x: 43, y: 39, width: 14, height: 10 }
  },
  {
    id: "scene",
    label: "Scene",
    partName: "Scene Background",
    material: "Environment",
    editableProperties: ["scene_background"],
    lockedNeighbors: ["Glass Shade", "Metal Ring", "LED Module", "Battery", "Marble Base"],
    promptHint: "Only change the environment or background. Preserve the full product exactly as uploaded.",
    confidence: 1,
    source: "rule-based",
    bounds: { x: 0, y: 0, width: 100, height: 100 }
  }
];

export function buildProductIdentityFromVision(input: {
  productName: string;
  category: string;
  imageReference: ImageReference;
  visionIdentity?: VisionProductIdentityJson | null;
  visionModelName?: string;
  visionProvider?: VisionProviderName;
}): ProductIdentity {
  const analyzedAt = new Date().toISOString();
  const rawVisionJson = input.visionIdentity ?? buildFallbackVisionIdentityJson(input);
  const isTableLamp = isLikelyTableLamp(input.productName, input.category, rawVisionJson.productType);
  const parts = normalizeParts(rawVisionJson, isTableLamp);
  const materials = normalizeMaterials(rawVisionJson, isTableLamp);
  const editableAreas = normalizeEditableAreas(rawVisionJson.editableAreas);
  const lockedAreas = normalizeStringArray(rawVisionJson.lockedAreas, [
    "shape",
    "dimension",
    "structure",
    "camera_angle"
  ]);

  return {
    id: makeId("identity"),
    sourceProductId: input.imageReference.sourceProductId,
    productType: normalizeText(rawVisionJson.productType, input.productName || input.category),
    designStyle: normalizeText(rawVisionJson.designStyle, isTableLamp ? "Modern compact lighting" : "Detected from uploaded image"),
    brandPositioning: normalizeText(rawVisionJson.brandPositioning, "Amazon-ready premium functional product"),
    partStructure: parts,
    materials,
    proportions: {
      overall: [
        rawVisionJson.dimensions.estimatedHeight ? `Estimated height: ${rawVisionJson.dimensions.estimatedHeight}` : "",
        rawVisionJson.dimensions.widthRatio ? `Width ratio: ${rawVisionJson.dimensions.widthRatio}` : "",
        rawVisionJson.dimensions.componentRatio ? `Component ratio: ${rawVisionJson.dimensions.componentRatio}` : ""
      ].filter(Boolean).join(" | ") || "Preserve uploaded product proportions, component relationships, and camera perspective.",
      dimensions: isTableLamp ? tableLampDimensions : undefined,
      relationships: [
        rawVisionJson.dimensions.widthRatio,
        rawVisionJson.dimensions.componentRatio,
        "Preserve visible part relationships from the uploaded image."
      ].filter(Boolean)
    },
    keyFeatures: ["Shape", "Proportion", "Silhouette", "Camera Angle"],
    editableAreas,
    lockedAreas,
    camera: {
      angle: normalizeText(rawVisionJson.camera.angle, "Detected from uploaded image"),
      view: normalizeText(rawVisionJson.camera.view, "Product view"),
      lighting: normalizeText(rawVisionJson.camera.lighting, "Detected studio lighting")
    },
    maskRegions: buildProductMaskRegionsFromVision(rawVisionJson, isTableLamp),
    rawVisionJson,
    imageReference: input.imageReference,
    visionModel: {
      name: input.visionModelName ?? "Reference Vision Analyzer v1",
      provider: input.visionProvider ?? "mock-fallback",
      status: "completed",
      analyzedAt
    }
  };
}

export function buildFallbackVisionIdentityJson(input: {
  productName: string;
  category: string;
}): VisionProductIdentityJson {
  const isTableLamp = isLikelyTableLamp(input.productName, input.category);

  if (isTableLamp) {
    return {
      productType: "Table Lamp",
      designStyle: "Modern portable ambient lighting",
      brandPositioning: "Premium home decor lighting for Amazon US shoppers",
      parts: [
        {
          name: "Glass Shade",
          shape: "Dome shade",
          material: "Glass",
          color: "Clear or softly tinted translucent glass",
          position: "Top section",
          locked: true
        },
        {
          name: "Metal Ring",
          shape: "Circular support ring",
          material: "Metal",
          color: "Warm brass or brushed metal",
          position: "Between shade and base",
          locked: true
        },
        {
          name: "LED Module",
          shape: "Centered hidden light source",
          material: "LED module",
          color: "Warm white light",
          position: "Inside the shade",
          locked: true
        },
        {
          name: "Battery",
          shape: "Hidden power cell",
          material: "Battery cell",
          color: "Not visible",
          position: "Inside the base",
          locked: true
        },
        {
          name: "Marble Base",
          shape: "Compact weighted base",
          material: "Stone",
          color: "Natural marble",
          position: "Bottom section",
          locked: true
        }
      ],
      materials: ["Glass", "Metal", "Stone"],
      dimensions: {
        estimatedHeight: `${tableLampDimensions.heightCm} cm`,
        widthRatio: `shade ${tableLampDimensions.shadeCm} cm, base ${tableLampDimensions.baseCm} cm`,
        componentRatio: "shade wider than base; compact heavy base supports vertical lamp body"
      },
      editableAreas: ["material", "color", "surface_finish"],
      lockedAreas: ["shape", "dimension", "structure", "camera_angle"],
      camera: {
        angle: "front or slight 45 degree product angle",
        view: "product hero view",
        lighting: "soft studio lighting"
      }
    };
  }

  return {
    productType: input.productName || input.category || "Uploaded Product",
    designStyle: "Detected from uploaded product reference",
    brandPositioning: "Amazon-ready product presentation",
    parts: [
      {
        name: "Main Body",
        shape: "Detected silhouette",
        material: "Detected from uploaded image",
        color: "Detected from uploaded image",
        position: "Primary visible product area",
        locked: true
      },
      {
        name: "Functional Component",
        shape: "Detected component geometry",
        material: "Detected from uploaded image",
        color: "Detected from uploaded image",
        position: "Attached to main body",
        locked: true
      }
    ],
    materials: ["Detected from uploaded image"],
    dimensions: {
      estimatedHeight: "Estimate from uploaded image",
      widthRatio: "Preserve original width-to-height ratio",
      componentRatio: "Preserve visible component proportions"
    },
    editableAreas: ["material", "color", "surface_finish"],
    lockedAreas: ["shape", "dimension", "structure", "camera_angle"],
    camera: {
      angle: "Detected from uploaded image",
      view: "Detected product view",
      lighting: "Detected image lighting"
    }
  };
}

export function buildStrictDesignLock(): DesignLock {
  return {
    mode: "strict-reference-lock",
    productOutline: "locked",
    sizeProportion: "locked",
    partPositions: "locked",
    cameraAngle: "locked",
    overallDimensions: "locked",
    allowedEdits: [...allowedReferenceEdits],
    forbiddenChanges: [
      "Never redesign the product",
      "Never change product silhouette",
      "Never change dimensions or proportions",
      "Never move, add, or remove components",
      "Never change the camera angle",
      "Never replace the uploaded product with a random similar product"
    ],
    validationRule:
      "Generation requires original_reference, Product Identity JSON, and Design Lock. If reference data is missing, return IMAGE_REFERENCE_REQUIRED. If the request violates locked areas, return DESIGN_LOCK_VIOLATION."
  };
}

export function buildReferenceGenerationPolicy(identity: ProductIdentity, designLock: DesignLock) {
  return {
    mode: "Image Reference",
    sourceProductId: identity.sourceProductId,
    identityId: identity.id,
    sourceFileName: identity.imageReference.fileName,
    product_identity: identity.rawVisionJson,
    design_lock: {
      lockedAreas: identity.lockedAreas,
      allowedEdits: designLock.allowedEdits,
      forbiddenChanges: designLock.forbiddenChanges
    },
    locked: [
      "product silhouette",
      "product proportion",
      "component position",
      "camera angle",
      "overall dimensions"
    ],
    allowedEdits: designLock.allowedEdits,
    forbiddenChanges: designLock.forbiddenChanges,
    instruction:
      "Use the uploaded product image as exact reference. Preserve shape, dimensions, structure, components, part positions, and camera angle. Only modify material, color, surface finish, or environment. Never redesign the product."
  };
}

export function createMissingReferenceError(action: string) {
  return {
    error: "IMAGE_REFERENCE_REQUIRED",
    message: `${action} requires an uploaded original image, Product Identity JSON, and Design Lock before generation.`,
    requiredPayload: {
      original_reference: "ImageReference",
      product_identity: "ProductIdentity",
      design_lock: "DesignLock",
      prompt: "string"
    },
    requiredWorkflow: [
      "Upload a JPG or PNG product image",
      "Call the vision model to analyze the uploaded product",
      "Create Product Identity JSON",
      "Apply Design Lock",
      "Generate only from the original image reference"
    ]
  };
}

export function toProductIdentityPreview(identity: ProductIdentity) {
  return {
    id: identity.id,
    sourceProductId: identity.sourceProductId,
    productType: identity.productType,
    designStyle: identity.designStyle,
    brandPositioning: identity.brandPositioning,
    partStructure: identity.partStructure,
    materials: identity.materials,
    proportions: identity.proportions,
    keyFeatures: identity.keyFeatures,
    editableAreas: identity.editableAreas,
    lockedAreas: identity.lockedAreas,
    camera: identity.camera,
    rawVisionJson: identity.rawVisionJson,
    maskRegions: identity.maskRegions.map((region) => ({
      id: region.id,
      label: region.label,
      partName: region.partName,
      material: region.material,
      editableProperties: region.editableProperties,
      lockedNeighbors: region.lockedNeighbors
    })),
    imageReference: {
      mode: identity.imageReference.mode,
      fileName: identity.imageReference.fileName,
      referenceStrength: identity.imageReference.referenceStrength,
      imageUrl: "[uploaded image reference]"
    },
    visionModel: identity.visionModel
  };
}

export function describeIdentityMaterials(identity: ProductIdentity) {
  return Array.from(new Set(identity.materials.map((item) => item.material))).join(" / ");
}

export function describeIdentityStructure(identity: ProductIdentity) {
  return identity.partStructure.join(" / ");
}

export function isTableLampIdentity(identity: ProductIdentity) {
  return /table\s+lamp|lamp/i.test(identity.productType);
}

function isLikelyTableLamp(productName: string, category: string, productType?: string) {
  return /table\s+lamp|lamp|lighting/i.test(`${productName} ${category} ${productType ?? ""}`);
}

function normalizeText(value: string | undefined, fallback: string) {
  const text = value?.trim();
  return text && text.length > 0 ? text : fallback;
}

function normalizeStringArray(values: string[] | undefined, fallback: string[]) {
  const normalized = Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeParts(identity: VisionProductIdentityJson, isTableLamp: boolean) {
  const normalized = Array.from(new Set((identity.parts ?? []).map((part) => part.name.trim()).filter(Boolean)));
  if (normalized.length > 0) return normalized;
  return isTableLamp ? ["Glass Shade", "Metal Ring", "LED Module", "Battery", "Marble Base"] : ["Main Body"];
}

function normalizeMaterials(identity: VisionProductIdentityJson, isTableLamp: boolean): ProductIdentityMaterial[] {
  const partMaterials = (identity.parts ?? [])
    .filter((part) => part.name.trim() && part.material.trim())
    .map((part) => ({
      part: part.name.trim(),
      material: part.material.trim(),
      editableProperties: ["material", "color", "surface_finish"] as ProductIdentityMaterial["editableProperties"]
    }));

  if (partMaterials.length > 0) return partMaterials;

  const materialNames = normalizeStringArray(identity.materials, isTableLamp ? ["Glass", "Metal", "Stone"] : ["Detected from uploaded image"]);
  return materialNames.map((material) => ({
    part: material,
    material,
    editableProperties: ["material", "color", "surface_finish"] as ProductIdentityMaterial["editableProperties"]
  }));
}

function normalizeEditableAreas(editableAreas: string[] | undefined): AllowedProductEdit[] {
  const allowed = new Set<AllowedProductEdit>(["material", "color", "surface_finish", "scene_background"]);
  const normalized = (editableAreas ?? [])
    .map((area) => area.trim().toLowerCase().replace(/[\s-]+/g, "_") as AllowedProductEdit)
    .filter((area) => allowed.has(area));
  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : ["material", "color", "surface_finish"];
}
